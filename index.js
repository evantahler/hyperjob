const path = require('path')

module.exports = {
  Connection: require(path.join(__dirname, 'lib', 'connection.js')),
  Producer: require(path.join(__dirname, 'lib', 'producer.js')),
  Consumer: require(path.join(__dirname, 'lib', 'consumer.js'))
}
