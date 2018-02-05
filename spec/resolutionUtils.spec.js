import {normalizeResolution, simualteResolution, simualteResolutions, lib} from '../src/resolutionUtils' 
import { MockPromise } from '../src/mockPromise'


describe('resolutionUtils', () => {
  describe('normalizeResolution', () => {
    it('Converts string into "resolve" resolution', () => {
      const resolution = normalizeResolution('name')
      expect(resolution.name).toBe('name')
      expect(resolution.type).toBe('resolve')

      const resolution2 = normalizeResolution(new String('name2'))
      expect(resolution2.name).toEqual('name2')
      expect(resolution2.type).toBe('resolve')
    })

    it('Throws when resolution has no name', () => {
      expect(() => {
        normalizeResolution({type: 'reject'})
      }).toThrow()

      expect(() => {
        normalizeResolution({})
      }).toThrow()
    })

    it('Throws when resolution type is nor resolve nor reject', () => {
      expect(() => {
        normalizeResolution({name: '1', type: 'fail'})
      }).toThrow()
      
      expect(() => {
        normalizeResolution({name: '1', type: 'ok'})
      }).toThrow()
    })

    it('Passes payload', () => {
      const payload = {}
      const resolution = normalizeResolution({name: '1', payload})
      expect(resolution.payload).toBe(payload)

      const resolutionZero = normalizeResolution({name: '1', payload: 0})
      expect(resolution.payload).toBe(payload)
    })

    it('Uses resolve as a default type', () => {
      const resolution = normalizeResolution({name: '1', payload: 0})
      expect(resolution.type).toBe('resolve')
    })
  })

  
  describe('Simualte resolution', () => {
    let testResolution
    const snapshot = {}
    const timetable = {}

    beforeEach(() => {
      testResolution = {
        name: 'someName',
        type: 'resolve',
        payload: {a: 'b'}
      }

      snapshot.add = jest.fn()
      timetable.trigger = jest.fn(() => Promise.resolve())
    })

    it('Returns timetable trigger result', () => {
      const timetableReturn = Promise.resolve()
      timetable.trigger.mockReturnValue(timetableReturn)

      const simutationReturn = simualteResolution(testResolution, snapshot, timetable)
      expect(simutationReturn).toBe(timetableReturn)
    })

    it('Produces message that matches snapshot', () => {
      simualteResolution(testResolution, snapshot, timetable)
      expect(snapshot.add.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('Simualte resolutions', () => {
    let testResolution
    let resolutions
    let normalizeResolutionSpy, simualteResolutionSpy
    const snapshot = {}, timetable = {}, options = {}

    beforeEach(() => {
      testResolution = {
        name: 'someName',
        type: 'reject',
        payload: {a: 'b'}
      }

      resolutions = [testResolution, 'a', 'b']

      snapshot.add = jest.fn()
      timetable.trigger = jest.fn().mockReturnValue(Promise.resolve())

      lib.normalizeResolution = jest.fn(normalizeResolution)
      lib.simualteResolution = jest.fn().mockReturnValue(Promise.resolve())
    })
  
    it('Returns a promise', () => {
      const returned = simualteResolutions(resolutions, snapshot, timetable, options)
      expect(returned instanceof Promise).toBe(true)
    })

    it('Normalizes all resolution', done => {
      simualteResolutions(resolutions, snapshot, timetable, options)
        .then(() => {
          expect(
            lib.normalizeResolution.mock.calls.length
          ).toBe(resolutions.length)
          
          done()
        })
        .catch(done)
    })

    it('Simulates all resolutions', done => {
      simualteResolutions(resolutions, snapshot, timetable, options)
        .then(() => {
          expect(
            lib.simualteResolution.mock.calls.length
          ).toBe(resolutions.length)
          
          done()
        })
        .catch(done)
    })


    it('Simulates resolutions one by one', done => {
      done()
    })
    
    it('Pipes errors up', done => {
      lib.normalizeResolution = normalizeResolution
      lib.simualteResolution = simualteResolution

      const normalizeErrorPromise = new MockPromise(() => {})
      const snapshotErrorPromise = new MockPromise(() => {})
      const timetableErrorPromise = new MockPromise(() => {})

      simualteResolutions([{type: 'strange thing'}], snapshot, timetable, options)
        .then(normalizeErrorPromise.reject)
        .catch(err => {
          expect(err instanceof Error).toBe(true)
          normalizeErrorPromise.resolve()
        })

      simualteResolutions(resolutions, {}, timetable, options)
      .then(snapshotErrorPromise.reject)
        .catch(err => {
          expect(err instanceof Error).toBe(true)
          snapshotErrorPromise.resolve()
        })

      simualteResolutions(resolutions, {}, timetable, options)
        .then(timetableErrorPromise.reject)
        .catch(err => {
          expect(err instanceof Error).toBe(true)
          timetableErrorPromise.resolve()
        })
        
      Promise.all([
        normalizeErrorPromise, 
        snapshotErrorPromise,
        timetableErrorPromise,
      ])
        .then(() => {
          done()
        })
        .catch(done)
    })
  })
})