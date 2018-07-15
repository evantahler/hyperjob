const path = require('path')

module.exports = {
  Producer: require(path.join(__dirname, 'lib', 'producer.js'))
}
