const { desktopCapturer } = require('electron')

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
      return new Promise(resolve => {
        video.onplay = () => {

          video.style.height = video.videoHeight + 'px' // videoHeight
          video.style.width = video.videoWidth + 'px' // videoWidth
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth,
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          setTimeout(() => {
            stream.getTracks().forEach(track => track.stop())
          }, 200)
          // document.getElementsByTagName('img')[0].src = canvas.toDataURL()
          resolve(ctx)
        }
      })
    })
  },
  isDev () {
    return process.env.NODE_ENV === 'dev'
  },
  detector(screen, cv) {
    // const cv = module.exports
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
      return new Promise(resolve => {
        video.onplay = () => {

          video.style.height = video.videoHeight + 'px' // videoHeight
          video.style.width = video.videoWidth + 'px' // videoWidth
          const cap = new cv.VideoCapture(video)

          // 创建存放图像的Mat
          let imageMat = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
          // 读一帧图像
          console.log('read')
          cap.read(imageMat);

          const dst = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC1)

          const qrcodeDetector = new cv.QRcodeDetector(imageMat, dst)

          console.log(dst)

          // const canvas = document.createElement('canvas')
          // canvas.width = video.videoWidth,
          // canvas.height = video.videoHeight
          // const ctx = canvas.getContext('2d')
          // ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          setTimeout(() => {
            stream.getTracks().forEach(track => track.stop())
          }, 300)
          // document.getElementsByTagName('img')[0].src = canvas.toDataURL()
          // resolve(ctx)
        }
      })
    })
  }
}
