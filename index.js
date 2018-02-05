import * as promiseLib from './src/mockPromise'
import * as fetchLib from './src/mockFetch'
import timetable from './src/timetable'
import snapActionCore from './src/snapAction'


const defaultConfig = {
  autoResolve: false,
  snapEnv: false
}

/**
 * @namespace
 * @property {Boolean} autoResolve resolve all MockPromises and fetches in order they were created
 * @property {Boolean} snapEnv include state, getters and paylaod into snapshot
 */
const config = {}
const resetConfig = () => Object.assign(config, defaultConfig)
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
    autoResolve: config.autoResolve,
    snapEnv: config.snapEnv,
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