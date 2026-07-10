# Раннер прогона задачи стенда через Claude Code CLI (headless).
# Использование: powershell -File run-task.ps1 -Task 01 -Config A -Run 1 [-Model claude-haiku-4-5-20251001]
#            или: powershell -File run-task.ps1 -Task 09 -Config C -CandidatePath bench\candidates\<name> -Run 1
#   Task   — номер задачи (каталог в bench/fixtures/)
#   Config — A (голая модель) | B (текущий сет: CLAUDE.md + .claude из project-template) | C (кандидат)
#   CandidatePath — обязателен при Config C: каталог с CLAUDE.md/.claude кандидата (по протоколу EXPERIMENTS.md)
#   Run    — номер прогона (для имени результата)
# Что делает: разворачивает фикстуру во временный каталог -> git-бейзлайн ->
# запускает claude -p с промптом задачи -> собирает метрики (CLI JSON + транскрипт + git diff) ->
# пишет заготовку записи результата в bench/results/. Поля quality/manual заполняет оператор.
# ВНИМАНИЕ: агент запускается с --dangerously-skip-permissions — только в изолированном
# каталоге прогона; не запускай раннер в каталогах с ценными данными.

param(
    [Parameter(Mandatory = $true)][string]$Task,
    [Parameter(Mandatory = $true)][ValidateSet('A', 'B', 'C')][string]$Config,
    [Parameter(Mandatory = $true)][int]$Run,
    # Дефолт = стандартная модель стенда (EXPERIMENTS.md § «Модель стенда»); смена стандарта = запись в журнале
    [string]$Model = 'claude-haiku-4-5-20251001',
    [string]$CandidatePath = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$fixture = Join-Path $repoRoot "bench\fixtures\$Task"
if (-not (Test-Path $fixture)) { throw "Нет фикстуры: $fixture" }
$promptFile = Join-Path $fixture 'PROMPT.txt'
if (-not (Test-Path $promptFile)) { throw "Нет PROMPT.txt в фикстуре $Task" }
if ($Config -eq 'C' -and -not $CandidatePath) { throw "Config C требует -CandidatePath (каталог с CLAUDE.md/.claude кандидата)" }
if ($Config -eq 'C') {
    $candidateFull = Join-Path $repoRoot $CandidatePath
    # Кандидату достаточно ЛЮБОГО из двух: CLAUDE.md или .claude — изолирующие
    # конфигурации (только правила / только скиллы) намеренно содержат одно из них.
    if (-not (Test-Path (Join-Path $candidateFull 'CLAUDE.md')) -and -not (Test-Path (Join-Path $candidateFull '.claude'))) {
        throw "В $candidateFull нет ни CLAUDE.md, ни .claude — кандидат пуст"
    }
}

$claude = "$env:USERPROFILE\.local\bin\claude.exe"
if (-not (Test-Path $claude)) { $claude = 'claude' }

$stamp = Get-Date -Format 'yyyy-MM-dd'
# Короткий тег модели в имени прогона — чтобы результаты разных моделей стенда не сталкивались
$modelTag = if ($Model -match 'haiku') { 'haiku' } elseif ($Model -match 'sonnet') { 'sonnet' } elseif ($Model -match 'opus') { 'opus' } elseif ($Model -match 'fable') { 'fable' } else { ($Model -replace '[^a-z0-9]', '') }
$candSlug = if ($Config -eq 'C') { '-' + (Split-Path $CandidatePath -Leaf) } else { '' }
$runId = "$stamp-task$Task-$Config$candSlug-$modelTag-run$Run"
$work = Join-Path $repoRoot "bench-runs\$runId"
if (Test-Path $work) { throw "Каталог прогона уже существует: $work (увеличь -Run)" }
New-Item -ItemType Directory -Force $work | Out-Null

# 1. Фикстура (без PROMPT.txt/ANSWERS.txt — агент не должен видеть мета-файлы стенда)
Copy-Item -Recurse "$fixture\*" $work
Remove-Item (Join-Path $work 'PROMPT.txt')
if (Test-Path (Join-Path $work 'ANSWERS.txt')) { Remove-Item (Join-Path $work 'ANSWERS.txt') }

# 2. Конфигурация B: сет из project-template (без .mcp.json — MCP в стенде не участвует)
if ($Config -eq 'B') {
    Copy-Item (Join-Path $repoRoot 'project-template\CLAUDE.md') $work
    Copy-Item -Recurse (Join-Path $repoRoot 'project-template\.claude') (Join-Path $work '.claude')
}
# 2b. Конфигурация C: кандидат — свой CLAUDE.md/.claude из указанного каталога (каждый — если есть)
if ($Config -eq 'C') {
    $candClaudeMd = Join-Path $candidateFull 'CLAUDE.md'
    if (Test-Path $candClaudeMd) { Copy-Item $candClaudeMd $work }
    $candClaudeDir = Join-Path $candidateFull '.claude'
    if (Test-Path $candClaudeDir) { Copy-Item -Recurse $candClaudeDir (Join-Path $work '.claude') }
}

# 3. Git-бейзлайн для дифа
Push-Location $work
git init -q -b main
git config user.email 'bench@vibe-engineer-kit.local'
git config user.name 'bench'
git add -A
git commit -q -m 'fixture baseline'
$baseSha = (git rev-parse HEAD).Trim()  # база для дифа: сет (config B) заставляет агента
                                        # самого коммитить, поэтому HEAD~1 недостаточно
Pop-Location

# 3.5. Доверие к каталогу прогона: без него headless-claude в untrusted-каталоге
# игнорирует настройки проекта — для конфигурации B это исказило бы эксперимент.
# Делаем через Node (PS 5.1 ConvertFrom-Json ломается на ~/.claude.json и может
# перезаписать его пустым — см. trust-dir.mjs). Бэкап делает сам хелпер.
& node (Join-Path $PSScriptRoot 'trust-dir.mjs') $work
if ($LASTEXITCODE -ne 0) { throw "Не удалось зарегистрировать доверие к $work (trust-dir.mjs)" }

# 4. Прогон
# КРИТИЧНО: PS 5.1 перекодирует stdin пайпа в OEM-кодировку -> кириллица в промпте
# приходит агенту как '??????'. Форсируем UTF-8 для вывода в native stdin.
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$prompt = Get-Content $promptFile -Raw -Encoding UTF8
Write-Host "[$runId] запускаю claude ($Model)..." -ForegroundColor Cyan
$t0 = Get-Date
Push-Location $work
# stderr нативной программы НЕ перенаправляем (в PS 5.1 это ломает $ErrorActionPreference=Stop);
# предупреждения claude уходят в консоль, stdout (JSON) captureится в переменную.
# Дальше по скрипту идут только нативные утилиты (claude, git) — оставляем Continue до конца,
# чтобы их stderr не убивал скрипт под Stop. Валидация setup (шаги 1-3.5) уже пройдена.
$ErrorActionPreference = 'Continue'
$cliOut = $prompt | & $claude -p --model $Model --output-format json --dangerously-skip-permissions
$elapsed = [math]::Round(((Get-Date) - $t0).TotalSeconds)
Pop-Location

$cliJsonPath = Join-Path $work 'cli-result.json'
$cliOut | Out-File $cliJsonPath -Encoding utf8
$cli = $null
try { $cli = ($cliOut | Out-String) | ConvertFrom-Json } catch { Write-Warning 'Не удалось распарсить JSON от CLI — см. cli-result.json' }

# 4b. Протокол автоответчика для интерактивных задач (ROADMAP v0.3).
# Пока финальное сообщение агента содержит вопрос или ожидание одобрения — продолжаем
# сессию (claude -p --resume), максимум до $MaxLegs легов:
#   лег 2 — ANSWERS.txt фикстуры («Ответы оператора» из карточки), если есть;
#   лег 3+ — стандартное одобрение (по README стенда: на непокрытое — «реши сам»).
# Ответы уходят одним сообщением на лег (компромисс: не диалог по одному вопросу).
# Прогоны с legs>1 несравнимы с прогонами без автоответчика — поле legs пишется в результат.
$MaxLegs = 3
$approveText = 'Одобряю, замечаний нет. Реализуй и доведи задачу до конца; по непокрытым мелочам решай сам и явно называй допущения.'
$continuePattern = '\?|одобр|подтверд|соглас|жд(и|у)|скажи|approve|confirm|proceed'
$legs = 1
$cliExtra = @()
$lastResult = if ($cli) { [string]$cli.result } else { '' }
$lastSession = if ($cli) { $cli.session_id } else { $null }
$answersFile = Join-Path $fixture 'ANSWERS.txt'
$answersSent = $false
while ($legs -lt $MaxLegs -and $lastSession -and $cli -and -not $cli.is_error -and (Test-Path $answersFile) -and ($lastResult -match $continuePattern)) {
    $reply = if (-not $answersSent) { $answersSent = $true; Get-Content $answersFile -Raw -Encoding UTF8 } else { $approveText }
    $legs++
    Write-Host "[$runId] агент ждёт ответа — лег ${legs}: отправляю $(if ($legs -eq 2) {'ответы оператора'} else {'одобрение'})..." -ForegroundColor Cyan
    Push-Location $work
    $cliOutN = $reply | & $claude -p --resume $lastSession --model $Model --output-format json --dangerously-skip-permissions
    Pop-Location
    $cliOutN | Out-File (Join-Path $work "cli-result-$legs.json") -Encoding utf8
    $cliN = $null
    try { $cliN = ($cliOutN | Out-String) | ConvertFrom-Json } catch { Write-Warning "Лег ${legs}: не удалось распарсить JSON"; break }
    $cliExtra += [ordered]@{
        leg            = $legs
        total_cost_usd = $cliN.total_cost_usd
        num_turns      = $cliN.num_turns
        session_id     = $cliN.session_id
        is_error       = $cliN.is_error
    }
    $lastResult = [string]$cliN.result
    if ($cliN.session_id) { $lastSession = $cliN.session_id }
    if ($cliN.is_error) { break }
}
$elapsed = [math]::Round(((Get-Date) - $t0).TotalSeconds)

# 5. Диф-метрики — от БАЗОВОГО коммита до финального состояния (включая коммиты,
# которые агент сделал сам через /ship). Сначала коммитим состояние (иначе новые
# НЕотслеживаемые файлы агента не попадают в numstat), исключаем артефакты раннера.
Push-Location $work
git add -A; git commit -q -m 'agent result' 2>$null
$numstat = git diff $baseSha HEAD --numstat -- . ':(exclude)cli-result*.json'
$filesChanged = 0; $added = 0; $removed = 0
foreach ($line in $numstat) {
    $p = $line -split "`t"
    if ($p.Count -ge 3) {
        $filesChanged++
        if ($p[0] -match '^\d+$') { $added += [int]$p[0] }
        if ($p[1] -match '^\d+$') { $removed += [int]$p[1] }
    }
}
Pop-Location

# 6. Метрики из транскрипта
$auto = $null
if ($cli -and $cli.session_id) {
    $tr = Get-ChildItem "$env:USERPROFILE\.claude\projects" -Recurse -Filter "$($cli.session_id).jsonl" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($tr) {
        $autoJson = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'collect-metrics.ps1') $tr.FullName
        try { $auto = ($autoJson | Out-String) | ConvertFrom-Json } catch {}
    }
}

