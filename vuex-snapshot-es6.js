const RealPromise = Promise;


const entries = [];


const makeSuffix = () => {
  const suffix = () => suffix.num > 1 ? '[' + suffix.num.toString() + ']' : '';
  suffix.num = 1;
  suffix.next = () => ++suffix.num;

  return suffix
};


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
  while(entries.filter(e => e.name === name + suffix()).length) suffix.next();

  entry.name = name + suffix();
  entries.push(entry);
};


const trigger = ({name, type, payload}) => {
  const suffix = makeSuffix();
  while(entries.filter(e => e.name === name + suffix() && e.called).length) suffix.next();
  
  const entry = entries.filter(e => e.name === name + suffix())[0];
  
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

var timetable$1 = Object.freeze({
	entries: entries,
	makeSuffix: makeSuffix,
	register: register,
	reset: reset,
	default: timetable
});

const useGlobally = (name, value) => {
  if(typeof window === 'undefined') global[name] = value; // node
  else window[name] = value; // browser
};

const RealPromise$1 = Promise;



class MockPromise extends RealPromise$1 {
  /**
   * Creates a named promise that can be resolved manually and properly serialized 
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

const serialize = JSON.stringify;

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
  if(resolution.name) {
    normalResolution.name = resolution.name;
  } else {
    throw new Error('vuex-snapshot: INPUT ERROR resolution must have a name')
  }

  if(resolution.type && ['resolve', 'reject'].indexOf(resolution.type) !== -1) {
    normalResolution.type = resolution.type;
  } else {
    throw new Error('vuex-snapshot: INPUT ERROR resolution type must be' 
                    + 'either "resovle" or "reject"')
  }

  if(resolution.payload) {
    normalResolution.payload = resolution.payload;
  }

  return normalResolution
};


const simualteResolution = (resolution, snapCb, timetable) => {
  snapCb(`RESOLUTION: ${resolution.name} -> ${resolution.type}`, resolution.payload);
  return timetable.trigger(resolution)
};


const simualteResolutions = (resolutions, snapCb, timetable) => {
  return new RealPromise$3((resolveSimulation, rejectSimulation) => {
    const normalResolutions = resolutions.map(normalizeResolution);
    
    // simulates given resolution and queues the next until all are simulated
    const simulationLoop = idx => {
      if(idx === normalResolutions.length) {
        resolveSimulation();
      }
      else {
        simualteResolution(normalResolutions[idx], snapCb, timetable)
          .then(() => simulationLoop(idx + 1))
          .catch(rejectSimulation);
      }
    };

    simulationLoop(0);
  })
};

const RealPromise$4 = Promise;


class Snapshot {
  constructor() {
    this.value = '';
    this.add = this.add.bind(this);
  }
  add(message, payload) {
    this.value += message; 
    if(typeof payload !== 'undefined') this.value += '\n' + serialize(payload);
    this.value += '\n---\n';
  }
}


const makeCallSnapper = (snapshot, type) => (name, payload) => {
  snapshot.add(`${type}: ${name}`, payload);
};

/**
 * @typedef {{name:string, type: ("resolve" | "reject"), payload}} Resolution
 */
/**
 * Takes snapshot of action's evaluation
 * @param {Function} action action to test
 * @param {{state, getters, payload}} mocks what should be in the store when action runs & action argument
 * @param {[(string | Resolution)]} resolutions
 * @returns  {(string | Promise<string>)}
 */
const snapAction = (action, mocks={}, resolutions=[]) => {
  // for 2 arg call (action, resolutions)
  if(Array.isArray(mocks)) {
    resolutions = mocks;
    mocks = {};
  }

  const snapshot = new Snapshot();
  const mockCommit = makeCallSnapper(snapshot, 'COMMIT');
  const mockDispatch = makeCallSnapper(snapshot, 'DISPATCH');


  const actionReturn = action({
    commit: mockCommit,
    dispatch: mockDispatch,
    state: mocks.state,
    getters: mocks.getters
  }, mocks.payload);


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
      
      simualteResolutions(resolutions, snapshot.add, timetable)
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
            snapshot
          });
        });

    })
  } else {
    // action is sync
    return snapshot.value
  }
};

/**
 * Serializes your state the fancy way 
 * (including functions and mock promises)
 * @param {*} state 
 */
const snapState = state => serialize(state);

var index = {
  snapAction,
  snapState,

  timetable: timetable$1,
  resetTimetable: reset,

  mockFetch: mockFetch,
  useMockFetch: useMock$1,
  useRealFetch: useReal$1,

  MockPromise: MockPromise,
  useMockPromise: useMock,
  useRealPromise: useReal,
}

export default index;
