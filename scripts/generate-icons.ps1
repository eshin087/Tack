# Generate Tack marketplace + extension icons from icons/source.png.
# Requires PowerShell 5.1+ on Windows (uses System.Drawing).
# Run from the repo root: pwsh scripts/generate-icons.ps1

param(
  [string]$Source = "icons/source.png"
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $Source)) {
  Write-Error "Source image not found at $Source"
  exit 1
}

function Resize-Square {
  param([string]$InPath, [string]$OutPath, [int]$Size)
  $orig = [System.Drawing.Image]::FromFile((Resolve-Path $InPath))
  try {
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Scale to fit, centered, preserving aspect ratio.
    $ratio = [Math]::Min($Size / $orig.Width, $Size / $orig.Height)
    $w = [int]($orig.Width * $ratio)
    $h = [int]($orig.Height * $ratio)
    $x = [int](($Size - $w) / 2)
    $y = [int](($Size - $h) / 2)
    $g.DrawImage($orig, $x, $y, $w, $h)

    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "  -> $OutPath ($Size x $Size)"
  } finally {
    $orig.Dispose()
  }
}

function Generate-PromoTile {
  param([string]$InPath, [string]$OutPath, [int]$Width, [int]$Height, [string]$Title, [string]$Subtitle)
  $orig = [System.Drawing.Image]::FromFile((Resolve-Path $InPath))
  try {
    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Background: warm cream so the red icon pops.
    $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 254, 247, 224))
    $g.FillRectangle($bg, 0, 0, $Width, $Height)
    $bg.Dispose()

    # Icon on the left third.
    $iconSize = [int]($Height * 0.55)
    $iconX = [int]($Width * 0.10)
    $iconY = [int](($Height - $iconSize) / 2)
    $ratio = [Math]::Min($iconSize / $orig.Width, $iconSize / $orig.Height)
    $iw = [int]($orig.Width * $ratio)
    $ih = [int]($orig.Height * $ratio)
    $g.DrawImage($orig, $iconX + ($iconSize - $iw) / 2, $iconY + ($iconSize - $ih) / 2, $iw, $ih)

    # Title + subtitle on the right.
    $textX = $iconX + $iconSize + [int]($Width * 0.04)
    $titleFont = New-Object System.Drawing.Font "Segoe UI", ([int]($Height * 0.18)), ([System.Drawing.FontStyle]::Bold)
    $subFont   = New-Object System.Drawing.Font "Segoe UI", ([int]($Height * 0.07)), ([System.Drawing.FontStyle]::Regular)
    $titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 90, 68, 0))
    $subBrush   = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 90, 68, 0))

    $titleSize = $g.MeasureString($Title, $titleFont)
    $subSize   = $g.MeasureString($Subtitle, $subFont)
    $totalH = $titleSize.Height + $subSize.Height + 8
    $titleY = [int](($Height - $totalH) / 2)
    $g.DrawString($Title,    $titleFont, $titleBrush, $textX, $titleY)
    $g.DrawString($Subtitle, $subFont,   $subBrush,   $textX, $titleY + $titleSize.Height + 8)

    $titleFont.Dispose(); $subFont.Dispose(); $titleBrush.Dispose(); $subBrush.Dispose()
    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "  -> $OutPath ($Width x $Height)"
  } finally {
    $orig.Dispose()
  }
}

Write-Host "Generating extension icons (icons/)..."
Resize-Square -InPath $Source -OutPath "icons/icon-16.png"  -Size 16
Resize-Square -InPath $Source -OutPath "icons/icon-32.png"  -Size 32
Resize-Square -InPath $Source -OutPath "icons/icon-48.png"  -Size 48
Resize-Square -InPath $Source -OutPath "icons/icon-128.png" -Size 128

Write-Host ""
Write-Host "Generating marketplace promo tiles (store-assets/)..."
Generate-PromoTile -InPath $Source -OutPath "store-assets/promo-tile-440x280.png"   -Width 440  -Height 280  -Title "Tack"          -Subtitle "Pin a filter to every search"
Generate-PromoTile -InPath $Source -OutPath "store-assets/promo-tile-1400x560.png"  -Width 1400 -Height 560  -Title "Tack"          -Subtitle "Pin a site: filter to every search. One key cycles between Reddit, GitHub & more."

Write-Host ""
Write-Host "Done."
