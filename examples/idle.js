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
hyperjob.on('error', (error) => { console.error(`Error: ${error}`) })
hyperjob.on('archiveKey', (key) => { console.log(`Archive Key: ${key}`) })
hyperjob.on('peerConnect', (peer, type) => { console.log(`Peer Connected: ${type.host}:${type.port} (${type.type})`) })
hyperjob.on('peerDisconnect', (peer, type) => { console.log(`Peer Disconnected: ${type.host}:${type.port} (${type.type})`) })

async function main () {
  await hyperjob.connect()
}

main()
