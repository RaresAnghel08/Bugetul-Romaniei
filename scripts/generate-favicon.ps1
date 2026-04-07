Add-Type -AssemblyName System.Drawing

$publicDir = Join-Path $PSScriptRoot "..\public"
$masterPath = Join-Path $publicDir "favicon.png"

$size = 256
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$roBlue = [System.Drawing.ColorTranslator]::FromHtml("#002B7F")
$roYellow = [System.Drawing.ColorTranslator]::FromHtml("#FCD116")
$roRed = [System.Drawing.ColorTranslator]::FromHtml("#CE1126")

$backgroundRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $backgroundRect,
  ([System.Drawing.ColorTranslator]::FromHtml("#0B1022")),
  ([System.Drawing.ColorTranslator]::FromHtml("#142447")),
  135
)
$graphics.FillRectangle($bgBrush, $backgroundRect)

$panelRect = New-Object System.Drawing.Rectangle(20, 20, 216, 216)
$panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 15, 22, 42))
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160, 0, 43, 127), 2)
$graphics.FillRectangle($panelBrush, $panelRect)
$graphics.DrawRectangle($panelPen, $panelRect)

$flagBarX = 35
$flagBarY = 178
$flagBarW = 186
$flagBarH = 32
$segment = [Math]::Floor($flagBarW / 3)

$blueBrush = New-Object System.Drawing.SolidBrush($roBlue)
$yellowBrush = New-Object System.Drawing.SolidBrush($roYellow)
$redBrush = New-Object System.Drawing.SolidBrush($roRed)

$graphics.FillRectangle($blueBrush, $flagBarX, $flagBarY, $segment, $flagBarH)
$graphics.FillRectangle($yellowBrush, $flagBarX + $segment, $flagBarY, $segment, $flagBarH)
$graphics.FillRectangle($redBrush, $flagBarX + (2 * $segment), $flagBarY, $flagBarW - (2 * $segment), $flagBarH)

$font = New-Object System.Drawing.Font("Segoe UI", 112, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#F8FBFF"))
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 0, 0, 0))

$graphics.DrawString("BR", $font, $shadowBrush, 40, 42)
$graphics.DrawString("BR", $font, $textBrush, 36, 38)

$bitmap.Save($masterPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bitmap.Dispose()
$bgBrush.Dispose()
$panelBrush.Dispose()
$panelPen.Dispose()
$blueBrush.Dispose()
$yellowBrush.Dispose()
$redBrush.Dispose()
$font.Dispose()
$textBrush.Dispose()
$shadowBrush.Dispose()

$source = [System.Drawing.Image]::FromFile($masterPath)
$targets = @(
  @{ File = "favicon-32x32.png"; Size = 32 },
  @{ File = "favicon-16x16.png"; Size = 16 },
  @{ File = "apple-touch-icon.png"; Size = 180 }
)

foreach ($target in $targets) {
  $resized = New-Object System.Drawing.Bitmap($target.Size, $target.Size)
  $g = [System.Drawing.Graphics]::FromImage($resized)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($source, 0, 0, $target.Size, $target.Size)

  $outPath = Join-Path $publicDir $target.File
  $resized.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose()
  $resized.Dispose()
  Write-Output "Generated $outPath"
}

$source.Dispose()
Write-Output "Generated $masterPath"
