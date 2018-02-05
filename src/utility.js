export const find = (arr, matchFn) => {
  for(let i = 0; i < arr.length; ++i) {
    if(matchFn(arr[i])) return arr[i]
  }
}


export const useGlobally = (name, value) => {
  window[name] = value
}


export const makeSuffix = () => {
  const suffix = () => suffix.num > 1 ? '[' + suffix.num.toString() + ']' : ''
  suffix.num = 1
  suffix.next = () => ++suffix.num

  return suffix
}