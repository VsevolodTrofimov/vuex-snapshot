import serialize from './serialize'
import timetable from './timetable'
import {simualteResolutions} from './resolutionUtils'


const RealPromise = Promise


export class Snapshot {
  constructor() {
    this.value = ''
    this.add = this.add.bind(this)
  }
  add(message, payload) {
    this.value += message 
    if(typeof payload !== 'undefined') this.value += '\n' + serialize(payload)
    this.value += '\n---\n'
  }
}


export const makeCallSnapper = (snapshot, type, cb) => (name, payload) => {
  snapshot.add(`${type}: ${name}`, payload)
  cb(name, payload)
}


/**
 * @typedef {{name:string, type: ("resolve" | "reject"), payload}} Resolution
 */
/**
 * Takes snapshot of action's evaluation
 * @param {Function} action action to test
 * @param {{state, getters, commit: Function, dispatch: Function, payload}} mocks arguments passed to the action, payload is the second argument
 * @param {[(string | Resolution)]} resolutions
 * @returns  {(string | Promise<string>)}
 */
export const snapAction = (action, mocks={}, resolutions=[]) => {
  // for 2 arg call (action, resolutions)
  if(Array.isArray(mocks)) {
    resolutions = mocks
    mocks = {}
  }

  const commit = mocks.commit || (() => {})
  const dispatch = mocks.dispatch || (() => {})

  const snapshot = new Snapshot()
  const mockCommit = makeCallSnapper(snapshot, 'COMMIT', commit)
  const mockDispatch = makeCallSnapper(snapshot, 'DISPATCH', dispatch)


  const actionReturn = action({
    commit: mockCommit,
    dispatch: mockDispatch,
    state: mocks.state,
    getters: mocks.getters
  }, mocks.payload)


  if(typeof actionReturn !== 'undefined' && actionReturn instanceof Promise) {
    // action is async
    return new RealPromise((resolve, reject) => {
      actionReturn
        .then(payload => {
          snapshot.add('ACTION RESOLVED', payload)
          resolve(snapshot.value)
        })
        .catch(payload => {
          snapshot.add('ACTION REJECTED', payload)
          resolve(snapshot.value)
        })
      
      simualteResolutions(resolutions, snapshot.add, timetable)
        .then(() => {
          // this is needed to let action to resolve first
          setTimeout(() => {
            snapshot.add('ACTION DID NOT RESOLVE')
            resolve(snapshot.value)
          }, 0)
        })
        .catch(err => {
          reject({
            err,
            snapshot
          })
        })

    })
  } else {
    // action is sync
    return snapshot.value
  }
}

export default snapAction