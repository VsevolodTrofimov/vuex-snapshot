class Snapshot {
  constructor() {
    this.value = []
    this.frozen = false
    this.add = this.add.bind(this)
    this.freeze = this.freeze.bind(this)
    this.unfreeze = this.unfreeze.bind(this)
  }

  add(message, payload) {
    if(this.frozen) return
    const entry = {}
    entry.message = message
    if(typeof payload !== 'undefined') entry.payload = payload
    this.value.push(entry)
  }

  freeze() {
    this.frozen = true
  }

  unfreeze() {
    this.frozen = false
  }
}


export default Snapshot