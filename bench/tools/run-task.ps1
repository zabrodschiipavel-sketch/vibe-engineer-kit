# Раннер прогона задачи стенда через Claude Code CLI (headless).
# Использование: powershell -File run-task.ps1 -Task 01 -Config A -Run 1 [-Model claude-sonnet-5]
#   Task   — номер задачи (каталог в bench/fixtures/)
#   Config — A (голая модель) | B (текущий сет: CLAUDE.md + .claude из project-template)
#   Run    — номер прогона (для имени результата)
# Что делает: разворачивает фикстуру во временный каталог -> git-бейзлайн ->
# запускает claude -p с промптом задачи -> собирает метрики (CLI JSON + транскрипт + git diff) ->
# пишет заготовку записи результата в bench/results/. Поля quality/manual заполняет оператор.
# ВНИМАНИЕ: агент запускается с --dangerously-skip-permissions — только в изолированном
# каталоге прогона; не запускай раннер в каталогах с ценными данными.

param(
    [Parameter(Mandatory = $true)][string]$Task,
    [Parameter(Mandatory = $true)][ValidateSet('A', 'B')][string]$Config,
    [Parameter(Mandatory = $true)][int]$Run,
    [string]$Model = 'claude-sonnet-5'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$fixture = Join-Path $repoRoot "bench\fixtures\$Task"
if (-not (Test-Path $fixture)) { throw "Нет фикстуры: $fixture" }
$promptFile = Join-Path $fixture 'PROMPT.txt'
if (-not (Test-Path $promptFile)) { throw "Нет PROMPT.txt в фикстуре $Task" }

$claude = "$env:USERPROFILE\.local\bin\claude.exe"
if (-not (Test-Path $claude)) { $claude = 'claude' }

$stamp = Get-Date -Format 'yyyy-MM-dd'
$runId = "$stamp-task$Task-$Config-run$Run"
$work = Join-Path $repoRoot "bench-runs\$runId"
if (Test-Path $work) { throw "Каталог прогона уже существует: $work (увеличь -Run)" }
New-Item -ItemType Directory -Force $work | Out-Null

# 1. Фикстура (без PROMPT.txt — агент не должен видеть мета-файлы стенда)
Copy-Item -Recurse "$fixture\*" $work
Remove-Item (Join-Path $work 'PROMPT.txt')

# 2. Конфигурация B: сет из project-template (без .mcp.json — MCP в стенде не участвует)
if ($Config -eq 'B') {
    Copy-Item (Join-Path $repoRoot 'project-template\CLAUDE.md') $work
    Copy-Item -Recurse (Join-Path $repoRoot 'project-template\.claude') (Join-Path $work '.claude')
}

# 3. Git-бейзлайн для дифа
Push-Location $work
git init -q -b main
git config user.email 'bench@vibe-engineer-kit.local'
git config user.name 'bench'
git add -A
git commit -q -m 'fixture baseline'
Pop-Location

# 3.5. Доверие к каталогу прогона: без него headless-claude в untrusted-каталоге
# игнорирует настройки проекта — для конфигурации B это исказило бы эксперимент.
# Делаем через Node (PS 5.1 ConvertFrom-Json ломается на ~/.claude.json и может
# перезаписать его пустым — см. trust-dir.mjs). Бэкап делает сам хелпер.
& node (Join-Path $PSScriptRoot 'trust-dir.mjs') $work
if ($LASTEXITCODE -ne 0) { throw "Не удалось зарегистрировать доверие к $work (trust-dir.mjs)" }

# 4. Прогон
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

# 5. Диф-метрики
Push-Location $work
$numstat = git diff --numstat
$filesChanged = 0; $added = 0; $removed = 0
foreach ($line in $numstat) {
    $p = $line -split "`t"
    if ($p.Count -ge 3) {
        $filesChanged++
        if ($p[0] -match '^\d+$') { $added += [int]$p[0] }
        if ($p[1] -match '^\d+$') { $removed += [int]$p[1] }
    }
}
git add -A; git commit -q -m 'agent result' 2>$null
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
    diff                 = [ordered]@{ files_changed = $filesChanged; lines_added = $added; lines_removed = $removed }
    manual               = [ordered]@{ context_tax_tokens = $null; clarifying_questions = $null; interventions = $null; offtask_lines = $null }
    notes                = ''
}

$resultsDir = Join-Path $repoRoot 'bench\results'
New-Item -ItemType Directory -Force $resultsDir | Out-Null
$resultPath = Join-Path $resultsDir "$runId.json"
$result | ConvertTo-Json -Depth 6 | Out-File $resultPath -Encoding utf8

Write-Host ""
Write-Host "[$runId] готово за ${elapsed}s" -ForegroundColor Green
if ($cli) { Write-Host ("  cost: {0}$  turns: {1}" -f $cli.total_cost_usd, $cli.num_turns) }
Write-Host "  диф: $filesChanged файлов, +$added/-$removed строк"
Write-Host "  результат: $resultPath"
Write-Host "  каталог прогона (для оценки ловушки): $work"
Write-Host "  дальше: оцени quality/manual по bench\tasks\$Task-*.md и bench\METRICS.md" -ForegroundColor Yellow
