const RealPromise = Promise


export const normalizeResolution = resolution => {
  const normalResolution = {
    name: '',
    type: 'resolve',
    payload: undefined,
  }
  
  // string constructor
  if(typeof resolution === 'string' || resolution instanceof String) {
    normalResolution.name = resolution
    return normalResolution
  } 
  
  // object constructor, errors are duplicated because they are likely to occur in promises
  if(typeof resolution.name !== 'undefined') {
    normalResolution.name = resolution.name
  } else {
    throw new Error('vuex-snapshot: INPUT ERROR resolution must have a name')
  }

  if(resolution.type) {
    if(['resolve', 'reject'].indexOf(resolution.type) !== -1) {
      normalResolution.type = resolution.type
    } else {
      throw new Error('vuex-snapshot: INPUT ERROR resolution type must be' 
                      + 'either "resovle" or "reject"')
    }
  }

  if(typeof resolution.payload !== 'undefined') {
    normalResolution.payload = resolution.payload
  }

  return normalResolution
}


export const simualteResolution = (resolution, snapshot, timetable) => {
  snapshot.add(`RESOLUTION: ${resolution.name} -> ${resolution.type}`, resolution.payload)
  return timetable.trigger(resolution)
}


// for testablility
export const lib = {
  simualteResolution,
  normalizeResolution,
}


export const simualteResolutions = (resolutions, snapshot, timetable, options) => {
  return new RealPromise((resolveSimulation, rejectSimulation) => {
    const normalResolutions = resolutions.map(lib.normalizeResolution)
    
    // simulates given resolution and queues the next until all are simulated
    const simulationLoop = idx => {
      if(idx === normalResolutions.length) {
        resolveSimulation()
      }
      else {
        lib.simualteResolution(normalResolutions[idx], snapshot, timetable)
          .then(() => simulationLoop(idx + 1))
          .catch(rejectSimulation)
      }
    }

    simulationLoop(0)
  })
}


export default {
  normalizeResolution,
  simualteResolution,
  simualteResolutions,
}