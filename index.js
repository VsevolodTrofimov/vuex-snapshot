import * as promiseLib from './src/mockPromise'
import * as fetchLib from './src/mockFetch'
import timetable from './src/timetable'
import snapActionCore from './src/snapAction'
import config from './src/config'


/**
 * Resets config and timetable
 */
const reset = () => {
  config.reset()
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
 * @returns {(Array | Promise<Array>)}
 */
const snapAction = (action, mocks={}, resolutions=[]) => {
  if(Array.isArray(mocks)) {
    resolutions = mocks
    mocks = {}
  }

  const commit = mocks.commit || (() => {})
  const dispatch = mocks.dispatch || (() => {})
  
  return snapActionCore(
    action, 
    {
      payload: mocks.payload,
      state: mocks.state,
      getters: mocks.getters,
      commit,
      dispatch
    }, 
    resolutions, 
    config.options,
  )
}


export default {
  snapAction,
  reset,

  timetable,
  resetTimetable: timetable.reset,

  config: config.options,
  resetConfig: config.reset,

  mockFetch: fetchLib.mockFetch,
  useMockFetch: fetchLib.useMock,
  useRealFetch: fetchLib.useReal,

  MockPromise: promiseLib.MockPromise,
  useMockPromise: promiseLib.useMock,
  useRealPromise: promiseLib.useReal,
}