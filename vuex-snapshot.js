'use strict';

const find = (arr, matchFn) => {
  for(let i = 0; i < arr.length; ++i) {
    if(matchFn(arr[i])) return arr[i]
  }
};


const useGlobally = (name, value) => {
  window[name] = value;
};


const makeSuffix = () => {
  const suffix = () => suffix.num > 1 ? '[' + suffix.num.toString() + ']' : '';
  suffix.num = 1;
  suffix.next = () => ++suffix.num;

  return suffix
};

const RealPromise = Promise;
const entries = [];


const register = ({name, promise, payload, resolve, reject}) => {
  const entry = {
    payload,
    promise,
    resolve,
    reject,
    called: false
  };

  // make sure name is unique
  const suffix = makeSuffix();
  while(find(entries, e => e.name === name + suffix())) suffix.next();

  entry.name = name + suffix();

  entries.push(entry);
};


const trigger = ({name, type, payload}) => {
  const suffix = makeSuffix();
  while(find(entries, e => e.name === name + suffix() && e.called)) suffix.next();
  
  const entry = find(entries, e => e.name === name + suffix());
  
  return new RealPromise((resolve, reject) => {
    if(typeof entry === 'undefined') {
      reject(new Error(`vuex-snapshot: did not find ${name + suffix()} that wasn't already resolved or rejected`));
    }
  
    entry[type](payload);
    entry.called = true;
    RealPromise.resolve().then(resolve); //this would happen right after entry's promise resolutions
  })
};


const ensureAbsence = (promise) => {
  for(let i = 0; i < entries.length; ++i) {
    if(entries[i].promise === promise) {
      entries.splice(i, 1);
    }
  }
};

const reset = () => entries.length = 0;

var timetable = {
  register,
  trigger,
  reset,
  entries,
  ensureAbsence,
}

const RealPromise$1 = Promise;


class MockPromise extends RealPromise$1 {
  /**
   * Named promise that can be resolved manually and properly serialized 
   * and registers it in timetable
   * @param {Function} cb 
   * @param {string} name
   */
  constructor(cb, name='Promise') {
    let resovleTrigger;
    let rejectTrigger;

    // name-only construction
    if(typeof cb === 'string') {
      name = cb;
      cb = () => {};
    }

    const cbProxy = (resolve, reject) => {
      resovleTrigger = resolve;
      rejectTrigger = reject;
      cb(resolve, reject);
    };

    super(cbProxy);

    this.name = name;
    this.resolve = resovleTrigger;
    this.reject = rejectTrigger;

    timetable.register({
      name,
      promise: this,
      payload: cb,
      resolve: resovleTrigger,
      reject: rejectTrigger
    });
  }
}


const useMock = () => useGlobally('Promise', MockPromise);
const useReal = () => useGlobally('Promise', RealPromise$1);

const RealPromise$2 = Promise;
const realFetch = window.fetch;


/**
 * Creates mock fetch that can be resolved manually and properly serialized 
 * and registers it in timetable
 * @param {string} url 
 * @param {any} init 
 * @returns {Promise}
 */
const mockFetch = (url, init) => {
  let resovleTrigger;
  let rejectTrigger;

  const cbProxy = (resolve, reject) => {
    resovleTrigger = resolve;
    rejectTrigger = reject;
  };

  const simulation = new RealPromise$2(cbProxy);
  simulation.name = url;
  simulation.resolve = resovleTrigger;
  simulation.reject = rejectTrigger;

  timetable.register({
    name: url,
    promise: simulation,
    payload: init,
    resolve: resovleTrigger,
    reject: rejectTrigger
  });

  return simulation
};


const useMock$1 = () => useGlobally('fetch', mockFetch);
const useReal$1 = () => useGlobally('fetch', realFetch);

class Snapshot {
  constructor() {
    this.value = [];
    this.frozen = false;
    this.add = this.add.bind(this);
    this.freeze = this.freeze.bind(this);
    this.unfreeze = this.unfreeze.bind(this);
  }

  add(message, payload) {
    if(this.frozen) return
    const entry = {};
    entry.message = message;
    if(typeof payload !== 'undefined') entry.payload = payload;
    this.value.push(entry);
  }

  freeze() {
    this.frozen = true;
  }

  unfreeze() {
    this.frozen = false;
  }
}

const RealPromise$3 = Promise;


const normalizeResolution = resolution => {
  const normalResolution = {
    name: '',
    type: 'resolve',
    payload: undefined,
  };
  
  // string constructor
  if(typeof resolution === 'string' || resolution instanceof String) {
    normalResolution.name = resolution;
    return normalResolution
  } 
  
  // object constructor, errors are duplicated because they are likely to occur in promises
  if(typeof resolution.name !== 'undefined') {
    normalResolution.name = resolution.name;
  } else {
    throw new Error('vuex-snapshot: INPUT ERROR resolution must have a name')
  }

  if(resolution.type) {
    if(['resolve', 'reject'].indexOf(resolution.type) !== -1) {
      normalResolution.type = resolution.type;
    } else {
      throw new Error('vuex-snapshot: INPUT ERROR resolution type must be' 
                      + 'either "resovle" or "reject"')
    }
  }

  if(typeof resolution.payload !== 'undefined') {
    normalResolution.payload = resolution.payload;
  }

  return normalResolution
};


const simualteResolution = (resolution, snapshot, timetable) => {
  snapshot.add(`RESOLUTION: ${resolution.name} -> ${resolution.type}`, resolution.payload);
  return timetable.trigger(resolution)
};


// for testablility
const lib = {
  simualteResolution,
  normalizeResolution,
};


