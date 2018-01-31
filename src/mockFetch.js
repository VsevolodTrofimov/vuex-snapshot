import timetable from './timetable'
import useGlobally from './useGlobally'


const RealPromise = Promise
const realFetch = fetch


// So we can resolve them manually and serialize them
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