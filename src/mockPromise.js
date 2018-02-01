import timetable from './timetable'
import useGlobally from './useGlobally'


const RealPromise = Promise



export class MockPromise extends RealPromise {
  /**
   * Creates a named promise that can be resolved manually and properly serialized 
   * and registers it in timetable
   * @param {Function} cb 
   * @param {string} name
   */
  constructor(cb, name='Promise') {
    let resovleTrigger
    let rejectTrigger

    // name-only construction
    if(typeof cb === 'string') {
      name = cb
      cb = () => {}
    }

    const cbProxy = (resolve, reject) => {
      resovleTrigger = resolve
      rejectTrigger = reject
      cb(resolve, reject)
    }

    super(cbProxy)

    timetable.register({
      name,
      payload: cb,
      resolve: resovleTrigger,
      reject: rejectTrigger
    })
  }
}


export const useMock = () => useGlobally('Promise', MockPromise)
export const useReal = () => useGlobally('Promise', RealPromise)