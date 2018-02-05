import vuexSnapshot from '../index'
import config from '../src/config'


describe('API', () => {
  it('Has autoResolve option, with default of false', () => {
    expect(vuexSnapshot.config.autoResolve).toBe(false)
  })

  it('Has snapEnv option, with default of false', () => {
    expect(vuexSnapshot.config.snapEnv).toBe(false)
  })

  it('Has allowManualActionResolution option, with default of false', () => {
    expect(vuexSnapshot.config.allowManualActionResolution).toBe(false)
  })

  it('resets config w/ .resetConfig', () => {
    vuexSnapshot.config.autoResolve = true
    vuexSnapshot.config.snapEnv = true
    vuexSnapshot.config.allowManualActionResolution = false

    vuexSnapshot.resetConfig()
    expect(vuexSnapshot.config.snapEnv).toBe(false)
    expect(vuexSnapshot.config.autoResolve).toBe(false)
  })

  it('resets all w/ .reset', () => {
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