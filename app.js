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
app.use(cors());

// view engine
const exphdb = require('express-handlebars')
app.engine('hbs', exphdb({ defaultLayout: 'main', extname: '.hbs' }))
app.set('view engine', 'hbs')

// static files
app.use(express.static('public'))
app.use('/frontend', express.static(__dirname + '/node_modules'))
app.use(
  '/peerjsmod',
  express.static(__dirname + '/node_modules/peerjs/dist/peerjs.min.js')
)

// socket
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
const { ExpressPeerServer } = require('peer')

// start peerjs server
const peerServer = ExpressPeerServer(server, {
  proxied: true,
  debug: true
})
app.use('/peerjs', peerServer)

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

server.listen(port, () => {
  console.log(`This server is running on http://localhost:${port}`)
})
