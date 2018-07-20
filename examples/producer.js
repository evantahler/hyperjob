#!/usr/bin/env node

const path = require('path')
const Hyperjob = require(path.join('..', 'index.js'))

const archiveKey = process.argv[2]
const authorizedKeys = process.env.AUTHORIZED_KEYS
  ? process.env.AUTHORIZED_KEYS.split(',').map((k) => { return k.trim() })
  : []

const producer = new Hyperjob.Producer({
  archiveKey: archiveKey,
  archivePath: `./test_data/producer`,
  authorizedKeys
})

const queue = 'medium_priority'
const sleep = 5000

producer.on('ready', (version) => { console.log(`Ready! (version: ${version})`) })
producer.on('connecting', () => { console.log(`connecting to swarm...`) })
producer.on('authorized', (auth) => { console.log(`authorized: ${auth}`) })
producer.on('error', (error) => { console.error(`Error: ${error}`) })
producer.on('archiveKey', (key) => { console.log(`Archive Key: ${key}`) })
producer.on('localKey', (key) => { console.log(`Local Key: ${key}`) })
producer.on('peerConnect', (peer, type) => { console.log(`Peer Connected: ${type.host}:${type.port} (${type.type})`) })
producer.on('peerDisconnect', (peer, type) => { console.log(`Peer Disconnected: ${type.host}:${type.port} (${type.type})`) })

async function main () {
  await producer.connect()

  setInterval(async () => {
    // enqueue a job
    await producer.enqueue(queue, 'sayHello', {name: producer.name, time: new Date().getTime()})

    // show enqueued Jobs
    let jobs = await producer.enqueued(queue)
    let job = await producer.get(queue, jobs[0])
    console.log(`Job: ${JSON.stringify(job)}`)
    console.log(`There are ${jobs.length} total jobs in the ${queue} queue`)
  }, sleep)

  // await producer.close()
}

main()
