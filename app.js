require('dotenv').config()
const port = process.env.MODE === 'dev' ? 3000 : process.env.PORT

const express = require('express')
const app = express()

// socket
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
let drawHistory = []

app.use(express.static('public'))
app.use('/socket', express.static(__dirname + '/node_modules/socket.io/client-dist/socket.io.js'))

const routes = require('./server/routes')
app.use(routes)

app.get('/', (req, res) => {
  res.send('test ok')
})

// handle draw history
io.on('connection', (socket) => {
  console.log(`user: ${socket.id} connected`)
  socket.on('send_draw_history', (msg) => {
    console.log(msg.length)
    drawHistory = msg
    socket.broadcast.emit('take_draw_history', drawHistory)
  })

  socket.on('chat message', (msg) => {
    console.log('message: ' + msg)

    socket.emit('sendback', msg)
  })
})

server.listen(port, () => {
  console.log(`This server is running on http://localhost:${port}`)
})


