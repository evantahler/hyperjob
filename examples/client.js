#!/usr/bin/env node

const path = require('path')
const Hyperjob = require(path.join('..', 'index.js'))

const name = process.argv[2] || 'client'
const archiveKey = process.argv[3]

const hyperjob = new Hyperjob({
  archiveKey: archiveKey,
  archivePath: `./test_data/${name}`
})

hyperjob.on('ready', (version) => { console.log(`Ready! (version: ${version})`) })
hyperjob.on('connecting', () => { console.log(`connecting to swarm...`) })
hyperjob.on('error', (error) => { console.error(`Error: ${error}`) })
hyperjob.on('archiveKey', (key) => { console.log(`Archive Key: ${key}`) })
hyperjob.on('peerConnect', (peer, type) => { console.log(`Peer Connected: ${type.host}:${type.port} (${type.type})`) })
hyperjob.on('peerDisconnect', (peer, type) => { console.log(`Peer Disconnected: ${type.host}:${type.port} (${type.type})`) })

async function main () {
  await hyperjob.connect()

  // add a job
  await hyperjob.enqueue('low_priority', 'doSomeMath', {a: 1, b: 2})

  // see the queue
  let queues = await hyperjob.queues()
  console.log(queues)
  console.log(`Queues: ${queues}`)

  // list enqueued jobs
  let jobs = await hyperjob.enqueued(queues[0])
  console.log(`Jobs: ${jobs}`)

  // // inspect the job
  let job = await hyperjob.get(queues[0], jobs[0])
  console.log(`Job: ${JSON.stringify(job)}`)

  // // delete the job
  await hyperjob.del(queues[0], jobs[0])
  jobs = await hyperjob.enqueued(queues[0])
  console.log(`Jobs (after single delete): ${jobs}`)

  // // delete the queue
  await hyperjob.enqueue('low-priority', 'doSomeMath', {a: 1, b: 2})
  await hyperjob.delQueue(queues[0])
  jobs = await hyperjob.enqueued(queues[0])
  console.log(`Jobs (after queue delete): ${jobs}`)

  await hyperjob.close()
  console.log('~~ all done! ~~')
}

main()
