const mongoose = require('mongoose')
const Schema = mongoose.Schema
const stockschema = new Schema({
  id: {
    type: Number,
    required: true
  },
  revenue_on_month: {
    type: Object, 
    default: false
  }
})

// export as module
module.exports = mongoose.model('revenue', stockschema)
