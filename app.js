// server init
require('dotenv').config()
const port = process.env.MODE === 'dev' ? 3000 : process.env.PORT
const express = require('express')
const app = express()
const cors = require('cors')

// body parser
app.use(express.urlencoded({ extended: false, limit: '50mb' }))
app.use(express.json({ extended: false, limit: '50mb' }))

// CORS allow all
app.use(cors())

// view engine
const exphdb = require('express-handlebars')
app.engine('hbs', exphdb({ defaultLayout: 'main', extname: '.hbs' }))
app.set('view engine', 'hbs')

// static files
app.use(express.static('public'))

// socket
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
const { ExpressPeerServer } = require('peer')

// start peerjs server except in test mode
if (process.env.MODE !== 'test') {
  const peerServer = ExpressPeerServer(server, {
    proxied: true,
    debug: true
  })
  app.use('/peerjs', peerServer)
}

// use Routes
const routes = require('./server/routes')
app.use(routes)

// handle draw history
const socketConnection = require('./server/controller/socket/socket-connection')
socketConnection(io)

// Page not found
app.use(function (req, res, next) {
  res.status(404).render('404', { style: '404.css' })
})

// Error handling
app.use(function (err, req, res, next) {
  const { status, error } = err
  console.log('Error Handler:', error)
  if (status && error) {
    res.status(status).send({ error })
  } else {
    res.status(500).send({ error: 'Server Error' })
  }
})

server.listen(port, () => {
  console.log(`This server is running on http://localhost:${port}`)
})

// https
const https = require('https')

const fs = require('fs')
const sslServer = https.createServer(
  {
    key: fs.readFileSync('./.cert/localhost-key.pem'),
    cert: fs.readFileSync('./.cert/localhost.pem')
  },
  app
)

sslServer.listen(4000, () => {
  console.log(`This server is running on https://localhost:4000`)
})

module.exports = { server }
