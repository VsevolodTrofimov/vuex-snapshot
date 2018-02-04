import {MockPromise, useReal, useMock} from '../src/mockPromise'
import timetable from '../src/timetable'

describe('MockPromise', () => {
  const RealPromise = Promise
  const realTimetableRegister = timetable.register

  beforeEach(() => {
    timetable.register = jest.fn()
  })

  afterAll(() => {
    timetable.register = realTimetableRegister
  })
  
  it('Is a promise', () => {
    expect(new MockPromise(() => {}) instanceof Promise).toBe(true)
  })

  it('Has name field', () => {
    const promise = new MockPromise('name')  
    expect(promise.name).toBe('name')
  })
  
  it('Has default name "Promise"', () => {
    const promise = new MockPromise(() => {})
    expect(promise.name).toBe('Promise')
  })
  
  it('Registers in timetable', () => {
    new MockPromise(() => {})
    expect(timetable.register).toBeCalled()
  })


  it('Registers with passed name', () => {
    new MockPromise('test1')
    expect(timetable.register.mock.calls[0][0].name).toBe('test1')

    new MockPromise(() =>{}, 'test2')
    expect(timetable.register.mock.calls[1][0].name).toBe('test2')
  })


  it('Extracts working resolve', done => {
    const promise = new MockPromise(() => {})
    const resolve = timetable.register.mock.calls[0][0].resolve

    resolve()

    promise.then(done)
  })

  it('Extracts working reject', done => {
    const promise = new MockPromise(() => {})
    const reject = timetable.register.mock.calls[0][0].reject

    reject()

    promise.catch(done)
  })

  it('Registers a promise', () => {
    new MockPromise(() => {})
    const promise = timetable.register.mock.calls[0][0].promise
    expect(promise instanceof Promise).toBe(true)
  })

  it('Passes registers function as a payload', () => {
    const cb = () => {}
    new MockPromise(cb)
    expect(timetable.register.mock.calls[0][0].payload).toBe(cb)
  })

  it('Replaces globals', () => {
    useMock()
    expect(Promise).toBe(MockPromise)

    useReal()
    expect(Promise).toBe(RealPromise)
  })
})