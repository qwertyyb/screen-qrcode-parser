const { app, Menu, Tray, BrowserWindow, ipcMain, dialog, clipboard } = require('electron')
const { isDev } = require('./utils')

app.disableHardwareAcceleration()

let tray = null
let mainWindow = null

const createTray = () => {
  const tray = new Tray(`${__dirname}/assets/images/status.png`)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '读取二维码',
      type: 'normal',
      click (menuItem, browserWindow, event) {
        const { screen } = require('electron')
        const curScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
        console.log(curScreen)
        if (!mainWindow) { return }
        mainWindow.webContents.send('read-screen-qrcode', {
          curScreen
        })
        mainWindow.show()
        mainWindow.setPosition(curScreen.workArea.x, curScreen.workArea.y)
        mainWindow.setSize(curScreen.workArea.width, curScreen.workArea.height)
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
  tray.setToolTip('屏幕二维码识别')
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
      devTools: isDev(),
      nodeIntegration: true,
      webSecurity: true
    }
  })
  mainWindow.loadURL(`file://${__dirname}/windows/main/index.html`)
  mainWindow.setIgnoreMouseEvents(true)
  isDev() && mainWindow.webContents.openDevTools()
  return mainWindow
}
app.on('ready', () => {
  mainWindow = createMainWindow()
  tray = createTray()

  mainWindow.hide()
})

ipcMain.on('qrcode-received', (event, { data }) => {
  dialog.showMessageBox({
    title: '操作提示',
    type: 'none',
    buttons: ['取消', '确认'],
    message: `二维码内容为: \n ${data} \n复制到粘贴板?`
  }).then(({ response }) => {
    mainWindow.hide()
    if (response) {
      clipboard.writeText(data)
    }
  })
})

ipcMain.on('close-window', event => {
  console.log('close window')
  mainWindow.hide()
})

// app.dock.hide()