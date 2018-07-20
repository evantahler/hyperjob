#!/usr/bin/env node

const path = require('path')
const Hyperjob = require(path.join('..', 'index.js'))

const archiveKey = process.argv[2]
const authorizedKeys = process.env.AUTHORIZED_KEYS
  ? process.env.AUTHORIZED_KEYS.split(',').map((k) => { return k.trim() })
  : []

const handlers = {
  sayHello: async (args) => {
    return new Promise((resolve) => {
      console.log(`*** hello from ${args.name} @ ${args.time} ***`)
      setTimeout(() => {
        return resolve(true)
      }, 1000)
    })
  }
}

const consumer = new Hyperjob.Consumer({
  archiveKey: archiveKey,
  archivePath: `./test_data/consumer`,
  authorizedKeys,
  handlers
})

consumer.on('ready', (version) => { console.log(`Ready! (version: ${version})`) })
consumer.on('connecting', () => { console.log(`connecting to swarm...`) })
consumer.on('authorized', (auth) => { console.log(`authorized: ${auth}`) })
consumer.on('error', (error) => { console.error(`Error: ${error}`) })
consumer.on('archiveKey', (key) => { console.log(`Archive Key: ${key}`) })
consumer.on('localKey', (key) => { console.log(`Local Key: ${key}`) })
consumer.on('peerConnect', (peer, type) => { console.log(`Peer Connected: ${type.host}:${type.port} (${type.type})`) })
consumer.on('peerDisconnect', (peer, type) => { console.log(`Peer Disconnected: ${type.host}:${type.port} (${type.type})`) })
consumer.on('poll', () => { console.log(`polling for work`) })
consumer.on('workQueues', (queues) => { console.log(`working ${queues} queues`) })
consumer.on('job', (job) => { console.log(`working job: ${JSON.stringify(job)}`) })
consumer.on('jobComplete', (job, result, delta) => { console.log(`Completed Job ${job.name} in ${delta / 1000}s with result: ${JSON.stringify(result)}`) })
consumer.on('jobFailed', (job, error, delta) => { console.log(`Failed Job ${job.name} in ${delta / 1000}s with error: ${error}`) })
consumer.on('sleep', () => { console.log('sleeping...') })

async function main () {
  await consumer.connect()
  consumer.start()
}

main()
