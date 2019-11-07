module.exports = {
  /* 二维码识别方式
   * 目前支持两种:
   * 1. jsQR 使用 [jsQR](https://github.com/cozmo/jsQR) 库来做识别
   * 2. zxing-wasm 使用 [基于zxing的webAssembly](https://github.com/nu-book/zxing-cpp) 识别
   */
  // detectMethod: 'zxing-wasm'
  detectMethod: 'jsQR'
}