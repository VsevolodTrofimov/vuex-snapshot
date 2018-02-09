import timetable from './timetable'
import {useGlobally} from './utility'


const RealPromise = Promise
const realFetch = window.fetch


/**
 * Creates mock fetch that can be resolved manually and properly serialized 
 * and registers it in timetable
 * @param {string} url 
 * @param {any} init 
 * @returns {Promise}
 */
export const mockFetch = (url, init) => {
  let resolveTrigger
  let rejectTrigger

  const cbProxy = (resolve, reject) => {
    resolveTrigger = resolve
    rejectTrigger = reject
  }

  const simulation = new RealPromise(cbProxy)
  simulation.name = url
  simulation.resolve = resolveTrigger
  simulation.reject = rejectTrigger

  timetable.register({
    name: url,
    promise: simulation,
    payload: init,
    resolve: resolveTrigger,
    reject: rejectTrigger
  })

  return simulation
}


export const useMock = () => useGlobally('fetch', mockFetch)
export const useReal = () => useGlobally('fetch', realFetch)