import timetable from './timetable'
import useGlobally from './useGlobally'


const RealPromise = Promise
const realFetch = fetch


/**
 * Creates mock fetch that can be resolved manually and properly serialized 
 * and registers it in timetable
 * @param {string} url 
 * @param {any} init 
 * @returns {Promise}
 */
export const mockFetch = (url, init) => {
  let resovleTrigger
  let rejectTrigger

  const cbProxy = (resolve, reject) => {
    resovleTrigger = resolve
    rejectTrigger = reject
  }

  const simulation = new RealPromise(cbProxy)

  timetable.register({
    name: url,
    payload: init,
    resolve: resovleTrigger,
    reject: rejectTrigger
  })

  return simulation
}


export const useMock = () => useGlobally('fetch', mockFetch)
export const useReal = () => useGlobally('fetch', realFetch)