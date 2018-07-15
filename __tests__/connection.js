const fs = require('fs-extra')
const path = require('path')
const Hyperjob = require(path.join(__dirname, '..', 'index.js'))
const id = parseInt(process.env.JEST_WORKER_ID || 0)
const archivePath = path.join(__dirname, '..', `test_data_${id}`)

describe('Connection', () => {
  let archiveKey
  let connection = new Hyperjob.Connection({
    archivePath: archivePath
  })

  beforeAll(async () => { await fs.remove(archivePath) })
  afterAll(async () => { await fs.remove(archivePath) })

  test('can boot and generate an archive key', async () => {
    await connection.connect()
    expect(connection.archiveKey).toBeTruthy()
    archiveKey = connection.archiveKey
    await connection.close()
  })

  test('rebooting the node with the same direcotry uses the same archive Key', async () => {
    connection = new Hyperjob.Connection({
      archivePath: archivePath
    })

    await connection.connect()
    expect(connection.archiveKey).toBeTruthy()
    expect(connection.archiveKey).toEqual(archiveKey)
    await connection.close()
  })

  test('sanitization', () => {
    expect(connection.sanitize('test thing')).toEqual('test_thing')
    expect(connection.sanitize('test-thing')).toEqual('test_thing')
    expect(connection.sanitize('TestThing3')).toEqual('testthing3')
    expect(connection.sanitize('Test/Thing')).toEqual('test_thing')
  })

  describe('swarm', () => {
    const archivePathA = path.join(__dirname, '..', `test_data_${id}_a`)
    const archivePathB = path.join(__dirname, '..', `test_data_${id}_b`)
    beforeAll(async () => { await connection.connect() })
    beforeAll(async () => { await fs.remove(archivePathA) })
    beforeAll(async () => { await fs.remove(archivePathB) })

    afterAll(async () => { await connection.close() })
    afterAll(async () => { await fs.remove(archivePathA) })
    afterAll(async () => { await fs.remove(archivePathB) })

    test('multiple nodes can join the same swarm', async () => {
      const connectionA = new Hyperjob.Connection({
        archivePath: archivePathA,
        archiveKey: archiveKey,
        port: 9999 + id + 1
      })

      const connectionB = new Hyperjob.Connection({
        archivePath: archivePathB,
        archiveKey: archiveKey,
        port: 9999 + id + 2
      })

      await connectionA.connect()
      await connectionB.connect()

      await new Promise((resolve) => { setTimeout(resolve, 500) })
      expect(connectionA.connections.length).toEqual(2)
      expect(connectionB.connections.length).toEqual(2)

      await connectionA.close()
      await connectionB.close()
    })
  })
})
