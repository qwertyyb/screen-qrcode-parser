# Screen QRcode Parser

Automatically detect and parse qrcode on the screen

## Screenshot

![running result](https://puui.qpic.cn/vupload/0/1573211476863_v72r0civsza.png/0)

## Usage

Active tray menu and click scan QRcode MenuItem. 

This app will detect and parse qrcode on screen automatically and show the parsed result, you can decide write to pasteboard or not

## Feature

No more phone, no more input and search, no more screenshot, no more uploading and waiting, no more copying and pasting, parse QR code in just one step

Cross platform, you can use it at any desktop system

## Background

What will you do when a QR code display on your screen and you really need to get its content, get your phone, unlock it and launch camera app to scan, or save to local、search tools、upload file and wait parse?

Either way is very complicated and wastes time

So i created this app to convenient some one like me

## Requirements

- [electron](https://electronjs.org/) >= 6.13
- [jsQR](https://github.com/cozmo/jsQR)
- [nu-book/zxing-cpp](https://github.com/nu-book/zxing-cpp)

## Develop

```
git clone https://github.com/qwertyyb/screen-qrcode-parser.git

cd screen-qrcode-parser

npm install

npm run dev

npm run build
```

## License

Mozilla Public License 2.0