const { app, Menu, Tray, BrowserWindow, ipcMain, } = require('electron')
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

const recreateMainWindow = () => {
  mainWindow && !mainWindow.isDestroyed() && mainWindow.destroy()
  mainWindow = createMainWindow()
  mainWindow.hide()
  return mainWindow
}
app.on('ready', () => {
  mainWindow = createMainWindow()
  tray = createTray()

  mainWindow.hide()
})
// listen this event will prevent default action (app will quit after close all window)
app.on('window-all-closed', () => {})

ipcMain.on('mainWindow: recreate', event => {
  console.log(event)
  recreateMainWindow()
})