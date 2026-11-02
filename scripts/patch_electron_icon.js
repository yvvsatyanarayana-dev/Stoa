const fs = require('fs')
const path = require('path')
const resedit = require('resedit')

try {
  const distDir = path.resolve('node_modules/electron/dist')
  const electronExePath = path.join(distDir, 'electron.exe')
  const stoaExePath = path.join(distDir, 'stoa.exe')
  const pathTxtPath = path.resolve('node_modules/electron/path.txt')
  const icoPath = path.resolve('build/icon.ico')

  if (!fs.existsSync(icoPath)) {
    console.error('icon.ico not found at:', icoPath)
    process.exit(1)
  }

  const icoBuffer = fs.readFileSync(icoPath)
  const iconFile = resedit.Data.IconFile.from(icoBuffer)

  // 1. Ensure stoa.exe exists by copying from electron.exe if needed
  if (!fs.existsSync(stoaExePath) && fs.existsSync(electronExePath)) {
    fs.copyFileSync(electronExePath, stoaExePath)
  }

  // 2. Patch stoa.exe with the new Stoa icon
  if (fs.existsSync(stoaExePath)) {
    try {
      const exeBuffer = fs.readFileSync(stoaExePath)
      const exe = resedit.NtExecutable.from(exeBuffer)
      const res = resedit.NtExecutableResource.from(exe)
      resedit.Resource.IconGroupEntry.replaceIconsForResource(
        res.entries,
        1,
        1033,
        iconFile.icons.map((item) => item.data)
      )
      res.outputResource(exe)
      fs.writeFileSync(stoaExePath, Buffer.from(exe.generate()))
      console.log('SUCCESS! stoa.exe icon patched to Stoa icon!')
    } catch (err) {
      console.warn('Could not patch stoa.exe directly:', err.message)
    }
  }

  // 3. Point electron binary to stoa.exe to guarantee fresh Windows taskbar grouping & icon
  fs.writeFileSync(pathTxtPath, 'stoa.exe')

  // 4. Also attempt to patch electron.exe if not currently in use
  if (fs.existsSync(electronExePath)) {
    try {
      const exeBuffer = fs.readFileSync(electronExePath)
      const exe = resedit.NtExecutable.from(exeBuffer)
      const res = resedit.NtExecutableResource.from(exe)
      resedit.Resource.IconGroupEntry.replaceIconsForResource(
        res.entries,
        1,
        1033,
        iconFile.icons.map((item) => item.data)
      )
      res.outputResource(exe)
      fs.writeFileSync(electronExePath, Buffer.from(exe.generate()))
      console.log('SUCCESS! electron.exe icon patched as well!')
    } catch (err) {
      // electron.exe might be running in background; stoa.exe is used
    }
  }

  // 5. Create or update Windows Start Menu shortcut for Stoa
  const appData = process.env.APPDATA
  if (appData) {
    const programsDir = path.join(appData, 'Microsoft/Windows/Start Menu/Programs')
    if (fs.existsSync(programsDir)) {
      const shortcutPath = path.join(programsDir, 'Stoa.lnk')
      const psScript = `
$sh = New-Object -ComObject WScript.Shell
$sc = $sh.CreateShortcut("${shortcutPath.replace(/\\/g, '\\\\')}")
$sc.TargetPath = "${stoaExePath.replace(/\\/g, '\\\\')}"
$sc.Arguments = "."
$sc.WorkingDirectory = "${path.resolve('.').replace(/\\/g, '\\\\')}"
$sc.IconLocation = "${icoPath.replace(/\\/g, '\\\\')},0"
$sc.Save()
`
      try {
        const { execSync } = require('child_process')
        execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, '; ')}"`, { stdio: 'ignore' })
        console.log('Start menu shortcut Stoa.lnk created/updated!')
      } catch {}
    }
  }

  console.log('App taskbar icon configuration complete!')
} catch (err) {
  console.error('Failed to configure taskbar icon:', err)
  process.exit(1)
}
