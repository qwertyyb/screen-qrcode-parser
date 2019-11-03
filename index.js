const { app, Menu, Tray, BrowserWindow, ipcMain, dialog, clipboard } = require('electron')

let tray = null
let mainWindow = null

const createTray = () => {
  const tray = new Tray(`${__dirname}/assets/images/status.png`)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '读取二维码',
      type: 'normal',
      click () {
        const { screen } = require('electron')
        mainWindow && mainWindow.webContents.send('read-screen-qrcode', {
          workArea: screen.getPrimaryDisplay().workArea
        })
      } 
    },
    { type: 'separator' },
    {
      label: '退出',
      type: 'normal',
      role: 'quit'
    },
    {
      label: '关于',
      role: 'about'
    }
  ])
  tray.setToolTip('This is my application.')
  tray.setContextMenu(contextMenu)
  return tray
}

const createMainWindow = () => {
  const { screen } = require('electron')
  const size = screen.getPrimaryDisplay().size
  const mainWindow = new BrowserWindow({
    ...size,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      webSecurity: true
    }
  })
  mainWindow.loadURL(`file://${__dirname}/windows/main/index.html`)
  mainWindow.setIgnoreMouseEvents(true)
  // mainWindow.webContents.openDevTools()
  return mainWindow
}
app.on('ready', () => {
  mainWindow = createMainWindow()
  tray = createTray()
})

ipcMain.on('qrcode-received', (event, { data }) => {
  dialog.showMessageBox({
    title: '操作提示',
    type: 'none',
    buttons: ['取消', '确认'],
    message: `二维码内容为: ${data}, 复制到粘贴板?`
  }).then(({ response }) => {
    if (response) {
      clipboard.writeText(data)
    }
  })
})


// app.dock.hide()