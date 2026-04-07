Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630
$outputPath = Join-Path $PSScriptRoot "..\public\og-cover.png"

$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$backgroundRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $backgroundRect,
  ([System.Drawing.ColorTranslator]::FromHtml("#0c0d14")),
  ([System.Drawing.ColorTranslator]::FromHtml("#1a1e35")),
  145
)
$graphics.FillRectangle($bgBrush, $backgroundRect)

$circleBrush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 34, 211, 238))
$circleBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 245, 158, 11))
$circleBrush3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(32, 46, 196, 182))
$graphics.FillEllipse($circleBrush1, -110, -110, 420, 420)
$graphics.FillEllipse($circleBrush2, 840, -80, 360, 360)
$graphics.FillEllipse($circleBrush3, 760, 340, 460, 460)

$panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(188, 17, 22, 42))
$panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 103, 232, 249), 2)
$graphics.FillRectangle($panelBrush, 84, 98, 1032, 432)
$graphics.DrawRectangle($panelPen, 84, 98, 1032, 432)

$accentRect = New-Object System.Drawing.Rectangle(130, 404, 640, 62)
$accentBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $accentRect,
  ([System.Drawing.ColorTranslator]::FromHtml("#22d3ee")),
  ([System.Drawing.ColorTranslator]::FromHtml("#2ec4b6")),
  0
)
$graphics.FillRectangle($accentBrush, $accentRect)

$fontSmall = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Regular)
$fontTitle = New-Object System.Drawing.Font("Georgia", 74, [System.Drawing.FontStyle]::Bold)
$fontLead = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular)
$fontPill = New-Object System.Drawing.Font("Segoe UI", 29, [System.Drawing.FontStyle]::Bold)

$brushCyan = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#67e8f9"))
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#f8fbff"))
$brushMuted = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#d4dcf4"))
$brushDark = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#042226"))

$graphics.DrawString("BUGETUL-ROMANIEI.RO", $fontSmall, $brushCyan, 130, 162)
$graphics.DrawString("Bugetul Romaniei", $fontTitle, $brushWhite, 130, 220)
$graphics.DrawString("Dashboard civic pentru transparenta bugetara", $fontLead, $brushMuted, 130, 330)
$graphics.DrawString("Overview | Ministere | Investitii", $fontPill, $brushDark, 160, 414)

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$fontSmall.Dispose()
$fontTitle.Dispose()
$fontLead.Dispose()
$fontPill.Dispose()
$brushCyan.Dispose()
$brushWhite.Dispose()
$brushMuted.Dispose()
$brushDark.Dispose()
$circleBrush1.Dispose()
$circleBrush2.Dispose()
$circleBrush3.Dispose()
$panelBrush.Dispose()
$panelPen.Dispose()
$accentBrush.Dispose()
$bgBrush.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Generated $outputPath"
