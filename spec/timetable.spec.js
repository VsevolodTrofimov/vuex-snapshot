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

    it('Adds to entries', () => {
      const realPush = timetable.entries.push
      timetable.entries.push = jest.fn(realPush)
      
      timetable.register(testEntry)
      
      expect(timetable.entries.push).toBeCalled()

      // getting it back to normal
      timetable.entries.push = realPush
    })

    it('Avoids name duplication', () => {   
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
    
    it('Returns a promise', () => {
      expect(timetable.trigger(testResolution) instanceof Promise).toBe(true)
    })

    it('Resolves entry`s promise correctly', () => {
      timetable.trigger(testResolution)
      expect(testEntry.resolve).toBeCalled()
    })
    
    it('Rejects entry`s promise correctly', () => {
      testResolution.type = 'reject'
      timetable.trigger(testResolution)
      expect(testEntry.reject).toBeCalled()
    })

    it('Passes payload', () => {
      timetable.trigger(testResolution)
      expect(testEntry.resolve).toBeCalledWith(testResolution.payload)
    })

    it('Resolves correct promise', () => {
      timetable.reset()
      timetable.register({
        name: 'some trash'
      })
      timetable.register(testEntry)

      timetable.trigger(testResolution)
      expect(testEntry.resolve).toBeCalled()
    })

    it('Never resolves promise twice', () => {
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

    it('Rejects if entry is note there', done => {
      testResolution.name = testEntry.name + 'ahahhah'
      timetable.trigger(testResolution)
        .catch(err => {
          expect(testEntry.resolve).not.toBeCalled()
          done()
        })      
    })
  })

  
  describe('ensureAbsence', () => {
    beforeEach(() => {
      timetable.reset()
      timetable.register(testEntry)
    })

    it('Removes entry if it`s there', () => {
      timetable.ensureAbsence(testEntry.promise)

      expect(timetable.entries.length).toBe(0)
    })

    it('Only removes entry that has passed promise', () => {
      const testEntry2 = {
        name: testEntry.name,
        promise: new Promise(() => {}),
        resolve: jest.fn(),
        reject: jest.fn(),
      }

      const testEntry3 = {
        name: testEntry.name,
        promise: new Promise(() => {}),
        resolve: jest.fn(),
        reject: jest.fn(),
      }

      timetable.register(testEntry2)
      timetable.register(testEntry3)
      timetable.ensureAbsence(testEntry3)
      expect(timetable.entries[0].promise).toBe(testEntry.promise)
      expect(timetable.entries[1].promise).toBe(testEntry2.promise)
    })

    it('Dosen`t change entries if there isn`t one it looks for', () => {
      timetable.ensureAbsence(new Promise(() => {}))
      expect(timetable.entries.length).toBe(1)
    })
  })


  describe('reset', () => {
    it('Empties entries array', () => {
      timetable.register(testEntry)

      timetable.reset()
      expect(timetable.entries.length).toBe(0)
    })
  })
})