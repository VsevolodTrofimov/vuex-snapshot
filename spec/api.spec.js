// fancy mocking
const snapActionModule = require('../src/snapAction')
const snapActionCore = snapActionModule.default
const snapAction = jest.fn(snapActionCore)
snapActionModule.default = snapAction

// the ones being tested
import vuexSnapshot from '../index'
import config from '../src/config'


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
      
      vuexSnapshot.timetable.reset = jest.fn()
      config.reset = jest.fn()
    
      vuexSnapshot.reset()
    
      expect(vuexSnapshot.timetable.reset).toBeCalled()
      expect(config.reset).toBeCalled()
    
      vuexSnapshot.timetable.reset = realTimetableReset
      config.reset = realConfigReset
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
    it('Sync action', () => {

    })

    it('Async simple', () => {
      
    })

    it('Async inner promise', () => {
      
    })

    it('Async state or getter promise', () => {
      
    })

    it('Async fetch', () => {
    
    })

    it('Async timeout', () => {
      
    })
  })
})