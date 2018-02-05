import vuexSnapshot from '../index'

describe('API', () => {
  // options
  
  it('Has autoResolve option, with default of false', () => {
    expect(vuexSnapshot.config.autoResolve).toBe(false)
  })

  it('Has snapEnv option, with default of false', () => {
    expect(vuexSnapshot.config.snapEnv).toBe(false)
  })

  it('resets config', () => {
    vuexSnapshot.config.autoResolve = true
    vuexSnapshot.config.snapEnv = true

    vuexSnapshot.resetConfig()
    expect(vuexSnapshot.config.snapEnv).toBe(false)
    expect(vuexSnapshot.config.autoResolve).toBe(false)
  })
})