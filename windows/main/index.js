const { ipcRenderer } = require('electron')
const jsQR = require('jsqr')
const $ = require('jquery')
const utils = require('../../utils')

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
  showRectTimeout = setTimeout(() => {
    $('.location-rect').css({
      transition: 'none',
      opacity: '0',
      left: 0,
      top: 0,
      width: '3000px',
      height: '3000px'
    })
  }, 3e3)
}

const emitCloseWindow = () => {
  ipcRenderer.send('close-window')
}

ipcRenderer.on('read-screen-qrcode', (event, args) => {
  console.log('read screen qrcode')
  return utils.detector(args.curScreen, module.exports)
  return utils.getScreenshot(args.curScreen).then(ctx => {
    if (!ctx) {
      alert('获取屏幕内容失败')
      return emitCloseWindow()
    }
    const { width, height } = ctx.canvas
    const res = jsQR(ctx.getImageData(0, 0, width, height).data, width, height)
    console.log(res)
    if (!res) {
      alert('未读取到二维码')
      return emitCloseWindow()
    }
    if (!res.data) {
      alert('未识别到二维码内容')
      return emitCloseWindow()
    }
    const rect = calcRightRect(res.location, args.curScreen.scaleFactor)
    updateRect(rect)
    setTimeout(() => ipcRenderer.send('qrcode-received', { data: res.data }), 600)
  })
})