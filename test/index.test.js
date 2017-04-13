import {expect} from 'chai'
import feathers from 'feathers'
import datastore from '@google-cloud/datastore'
import service from '../lib'

const ds = datastore({
  projectId: process.env.PROJECTID,
  // you can use https://cloud.google.com/datastore/docs/tools/datastore-emulator to run the tests
  apiEndpoint: 'http://localhost:8081',
  keyFilename: './key.json',
})

function createService(options) {
  return service({
    ds,
    ...options
  })
}

const app = feathers()
  .use('/todo', createService({kind: 'Todo', nonIndexed: ['description']}))

describe('Datastore Service', () => {
  describe('Basic', () => {
    const service = app.service('/todo')
    const ids = []
    const testTodo = {
      title: 'title',
      description: 'desc',
    }

    it('should create a todo', () => {
      return service.create(testTodo)
        .then((todo) => {
          expect(todo.description).to.equal(testTodo.description)
          expect(todo.title).to.equal(testTodo.title)
          ids.push(todo.id)
        })
    })

    it('should retrieve it', () => {
      return service.get(ids[0])
        .then((todo) => {
          expect(todo.id).to.equal(ids[0])
          expect(todo.description).to.equal(testTodo.description)
          expect(todo.title).to.equal(testTodo.title)
        })
    })
    it('should edit the first todo', () => {
      const newDesc = 'new desc'
      return service.update(ids[0], {
        description: newDesc,
      })
        .then(updatedTodo => {
          expect(updatedTodo.id).to.equal(ids[0])
          expect(updatedTodo.title).to.equal(undefined)
          expect(updatedTodo.description).to.equal(newDesc)
        })
    })

    it('should create 2 others todo', () => {
      const toInsert = [testTodo, testTodo]
      return service.create(toInsert)
        .then(inserted => {
          expect(inserted.length).to.equal(toInsert.length)
          inserted.forEach(todo => {
            ids.push(todo.id)
          })
        })
    })

    it('should find the 3 todos', () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          return resolve(service.find()
            .then(todos => {
              expect(todos.length).to.equal(3)
            }),
          )
        }, 100)
      })
    })
    it('shoudl remove the third todo', () => {
      return service.remove(ids.pop())
        .then(response => {
          expect(response[0].mutationResults.length).to.equal(1)
        })
    })
    after(() => {
      return service.remove(ids)
        .then(response => {
          expect(response[0].mutationResults.length).to.equal(2)
        })
    })
  })
})
