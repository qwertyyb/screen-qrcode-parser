# 项目介绍

## 背景

二维码出现的频率起来越高，现在不仅仅是在手机上，即使在电脑上，也会经常遇到需要解码当前屏幕中二维码内容的情况。这时，在我看来，有两种选择，一是拿出手机，用手机扫码获取内容，二是搜索解码服务，然后上传图片获取内容。不管哪种方式，都算不上优雅，会打断手上的工作，干扰注意力，降低效率。

所以如果有一个可以直接扫码解析屏幕上二维码的工具，会方便很多，这便是此项目诞生的idea

## 技术选型

1. 从背景上来看，所有的桌面平台系统都会有这样的困镜，所以如果这个工具能够跨桌面平台是最好的。目前跨桌面平台的软件开发框架有 Qt、NW.js、Electron 等，我之前有使用过Qt进行开发，但是C++的复杂语法，还是让人有些望而生畏。至于 `NW.js` ，我的了解并不多，仅限于知道是一个使用js来写GUI程序的框架，微信开发者工具就是使用的 `NW.js` 开发的。相对而言，`Electron` 就高调很多了，大名鼎鼎的 visual studio codo 和 著名的 atom 编辑器就是基于 `Electron` 开发的，它使用web技术结合v8引擎，打造跨平台的应用。基于以上原因，本项目拟使用 `Electron` 进行开发。

