const fs = require('fs-extra')
const path = require('path')
const Hyperjob = require(path.join(__dirname, '..', 'index.js'))
const id = parseInt(process.env.JEST_WORKER_ID || 0)
const archivePath = path.join(__dirname, '..', `test_data_${id}`)

describe('Producer', () => {
  const producer = new Hyperjob.Producer({
    archivePath: archivePath
  })

  beforeAll(async () => { await fs.remove(archivePath) })
  afterAll(async () => { await producer.close() })
  afterAll(async () => { await fs.remove(archivePath) })

  test('can boot and generate an archive key', async () => {
    await producer.connect()
    expect(producer.archiveKey).toBeTruthy()
  })

  describe('workflow', () => {
    let jobsNames

    test('can add a job', async () => {
      await producer.enqueue('low_priority', 'doSomeMath', {a: 1, b: 2})
    })

    test('added jobs create a queue', async () => {
      let queues = await producer.queues()
      expect(queues).toEqual(['low_priority'])
    })

    test('added jobs can be listed and inspected', async () => {
      jobsNames = await producer.enqueued('low_priority')
      expect(jobsNames.length).toEqual(1)

      let job = await producer.get('low_priority', jobsNames[0])
      expect(job.method).toEqual('doSomeMath')
      expect(job.queue).toEqual('low_priority')
      expect(job.args).toEqual({a: 1, b: 2})
      expect(job.enqueuedAt).toBeGreaterThan(0)
      expect(job.enqueuedAt).toBeLessThan(new Date().getTime())
    })

    test('added jobs can be removed', async () => {
      await producer.del('low_priority', jobsNames[0])
      let jobsNamesAfterDelete = await producer.enqueued('low_priority')
      expect(jobsNamesAfterDelete.length).toEqual(0)
    })

    test('removing a queue removes all jobs', async () => {
      await producer.enqueue('low-priority', 'doSomeMath', {a: 1, b: 2})
      await producer.enqueue('low-priority', 'doSomeMath', {a: 1, b: 2})
      await producer.delQueue('low-priority')
      let jobsNamesAfterDelete = await producer.enqueued('low_priority')
      expect(jobsNamesAfterDelete.length).toEqual(0)
    })
  })
})
