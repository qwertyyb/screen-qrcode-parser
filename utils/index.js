const jsQR = require('jsqr')

module.exports = {
  getScreenshot (screen) {
    // @todo desktopCapturer.getSources在Macos下会产生内存泄露问题
    // body 由于在此版本(6.1.13)macos下会产生内存泄露问题，并且暂时由于各种原因，无法安装7以上版本，所以暂时使用 `navigator.mediaDevices.getUserMedia` 替代。 `chromeMediaSourceId` 经过分析规律得到，经过不完全测试，应该仅在Macos下可用，未必在所有平台可用，后续待 `electron` 把问题解决后，升级版本解决此问题
    // return desktopCapturer.getSources({
    //   types: ['screen'],
    //   thumbnailSize: { width: window.screen.width * window.devicePixelRatio, height: window.screen.height * window.devicePixelRatio }
    // }).then(sources => {
    //   console.log(sources)
    //   const source = sources.find(item => item.display_id === screen.id + '')
    //   return source && source.thumbnail
    // })
    const { bounds, scaleFactor } = screen
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          minWidth: bounds.width,
          minHeight: bounds.height,
          maxWidth: bounds.width * scaleFactor,
          maxHeight: bounds.height * scaleFactor,
          chromeMediaSourceId: `screen:${screen.id}:0`,
        }
      }
    }).then(stream => {
      const video = document.querySelector('#video')
      video.srcObject = stream
      return new Promise((resolve, reject) => {
        video.onplay = () => {
          video.style.height = video.videoHeight + 'px' // videoHeight
          video.style.width = video.videoWidth + 'px' // videoWidth
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth,
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          // setTimeout(() => {
          stream.getTracks().forEach(track => track.stop())
          // }, 200)
          // document.getElementsByTagName('img')[0].src = canvas.toDataURL()
          resolve(ctx)
        }
        setTimeout(reject, 3000, new Error('读取屏幕内容超时'))
      })
    })
  },
  detectWithJsQR (ctx) {
    const { width, height } = ctx.canvas
    const res = jsQR(ctx.getImageData(0, 0, width, height).data, width, height)
    console.log(res)
    if (!res) {
      throw new Error('未读取到二维码')
    }
    if (!res.data) {
      throw new Error('未识别到二维码内容')
    }
    return { text: res.data, location: res.location }
  },
  calcQRRect (qrlocation, scaleFactor) {
    const { topLeftCorner, topRightCorner, bottomLeftCorner } = qrlocation
    const width = (topRightCorner.x - topLeftCorner.x) / scaleFactor + 4
    const height = (bottomLeftCorner.y - topLeftCorner.y) / scaleFactor + 4
    const top = topLeftCorner.y / scaleFactor - 23 - 5
    const left = topLeftCorner.x / scaleFactor - 5
    return {
      top, left, width, height
    }
  },
  isDev () {
    return process.env.NODE_ENV === 'dev'
  },
  detectWithZXingWasm(ctx) {
    const pngData = ctx.canvas.toDataURL("image/png")
    const fileData = base64ToUint8Array(pngData)
    const buffer = zxing._malloc(fileData.length)
    zxing.HEAPU8.set(fileData, buffer);
    const result = zxing.readBarcodeFromPng(buffer, fileData.length, true, 'QR_CODE');
    zxing._free(buffer.byteOffset);
    console.log(result)

    if (!result || result.error) {
      throw new Error(result && result.error || '二维码检测出错')
    }
    if (!result.text) {
      throw new Error('未识别到二维码内容')
    }
    // @todo zxing-wasm 方式返回信息中缺少位置信息
    return { text: result.text, location: null }
  }
}