2. 确定了跨桌面平台后，我们要看技术方面是否可行。本工具要能够截取当前屏幕的内容，原来对于这样的低层API，我是不抱太大希望能够跨平台的。但是阅读了 [Electron的](https://electronjs.org/docs) 文档后，发现Electron竟然提供了这样的接口，非常方便调用。仔细翻阅之下，它的实现方式其实也都很清楚了，使用的是浏览器提供的 `navigator.mediaDevices.getUserMedia` 这个API。如此看来 `Electron` 的跨平台方案是可行性很高的。

3. 二维码解析的技术方案，这样的轮子还是不要造了，直接使用现成的方案吧。经过在github一翻查找筛选，选出了最终的比较适合的方案——[jsQR](https://github.com/cozmo/jsQR)


所以最终，基础开发方案敲定，使用 `Electron` 框架做跨平台开发，用 `jsQR` 作为二维码解析的技术方案。接下来，请看 `Electron` 踩坑表演

## `Electron` 踩坑表演

### 1. 安装 `Electron`

项目初始化后，首先安装 electron 依赖，万万想不到，这第一步就卡了。

根据官方文档，安装 electron 是相当简单的
```
npm install electron --save-dev
```
但是，但是啊，安装卡在了如下图所示的位置

![install](https://s2.ax1x.com/2019/11/09/MmV9OI.png)


继续翻阅 [安装文档](https://electronjs.org/docs/tutorial/installation) ，可知在 electron 安装过程中，会从 `github` 下载预编译的二进制文件。而在中国大陆，由于众所周知的原因，网络有时并不是那么顺畅的，所以便卡在了这里。

官方也提供了解决方案——代理或镜像。OKOK，感谢淘宝，提供了镜像地址。我使用设置环境变量，用镜像的方式来安装。本以为一切就会顺利，然而

![install from mirror](https://s2.ax1x.com/2019/11/09/MmeTyj.md.png)

WTF，404是什么鬼，这个玩意儿真的是镜像么？打开镜像网址之后，发现确实是有这个包的，但是就是404，非常的奇怪。

网上一翻搜索并没有找到解决方案。最终无奈之下，我只能放弃了最新稳定版本7.1.1的安装。经过实验，通过镜像只能顺利安装6.1.3版本，所以，这就是为什么没有使用最新版本的原因了。

### 2. 隐藏 dock 图标

我在官方文档中找到的解决方案是 `app.dock.hide()`，但是这个方案并不完美，启动时，dock图标还是会在dock栏闪动一下。再次翻阅文档，仍然没有找到好的解决方案，但是在 `Macos` 开发中，隐藏dock栏图标的方式之一是在 `Info.plist` 设置 `LSUIElement＝true`。

所以我们可以在最终的构建阶段加入这个设置来解决这个问题。

## 功能开发

### 1. 截取屏幕获得图片

#### 初始阶段

在初始阶段，我使用的 [desktopCapturer.getSources](https://electronjs.org/docs/api/desktop-capturer#desktopcapturergetsourcesoptions) 这个api来抓取当前的屏幕数据，这个API会在返回结果中包括一个 `thumbnail` 来表示屏幕的缩略图，可以通过传入参数来控制这个缩略图的大小，如果把屏幕的大小传进去，返回的这个缩略图就代表了屏幕的缩略图。

但是这个api只能在渲染进程中调用，主线程无法调用，所以为此，必须要创建一个窗口，在主线程上发起截图请求后，通知渲染进程进行截图操作。关于主线程和渲染进程之前的通信，electron 也提供了非常易用的接口，这里就不再缀述。

最终在渲染进程中，获取屏幕图像的初始代码如下:

```js
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
```

#### 爬坑阶段

上面的代码本应正常工作，但是实际测试过程中，仍然发现了较严重的问题——截取一次屏幕后，电脑变得很卡。

起初我以为是窗口的渲染问题，因为程序在运行时，一直保持一个透明的置顶窗口在所有的窗口前面，我以为是这个窗口显示的帧数不够造成下面的窗口显示很卡。所以我调整了窗口的显示时机，只在有识别二维码请求时才把这个透明的窗口显示出来，任务执行完成后，立刻再隐藏这个窗口。具体就是调用了 `window.show()` 和 `window.hide()` 这两个API。

但是在之后的测试中，发现问题仍然存在，一点都没有改善。我继续调整，把上面的隐藏显示逻辑调整为关闭创建新窗口。但是一个新的问题出现了，因为整个应用只有这一个窗口，关闭窗口之后，整个应用就直接退出了。这和我的想法实在不一样，再加上，重新创建窗口的逻辑也确实是一种很蠢的方案，毕竟创建窗口是一个比较耗时的操作，一定会拖慢系统的识别效率，所以最终这个方案并没有被采用。

这里要提一下，关于关闭所有窗口应该就直接退出的问题，也是有解决方案的，具体的就是监听 app 上的 `window-all-closed` 事件，可以直接传入一个空函数作为回调，就能阻止在所有窗口关闭的时候退出应用的问题了，如下。

```js
// listen this event will prevent default action (app will quit after close all window)
app.on('window-all-closed', () => {})
```

最初的问题还没有解决，经过两个方案的尝试，最终确定了变卡的原因并不是窗口渲染的性能不够。打开任务管理器，发现在一次识别之后，应用所占用的内在开始飙升，然后页面就开始变卡，看来最根本的原因是内存泄露。进一步定位发现内存泄露是在渲染进程中，在渲染进程中，通过分段法，一步一步定位到内存泄露是在 `desktopCapturer.getSources` 调用后，看来是这个api出了问题，然后以这个api为关键词网上一翻查找，很容易就在 electron 代码仓库的 `issues` 中找到了 [答案](https://github.com/electron/electron/issues?utf8=✓&q=desktopCapturer.getSources+memory)，这个是chromium的bug，但是官方已经使用补丁修复了，只是在使用的electron版本6.1.3中没有合并进来。所以总结来说，这个bug很可能是因为electron的版本问题，但是我目前确实无能为力，没办法安装最新的版本实验

解决方案：由于 `desktopCapturer.getSources` api不能调用了，所以只能使用 `navigator.mediaDevices.getUserMedia` 来实现屏幕截取。
当有多个屏幕的时候，需要在这个api的参数中指定 `chromeMediaSourceId`, 但是 `chromeMediaSourceId` 是由 `desktopCapturer.getSources` api返回的，所以就整个应用就又卡死到这里了，无法进行下去了。
不过经过分析，chromeMediaSourceId 在 Macos 上是比较有规律的，具体表现为 `screen:${screenId}:0`, 而screenId 是可以通过 screen 相关的api来获取的，这样就能跳过 `desktopCapturer.getSources` 这个有问题的api的调用了。当然这个解决方案也有其局限性，chromeMediaSourceId 是通过非正常手段分析得到的，官方文档上并没有明确指出，使用这样的值是有风险的，经过测试，macos 上是没有问题的，但是其它平台，由于目前手中没有设备，没有测试，不知道是否能正常运行。

### 2. 识别二维码图片

使用 `jsQR` 库，直接调用api即可，这个地方没什么可说的。

真正有坑的是结果显示阶段。

最终的结果展示会在屏幕上显示一个红框，把二维码的部分框起来，同时弹出一个弹窗，显示识别的内容，并询问用户是否复制到粘贴板。

为了方便起见，直接使用了自带的 `confirm`、`alert` api, 这两个api因为是同步的会阻塞线程，所以现在应该已经很少有人用了。但是这个阻塞，会连页面的渲染也阻塞，所以，如果修改定位框的属性立刻调用这些api，定位框的渲染也会被阻塞，进而导致在弹窗的时候，不显示定位框。关于这个问题， [JavaScript Alert 函数执行顺序问题](https://cloud.tencent.com/developer/article/1090201) 这篇文章作了很精确的分析。

针对这个的解决方案就是设置延时，由于定位框也会有一个动画，所以，把弹窗设置在定位之后显示。

如果使用 electron 的 `dialog.showMessageBox` api，也会阻塞主线程，而主线程的阻塞，也会导致渲染进行阻塞，所以问题还是会存在。至于为什么主进程阻塞会导致渲染进程阻塞，[Electron的主进程阻塞导致UI卡顿的问题](https://zhuanlan.zhihu.com/p/37050595) 这篇文章作了详细介绍

## 打包发布

项目使用 [electron.builder](https://www.electron.build) 来进行构建

配置方式参见 [文档](https://www.electron.build) 和本项目 `package.json` 的 `build` 字段

对应上面的隐藏 dock 的方式介绍，需要加入以下配置

```json
"extendInfo": {
  "LSBackgroundOnly": 1,
  "LSUIElement": 1
}
```

至此，本项目的基本功能已完成。

下一阶段，是性能的优化和功能的完善。将使用 WebAssembly 技术提高二维码识别效率和性能，再进一步完善功能

