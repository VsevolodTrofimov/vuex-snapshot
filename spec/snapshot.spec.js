import Snapshot from '../src/snapshot'

describe('Snapshot', () => {
  let snapshot

  beforeEach(() => {
    snapshot = new Snapshot()
  })
  
  it('Has add functiion and value array', () => {
    expect(snapshot.add instanceof Function).toBe(true)
    expect(Array.isArray(snapshot.value)).toBe(true)
  })

  it('Adds messages in value', () => {
    const message = 'Sample message'
    const payload = {isPayload: true}
    snapshot.add(message, payload)
    expect(snapshot.value[0]).toEqual({message, payload})
  })
})