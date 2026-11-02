Add-Type -AssemblyName System.Drawing

$size = 512
$bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Clear fully transparent
$g.Clear([System.Drawing.Color]::Transparent)

# Helper for rounded rect path
function Get-RoundedRectanglePath {
    param(
        [System.Drawing.RectangleF]$rect,
        [float]$radius
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2.0

    $arc = New-Object System.Drawing.RectangleF $rect.X, $rect.Y, $diameter, $diameter
    # Top-Left
    $path.AddArc($arc, 180, 90)

    # Top-Right
    $arc.X = $rect.Right - $diameter
    $path.AddArc($arc, 270, 90)

    # Bottom-Right
    $arc.Y = $rect.Bottom - $diameter
    $path.AddArc($arc, 0, 90)

    # Bottom-Left
    $arc.X = $rect.Left
    $path.AddArc($arc, 90, 90)

    $path.CloseFigure()
    return $path
}

# 1. Outer White Rounded Squircle Badge (Image 2 style)
# Squircle: (32, 32, 448, 448), radius: 120
$outerRect = New-Object System.Drawing.RectangleF 32, 32, 448, 448
$outerPath = Get-RoundedRectanglePath $outerRect 120

# Fill with bright clean pure white (#FFFFFF)
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillPath($whiteBrush, $outerPath)

# Subtle crisp anti-aliased edge
$edgePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(30, 0, 0, 0), 2)
$g.DrawPath($edgePen, $outerPath)

# 2. Draw Stoa Greek Architectural Columns Emblem inside (Rich Black #111111)
$blackBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 17, 17, 17))

# Architrave (top beam) - clean bold horizontal bar
# Width: 270, Height: 44, centered horizontally at X=121 (121 to 391)
$topBeamRect = New-Object System.Drawing.RectangleF 121, 130, 270, 44
$topBeamPath = Get-RoundedRectanglePath $topBeamRect 7
$g.FillPath($blackBrush, $topBeamPath)

# Architrave sub-band (frieze trim)
$subBandRect = New-Object System.Drawing.RectangleF 135, 174, 242, 12
$g.FillRectangle($blackBrush, $subBandRect)

# 3 Pillars (Columns) with flared capital (top) and base (bottom) plinths
# Column Capitals (flared tops)
$g.FillRectangle($blackBrush, (New-Object System.Drawing.RectangleF 146, 186, 52, 10))
$g.FillRectangle($blackBrush, (New-Object System.Drawing.RectangleF 230, 186, 52, 10))
$g.FillRectangle($blackBrush, (New-Object System.Drawing.RectangleF 314, 186, 52, 10))

# Column Shafts (vertical pillars)
$g.FillRectangle($blackBrush, (New-Object System.Drawing.RectangleF 152, 196, 40, 134))
$g.FillRectangle($blackBrush, (New-Object System.Drawing.RectangleF 236, 196, 40, 134))
$g.FillRectangle($blackBrush, (New-Object System.Drawing.RectangleF 320, 196, 40, 134))

# Column Bases (flared bottom plinths)
$g.FillRectangle($blackBrush, (New-Object System.Drawing.RectangleF 146, 330, 52, 10))
$g.FillRectangle($blackBrush, (New-Object System.Drawing.RectangleF 230, 330, 52, 10))
$g.FillRectangle($blackBrush, (New-Object System.Drawing.RectangleF 314, 330, 52, 10))

# Stylobate / Base (crepidoma)
# Upper foundation step
$step1 = New-Object System.Drawing.RectangleF 135, 340, 242, 18
$g.FillRectangle($blackBrush, $step1)

# Lower ground foundation step (matches top beam width)
$step2Rect = New-Object System.Drawing.RectangleF 115, 358, 282, 34
$step2Path = Get-RoundedRectanglePath $step2Rect 6
$g.FillPath($blackBrush, $step2Path)

