import serialize from './serialize'


const RealPromise = Promise


export const normalizeResolution = resolution => {
  const normalResolution = {
    name: '',
    type: 'resolve',
    payload: undefined,
  }
  
  // string constructor
  if(typeof resolution === 'string' || resolution.indexOf('string')) {
    normalResolution.name = resolution
    return normalResolution
  } 
  
  // object constructor, errors are duplicated because they are likely to occur in promises
  if(resolution.name) {
    normalResolution.name = resolution.name
  } else {
    throw new Error('vuex-snapshot: INPUT ERROR resolution must have a name')
  }

  if(resolution.type && ['resolve', 'reject'].indexOf(resolution.type) !== -1) {
    normalResolution.type = resolution.type
  } else {
    throw new Error('vuex-snapshot: INPUT ERROR resolution type must be' 
                    + 'either "resovle" or "reject"')
  }

  if(resolution.payload) {
    normalResolution.payload = resolution.payload
  }
}


export const simualteResolution = (resolution, snapCb, timetable) => {
  snapCb(`RESOLUTION: ${resolution.name} -> ${resolution.type}`, resolution.payload)
  return timetable.trigger(resolution)
}


export const simualteResolutions = (resolutions, snapCb, timetable) => {
  return new RealPromise((resolveSimulation, rejectSimulation) => {
    const normalResolutions = resolutions.map(normalizeResolution)
    
    // simulates given resolution and queues the next until all are simulated
    const simulationLoop = idx => {
      if(idx === normalResolutions.length) {
        resolveSimulation()
      }
      else {
        simualteResolution(normalResolutions[idx], snapCb, timetable)
          .then(() => simulationLoop(idx + 1))
          .catch(rejectSimulation)
      }
    }

    simulationLoop(0)
  })
}
