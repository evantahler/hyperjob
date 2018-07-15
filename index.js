const { EventEmitter } = require('events')
const hyperdrive = require('hyperdrive')
const swarm = require('hyperdiscovery')
const uuid = require('uuid')

module.exports = class Hyperjob extends EventEmitter {
  constructor (options) {
    super()

    if (!options) { throw new Error('options.archiveKey and options.archivePath required') }

    this.archiveKey = options.archiveKey
    // if (!this.archiveKey) { throw new Error('options.archiveKey required') }

    this.archivePath = options.archivePath
    if (!this.archivePath) { throw new Error('options.archivePath required') }

    this.connections = {}
  }

  async connect () {
    await new Promise((resolve, reject) => {
      this.archive = hyperdrive(this.archivePath, this.archiveKey)
      this.archive.on('error', (error) => { this.emit('error', error) })
      this.archive.on('ready', (error) => {
        if (error) { return reject(error) }
        this.emit('ready', this.archive.version)
        this.emit('archiveKey', this.archive.key.toString('hex'))

        this.swarm = swarm(this.archive)
        this.swarm.on('error', (error) => { this.emit('error', error) })
        this.swarm.on('connection', (peer, type) => { this.handleConnection(peer, type) })

        return resolve()
      })
    })

    this.buildAsyncMethods()
  }

  async close () {
    await this.swarm.close()
  }

  buildAsyncMethods () {
    this.archive.writeFileAsync = async (path, contents) => {
      return new Promise((resolve, reject) => {
        this.archive.writeFile(path, contents, (error) => {
          if (error) { return reject(error) }
          return resolve()
        })
      })
    }

    this.archive.readFileAsync = async (path, encoding = 'utf-8') => {
      return new Promise((resolve, reject) => {
        this.archive.readFile(path, encoding, (error, data) => {
          if (error) { return reject(error) }
          return resolve(data)
        })
      })
    }

    this.archive.readdirAsync = async (path) => {
      return new Promise((resolve, reject) => {
        this.archive.readdir(path, (error, data) => {
          if (error) { return reject(error) }
          return resolve(data)
        })
      })
    }

    this.archive.unlinkAsync = async (path) => {
      return new Promise((resolve, reject) => {
        this.archive.unlink(path, (error, data) => {
          if (error) { return reject(error) }
          return resolve(data)
        })
      })
    }

    this.archive.rmdirAsync = async (path) => {
      return new Promise((resolve, reject) => {
        this.archive.rmdir(path, (error, data) => {
          if (error) { return reject(error) }
          return resolve(data)
        })
      })
    }
  }

  handleConnection (peer, type) {
    this.emit('peerConnect', peer, type)
    this.connections = this.swarm.connections
    peer.on('close', () => {
      this.emit('peerDisconnect', peer, type)
      this.connections = this.swarm.connections
    })
  }

  async enqueue (queue, method, args, name = uuid.v4()) {
    name = this.sanitize(name)
    const path = `/queues/${queue}/${name}.job`
    const contents = { method, args, enqueuedAt: new Date().getTime() }
    return this.archive.writeFileAsync(path, JSON.stringify(contents))
  }

  async queues () {
    return this.archive.readdirAsync('/queues')
  }

  async enqueued (queue, start = 0, stop = undefined) {
    const path = `/queues/${queue}`
    let files
    try {
      files = await this.archive.readdirAsync(path)
    } catch (error) {
      if (error.toString().indexOf(`/queues/${queue} could not be found`) >= 0) { return [] }
      throw error
    }

    const slicedFiles = files.slice(start, stop)
    return slicedFiles.map((filename) => {
      return filename.split('.').slice(0, -1).join('.')
    })
  }

  async get (queue, name, type = 'queues') {
    name = this.sanitize(name)
    const path = `/${type}/${queue}/${name}.job`
    const stringifiedData = await this.archive.readFileAsync(path)
    return JSON.parse(stringifiedData)
  }

  async del (queue, name, type = 'queues') {
    name = this.sanitize(name)
    const path = `/${type}/${queue}/${name}.job`
    return this.archive.unlinkAsync(path)
  }

  async length (queue) {
    const files = await this.enqueued(queue)
    return files.length
  }

  async delQueue (queue) {
    const files = await this.enqueued(queue)
    for (let i in files) { await this.archive.unlinkAsync(`/queues/${queue}/${files[i]}.job`) }
    try {
      await this.archive.rmdirAsync(`/queues/${queue}`)
    } catch (error) {
      if (error.toString().indexOf(`/queues/${queue} could not be found`) >= 0) { return }
      throw error
    }
  }

  sanitize (name) {
    name = String(name)
    name = name.toLowerCase()
    name = name.replace(/[^a-z0-9 ]/g, '_')
    name = name.replace(/-/g, '_') // TODO: Why is "-" an invalid char?
    return name
  }
}
