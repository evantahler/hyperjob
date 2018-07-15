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
}

main()
