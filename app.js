// server init
require('dotenv').config()
const port = process.env.MODE === 'dev' ? 3000 : process.env.PORT
const express = require('express')
const app = express()
const cors = require('cors')

// body parser
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// CORS allow all
app.use(cors());

// view engine
const exphdb = require('express-handlebars')
app.engine('hbs', exphdb({ defaultLayout: 'main', extname: '.hbs' }))
app.set('view engine', 'hbs')

// static files
app.use(express.static('public'))
app.use(
  '/socket',
  express.static(__dirname + '/node_modules/socket.io/client-dist/socket.io.js')
)

// socket
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
const { ExpressPeerServer } = require('peer')

// start peerjs server
const peerServer = ExpressPeerServer(server, {
  debug: true
})
app.use('/peerjs', peerServer)

// use Routes
const routes = require('./server/routes')
app.use(routes)

// handle draw history
const socketListener = require('./server/controller/socket/main-socket-controller')
socketListener(io)

server.listen(port, () => {
  console.log(`This server is running on http://localhost:${port}`)
})
