/**
 * @namespace 
 * @property {Boolean} autoResolve resolve all MockPromises and fetches in order they were created
 * @property {Boolean} snapEnv include state, getters and paylaod into snapshot
 */
const options = {
  autoResolve: false,
  snapEnv: false
}

// they are likely to stay flat
const defaults = Object.assign({}, options)
const reset = () => Object.assign(options, defaults)
reset()

export default {
  options,
  reset
}