const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const config = require('../config')

const adapter = new FileSync(config.databasePath)

const db = lowdb(adapter)

db.defaults({
  preferences: {
    hotkey: 'Shift+Alt+Q',
    detectMethod: 'zxing-wasm',
    launchAtLogin: true
  }
}).write()

module.exports = db