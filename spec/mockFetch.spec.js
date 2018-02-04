import {mockFetch, useReal, useMock} from '../src/mockFetch'
import timetable from '../src/timetable'

describe('mockFetch', () => {
  const realTimetableRegister = timetable.register

  beforeEach(() => {
    timetable.register = jest.fn()
  })

  afterAll(() => {
    timetable.register = realTimetableRegister
  })
  
  it('Is a promise', () => {
    expect(mockFetch() instanceof Promise).toBe(true)
  })
  
  it('Registers in timetable', () => {
    mockFetch()
    expect(timetable.register).toBeCalled()
  })

  it('Has name of url it was called with', () => {
    mockFetch('url')
    expect(timetable.register.mock.calls[0][0].name).toBe('url')
  })

  it('Extracts working resolve', done => {
    const promise = mockFetch('url')
    const resolve = timetable.register.mock.calls[0][0].resolve

    resolve()

    promise.then(done)
  })

  it('Extracts working reject', done => {
    const promise = mockFetch('url')
    const reject = timetable.register.mock.calls[0][0].reject

    reject()

    promise.catch(done)
  })

  it('Registers a promise', () => {
    mockFetch('url')
    const promise = timetable.register.mock.calls[0][0].promise
    expect(promise instanceof Promise).toBe(true)
  })

  it('Passes init as a payload', () => {
    const init = {
      method: 'POST'
    }
    mockFetch('url', init)
    expect(timetable.register.mock.calls[0][0].payload).toBe(init)
  })

  it('Replaces globals', () => {
    useMock()
    expect(fetch).toBe(mockFetch)

    useReal()
    expect(fetch).not.toBe(mockFetch) // node runtime has no fetch
  })
})