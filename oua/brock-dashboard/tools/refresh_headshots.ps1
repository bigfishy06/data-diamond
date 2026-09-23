<#!
.SYNOPSIS
Refreshes the locally served OUA player photos from each university's roster.

.DESCRIPTION
The script intentionally does not delete older portraits: players absent from
the current roster are still needed for historical dashboard seasons.
#>
[CmdletBinding()]
param(
    [ValidateSet('all','brock-badgers','guelph-gryphons','mcmaster-marauders','u-of-t-varsity-blues','waterloo-warriors','western-mustangs','wilfrid-laurier-golden-hawks','windsor-lancers')]
    [string]$Team = 'all',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root 'headshots'
New-Item -ItemType Directory -Force -Path $output | Out-Null
$statePath = Join-Path $output '.refresh-state.json'
$state = @{}
if (Test-Path -LiteralPath $statePath) {
    try {
        $saved = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json -AsHashtable
        if ($saved) { $state = $saved }
    } catch { Write-Warning 'Ignoring unreadable prior headshot refresh state.' }
}

function Save-RefreshState {
    $state | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $statePath -Encoding utf8
}

$teams = [ordered]@{
    'brock-badgers' = 'https://gobadgers.ca/sports/baseball/roster'
    'guelph-gryphons' = 'https://gryphons.ca/sports/baseball/roster/2025-26'
    'mcmaster-marauders' = 'https://marauders.ca/sports/baseb/roster'
    'u-of-t-varsity-blues' = 'https://varsityblues.ca/sports/baseball/roster'
    'waterloo-warriors' = 'https://athletics.uwaterloo.ca/sports/baseball/roster'
    'western-mustangs' = 'https://westernmustangs.ca/sports/baseball/roster/2025-26'
    'wilfrid-laurier-golden-hawks' = 'https://laurierathletics.com/sports/baseball/roster'
    'windsor-lancers' = 'https://golancers.ca/sports/baseball/roster'
}

function ConvertTo-Slug([string]$Text) {
    $decomposed = $Text.Normalize([Text.NormalizationForm]::FormD)
    $chars = foreach ($character in $decomposed.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($character) -ne [Globalization.UnicodeCategory]::NonSpacingMark) { $character }
    }
    return (($chars -join '') -replace '[^a-zA-Z0-9]+','-').Trim('-').ToLowerInvariant()
}

function Get-ImageExtension([byte[]]$Bytes, [string]$Url) {
    if ($Bytes.Length -gt 3 -and $Bytes[0] -eq 137 -and $Bytes[1] -eq 80 -and $Bytes[2] -eq 78 -and $Bytes[3] -eq 71) { return '.png' }
    if ($Bytes.Length -gt 11 -and $Bytes[0] -eq 82 -and $Bytes[1] -eq 73 -and $Bytes[2] -eq 70 -and $Bytes[8] -eq 87 -and $Bytes[9] -eq 69 -and $Bytes[10] -eq 66 -and $Bytes[11] -eq 80) { return '.webp' }
    if ($Bytes.Length -gt 2 -and $Bytes[0] -eq 255 -and $Bytes[1] -eq 216 -and $Bytes[2] -eq 255) { return '.jpg' }
    $extension = [IO.Path]::GetExtension(($Url -split '\?')[0]).ToLowerInvariant()
    if ($extension -in '.jpg','.jpeg','.png','.webp') { return $extension }
    return '.jpg'
}

$targets = if ($Team -eq 'all') { $teams.Keys } else { @($Team) }
$total = 0
foreach ($key in $targets) {
    $rosterUrl = $teams[$key]
    Write-Host "$key`: reading roster..."
    try {
        $html = (Invoke-WebRequest -Uri $rosterUrl -UseBasicParsing -TimeoutSec 60).Content
        $profileRegex = [regex]'(?is)<a[^>]+aria-label="([^"]+?)\s*-\s*View Profile"[^>]*>'
        $imageRegex = [regex]'(?is)<img[^>]+(?:data-src|src)="([^"]+)"[^>]*>'
        $found = @{}
        foreach ($profile in $profileRegex.Matches($html)) {
            $name = [Net.WebUtility]::HtmlDecode($profile.Groups[1].Value).Trim()
            $remaining = $html.Substring($profile.Index, [Math]::Min(3000, $html.Length - $profile.Index))
            $image = $imageRegex.Match($remaining)
            if (-not $image.Success) { continue }
            $source = [Net.WebUtility]::HtmlDecode($image.Groups[1].Value)
            if ($source -match '(?i)generic|placeholder|no-image|logo') { continue }
            $sourceUrl = [uri]::new([uri]$rosterUrl, $source).AbsoluteUri
            $sourceUrl = [regex]::Replace($sourceUrl, '([?&])width=\d+', '$1width=500', 'IgnoreCase')
            $sourceUrl = [regex]::Replace($sourceUrl, '([?&])quality=\d+', '$1quality=95', 'IgnoreCase')
            $found["$name`|$sourceUrl"] = @($name, $sourceUrl)
        }
        $count = 0
        foreach ($item in $found.Values) {
            $name, $sourceUrl = $item
            $stateKey = "$key|$name|$sourceUrl"
            if (-not $Force -and $state.ContainsKey($stateKey)) { continue }
            try {
                Write-Host "$key`: refreshing $name..."
                $response = Invoke-WebRequest -Uri $sourceUrl -UseBasicParsing -TimeoutSec 60
                $bytes = [byte[]]$response.Content
                if ($bytes.Length -lt 1000) { throw 'Response was not an image.' }
                $base = Join-Path $output "$key-$(ConvertTo-Slug $name)"
                Get-ChildItem -LiteralPath "$base.*" -ErrorAction SilentlyContinue | Remove-Item -Force
                $path = "$base$(Get-ImageExtension $bytes $sourceUrl)"
                [IO.File]::WriteAllBytes($path, $bytes)
                $state[$stateKey] = @{ file = [IO.Path]::GetFileName($path); refreshed = (Get-Date).ToString('s') }
                Save-RefreshState
                $count++
                $total++
            } catch {
                Write-Warning "$key`: could not refresh $name ($($_.Exception.Message))"
            }
        }
        Write-Host "$key`: refreshed $count of $($found.Count) roster headshots."
    } catch {
        Write-Warning "$key`: roster could not be read ($($_.Exception.Message))"
    }
}
Write-Host "Done: refreshed $total headshots."