const simualteResolutions = (resolutions, snapshot, timetable, options) => {
  return new RealPromise$3((resolveSimulation, rejectSimulation) => {
    const normalResolutions = resolutions.map(lib.normalizeResolution);

    if(options.autoResolve) {
      let count = 0; // to break infinite loops

      // finds next uncalled entry and calls it
      const autoSimulationLoop = () => {
        count++;
        const nextEntry = find(timetable.entries, e => !e.called);
        
        if(nextEntry && count < 1000) {
          const nextResolution = lib.normalizeResolution(nextEntry.name);

          lib.simualteResolution(nextResolution, snapshot, timetable)
            .then(autoSimulationLoop)
            .catch(rejectSimulation);
        } else {
          resolveSimulation();
        }
      };

      autoSimulationLoop();
    } else {
      // simulates given resolution and queues the next until all are simulated
      const simulationLoop = (idx=0) => {
        if(idx === normalResolutions.length) {
          resolveSimulation();
        }
        else {
          lib.simualteResolution(normalResolutions[idx], snapshot, timetable)
            .then(() => simulationLoop(idx + 1))
            .catch(rejectSimulation);
        }
      };

      simulationLoop();
    }
  })
};

const RealPromise$4 = Promise;


const makeCallSnapper = (snapshot, type, cb) => (name, payload) => {
  snapshot.add(`${type}: ${name}`, payload);
  cb(name, payload);
};


/**
 * @typedef {{name:string, type: ("resolve" | "reject"), payload}} Resolution
 */
/**
 * Takes snapshot of action's evaluation
 * @param {Function} action action to test
 * @param {{state, getters, commit: Function, dispatch: Function, payload}} mocks arguments passed to the action, payload is the second argument
 * @param {[(string | Resolution)]} resolutions
 * @param {{autoResovle: Boolean, snapEnv: Boolean}} options
 * @returns  {(string | Promise<string>)}
 */
const snapAction = (action, mocks, resolutions, options, snapshot) => {
  const mockCommit = makeCallSnapper(snapshot, 'COMMIT', mocks.commit);
  const mockDispatch = makeCallSnapper(snapshot, 'DISPATCH', mocks.dispatch);

  if(options.snapEnv) {
    snapshot.add('DATA MOCKS', {
      state: mocks.state,
      getters: mocks.getters
    });
    snapshot.add('ACTION CALL', mocks.payload);
  }

  const actionReturn = action({
    commit: mockCommit,
    dispatch: mockDispatch,
    state: mocks.state,
    getters: mocks.getters
  }, mocks.payload);

  if(typeof actionReturn !== 'undefined' && actionReturn instanceof Promise) {
    // action is async
    if(!options.allowManualActionResolution) {
      timetable.ensureAbsence(actionReturn);
    }

    return new RealPromise$4((resolve, reject) => {
      actionReturn
        .then(payload => {
          snapshot.add('ACTION RESOLVED', payload);
          snapshot.freeze();
          resolve(snapshot.value);
        })
        .catch(payload => {
          snapshot.add('ACTION REJECTED', payload);
          snapshot.freeze();
          resolve(snapshot.value);
        });
      
      simualteResolutions(resolutions, snapshot, timetable, options)
        .then(() => {
          // this is needed to let action to resolve first
          setTimeout(() => {
            snapshot.add('ACTION DID NOT RESOLVE');
            resolve(snapshot.value);
          }, 0);
        })
        .catch(err => {
          reject({
            err,
            run: snapshot.value
          });
        });

    })
  } else {
    // action is sync
    return snapshot.value
  }
};

/**
 * @namespace 
 * @property {Boolean} autoResolve resolve all MockPromises and fetches in order they were created
 * @property {Boolean} snapEnv include state, getters and payload into snapshot
 * @property {Boolean} allowManualActionResolution simaulation can now resolve action'sReturn value
 */
const options = {
  autoResolve: false,
  snapEnv: false,
  allowManualActionResolution: false
};

// they are likely to stay flat
const defaults = Object.assign({}, options);
const reset$1 = () => Object.assign(options, defaults);
reset$1();

var config = {
  options,
  reset: reset$1
}

/**
 * Resets config and timetable
 */
const reset$2 = () => {
  config.reset();
  timetable.reset();
  useReal();
  useReal$1();
};

/**
 * @typedef {{name:string, type: ("resolve" | "reject"), payload}} Resolution
 */
/**
 * Takes snapshot of action's evaluation
 * @param {Function} action action to test
 * @param {{state, getters, commit: Function, dispatch: Function, payload}} mocks arguments passed to the action, payload is the second argument
 * @param {[(string | Resolution)]} resolutions
 * @returns {(Array | Promise<Array>)}
 */
const snapAction$1 = (action, mocks={}, resolutions=[], snapshot=new Snapshot()) => {
  if(Array.isArray(mocks)) {
    resolutions = mocks;
    mocks = {};
  }

  const commit = mocks.commit || (() => {});
  const dispatch = mocks.dispatch || (() => {});
  
  return snapAction(
    action, 
    {
      payload: mocks.payload,
      state: mocks.state,
      getters: mocks.getters,
      commit,
      dispatch
    }, 
    resolutions, 
    config.options,
    snapshot
  )
};


var index = {
  snapAction: snapAction$1,
  reset: reset$2,

  timetable,
  resetTimetable: timetable.reset,

  config: config.options,
  resetConfig: config.reset,

  Snapshot,

  mockFetch: mockFetch,
  useMockFetch: useMock$1,
  useRealFetch: useReal$1,

  MockPromise: MockPromise,
  useMockPromise: useMock,
  useRealPromise: useReal,
}

module.exports = index;
