const { ipcRenderer, remote } = require('electron')
const jsQR = require('jsqr')
const $ = require('jquery')
const utils = require('../../utils')

const calcRightRect = (qrlocation, workArea) => {
  const { topLeftCorner, topRightCorner, bottomLeftCorner } = qrlocation
  const width = topRightCorner.x - topLeftCorner.x
  const height = bottomLeftCorner.y - topLeftCorner.y
  const top = topLeftCorner.y - workArea.y
  const left = topLeftCorner.x
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
  return utils.getScreenshot().then(thumbnail => {
    const { width, height } = thumbnail.getSize()
    const res = jsQR(thumbnail.toBitmap(), width, height)
    console.log(res)
    if (!res) {
      return alert('未识别到二维码')
    }
    if (!res.data) {
      return alert('未识别到二维码内容')
    }
    if (res) {
      const rect = calcRightRect(res.location, args.workArea)
      updateRect(rect)
      ipcRenderer.send('qrcode-received', { data: res.data })
    }
  })
})