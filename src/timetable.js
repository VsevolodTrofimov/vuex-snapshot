import {makeSuffix, find} from './utility'


const RealPromise = Promise
export const entries = []


export const register = ({name, promise, payload, resolve, reject}) => {
  const entry = {
    payload,
    promise,
    resolve,
    reject,
    called: false
  }

  // make sure name is unique
  const suffix = makeSuffix()
  while(find(entries, e => e.name === name + suffix())) suffix.next()

  entry.name = name + suffix()

  entries.push(entry)
}


export const trigger = ({name, type, payload}) => {
  const suffix = makeSuffix()
  while(find(entries, e => e.name === name + suffix() && e.called)) suffix.next()
  
  const entry = find(entries, e => e.name === name + suffix())
  
  return new RealPromise((resolve, reject) => {
    if(typeof entry === 'undefined') {
      reject(new Error(`vuex-snapshot: did not find ${name + suffix()} that wasn't already resolved or rejected`))
    }
  
    entry[type](payload)
    entry.called = true
    entry.promise
      .then(resolve)
      .catch(resolve)
  })
}


export const ensureAbsence = (promise) => {
  for(let i = 0; i < entries.length; ++i) {
    if(entries[i].promise === promise) {
      entries.splice(i, 1)
    }
  }
}

export const reset = () => entries.length = 0

export default {
  register,
  trigger,
  reset,
  entries,
  ensureAbsence,
}