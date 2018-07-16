const path = require('path')
const Producer = require(path.join(__dirname, 'producer.js'))

module.exports = class Consumer extends Producer {
  constructor (options) {
    super(options)

    this.sleep = options.sleep || 5000
    this.handlers = options.handlers || {}
    this.workQueues = options.queues || '*'
    this.running = false
    this.timer = null
    this.job = null
    this.dynamicallyLoadQueues = false
  }

  async start () {
    this.running = true
    this.poll()
  }

  stop () {
    this.running = false
    clearTimeout(this.timer)
  }

  async poll () {
    this.emit('poll')
    await this.determineQueues()

    this.job = await this.getNextJob()
    while (this.job) {
      await this.work()
      this.job = await this.getNextJob()
    }

    await this.pomoteDelated()

    if (this.running) {
      this.emit('sleep')
      this.timer = setTimeout(() => { this.poll() }, this.sleep)
    }
  }

  async work () {
    const start = new Date().getTime()
    if (!this.job) { throw new Error('I do not have a job!') }
    const handler = this.handlers[this.job.values.method]
    if (!handler) { throw new Error(`I do not know how to do ${this.job.values.method}!`) }

    const moveJob = async (result, error, delta) => {
      this.job.value.result = result
      this.job.value.error = error
      this.job.value.delta = delta

      const from = `/workers/${this.name}/${this.job.value.name}.job`
      let to = `/complete/${this.job.value.queue}/${this.job.value.name}.job`
      if (error) { to = `/failed/${this.job.value.queue}/${this.job.value.name}.job` }

      await this.database.put(from, this.job.value)
      await this.database.moveAsync(from, to)
    }

    try {
      const result = await handler.call(this, [this.job.values.arguments])
      const delta = new Date().getTime() - start
      this.emit('jobComplete', this.job, result, delta)
      await moveJob(result, null, delta)
    } catch (error) {
      const delta = new Date().getTime() - start
      this.emit('jobFailed', this.job, error, delta)
      await moveJob(null, error, delta)
    }

    delete this.job
  }

  async determineQueues () {
    if (typeof this.workQueues === 'string') { this.workQueues = this.workQueues.split(',') }

    if ((this.workQueues.length === 1 && this.workQueues[0] === '*') || this.dynamicallyLoadQueues === true) {
      this.dynamicallyLoadQueues = true
      this.workQueues = await this.queues()
      this.emit('workQueues', this.workQueues)
    }
  }

  async getNextJob () {
    for (let i in this.workQueues) {
      let queue = this.workQueues[i]
      let jobName = await this.enqueued(queue, 0, 1)
      if (jobName) {
        const from = `/queues/${queue}/${jobName}.job`
        const to = `/workers/${this.name}/${jobName}.job`
        await this.database.moveAsync(from, to)
        let job = await this.database.get(to)
        job.value.claimedBy = this.name
        job.value.claimedAt = new Date().getTime()
        await this.database.put(to, job.value)
        this.emit('job', job)
        return job
      }
    }
  }

  async pomoteDelated () {
    // TODO
  }
}
