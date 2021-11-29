require('dotenv').config()
const { createServer } = require('http')
const { Server } = require('socket.io')
const Client = require('socket.io-client')
const WarRoom = require('../server/model/war-room-model')
const db = require('../server/model/config/mysqlConnection')
const e = require('express')
const roomClients = {}

describe('test drawing permission socket event', () => {
  let io, serverSocket1, serverSocket2, clientSocket1, clientSocket2, httpServer
  let hostId = 1 // Default host ID
  let clientId = 2 // Default client ID

  beforeAll((done) => {
    httpServer = createServer()
    io = new Server(httpServer)
    httpServer.listen(() => {
      const port = httpServer.address().port
      io.on('connection', (socket) => {
        if (serverSocket1) {
          serverSocket2 = socket
        } else {
          serverSocket1 = socket

          // Client 2 connect to server after client 1 connected
          clientSocket2 = new Client(`http://localhost:${port}`, {
            'force new connection': true
          })
          clientSocket2.on('connect', done)
        }

        if (Object.keys(roomClients).length) {
          roomClients[socket.id] = {}
          roomClients[socket.id].userId = clientId
        } else {
          roomClients[socket.id] = {}
          roomClients[socket.id].userId = hostId
        }
      })
      clientSocket1 = new Client(`http://localhost:${port}`, {
        'force new connection': true
      })

      clientSocket1.on('connect', done)
    })
  })

  afterAll(async () => {
    io.close()
    clientSocket1.close()
    clientSocket2.close()
    httpServer.close()
    await db.end()
  })

  test('DB should change draw permission', (done) => {
    serverSocket1.on('turn on draw', async () => {
      let openDrawResult1
      if (roomClients[serverSocket1.id].userId === hostId) {
        await WarRoom.updateRoomRights(1, true, undefined)
        const [result] = await db.query('SELECT * FROM war_room')
        openDrawResult1 = result[0].open_draw
      }

      // check if turn on draw permission or not
      expect(openDrawResult1).toBe(1)
      done()
    })
    clientSocket1.emit('turn on draw')
  })

  test('DB should NOT change draw permission', (done) => {
    serverSocket2.on('turn on draw', async () => {
      let openDrawResult2
      if (roomClients[serverSocket2.id].userId === hostId) {
        await WarRoom.updateRoomRights(1, true, undefined)
        const [result] = await db.query('SELECT * FROM war_room')
        openDrawResult2 = result[0].open_draw
      }

      // check if turn on draw permission or not
      expect(openDrawResult2).not.toBe(1)
      done()
    })
    clientSocket2.emit('turn on draw')
  })
})
