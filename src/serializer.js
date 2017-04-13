// highly inspired from https://github.com/sebelga/gstore-node/blob/master/lib/serializers/datastore.js
import datastore from '@google-cloud/datastore'

export function toDatastore(obj, nonIndexed) {
  const results = []
  const keys = Object.keys(obj)
  const len = keys.length

  for (let i = 0; i < len; i++) {
    if (obj[keys[i]] !== undefined) {
      results.push({
        name: keys[i],
        value: obj[keys[i]],
        excludeFromIndexes: nonIndexed.includes(keys[i]),
      })
    }
  }
  return results
}

function idFromKey(key) {
  return key.path[key.path.length - 1]
}

export function fromDatastore(entity) {
  const KEY = datastore.KEY

  if (Array.isArray(entity)) {
    return entity.map(e => ({
      ...e,
      id: idFromKey(e[KEY]),
      [KEY]: e[KEY],
    }))
  }

  return {
    id: idFromKey(entity[KEY]),
    [KEY]: entity[KEY],
    ...entity
  }
}

export default undefined
