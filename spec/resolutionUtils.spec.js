import {normalizeResolution, simualteResolution, simualteResolutions} from '../src/resolutionUtils'
import timetable from '../src/timetable'

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
})