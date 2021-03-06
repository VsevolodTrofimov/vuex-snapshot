import timetable from './timetable'
import {useGlobally} from './utility'


const RealPromise = Promise


export class MockPromise extends RealPromise {
  /**
   * Named promise that can be resolved manually and properly serialized 
   * and registers it in timetable
   * @param {Function} cb 
   * @param {string} name
   */
  constructor(cb, name='Promise') {
    let resolveTrigger
    let rejectTrigger

    // name-only construction
    if(typeof cb === 'string') {
      name = cb
      cb = () => {}
    }

    const cbProxy = (resolve, reject) => {
      resolveTrigger = resolve
      rejectTrigger = reject
      cb(resolve, reject)
    }

    super(cbProxy)

    this.name = name
    this.resolve = resolveTrigger
    this.reject = rejectTrigger

    timetable.register({
      name,
      promise: this,
      payload: cb,
      resolve: resolveTrigger,
      reject: rejectTrigger
    })
  }
}


export const useMock = () => useGlobally('Promise', MockPromise)
export const useReal = () => useGlobally('Promise', RealPromise)