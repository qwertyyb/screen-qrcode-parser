const { app, Menu, Tray, BrowserWindow, ipcMain, globalShortcut } = require('electron')
const { isDev } = require('./utils')
const preferences = require('./db/preferences')
app.disableHardwareAcceleration()

let tray = null
let mainWindow = null

const emitScreenQRcodeParser = () => {
  const { screen } = require('electron')
  const curScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  console.log('current screen', curScreen)
  if (!mainWindow) { return }
  mainWindow.webContents.send('read-screen-qrcode', {
    curScreen
  })
  mainWindow.show()
  mainWindow.setPosition(curScreen.workArea.x, curScreen.workArea.y)
  mainWindow.setSize(curScreen.workArea.width, curScreen.workArea.height)
}

const createTray = () => {
  const tray = new Tray(`${__dirname}/assets/images/status.png`)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '读取二维码',
      type: 'normal',
      accelerator: preferences.get('hotkey'),
      click () {
        emitScreenQRcodeParser()
      } 
    },
    { 
      label: '切换检测方式',
      type: 'submenu',
      submenu: [
        {
          label: 'jsQR - 会返回位置信息，但二维码非常小或非常大时会检测不到',
          type: 'radio',
          checked: preferences.get('detectMethod') === 'jsQR',
          click () {
            console.log('toggle detect method')
            preferences.set('detectMethod', 'jsQR')
          }
        },
        {
          label: 'ZXing WebAssembly - 检测效果非常好，但暂时缺少二维码的位置信息',
          type: 'radio',
          checked: preferences.get('detectMethod') === 'zxing-wasm',
          click () {
            console.log('toggle detect method')
            preferences.set('detectMethod', 'zxing-wasm')
          }
        }
      ]
    },
    {
      label: '首选项',
      type: 'normal',
      click () {
        const win = createPreferencesWindow()
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
    show: false,
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

const createPreferencesWindow = () => {
  const window = new BrowserWindow({
    width: 300,
    height: 240,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      devTools: true,
      nodeIntegration: true
    }
  })
  window.loadFile('./windows/preferences/index.html')
  window.openDevTools()
  return window
}

const bindShortcut = () => {
  const success = globalShortcut.register(preferences.get('hotkey'), e => {
    emitScreenQRcodeParser()
  })
  if (!success) {
    console.log('register global shortcut fail')
  }
}

const recreateMainWindow = () => {
  mainWindow && !mainWindow.isDestroyed() && mainWindow.destroy()
  mainWindow = createMainWindow()
  return mainWindow
}
app.on('ready', () => {
  mainWindow = createMainWindow()
  tray = createTray()

  bindShortcut()
})
// listen this event will prevent default action (app will quit after close all window)
app.on('window-all-closed', () => {})

app.setLoginItemSettings({
  openAtLogin: preferences.get('launchAtLogin'),
  openAsHidden: true
})

ipcMain.on('mainWindow:recreate', event => {
  console.log('recreate window')
  recreateMainWindow()
})

ipcMain.on('preferences:update', (_, newpreferences) => {
  console.log(newpreferences)
  for(let key in newpreferences) {
    preferences.set(key, newpreferences[key])
  }
  globalShortcut.unregisterAll()
  if ('hotkey' in newpreferences) {
    tray = createTray()
    bindShortcut()
  }
  console.log(global.preferences)
})
