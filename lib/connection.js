const { EventEmitter } = require('events')
const hyperdb = require('hyperdb')
const swarm = require('hyperdiscovery')
const path = require('path')
const dbAsyncify = require(path.join(__dirname, '..', 'utils', 'dbAsyncify.js'))

module.exports = class Connection extends EventEmitter {
  constructor (options) {
    super()

    if (!options) { throw new Error('options.archivePath is required and you may want to provide options.archiveKey') }

    this.databaseKey = options.archiveKey
    if (this.databaseKey) { this.databaseKey = Buffer.from(this.databaseKey, 'hex') }

    this.databasePath = options.archivePath
    if (!this.databasePath) { throw new Error('options.archivePath required') }

    this.connections = {}
    this.requestedPort = options.port
  }

  async connect () {
    const dbOptions = {valueEncoding: 'utf-8'}

    await new Promise(async (resolve, reject) => {
      this.database = hyperdb(this.databasePath, this.databaseKey, dbOptions)
      dbAsyncify(this.database)

      this.database.on('error', (error) => { this.emit('error', error) })
      this.database.on('ready', async (error) => {
        if (error) { return reject(error) }

        this.emit('archiveKey', this.database.key.toString('hex'))
        this.archiveKey = this.database.key.toString('hex')

        this.swarm = swarm(this.database, {port: this.requestedPort})
        this.swarm.on('error', (error) => { this.emit('error', error) })
        this.swarm.on('connection', (peer, type) => { this.handleConnection(peer, type) })
        this.emit('connecting')

        let version = await this.database.versionAsync()
        this.emit('ready', version)

        return resolve()
      })
    })
  }

  async close () {
    await this.swarm.close()
  }

  handleConnection (peer, type) {
    this.emit('peerConnect', peer, type)
    this.connections = this.swarm.connections
    peer.on('close', () => {
      this.emit('peerDisconnect', peer, type)
      this.connections = this.swarm.connections
    })
  }

  sanitize (name) {
    name = String(name)
    name = name.toLowerCase()
    name = name.replace(/[^a-z0-9]/g, '_')
    name = name.replace(/\//g, '_')
    name = name.replace(/-/g, '_') // for regular expression help (not a word boundry)
    return name
  }
}
