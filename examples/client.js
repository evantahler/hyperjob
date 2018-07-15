#!/usr/bin/env node

const path = require('path')
const Hyperjob = require(path.join('..', 'index.js'))

const name = process.argv[2] || 'client'
const archiveKey = process.argv[3]

const producer = new Hyperjob.Producer({
  archiveKey: archiveKey,
  archivePath: `./test_data/${name}`
})

producer.on('ready', (version) => { console.log(`Ready! (version: ${version})`) })
producer.on('connecting', () => { console.log(`connecting to swarm...`) })
producer.on('error', (error) => { console.error(`Error: ${error}`) })
producer.on('archiveKey', (key) => { console.log(`Archive Key: ${key}`) })
producer.on('peerConnect', (peer, type) => { console.log(`Peer Connected: ${type.host}:${type.port} (${type.type})`) })
producer.on('peerDisconnect', (peer, type) => { console.log(`Peer Disconnected: ${type.host}:${type.port} (${type.type})`) })

async function main () {
  await producer.connect()

  // add a job
  await producer.enqueue('low_priority', 'doSomeMath', {a: 1, b: 2})

  // see the queue
  let queues = await producer.queues()
  console.log(queues)
  console.log(`Queues: ${queues}`)

  // list enqueued jobs
  let jobs = await producer.enqueued(queues[0])
  console.log(`Jobs: ${jobs}`)

  // // inspect the job
  let job = await producer.get(queues[0], jobs[0])
  console.log(`Job: ${JSON.stringify(job)}`)

  // // delete the job
  await producer.del(queues[0], jobs[0])
  jobs = await producer.enqueued(queues[0])
  console.log(`Jobs (after single delete): ${jobs}`)

  // // delete the queue
  await producer.enqueue('low-priority', 'doSomeMath', {a: 1, b: 2})
  await producer.delQueue(queues[0])
  jobs = await producer.enqueued(queues[0])
  console.log(`Jobs (after queue delete): ${jobs}`)

  await producer.close()
  console.log('~~ all done! ~~')
}

main()
