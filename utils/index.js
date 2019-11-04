const { desktopCapturer } = require('electron')

module.exports = {
  getScreenshot (screen) {
    return desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: window.screen.width * window.devicePixelRatio, height: window.screen.height * window.devicePixelRatio }
    }).then(sources => {
      console.log(sources)
      const source = sources.find(item => item.display_id === screen.id + '')
      return source && source.thumbnail
    })
  }
}
