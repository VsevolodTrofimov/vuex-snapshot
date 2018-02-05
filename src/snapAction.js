import Snapshot from './snapshot'
import {simualteResolutions} from './resolutionUtils'
import timetable from '../src/timetable'

const RealPromise = Promise


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
 * @param {{autoResovle: Boolean, snapEnv: Boolean}} options
 * @returns  {(string | Promise<string>)}
 */
export const snapAction = (action, mocks, resolutions, options) => {
  const snapshot = new Snapshot()
  const mockCommit = makeCallSnapper(snapshot, 'COMMIT', mocks.commit)
  const mockDispatch = makeCallSnapper(snapshot, 'DISPATCH', mocks.dispatch)

  if(options.snapEnv) {
    snapshot.add('DATA MOCKS', {
      state: mocks.state,
      getters: mocks.getters
    })
    snapshot.add('ACTION CALL', mocks.payload)
  }

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
      
      simualteResolutions(resolutions, snapshot, timetable, options)
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
            run: snapshot.value
          })
        })

    })
  } else {
    // action is sync
    return snapshot.value
  }
}

export default snapAction