# Save 512x512 PNGs to resources and build
$bmp.Save("D:\PROJECTS\EVENT\resources\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("D:\PROJECTS\EVENT\build\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 3. Build multi-size Windows .ico file with true 32-bit DIB bitmaps
function Create-DIBIconEntry {
    param(
        [System.Drawing.Bitmap]$sourceBmp,
        [int]$size
    )

    $resized = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $rg = [System.Drawing.Graphics]::FromImage($resized)
    $rg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $rg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $rg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $rg.DrawImage($sourceBmp, 0, 0, $size, $size)
    $rg.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter $ms

    # Row padding for 1-bit AND mask: must be multiple of 32 bits (4 bytes)
    $andRowBytes = [int]([Math]::Ceiling($size / 32.0) * 4)
    $andMaskSize = $andRowBytes * $size
    $colorDataSize = $size * $size * 4

    # 1. BITMAPINFOHEADER (40 bytes)
    $bw.Write([uint32]40)             # biSize
    $bw.Write([int32]$size)           # biWidth
    $bw.Write([int32]($size * 2))     # biHeight (XOR + AND)
    $bw.Write([uint16]1)              # biPlanes
    $bw.Write([uint16]32)             # biBitCount
    $bw.Write([uint32]0)              # biCompression (BI_RGB)
    $bw.Write([uint32]($colorDataSize + $andMaskSize)) # biSizeImage
    $bw.Write([int32]0)               # biXPelsPerMeter
    $bw.Write([int32]0)               # biYPelsPerMeter
    $bw.Write([uint32]0)              # biClrUsed
    $bw.Write([uint32]0)              # biClrImportant

    # 2. Color pixels (BGRA), bottom-to-top
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $bmpData = $resized.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $stride = $bmpData.Stride
    $scan0 = $bmpData.Scan0
    $totalBytes = [Math]::Abs($stride) * $size
    $rawPixels = New-Object byte[] $totalBytes
    [System.Runtime.InteropServices.Marshal]::Copy($scan0, $rawPixels, 0, $totalBytes)
    $resized.UnlockBits($bmpData)
    $resized.Dispose()

    # Write rows from bottom (size - 1) up to 0
    for ($y = $size - 1; $y -ge 0; $y--) {
        $rowStart = $y * $stride
        $bw.Write($rawPixels, $rowStart, $size * 4)
    }

    # 3. AND mask (all zeros for 32bpp alpha icon)
    $andBytes = New-Object byte[] $andMaskSize
    $bw.Write($andBytes)

    $bw.Flush()
    $data = $ms.ToArray()
    $bw.Dispose()
    $ms.Dispose()

    return @{
        Size = $size
        Data = $data
    }
}

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$entries = @()
foreach ($s in $sizes) {
    $entries += (Create-DIBIconEntry $bmp $s)
}

$g.Dispose()
$bmp.Dispose()

$icoMs = New-Object System.IO.MemoryStream
$icoWriter = New-Object System.IO.BinaryWriter $icoMs

$icoWriter.Write([uint16]0)
$icoWriter.Write([uint16]1)
$icoWriter.Write([uint16]$entries.Count)

$offset = 6 + (16 * $entries.Count)
foreach ($e in $entries) {
    $s = $e.Size
    $bWidth = if ($s -ge 256) { [byte]0 } else { [byte]$s }
    $bHeight = if ($s -ge 256) { [byte]0 } else { [byte]$s }
    $icoWriter.Write([byte]$bWidth)
    $icoWriter.Write([byte]$bHeight)
    $icoWriter.Write([byte]0)
    $icoWriter.Write([byte]0)
    $icoWriter.Write([uint16]1)
    $icoWriter.Write([uint16]32)
    $icoWriter.Write([uint32]$e.Data.Length)
    $icoWriter.Write([uint32]$offset)
    $offset += $e.Data.Length
}

foreach ($e in $entries) {
    $icoWriter.Write($e.Data)
}

$icoWriter.Flush()
[System.IO.File]::WriteAllBytes("D:\PROJECTS\EVENT\build\icon.ico", $icoMs.ToArray())
[System.IO.File]::WriteAllBytes("D:\PROJECTS\EVENT\resources\icon.ico", $icoMs.ToArray())

$icoWriter.Dispose()
$icoMs.Dispose()

Write-Host "New high-contrast white Stoa squircle icon generated with valid Win32 DIB format!"
