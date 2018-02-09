import {simualteResolutions} from './resolutionUtils'
import timetable from '../src/timetable'


const RealPromise = Promise


export const makeCallSnapper = (snapshot, type, cb) => {
  const snapper = (name, payload) => {
    snapshot.add(`${type}: ${name}`, payload)
    return cb(name, payload, snapper.proxies)
  }

  return snapper
}


/**
 * @typedef {{name:string, type: ("resolve" | "reject"), payload}} Resolution
 */
/**
 * Takes snapshot of action's evaluation
 * @param {Function} action action to test
 * @param {{state, getters, commit: Function, dispatch: Function, payload}} mocks arguments passed to the action, payload is the second argument
 * @param {[(string | Resolution)]} resolutions
 * @param {{autoResolve: Boolean, snapEnv: Boolean, allowManualActionResolution: Boolean}} options
 * @returns  {(string | Promise<string>)}
 */
export const snapAction = (action, mocks, resolutions, options, snapshot) => {
  const mockCommit = makeCallSnapper(snapshot, 'COMMIT', mocks.commit)
  const mockDispatch = makeCallSnapper(snapshot, 'DISPATCH', mocks.dispatch)
  
  const proxies = {
    commit: mockCommit,
    dispatch: mockDispatch
  }

  mockCommit.proxies = proxies
  mockDispatch.proxies = proxies

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
    if(!options.allowManualActionResolution) {
      timetable.ensureAbsence(actionReturn)
    }

    return new RealPromise((resolve, reject) => {
      actionReturn
        .then(payload => {
          snapshot.add('ACTION RESOLVED', payload)
          snapshot.freeze()
          resolve(snapshot.value)
        })
        .catch(payload => {
          snapshot.add('ACTION REJECTED', payload)
          snapshot.freeze()
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