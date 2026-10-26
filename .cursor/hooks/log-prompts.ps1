# Appends user prompts that are not already in this session's JSONL log.
# Reads the stop-hook payload from the PowerShell pipeline. Writes "{}" and exits 0.
$ErrorActionPreference = 'Stop'

function Get-PromptText {
    param($Row)
    $chunks = New-Object System.Collections.Generic.List[string]
    $content = $Row.message.content
    if ($content -is [string]) {
        $chunks.Add($content)
    } else {
        foreach ($part in @($content)) {
            if ($null -eq $part) { continue }
            if ($part -is [string]) {
                $chunks.Add($part)
                continue
            }
            if ($part.type -eq 'text' -and $part.text) {
                $chunks.Add([string]$part.text)
            }
        }
    }
    $text = $chunks -join "`n"
    $found = [regex]::Matches($text, '(?s)<user_query>\s*(.*?)\s*</user_query>')
    if ($found.Count -gt 0) {
        return $found[$found.Count - 1].Groups[1].Value.Trim()
    }
    return $text.Trim()
}

try {
    $raw = @($input | Out-String)
    if ([string]::IsNullOrWhiteSpace($raw)) {
        $raw = [Console]::In.ReadToEnd()
    }
    if ([string]::IsNullOrWhiteSpace($raw)) {
        Write-Output '{}'
        exit 0
    }

    $hook = $raw | ConvertFrom-Json
    $transcript = [string]$hook.transcript_path
    if ([string]::IsNullOrWhiteSpace($transcript) -or -not (Test-Path -LiteralPath $transcript)) {
        Write-Output '{}'
        exit 0
    }

    $conversationId = [string]$hook.conversation_id
    if ([string]::IsNullOrWhiteSpace($conversationId)) {
        $conversationId = 'unknown'
    }
    $safeId = [regex]::Replace($conversationId, '[^a-zA-Z0-9._-]', '_')

    $root = @($hook.workspace_roots) | Select-Object -First 1
    if ([string]::IsNullOrWhiteSpace([string]$root)) {
        $root = (Get-Location).Path
    }
    $dir = Join-Path ([string]$root) '.cursor\prompts'
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
    $outFile = Join-Path $dir ($safeId + '.jsonl')

    $seen = @{}
    if (Test-Path -LiteralPath $outFile) {
        foreach ($line in [System.IO.File]::ReadAllLines($outFile)) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            try {
                $existing = $line | ConvertFrom-Json
                if ($null -ne $existing.index) {
                    $seen["$($existing.index)"] = $true
                }
            } catch {
                continue
            }
        }
    }

    $index = 0
    $pending = New-Object System.Collections.Generic.List[string]
    $share = [System.IO.FileShare]::ReadWrite
    $stream = [System.IO.File]::Open($transcript, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, $share)
    try {
        $reader = New-Object System.IO.StreamReader($stream, (New-Object System.Text.UTF8Encoding $false))
        while ($null -ne ($line = $reader.ReadLine())) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            try {
                $row = $line | ConvertFrom-Json
            } catch {
                continue
            }
            if ($row.role -ne 'user') { continue }
            $prompt = Get-PromptText $row
            if (-not [string]::IsNullOrWhiteSpace($prompt) -and -not $seen.ContainsKey("$index")) {
                $record = [ordered]@{
                    conversation_id = $conversationId
                    index           = $index
                    prompt          = $prompt
                    status          = [string]$hook.status
                    generation_id   = [string]$hook.generation_id
                    logged_at       = (Get-Date).ToUniversalTime().ToString('o')
                }
                $pending.Add(($record | ConvertTo-Json -Compress -Depth 6))
            }
            $index++
        }
    } finally {
        if ($reader) { $reader.Dispose() }
        elseif ($stream) { $stream.Dispose() }
    }

    if ($pending.Count -gt 0) {
        $utf8 = New-Object System.Text.UTF8Encoding $false
        $payload = ($pending -join "`n") + "`n"
        [System.IO.File]::AppendAllText($outFile, $payload, $utf8)
    }
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
}

Write-Output '{}'
exit 0
