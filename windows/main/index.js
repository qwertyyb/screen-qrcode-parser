const { ipcRenderer, clipboard } = require('electron')
const $ = require('jquery')
const utils = require('../../utils')
const preferences = require('electron').remote.getGlobal('preferences')

const calcRightRect = (qrlocation, scaleFactor) => {
  const { topLeftCorner, topRightCorner, bottomLeftCorner } = qrlocation
  const width = (topRightCorner.x - topLeftCorner.x) / scaleFactor + 4
  const height = (bottomLeftCorner.y - topLeftCorner.y) / scaleFactor + 4
  const top = topLeftCorner.y / scaleFactor - 23 - 5
  const left = topLeftCorner.x / scaleFactor - 5
  return {
    top, left, width, height
  }
}


const zxing = ZXing()

let showRectTimeout = null
const updateRect = ({ top, left, width, height }) => {
  clearTimeout(showRectTimeout)
  $('.location-rect').css({
    opacity: '1',
    top: top + 'px',
    left: left + 'px',
    height: height + 'px',
    width: width + 'px',
    transition: 'all .5s'
  })
  // showRectTimeout = setTimeout(() => {
  //   $('.location-rect').css({
  //     transition: 'none',
  //     opacity: '0',
  //     left: 0,
  //     top: 0,
  //     width: '3000px',
  //     height: '3000px'
  //   })
  // }, 3e3)
}

const recreateWindow = () => {
  ipcRenderer.send('mainWindow: recreate')
}

ipcRenderer.on('read-screen-qrcode', (event, args) => {
  console.log('read screen qrcode')
  return utils.getScreenshot(args.curScreen)
  .then(ctx => {
    const detectMethod = preferences.detectMethod
    console.log('detect method', detectMethod)
    console.time('detect time')
    const detect = detectMethod === 'jsQR' ? utils.detectWithJsQR : detectMethod === 'zxing-wasm' ? utils.detectWithZXingWasm : null
    console.timeEnd('detect time')
    if (!detect) {
      throw new Error(`没有找到${detectMethod}的检测方法，请检查设置`)
    }
    const { text, location } = detect(ctx)
    if (location) {
      const rect = utils.calcQRRect(location, args.curScreen.scaleFactor)
      updateRect(rect)
    }
    setTimeout(() => {
      if(confirm(`二维码内容为: \n ${text} \n复制到粘贴板?`)) {
        clipboard.writeText(text)
      }
      recreateWindow()
    }, 600)
  })
  .catch(err => {
    alert(err.message)
    recreateWindow()
    throw err
  })
})