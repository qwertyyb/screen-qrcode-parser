const db = require('./initdb')

global.preferences = db.get('preferences').value()

console.log('preferences: ', global.preferences)

module.exports = {
  set: (key, value) => {
    db.set(`preferences.${key}`, value).write()
    global.preferences = db.get('preferences').value()
  },
  get: key => global.preferences[key]
}
