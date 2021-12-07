const { TOKEN_SECRET, ROOM_EXPIRED_CHECK } = process.env
let multipleHostList = {}
const drawHistory = {}
const chatHistory = {}
const onlineClients = {}
const roomPermission = {}
const Canvas = require('../../model/canvas-model')
const Chat = require('../../model/chat-model')
const WarRoom = require('../../model/war-room-model')
const SocketEventLoad = require('./socket-event')
const jwt = require('jsonwebtoken')

// Functions
async function socketConnection(io) {
  io.use(async (socket, next) => {
    // Only logged in people can send socket event
    const accessToken = socket.handshake.auth.authentication
    const visitorAccess = socket.handshake.auth.visitorAccess
    const type = socket.handshake.auth.type

    switch (type) {
      case 'hot_rooms':
        if (visitorAccess) {
          next()
        }
        break
      case 'war_room':
        // JWT token verification
        try {
          jwt.verify(accessToken, TOKEN_SECRET)
          next()
        } catch (error) {
          console.log(error)
          next(error)
        }
        break
    }
  })

  io.on('connection', async (socket) => {
    socket.on('get all room clients', () => {
      socket.emit('recieve all room clients', onlineClients)
    })

    socket.on('join room', async (roomId, userId, userName, userRole) => {
      socket.join(roomId)

      // Handle clients list
      if (!onlineClients[roomId]) {
        onlineClients[roomId] = {}
        onlineClients[roomId][socket.id] = {}
        onlineClients[roomId][socket.id].userId = userId // add new client id
      } else {
        onlineClients[roomId][socket.id] = {}
        onlineClients[roomId][socket.id].userId = userId // add new client id
      }

      // Default drawing permission initialization
      if (!roomPermission[roomId]) {
        roomPermission[roomId] = {}
        roomPermission[roomId].drawToolTurnOn = false
      }

      // Handle clients
      if (userRole === 'streamer') {
        const warRoomInfo = await WarRoom.getRoomInfo(roomId)

        if (warRoomInfo[0].user_id === userId) {
          // Confirm room host
          if (!onlineClients[roomId].hostId) {
            onlineClients[roomId].hostId = userId
          }

          if (!multipleHostList[roomId]) {
            multipleHostList[roomId] = 1
          } else {
            multipleHostList[roomId] += 1
            if (multipleHostList[roomId] > 1) {
              // Check multiple host
              socket.emit('return host room')
            }
          }
        } else {
          socket.emit('return host room')
        }
      }

      // Drawing event initialization
      SocketEventLoad.drawEventLoad(
        socket,
        drawHistory,
        roomId,
        roomPermission,
        onlineClients[roomId].hostId,
        onlineClients[roomId],
        io
      )

      // Chat room initialization
      SocketEventLoad.chatEventLoad(socket, chatHistory, roomId, userName)

      // Voice chat initialization
      SocketEventLoad.peerjsLoad(
        socket,
        roomId,
        onlineClients[roomId].hostId,
        onlineClients[roomId]
      )

      // host left
      socket.on('host leaving', () => {
        socket.to(roomId).emit('update host leaving')
      })

      socket.on('disconnect', async () => {
        // delete left peer user
        socket
          .to(roomId)
          .emit('user-disconnected', onlineClients[roomId][socket.id].userId)

        // user left notification
        socket.to(roomId).emit('user left msg', `${userName} 離開房間拉`)

        // If host leave, delete host id
        let leaveHostId
        if (
          onlineClients[roomId][socket.id].userId ===
          onlineClients[roomId].hostId
        ) {
          leaveHostId = onlineClients[roomId].hostId
          multipleHostList[roomId] -= 1
        }

        delete onlineClients[roomId][socket.id]

        if (Object.keys(onlineClients[roomId]).length - 1 === 0) {
          //If it's still on people in this room after 1 mins, clear this rooms
          setTimeout(() => {
            if (Object.keys(onlineClients[roomId]).length - 1 === 0) {
              WarRoom.endWarRoom(roomId, leaveHostId)
            }
          }, ROOM_EXPIRED_CHECK)
        }

        // store history data after each user left
        if (Object.keys(drawHistory[roomId]).length) {
          // store drawing history
          await Canvas.insertDrawHistory(cleanDrawHistory(roomId), roomId)
        }
        if (chatHistory[roomId].length) {
          // store chat history
          await Chat.insertChatHistory(cleanChatHistory(roomId), roomId)
        }
      })

      // For Jest test
      socket.emit('join success')
      socket.to(roomId).emit('join success')
    })
  })
}

function cleanDrawHistory(roomId) {
  // arrange drawing history data that it fits mysql column
  const cleanHistory = []

  for (let layerId in drawHistory[roomId]) {
    cleanHistory.push([
      drawHistory[roomId][layerId].userId,
      layerId,
      roomId,
      drawHistory[roomId][layerId].toolType,
      5,
      '#df4b26',
      drawHistory[roomId][layerId].canvasImg || null,
      JSON.stringify(drawHistory[roomId][layerId].location)
    ])
  }

  return cleanHistory
}

function cleanChatHistory(roomId) {
  // arrange chat history data that it fits mysql column
  const cleanHistory = []

  for (let item of chatHistory[roomId]) {
    cleanHistory.push([item[0], roomId, item[2], item[3]])
  }

  return cleanHistory
}

module.exports = socketConnection
