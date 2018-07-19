const uuid = require('uuid')
const path = require('path')
const Connection = require(path.join(__dirname, 'connection.js'))

module.exports = class Producer extends Connection {
  async enqueue (queue, method, args, name) {
    if (!name) { name = `${new Date().getTime()}_${uuid.v4()}` }
    name = this.sanitize(name)
    queue = this.sanitize(queue)
    const path = `/queues/${queue}/${name}.job`
    const contents = { method, queue, name, args, enqueuedAt: new Date().getTime() }
    return this.database.putAsync(path, JSON.stringify(contents))
  }

  async queues () {
    const nodes = await this.database.listAsync('/queues')
    let queues = []
    nodes.forEach((node) => {
      let queue = node.key.match(/^queues\/(\w+)\/.*$/)[1]
      if (!queues.includes(queue)) { queues.push(queue) }
    })

    queues.sort()
    return queues
  }

  async enqueued (queue, start = 0, stop = undefined) {
    queue = this.sanitize(queue)
    const path = `/queues/${queue}`
    const nodes = await this.database.listAsync(path)
    nodes.sort((a, b) => { return a.key > b.key })
    const slicedNodes = nodes.slice(start, stop)
    const matcher = new RegExp(`^queues/${queue}/(.*).job$`)
    return slicedNodes.map((node) => {
      return node.key.match(matcher)[1]
    })
  }

  async get (queue, name, type = 'queues') {
    name = this.sanitize(name)
    queue = this.sanitize(queue)
    const path = `/${type}/${queue}/${name}.job`
    const node = await this.database.getAsync(path)
    return JSON.parse(node.value)
  }

  async del (queue, name, type = 'queues') {
    name = this.sanitize(name)
    queue = this.sanitize(queue)
    const path = `/${type}/${queue}/${name}.job`
    return this.database.delAsync(path)
  }

  async length (queue) {
    queue = this.sanitize(queue)
    const files = await this.enqueued(queue)
    return files.length
  }

  async delQueue (queue) {
    queue = this.sanitize(queue)
    const files = await this.enqueued(queue)
    let batch = []
    for (let i in files) {
      batch.push({
        type: 'del',
        key: `/queues/${queue}/${files[i]}.job`
      })
    }

    return this.database.batchAsync(batch)
  }
}
