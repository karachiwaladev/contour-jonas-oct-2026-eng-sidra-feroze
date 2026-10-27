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
        foreach ($blocked in @('.env', '.env.local', '.env.*', 'credentials.json', '*.pem', '*.key', '*.p12', '*.pfx', 'id_rsa', 'id_ed25519', '*secret*', '*token*')) {
            git reset HEAD -- $blocked 2>$null | Out-Null
        }

        $secretHit = 'github_pat_|ghp_|gho_|ghu_|ghs_|sk-[A-Za-z0-9]{10,}|AKIA[A-Z0-9]{16}|AIza[0-9A-Za-z_\-]{20,}|xox[baprs]-|-----BEGIN [A-Z ]*PRIVATE KEY-----'
        $staged = @(git diff --cached --name-only 2>$null | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
        foreach ($file in @($staged)) {
            $blob = git show ":$file" 2>$null
            if ($blob -match $secretHit) {
                git reset HEAD -- $file 2>$null | Out-Null
                [Console]::Error.WriteLine("Skipped staged secret-looking content: $file")
            }
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
