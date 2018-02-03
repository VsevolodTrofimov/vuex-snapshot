import * as promiseLib from './src/mockPromise'
import * as fetchLib from './src/mockFetch'
import * as timetable from './src/timetable'
import snapAction from './src/snapAction'
import snapState from './src/snapState'

export default {
  snapAction,
  snapState,

  timetable,
  resetTimetable: timetable.reset,

  mockFetch: fetchLib.mockFetch,
  useMockFetch: fetchLib.useMock,
  useRealFetch: fetchLib.useReal,

  MockPromise: promiseLib.MockPromise,
  useMockPromise: promiseLib.useMock,
  useRealPromise: promiseLib.useReal,
}