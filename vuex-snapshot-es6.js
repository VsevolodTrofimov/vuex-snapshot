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
      reject(new Error(`vuex-snapshot: did not found promise ${name + suffix()}`));
    }
  
    entry[type](payload);
    entry.called = true;
    entry.promise
      .then(resolve)
      .catch(resolve);
  })
};


const reset = () => entries.length = 0;

var timetable = {
  register,
  trigger,
  reset,
  entries
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
const realFetch = typeof fetch === 'undefined' ? () => {} : fetch;


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
    this.add = this.add.bind(this);
  }
  add(message, payload) {
    const entry = {};
    entry.message = message;
    if(typeof payload !== 'undefined') entry.payload = payload;
    this.value.push(entry);
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
    
    // simulates given resolution and queues the next until all are simulated
    const simulationLoop = idx => {
      if(idx === normalResolutions.length) {
        resolveSimulation();
      }
      else {
        lib.simualteResolution(normalResolutions[idx], snapshot, timetable)
          .then(() => simulationLoop(idx + 1))
          .catch(rejectSimulation);
      }
    };

    simulationLoop(0);
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
const snapAction = (action, mocks, resolutions, options) => {
  const snapshot = new Snapshot();
  const mockCommit = makeCallSnapper(snapshot, 'COMMIT', mocks.commit);
  const mockDispatch = makeCallSnapper(snapshot, 'DISPATCH', mocks.dispatch);


  const actionReturn = action({
    commit: mockCommit,
    dispatch: mockDispatch,
    state: mocks.state,
    getters: mocks.getters
  }, mocks.payload);


  if(options.snapEnv) {
    snapshot.add('DATA MOCKS', {
      state: mocks.state,
      getters: mocks.getters
    });
    snapshot.add('ACTION CALL', mocks.payload);
  }


  if(typeof actionReturn !== 'undefined' && actionReturn instanceof Promise) {
    // action is async
    return new RealPromise$4((resolve, reject) => {
      actionReturn
        .then(payload => {
          snapshot.add('ACTION RESOLVED', payload);
          resolve(snapshot.value);
        })
        .catch(payload => {
          snapshot.add('ACTION REJECTED', payload);
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

const defaultConfig = {
  autoResolve: false,
  snapEnv: false
};

/**
 * @namespace
 * @property {Boolean} autoResolve resolve all MockPromises and fetches in order they were created
 * @property {Boolean} snapEnv include state, getters and paylaod into snapshot
 */
const config = {};
const resetConfig = () => Object.assign(config, defaultConfig);
resetConfig();

const reset$1 = () => {
  resetConfig();
  timetable.reset();
};

/**
 * @typedef {{name:string, type: ("resolve" | "reject"), payload}} Resolution
 */
/**
 * Takes snapshot of action's evaluation
 * @param {Function} action action to test
 * @param {{state, getters, commit: Function, dispatch: Function, payload}} mocks arguments passed to the action, payload is the second argument
 * @param {[(string | Resolution)]} resolutions
 * @param {Snapshot} snapshot
 * @param {Tiemtable} timetable
 * @returns  {(string | Promise<string>)}
 */
const snapAction$1 = (action, mocks={}, resolutions=[], snapshot, timetable$$1) => {
  console.log(autoResolve);
  if(Array.isArray(mocks)) {
    resolutions = mocks;
    mocks = {};
  }

  const commit = mocks.commit || (() => {});
  const dispatch = mocks.dispatch || (() => {});

  const options = {
    autoResolve: config.autoResolve,
    snapEnv: config.snapEnv,
  };
  
  snapAction(
    action, 
    {
      payload: mocks.payload,
      state: mocks.state,
      getters: mocks.getters,
      commit,
      dispatch
    }, 
    resolutions, 
    options,
  );
};


var index = {
  snapAction: snapAction$1,
  reset: reset$1,

  timetable,
  resetTimetable: timetable.reset,

  config,
  resetConfig,

  mockFetch: mockFetch,
  useMockFetch: useMock$1,
  useRealFetch: useReal$1,

  MockPromise: MockPromise,
  useMockPromise: useMock,
  useRealPromise: useReal,
}

export default index;
