<#!
.SYNOPSIS
Uploads current OUA roster photos with roster-verified player-name mappings.

.DESCRIPTION
Each athletics roster exposes an LD+JSON player record that binds a name to an
image URL. This script uses that record rather than trying to infer a player
from nearby HTML. Brock uses the supplied Head_Shots folder as its source of
truth, because its roster currently has no published image for several players.
#>
[CmdletBinding()]
param(
  [ValidateSet('all','brock-badgers','guelph-gryphons','mcmaster-marauders','u-of-t-varsity-blues','waterloo-warriors','western-mustangs','wilfrid-laurier-golden-hawks','windsor-lancers')]
  [string]$Team = 'all'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$headshots = Join-Path $root 'headshots'

$teams = [ordered]@{
  'brock-badgers' = 'https://gobadgers.ca/sports/baseball/roster'
  'guelph-gryphons' = 'https://gryphons.ca/sports/baseball/roster'
  'mcmaster-marauders' = 'https://marauders.ca/sports/baseb/roster'
  'u-of-t-varsity-blues' = 'https://varsityblues.ca/sports/baseball/roster'
  'waterloo-warriors' = 'https://athletics.uwaterloo.ca/sports/baseball/roster'
  'western-mustangs' = 'https://westernmustangs.ca/sports/baseball/roster/2025-26'
  'wilfrid-laurier-golden-hawks' = 'https://laurierathletics.com/sports/baseball/roster'
  'windsor-lancers' = 'https://golancers.ca/sports/baseball/roster'
}

function ConvertTo-Slug([string]$Text) {
  $normal = $Text.Normalize([Text.NormalizationForm]::FormD)
  $characters = foreach ($character in $normal.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($character) -ne [Globalization.UnicodeCategory]::NonSpacingMark) { $character }
  }
  (($characters -join '') -replace '[^a-zA-Z0-9]+','-').Trim('-').ToLowerInvariant()
}

function Save-Photo([string]$Name, [string]$TeamSlug, [byte[]]$Bytes) {
  if ($Bytes.Length -lt 1000) { throw 'Image response was too small.' }
  $extension = if ($Bytes[0..2] -join ',' -eq '255,216,255') { '.jpg' } elseif ($Bytes[0..3] -join ',' -eq '137,80,78,71') { '.png' } else { '.jpg' }
  $path = Join-Path $headshots "$TeamSlug-$(ConvertTo-Slug $Name)$extension"
  [IO.File]::WriteAllBytes($path, $Bytes)
}

function Update-Team([string]$TeamSlug, [string]$RosterUrl) {
  Write-Host "$TeamSlug`: reading structured roster data..."
  $content = (Invoke-WebRequest -Uri $RosterUrl -UseBasicParsing -TimeoutSec 60).Content
  $scripts = [regex]::Matches($content, '(?is)<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>')
  $people = @()
  foreach ($script in $scripts) {
    try {
      $data = $script.Groups[1].Value | ConvertFrom-Json
      if ($data.item) { $people += @($data.item) }
    } catch { }
  }
  $updated = 0
  foreach ($person in $people) {
    $name = [string]$person.name
    $url = if ($person.image -is [string]) { [string]$person.image } else { [string]$person.image.url }
    if ([string]::IsNullOrWhiteSpace($name)) { continue }
    if ([string]::IsNullOrWhiteSpace($url)) {
      # The source roster has no photo for this player. Remove only our
      # team-prefixed override so Brock falls back to its verified local asset.
      if ($TeamSlug -eq 'brock-badgers') {
        Get-ChildItem -LiteralPath $headshots -Filter "$TeamSlug-$(ConvertTo-Slug $name).*" -ErrorAction SilentlyContinue | Remove-Item -Force
      }
      continue
    }
    try {
      $image = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 60
      Save-Photo $name $TeamSlug ([byte[]]$image.Content)
      $updated++
    } catch { Write-Warning "$TeamSlug`: skipped $name ($($_.Exception.Message))" }
  }
  Write-Host "$TeamSlug`: uploaded $updated verified roster headshots."
}

foreach ($teamSlug in $teams.Keys) {
  if ($Team -eq 'all' -or $Team -eq $teamSlug) { Update-Team $teamSlug $teams[$teamSlug] }
}
