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

  it('Never adds after freezing', () => {
    const message = 'Sample message'
    const payload = {isPayload: true}
    snapshot.add(message, payload)
    snapshot.freeze()
    snapshot.add(message, payload)
    expect(snapshot.value.length).toBe(1)
  })

  it('Can be unfrozen', () => {
    const message = 'Sample message'
    const payload = {isPayload: true}

    snapshot.freeze()
    snapshot.add(message, payload)
    expect(snapshot.value.length).toBe(0)

    snapshot.unfreeze()
    snapshot.add(message, payload)
    expect(snapshot.value.length).toBe(1)
  })
})