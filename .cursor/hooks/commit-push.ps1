# On agent stop: commit tracked workspace changes and push. Never force-push.
# Reads stop-hook JSON from the PowerShell pipeline. Writes "{}" and exits 0.
$ErrorActionPreference = 'SilentlyContinue'

function Write-HookOk {
    Write-Output '{}'
    exit 0
}

try {
    $raw = @($input | Out-String)
    if ([string]::IsNullOrWhiteSpace($raw)) {
        $raw = [Console]::In.ReadToEnd()
    }

    $root = (Get-Location).Path
    if (-not [string]::IsNullOrWhiteSpace($raw)) {
        $hook = $raw | ConvertFrom-Json
        $fromHook = @($hook.workspace_roots) | Select-Object -First 1
        if (-not [string]::IsNullOrWhiteSpace([string]$fromHook)) {
            $root = [string]$fromHook
        }
    }

    if (-not (Test-Path -LiteralPath (Join-Path $root '.git'))) {
        Write-HookOk
    }

    Push-Location -LiteralPath $root
    try {
        $porcelain = git status --porcelain 2>$null
        if ([string]::IsNullOrWhiteSpace($porcelain)) {
            Write-HookOk
        }

        git add -A 2>$null
        foreach ($blocked in @('.env', '.env.local', 'credentials.json', '*.pem', '*.key')) {
            git reset HEAD -- $blocked 2>$null | Out-Null
        }

        $staged = @(git diff --cached --name-only 2>$null | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
        if ($staged.Count -eq 0) {
            Write-HookOk
        }

        $summary = ($staged | Select-Object -First 10) -join ', '
        if ($staged.Count -gt 10) {
            $summary += ', ...'
        }

        git commit -m "Factory loop: publish workspace changes" -m $summary 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-HookOk
        }

        git push 2>$null
    } finally {
        Pop-Location
    }
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
}

Write-HookOk
