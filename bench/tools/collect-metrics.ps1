# Автосбор метрик прогона из транскрипта сессии Claude Code (JSONL).
# Использование: powershell -File collect-metrics.ps1 <путь-к-session.jsonl>
# Эквивалент collect-metrics.mjs для Windows без Node. См. bench/METRICS.md.

param(
    [Parameter(Mandatory = $true)]
    [string]$TranscriptPath
)

$tokensIn = 0; $tokensOut = 0; $cacheRead = 0; $cacheCreate = 0
$toolCalls = @{}
$turns = 0
$humanMessages = 0
$tFirst = $null; $tLast = $null

foreach ($line in [System.IO.File]::ReadLines((Resolve-Path $TranscriptPath))) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    try { $e = $line | ConvertFrom-Json } catch { continue }

    if ($e.timestamp) {
        try {
            $t = [datetimeoffset]::Parse($e.timestamp, [cultureinfo]::InvariantCulture)
            if ($null -eq $tFirst -or $t -lt $tFirst) { $tFirst = $t }
            if ($null -eq $tLast -or $t -gt $tLast) { $tLast = $t }
        } catch {}
    }

    $msg = $e.message
    if ($null -eq $msg) { continue }

    if ($e.type -eq 'assistant') {
        $turns++
        $u = $msg.usage
        if ($u) {
            if ($u.input_tokens) { $tokensIn += $u.input_tokens }
            if ($u.output_tokens) { $tokensOut += $u.output_tokens }
            if ($u.cache_read_input_tokens) { $cacheRead += $u.cache_read_input_tokens }
            if ($u.cache_creation_input_tokens) { $cacheCreate += $u.cache_creation_input_tokens }
        }
        if ($msg.content -is [array]) {
            foreach ($block in $msg.content) {
                if ($block.type -eq 'tool_use') {
                    if ($toolCalls.ContainsKey($block.name)) { $toolCalls[$block.name]++ }
                    else { $toolCalls[$block.name] = 1 }
                }
            }
        }
    }

    if ($e.type -eq 'user') {
        # Сообщение человека = контент без tool_result (результаты инструментов приходят как user-записи)
        $c = $msg.content
        $isToolResult = $false
        if ($c -is [array]) {
            foreach ($block in $c) { if ($block.type -eq 'tool_result') { $isToolResult = $true; break } }
        }
        if (-not $isToolResult) { $humanMessages++ }
    }
}

$total = 0
$byType = [ordered]@{}
foreach ($kv in ($toolCalls.GetEnumerator() | Sort-Object Value -Descending)) {
    $byType[$kv.Key] = $kv.Value
    $total += $kv.Value
}

$wallTime = $null
if ($null -ne $tFirst -and $null -ne $tLast) { $wallTime = [math]::Round(($tLast - $tFirst).TotalSeconds) }

$hm = $humanMessages - 1  # минус стартовый промпт
if ($hm -lt 0) { $hm = 0 }

[ordered]@{
    tokens_in           = $tokensIn
    tokens_out          = $tokensOut
    tokens_cache_read   = $cacheRead
    tokens_cache_create = $cacheCreate
    wall_time_s         = $wallTime
    turns               = $turns
    tool_calls_total    = $total
    tool_calls_by_type  = $byType
    human_messages      = $hm
} | ConvertTo-Json -Depth 4
