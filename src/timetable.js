const RealPromise = Promise


export const entries = []


export const makeSuffix = () => {
  const suffix = () => suffix.num > 1 ? '[' + suffix.num.toString() + ']' : ''
  suffix.num = 1
  suffix.next = () => ++suffix.num

  return suffix
}


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
  while(entries.filter(e => e.name === name + suffix()).length) suffix.next()

  entry.name = name + suffix()
  entries.push(entry)
}


const trigger = ({name, type, payload}) => {
  const suffix = makeSuffix()
  while(entries.filter(e => e.name === name + suffix() && e.called).length) suffix.next()
  
  const entry = entries.filter(e => e.name === name + suffix())[0]
  
  return new RealPromise((resolve, reject) => {
    if(typeof entry === 'undefined') {
      reject(new Error(`vuex-snapshot: did not found promise ${name + suffix()}`))
    }
  
    entry[type](payload)
    entry.called = true
    entry.promise
      .then(resolve)
      .catch(resolve)
  })
}


export const reset = () => entries.length = 0

export default {
  register,
  trigger,
  reset,
  entries
}