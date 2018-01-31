export const useGlobally = (name, value) => {
  if(typeof window === 'undefined') global[name] = value // node
  else window[name] = value // browser
}