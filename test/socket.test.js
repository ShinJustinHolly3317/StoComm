require('dotenv').config()
const redisClient = require('../utils/cache')
const socketServer = require('../app').server
const Client = require('socket.io-client')
const db = require('../server/model/config/mysqlConnection')
const port = 3001
const socketURL = `http://localhost:${port}`

// Start server for testing
socketServer.listen(port, function () {
  console.log(`start test server at port ${port}`)
})

describe('test drawing permission socket event', () => {
  let clientSocket1, clientSocket2
  let client1Connected = false
  let client2Connected = false

  beforeAll((done) => {
    const hostOptions = {
      transports: ['websocket'],
      'force new connection': true,
      auth: {
        visitorAccess: true,
        type: 'hot_rooms'
      }
    }
    const clientOptions = {
      transports: ['websocket'],
      'force new connection': true,
      auth: {
        visitorAccess: true,
        type: 'hot_rooms'
      }
    }

    clientSocket1 = Client.connect(socketURL, hostOptions)
    clientSocket2 = Client.connect(socketURL, clientOptions)

    clientSocket1.on('connect', () => {
      client1Connected = true
      if (client2Connected) {
        done()
      }
    })
    clientSocket2.on('connect', () => {
      client2Connected = true
      if (client1Connected) {
        done()
      }
    })
  })

  afterAll(async () => {
    clientSocket1.close()
    clientSocket2.close()
    socketServer.close()
    redisClient.quit()
    await db.end()
  })

  test('DB should change draw permission', (done) => {
    clientSocket2.on('update turn on draw', async () => {
      const [result] = await db.query('SELECT * FROM war_room')
      const openDrawResult = result[0].open_draw

      // check if turn on draw permission or not
      expect(openDrawResult).toBe(1)
      done()
    })
    clientSocket1.emit('join room', 1, 1, 'client1', 'streamer')
    clientSocket2.emit('join room', 1, 2, 'client2', 'visitor')
    setTimeout(() => {
      clientSocket2.emit('turn on draw')
      clientSocket1.emit('turn on draw')
    }, 1000)
  })
})
