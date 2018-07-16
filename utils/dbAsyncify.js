module.exports = function dbAsyncify (db) {
  db.versionAsync = async (path, contents) => {
    return new Promise((resolve, reject) => {
      db.version((error, version) => {
        if (error) { return reject(error) }
        return resolve(version.toString('hex'))
      })
    })
  }

  db.putAsync = async (path, contents) => {
    return new Promise((resolve, reject) => {
      db.put(path, contents, (error) => {
        if (error) { return reject(error) }
        return resolve()
      })
    })
  }

  db.getAsync = async (path) => {
    return new Promise((resolve, reject) => {
      db.get(path, (error, data) => {
        if (error) { return reject(error) }
        return resolve(data[0])
      })
    })
  }

  db.listAsync = async (path, options) => {
    return new Promise((resolve, reject) => {
      db.list(path, options, (error, data) => {
        if (error) { return reject(error) }
        return resolve(data.map((i) => i[0]))
      })
    })
  }

  db.delAsync = async (path) => {
    return new Promise((resolve, reject) => {
      db.del(path, (error, data) => {
        if (error) { return reject(error) }
        return resolve(data)
      })
    })
  }

  db.batchAsync = async (batch) => {
    return new Promise((resolve, reject) => {
      db.batch(batch, (error, nodes) => {
        if (error) { return reject(error) }
        return resolve(nodes)
      })
    })
  }

  db.moveAsync = async (from, to) => {
    return new Promise(async (resolve, reject) => {
      let batch = []
      try {
        const node = await db.getAsync(from)
        batch.push({ type: 'del', key: from })
        batch.push({ type: 'put', key: to, value: node.value })
        const response = await db.batchAsync(batch)
        return resolve(response)
      } catch (error) {
        return reject(error)
      }
    })
  }

  return db
}
