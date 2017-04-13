import errors from 'feathers-errors'
import arrify from 'arrify'
import {fromDatastore, toDatastore} from './serializer'

class Service {
  constructor(options) {
    if (!options.ds) {
      throw new Error('You need to provide a datastore instance to Datastore service')
    }
    if (!options.kind) {
      throw new Error('You need to provide a kind to Datastore service')
    }
    if (!options.nonIndexed) {
      console.log('You did not provide nonIndexed option to Datastore service. All fields will be marked for indexation')
    }

    this._ds = options.ds
    this._kind = options.kind
    this._nonIndexed = options.nonIndexed || []
    this._defaultConsistency = options.defaultConsistency || 'strong'
  }

  find(params) {
    return this._ds.createQuery(this._kind)
      .limit(200)
      .run({
        consistency: this._defaultConsistency,
      })
      .then(res => fromDatastore(res[0]))
  }

  get(id, params) {
    const key = this._ds.key([this._kind, this._ds.int(id)])
    return this._ds.get(key, {consistency: this._defaultConsistency})
      .then(response => {
        if (!response[0]) {
          throw new errors.NotFound(`Did not found any records of kind ${this._kind} for id ${id}`)
        }
        return fromDatastore(response[0])
      })
  }

  create(data, params) {
    let multipleInsert = Array.isArray(data)
    let toInsert

    if (multipleInsert) {
      toInsert = data.map(entry => ({
        key: this._ds.key(this._kind),
        data: toDatastore(entry, this._nonIndexed),
      }))
    } else {
      toInsert = {
        key: this._ds.key(this._kind),
        data: toDatastore(data, this._nonIndexed),
      }
    }

    return this._ds.save(toInsert)
      .then(() => {
        if (multipleInsert) {
          return data.map((item, idx) => ({
            ...item,
            id: toInsert[idx].key.id,
          }))
        }
        return {
          ...data,
          id: toInsert.key.id,
        }
      })
  }

  patch(id, data, params) {
    throw errors.GeneralError('Datastore service doesn\'t support partial update')
  }

  update(id, data, params) {
    const toUpdate = {
      key: this._ds.key([this._kind, this._ds.int(id)]),
      data: toDatastore(data, this._nonIndexed),
    }
    return this._ds.update(toUpdate)
      .then(() => ({
        ...data,
        id: toUpdate.key.id,
      }))
  }

  remove(id, params) {
    const keys = arrify(id).map(id => this._ds.key([this._kind, this._ds.int(id)]),)
    return this._ds.delete(keys)
  }
}

export default function init(options) {
  return new Service(options)
}

init.Service = Service
