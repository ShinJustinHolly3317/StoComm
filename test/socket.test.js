require('dotenv').config()
const { createServer } = require('http')
const { Server } = require('socket.io')
const Client = require('socket.io-client')
const WarRoom = require('../server/model/war-room-model')
const db = require('../server/model/config/mysqlConnection')
const roomClients = {}

describe('test drawing permissino socket event', () => {
  let io, serverSocket, clientSocket, httpServer
  let hostId = 1

  beforeAll((done) => {
    httpServer = createServer()
    io = new Server(httpServer)
    httpServer.listen(() => {
      const port = httpServer.address().port
      clientSocket = new Client(`http://localhost:${port}`)
      io.on('connection', (socket) => {
        serverSocket = socket
        roomClients[socket.id] = {}
        roomClients[socket.id].userId = hostId
      })
      clientSocket.on('connect', done)
    })
  })

  afterAll(async () => {
    io.close()
    clientSocket.close()
    httpServer.close()
    await db.end()
  })

  test('DB should change draw permission', (done) => {
    clientSocket.on('turn on draw', async () => {
      if (roomClients[clientSocket.id].userId !== hostId) {
        return
      }
      await WarRoom.updateRoomRights(1, true, undefined)
      const [result] = await db.query('SELECT * FROM war_room')
      
      // check if turn on draw permission or not
      expect(result[0].open_draw).toBe(1)
      done()
    })
    serverSocket.emit('turn on draw')
  })
})
