# PreToolUse: block rm -rf, git push --force, curl|sh, and .env reads.
# Reads hook JSON from stdin. Always prints valid JSON (fail-closed hosts).

$ErrorActionPreference = 'Continue'

function Write-Allow {
    [Console]::Out.WriteLine('{"permission":"allow"}')
    exit 0
}

function Write-Deny {
    param([string]$Reason)
    $payload = '{"permission":"deny","user_message":"' + $Reason + '","agent_message":"' + $Reason + '","hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"' + $Reason + '"}}'
    [Console]::Out.WriteLine($payload)
    exit 2
}

try {
    $raw = ''
    try {
        $stdin = [Console]::OpenStandardInput()
        $reader = New-Object System.IO.StreamReader($stdin)
        $raw = $reader.ReadToEnd()
    } catch {
        $raw = ''
    }

    if ([string]::IsNullOrWhiteSpace($raw)) {
        Write-Allow
    }

    try {
        $call = $raw | ConvertFrom-Json
    } catch {
        Write-Allow
    }

    $command = ''
    if ($call.tool_input -and $call.tool_input.command) {
        $command = [string]$call.tool_input.command
    } elseif ($call.arguments -and $call.arguments.command) {
        $command = [string]$call.arguments.command
    } elseif ($call.command) {
        $command = [string]$call.command
    }

    $path = ''
    if ($call.tool_input -and $call.tool_input.file_path) {
        $path = [string]$call.tool_input.file_path
    } elseif ($call.tool_input -and $call.tool_input.path) {
        $path = [string]$call.tool_input.path
    } elseif ($call.arguments -and $call.arguments.file_path) {
        $path = [string]$call.arguments.file_path
    } elseif ($call.arguments -and $call.arguments.path) {
        $path = [string]$call.arguments.path
    } elseif ($call.file_path) {
        $path = [string]$call.file_path
    }

    if ($command -match '(?i)rm\s+(-[^\s]*r[^\s]*f|-[^\s]*f[^\s]*r|--recursive\s+--force|--force\s+--recursive)\b') {
        Write-Deny 'Blocked: rm -rf'
    }
    if ($command -match '(?i)Remove-Item\b.*(-Recurse|-r\b)') {
        Write-Deny 'Blocked: recursive Remove-Item'
    }
    if ($command -match '(?i)git\s+push\b.*(--force\b|-f\b)') {
        Write-Deny 'Blocked: git push --force'
    }
    if ($command -match '(?i)(curl|wget)\b.+\|\s*(sh|bash|zsh)\b') {
        Write-Deny 'Blocked: curl|sh'
    }

    $envName = ''
    if ($path) {
        $envName = [System.IO.Path]::GetFileName($path)
    }
    if ($envName -and $envName -match '(?i)^\.env' -and $envName -notmatch '(?i)^\.env\.example$') {
        Write-Deny 'Blocked: reading .env files'
    }

    Write-Allow
} catch {
    Write-Allow
}
