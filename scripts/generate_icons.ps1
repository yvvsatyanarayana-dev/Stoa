Add-Type -AssemblyName System.Drawing

$src = "C:\Users\yerip\.gemini\antigravity\brain\c6d32132-50e7-4db4-ae16-40fb3db18d46\stoa_app_icon_1793444860304.jpg"
$img = [System.Drawing.Bitmap]::new($src)

# 1. Save 512x512 PNGs
$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g512.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g512.DrawImage($img, 0, 0, 512, 512)
$g512.Dispose()

$bmp512.Save("D:\PROJECTS\EVENT\resources\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Save("D:\PROJECTS\EVENT\build\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Dispose()

# 2. Build multi-size Windows .ico file using standard binary structure
$sizes = @(256, 128, 64, 48, 32, 16)
$pngBytesList = @()

foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $s, $s)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytesList += ,@($s, $ms.ToArray())
    $ms.Dispose()
    $bmp.Dispose()
}

$img.Dispose()

# Create .ico binary
$icoStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter $icoStream

# ICONDIR header: Reserved(2), Type(2, 1=icon), Count(2)
$writer.Write([uint16]0)
$writer.Write([uint16]1)
$writer.Write([uint16]$sizes.Count)

# Calculate initial offset for image data: 6 (ICONDIR) + 16 * count (ICONDIRENTRY)
$dataOffset = 6 + (16 * $sizes.Count)

foreach ($item in $pngBytesList) {
    $s = $item[0]
    $bytes = $item[1]
    $bWidth = if ($s -ge 256) { [byte]0 } else { [byte]$s }
    $bHeight = if ($s -ge 256) { [byte]0 } else { [byte]$s }

    $writer.Write([byte]$bWidth)        # bWidth
    $writer.Write([byte]$bHeight)       # bHeight
    $writer.Write([byte]0)              # bColorCount
    $writer.Write([byte]0)              # bReserved
    $writer.Write([uint16]1)            # wPlanes
    $writer.Write([uint16]32)           # wBitCount
    $writer.Write([uint32]$bytes.Length)# dwBytesInRes
    $writer.Write([uint32]$dataOffset)  # dwImageOffset

    $dataOffset += $bytes.Length
}

foreach ($item in $pngBytesList) {
    $writer.Write($item[1])
}

$writer.Flush()
[System.IO.File]::WriteAllBytes("D:\PROJECTS\EVENT\build\icon.ico", $icoStream.ToArray())
[System.IO.File]::WriteAllBytes("D:\PROJECTS\EVENT\resources\icon.ico", $icoStream.ToArray())

$writer.Dispose()
$icoStream.Dispose()

Write-Host "Icons generated successfully!"
