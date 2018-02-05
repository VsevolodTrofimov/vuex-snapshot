class Snapshot {
  constructor() {
    this.value = []
    this.add = this.add.bind(this)
  }
  add(message, payload) {
    const entry = {}
    entry.message = message
    if(typeof payload !== 'undefined') entry.payload = payload
    this.value.push(entry)
  }
}


export default Snapshot