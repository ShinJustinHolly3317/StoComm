const mongoose = require('mongoose')
const Schema = mongoose.Schema
const stockschema = new Schema({
  id: {
    type: Number,
    required: true
  },
  gross_on_quarter: {
    type: Object, // true or false
    default: false
  }
})

// export as module
module.exports = mongoose.model('stoComm', stockschema)
