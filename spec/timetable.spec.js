import timetable from '../src/timetable'

describe('timetable', () => {
  let testEntry
  let testResolution

  beforeEach(() => {
    testEntry = {
      name: 'testEntry',
      promise: new Promise(() => {}),
      resolve: jest.fn(),
      reject: jest.fn(),
    }

    testResolution = {
      name: testEntry.name,
      type: 'resolve',
      payload: {a: 'b'}
    }
  })

  describe('register', () => {
    beforeEach(timetable.reset)

    it('adds to entries', () => {
      const realPush = timetable.entries.push
      timetable.entries.push = jest.fn(realPush)
      
      timetable.register(testEntry)
      
      expect(timetable.entries.push).toBeCalled()

      // getting it back to normal
      timetable.entries.push = realPush
    })

    it('avoids name duplication', () => {   
      timetable.register(testEntry)
      timetable.register(testEntry)

      expect(timetable.entries[1].name).not.toEqual(testEntry.name)
    })
  })


  describe('trigger', () => {
    beforeEach(() => {
      timetable.reset()
      timetable.register(testEntry)
    })
    
    it('returns a promise', () => {
      expect(timetable.trigger(testResolution) instanceof Promise).toBe(true)
    })

    it('resolves entry`s promise correctly', () => {
      timetable.trigger(testResolution)
      expect(testEntry.resolve).toBeCalled()
    })
    
    it('rejects entry`s promise correctly', () => {
      testResolution.type = 'reject'
      timetable.trigger(testResolution)
      expect(testEntry.reject).toBeCalled()
    })

    it('passes payload', () => {
      timetable.trigger(testResolution)
      expect(testEntry.resolve).toBeCalledWith(testResolution.payload)
    })

    it('resolves correct promise', () => {
      timetable.reset()
      timetable.register({
        name: 'some trash'
      })
      timetable.register(testEntry)

      timetable.trigger(testResolution)
      expect(testEntry.resolve).toBeCalled()
    })

    it('never resolves promise twice', () => {
      const testEntry2 = {
        name: testEntry.name,
        promise: new Promise(() => {}),
        resolve: jest.fn(),
        reject: jest.fn(),
      }

      timetable.register(testEntry2)

      timetable.trigger(testResolution)
      expect(testEntry.resolve).toBeCalled()
      expect(testEntry2.resolve).not.toBeCalled()

      timetable.trigger(testResolution)
      expect(testEntry2.resolve).toBeCalled()
      expect(testEntry.resolve.mock.calls.length).toBe(1)
    })

    it('rejects if entry is note there', done => {
      testResolution.name = testEntry.name + 'ahahhah'
      timetable.trigger(testResolution)
        .catch(err => {
          expect(testEntry.resolve).not.toBeCalled()
          done()
        })      
    })
  })


  describe('reset', () => {
    it('empies entries array', () => {
      timetable.register(testEntry)

      timetable.reset()
      expect(timetable.entries.length).toBe(0)
    })
  })
})