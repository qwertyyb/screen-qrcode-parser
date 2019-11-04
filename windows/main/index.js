const { ipcRenderer, remote } = require('electron')
const jsQR = require('jsqr')
const $ = require('jquery')
const utils = require('../../utils')

const calcRightRect = qrlocation => {
  const { topLeftCorner, topRightCorner, bottomLeftCorner } = qrlocation
  const width = topRightCorner.x - topLeftCorner.x + 10
  const height = bottomLeftCorner.y - topLeftCorner.y + 10
  const top = topLeftCorner.y - 23 - 5
  const left = topLeftCorner.x - 5
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

ipcRenderer.on('read-screen-qrcode', (event, args) => {
  console.log('read screen qrcode')
  return utils.getScreenshot(args.curScreen).then(thumbnail => {
    if (!thumbnail) {
      return alert('获取屏幕内容失败')
    }
    // $('img').attr('src', thumbnail.toDataURL())
    const { width, height } = thumbnail.getSize()
    const res = jsQR(thumbnail.toBitmap(), width, height)
    console.log(res)
    if (!res) {
      return alert('未读取到二维码')
    }
    if (!res.data) {
      return alert('未识别到二维码内容')
    }
    if (res) {
      const rect = calcRightRect(res.location, args.curScreen.workArea)
      updateRect(rect)
      setTimeout(() => ipcRenderer.send('qrcode-received', { data: res.data }), 600)
    }
  })
})