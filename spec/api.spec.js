import * as promiseLib from '../src/mockPromise'
import * as fetchLib from '../src/mockFetch'

// fancy mocking
const snapActionModule = require('../src/snapAction')
const snapActionCore = snapActionModule.default
const snapAction = jest.fn(snapActionCore)
snapActionModule.default = snapAction

// the ones being tested
import vuexSnapshot from '../index'
import config from '../src/config'
import { MockPromise } from '../src/mockPromise';


describe('API', () => {
  describe('config', () => {
    it('Has autoResolve option, with default of false', () => {
      expect(vuexSnapshot.config.autoResolve).toBe(false)
    })
    
    it('Has snapEnv option, with default of false', () => {
      expect(vuexSnapshot.config.snapEnv).toBe(false)
    })
    
    it('Has allowManualActionResolution option, with default of false', () => {
      expect(vuexSnapshot.config.allowManualActionResolution).toBe(false)
    })
    
    it('Resets config w/ .resetConfig', () => {
      vuexSnapshot.config.autoResolve = true
      vuexSnapshot.config.snapEnv = true
      vuexSnapshot.config.allowManualActionResolution = false
    
      vuexSnapshot.resetConfig()
      expect(vuexSnapshot.config.snapEnv).toBe(false)
      expect(vuexSnapshot.config.autoResolve).toBe(false)
    })
    
    it('Resets all w/ .reset', () => {
      const realTimetableReset = vuexSnapshot.timetable.reset
      const realConfigReset = config.reset
      const realUseRealPromise = promiseLib.useReal
      const realUseRealFetch = fetchLib.useReal
      
      vuexSnapshot.timetable.reset = jest.fn()
      config.reset = jest.fn()
      promiseLib.useReal = jest.fn()
      fetchLib.useReal = jest.fn()
    
      vuexSnapshot.reset()
    
      expect(vuexSnapshot.timetable.reset).toBeCalled()
      expect(config.reset).toBeCalled()
      expect(promiseLib.useReal).toBeCalled()
      expect(fetchLib.useReal).toBeCalled()
    
      vuexSnapshot.timetable.reset = realTimetableReset
      config.reset = realConfigReset
      promiseLib.useReal = realUseRealPromise
      fetchLib.useReal = realUseRealFetch
    })
  })


  describe('snapAction', () => {
    // mocks are being reconstructed, so we check them manually
    const expectMocksPassed = (recivedMocks, realMocks) => {
      expect(recivedMocks.state).toEqual(mocks.state)
      expect(recivedMocks.getters).toEqual(mocks.getters)
      expect(recivedMocks.payload).toEqual(mocks.payload)
      expect(mocks.commit).toBeCalled()
      expect(mocks.dispatch).toBeCalled()
    }

    let action
    const mocks={}, resolutions=[], options={}

    beforeEach(() => {
      vuexSnapshot.reset()
      action = jest.fn(({commit, dispatch}) => {
        commit('a')
        dispatch('b')
      })
      
      mocks.state = {
        isState: true
      }
      mocks.getters = {
        value: [1, 2, 3]
      }
      mocks.commit = jest.fn()
      mocks.dispatch = jest.fn()
      mocks.payload = {isPayload: true}

      resolutions.length = 0

      Object.assign(options, config.options)
    })

    it('Passes options', () => {
      vuexSnapshot.snapAction(action, mocks, resolutions)
      expect(snapAction.mock.calls[0][3]).toEqual(options)
    })

    it('Ensures commit and dispatch', () => {
      mocks.commit = undefined
      mocks.dispatch = undefined

      vuexSnapshot.snapAction(action, mocks, resolutions)

      const recivedMocks = snapAction.mock.calls[0][1]

      expect(typeof recivedMocks.commit).toBe('function')
      expect(typeof recivedMocks.dispatch).toBe('function')
    })

    it('Works with [action] args', () => {
      vuexSnapshot.snapAction(action)

      expect(snapAction).toBeCalledWith(
        action, expect.any(Object), 
        expect.any(Array), 
        config.options
      )
    })

    it('Works with [action, mocks] args', () => {
      vuexSnapshot.snapAction(action, mocks)

      const recivedMocks = snapAction.mock.calls[0][1]

      expectMocksPassed(recivedMocks, mocks)
      expect(snapAction).toBeCalledWith(
        action, expect.any(Object), 
        expect.any(Array), 
        config.options
      )
    })

    it('Works with [action, resolutions] args', () => {
      vuexSnapshot.snapAction(action, resolutions)

      expect(snapAction).toBeCalledWith(
        action, expect.any(Object), 
        resolutions, 
        config.options
      )
    })

    it('Works with [action, mocks, resolutions] args', () => {
      vuexSnapshot.snapAction(action, mocks ,resolutions)

      const recivedMocks = snapAction.mock.calls[0][1]

      expectMocksPassed(recivedMocks, mocks)
      expect(snapAction).toBeCalledWith(
        action, expect.any(Object), 
        resolutions, 
        config.options
      )
    })
  })


  describe('Snapshots (backwards compability check)', () => {
    beforeEach(vuexSnapshot.reset)

    it('Sync action', () => {
      const action = ({commit, dispatch}) => {
        commit('increment', 10)
        commit('decrement')
        dispatch('something useful', {notThisOne: 'yeah'})
      }

      expect(vuexSnapshot.snapAction(action)).toMatchSnapshot()
    })

    it('Sync action w/ env & payload', () => {
      const action = ({commit, dispatch, state, getters}, payload) => {
        commit('increment', state.incBig)
        commit('decrement', getters.sadness)
        dispatch('something useful', payload)
      }

      const mocks = {
        state: {
          irrelevat: false,
          incBig: 100
        },
        getters: {sadness: Infinity},
        payload: {action}
      }

      vuexSnapshot.config.snapEnv = true

      expect(vuexSnapshot.snapAction(action, mocks)).toMatchSnapshot()
    })

    it('Async simple', done => {
      const action = ({commit}) => {
        commit('smth')
        return Promise.resolve()
      }

      vuexSnapshot.snapAction(action)
        .then(run => {
          expect(run).toMatchSnapshot()
          done()
        })
        .catch(done)
    })

    it('Async inner promise', done => {
      vuexSnapshot.useMockPromise()

      const action = ({commit}) => new Promise(resolve => {
        commit('smth')
        new Promise(() => {}).then(data => {
          commit('use', data)
          resolve(data)
        })
      })

      vuexSnapshot.snapAction(action, ['Promise'])
        .then(run => {
          expect(run).toMatchSnapshot()
          done()
        })
        .catch(done)
    })

    it('Async state or getter promise', done => {
      const action = ({commit, state}) => new Promise(resolve => {
        commit('smth')
        state.preloadPromise.then(data => {
          commit('use', data)
          resolve(data)
        })
      })

      const state = {
        preloadPromise: new vuexSnapshot.MockPromise('preload')
      }

      vuexSnapshot.snapAction(action, {state}, [{name: 'preload', payload: 'a lot of data'}])
        .then(run => {
          expect(run).toMatchSnapshot()
          done()
        })
        .catch(done)
    })

    it('Async fetch', done => {
      vuexSnapshot.useMockFetch()

      const action = ({dispatch}, attempts=0) => new Promise((resolve, reject) => {
        const request = fetch('http://api.example.com/whatever')
        request
          .then(response => response.json())
          .then(json => {
            dispatch('useExample', json)
            resolve()
          })
          .catch(message => {
            dispatch('callExampleAPI', attempts + 1)
            reject()
          })

        return request
      })

      const resolutions = [{
        name: 'http://api.example.com/whatever',
        payload: {
          json: () => new MockPromise('json')
        }
      }, {
        name: 'json',
        payload: {
          data: 'yep',
          important: true
        }
      }]

      vuexSnapshot.snapAction(action, resolutions)
        .then(run => {
          expect(run).toMatchSnapshot()
          done()
        })
        .catch(err => {
          console.error(err)
          done(err)
        })

      console.log(vuexSnapshot.timetable.entries)
    })

    it('Async rejected', done => {
      vuexSnapshot.config.allowManualActionResolution = true
      vuexSnapshot.useMockFetch()

      const action = ({dispatch}, attempts=0) => {
        const request = fetch('http://api.example.com/whatever')
        
        request.catch(message => {
          dispatch('callExampleAPI', attempts + 1)
        })

        return request
      }

      const resolutions = [{
        name: 'http://api.example.com/whatever',
        type: 'reject',
        payload: new TypeError('Failed to fetch')
      }]

      vuexSnapshot.snapAction(action, resolutions)
        .then(run => {
          expect(run).toMatchSnapshot()
          done()
        })
        .catch(done)
    })
  })
})