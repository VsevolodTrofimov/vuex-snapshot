import * as promiseLib from './src/mockPromise'
import * as fetchLib from './src/mockFetch'
import timetable from './src/timetable'
import snapActionCore from './src/snapAction'


const config = {}
const resetConfig = () => {
  config.autoResolve = false
  config.snapEnv = false
}
resetConfig()

const reset = () => {
  resetConfig()
  timetable.reset()
}

/**
 * @typedef {{name:string, type: ("resolve" | "reject"), payload}} Resolution
 */
/**
 * Takes snapshot of action's evaluation
 * @param {Function} action action to test
 * @param {{state, getters, commit: Function, dispatch: Function, payload}} mocks arguments passed to the action, payload is the second argument
 * @param {[(string | Resolution)]} resolutions
 * @param {Snapshot} snapshot
 * @param {Tiemtable} timetable
 * @returns  {(string | Promise<string>)}
 */
const snapAction = (action, mocks={}, resolutions=[], snapshot, timetable) => {
  console.log(autoResolve)
  if(Array.isArray(mocks)) {
    resolutions = mocks
    mocks = {}
  }

  const commit = mocks.commit || (() => {})
  const dispatch = mocks.dispatch || (() => {})

  const options = {
    autoResolve: config.autoResolve
  }
  
  snapActionCore(
    action, 
    {
      payload: mocks.payload,
      state: mocks.state,
      getters: mocks.getters,
      commit,
      dispatch
    }, 
    resolutions, 
    options,
  )
}


export default {
  snapAction,
  reset,

  timetable,
  resetTimetable: timetable.reset,

  config,
  resetConfig,

  mockFetch: fetchLib.mockFetch,
  useMockFetch: fetchLib.useMock,
  useRealFetch: fetchLib.useReal,

  MockPromise: promiseLib.MockPromise,
  useMockPromise: promiseLib.useMock,
  useRealPromise: promiseLib.useReal,
}