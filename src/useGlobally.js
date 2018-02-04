const useGlobally = (name, value) => {
  window[name] = value
}

export default useGlobally