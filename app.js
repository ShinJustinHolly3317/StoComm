require('dotenv').config()
const port = process.env.MODE === 'dev' ? 3000 : process.env.PORT

const express = require('express')
const app = express()

// body parser
app.use(express.urlencoded({ extended: false }))
app.use(express.json({ extended: false }))

// socket
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
const { ExpressPeerServer } = require('peer')
let drawHistory = []

app.use(express.static('public'))
app.use(
  '/socket',
  express.static(__dirname + '/node_modules/socket.io/client-dist/socket.io.js')
)

const routes = require('./server/routes')
app.use(routes)

app.get('/', (req, res) => {
  res.redirect('/home.html')
})

// handle draw history
io.on('connection', (socket) => {
  console.log(`user: ${socket.id} connected`)
  socket.on('send_draw_history', (drawHistory) => {
    socket.broadcast.emit('take_draw_history', drawHistory)
  })

  socket.on('chat message', (msg) => {
    console.log('message: ' + msg)

    socket.broadcast.emit('sendback', msg)
    // send my msg
    socket.emit('send my msg', msg)
  })

  // peerjs
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    console.log('user: ', userId)
    socket.broadcast.to(roomId).emit('user-connected', userId)

    // for local test
    // socket.on('ready', () => {
    //   socket.broadcast.to(roomId).emit('user-connected', userId)
    // })

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  })
})

const peerServer = ExpressPeerServer(server, {
  debug: true
})
app.use('/', peerServer)

server.listen(port, () => {
  console.log(`This server is running on http://localhost:${port}`)
})
