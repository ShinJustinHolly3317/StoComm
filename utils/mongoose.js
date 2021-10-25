/* Include mongoose */
const mongoose = require('mongoose') // include mongoose library
const MONGO_DB = process.env.MONGO_DB || 'mongodb://localhost/stockComm'
mongoose.connect(MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true }) // connect to MongoDB

/* aquire the status of mongoDB connection */
const db = mongoose.connection
// connection error
db.on('error', () => {
  console.log('MongoDB error!')
})
// connected
db.once('open', () => {
  console.log('MongoDB connected')
})

module.exports = db
