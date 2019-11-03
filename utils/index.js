const { desktopCapturer } = require('electron')

module.exports = {
  getScreenshot () {
    return desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: window.screen.width, height: window.screen.height }
    }).then(sources => {
      const source = sources.find(item => item.name === 'Entire Screen')
      console.log(source)
      return source && source.thumbnail
    })
  }
}
