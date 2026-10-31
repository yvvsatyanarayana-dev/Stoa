const fs = require('fs')
const path = require('path')
const resedit = require('resedit')

try {
  const electronExePath = path.resolve('node_modules/electron/dist/electron.exe')
  const icoPath = path.resolve('build/icon.ico')

  if (!fs.existsSync(electronExePath)) {
    console.error('electron.exe not found at:', electronExePath)
    process.exit(1)
  }

  if (!fs.existsSync(icoPath)) {
    console.error('icon.ico not found at:', icoPath)
    process.exit(1)
  }

  console.log('Reading electron.exe and icon.ico...')
  const exeBuffer = fs.readFileSync(electronExePath)
  const icoBuffer = fs.readFileSync(icoPath)

  const exe = resedit.NtExecutable.from(exeBuffer)
  const res = resedit.NtExecutableResource.from(exe)
  const iconFile = resedit.Data.IconFile.from(icoBuffer)

  // Replace default icon group (ID 1)
  resedit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    1,
    1033, // English US
    iconFile.icons.map((item) => item.data)
  )

  // Write resource entries to exe
  res.outputResource(exe)

  const newExeBuffer = Buffer.from(exe.generate())
  fs.writeFileSync(electronExePath, newExeBuffer)
  console.log('SUCCESS! node_modules/electron/dist/electron.exe icon patched to Stoa icon!')
} catch (err) {
  console.error('Failed to patch electron.exe icon:', err)
  process.exit(1)
}