# 7. Запись результата (quality/manual заполняет оператор)
$result = [ordered]@{
    date                 = $stamp
    task                 = $Task
    config               = $Config
    run                  = $Run
    model                = $Model
    effort               = 'medium'
    claude_code_version  = (& $claude --version 2>$null | Select-Object -First 1)
    workdir              = $work
    quality              = [ordered]@{ trap_triggered = $null; acceptance_rate = $null; review_defects = $null }
    auto                 = $auto
    cli                  = if ($cli) { [ordered]@{
                              total_cost_usd = $cli.total_cost_usd
                              duration_ms    = $cli.duration_ms
                              num_turns      = $cli.num_turns
                              session_id     = $cli.session_id
                              is_error       = $cli.is_error } } else { $null }
    legs                 = $legs
    cli_extra            = if ($cliExtra.Count) { $cliExtra } else { $null }
    diff                 = [ordered]@{ files_changed = $filesChanged; lines_added = $added; lines_removed = $removed }
    manual               = [ordered]@{ context_tax_tokens = $null; clarifying_questions = $null; interventions = $null; offtask_lines = $null }
    notes                = ''
}

$resultsDir = Join-Path $repoRoot 'bench\results'
New-Item -ItemType Directory -Force $resultsDir | Out-Null
$resultPath = Join-Path $resultsDir "$runId.json"
$result | ConvertTo-Json -Depth 6 | Out-File $resultPath -Encoding utf8

Write-Host ""
Write-Host "[$runId] готово за ${elapsed}s (legs: $legs)" -ForegroundColor Green
if ($cli) {
    $costTotal = $cli.total_cost_usd; $turnsTotal = $cli.num_turns
    foreach ($e in $cliExtra) { $costTotal += $e.total_cost_usd; $turnsTotal += $e.num_turns }
    Write-Host ("  cost: {0}$  turns: {1}" -f $costTotal, $turnsTotal)
}
Write-Host "  диф: $filesChanged файлов, +$added/-$removed строк"
Write-Host "  результат: $resultPath"
Write-Host "  каталог прогона (для оценки ловушки): $work"
Write-Host "  дальше: оцени quality/manual по bench\tasks\$Task-*.md и bench\METRICS.md" -ForegroundColor Yellow
