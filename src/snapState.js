import serialize from './serialize'


/**
 * Serializes your state the fancy way 
 * (including functions and mock promises)
 * @param {*} state 
 */
export const snapState = state => serialize(state)
export default snapState