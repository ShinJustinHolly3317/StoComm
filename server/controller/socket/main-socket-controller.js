const drawHistory = {}
const chatHistory = {}
const onlineClients = {}
let clientList
const Canvas = require('../../model/canvas-model')
const Chat = require('../../model/chat-model')
const moment = require('moment')

async function socketController(io) {
  io.on('connection', mainSocketController)

  async function mainSocketController(socket) {
    socket.on('get all room clients', () => {
      socket.emit('recieve all room clients', onlineClients)
    })

    socket.on('join room', async (roomId, userId) => {
      socket.join(roomId)

      if (!onlineClients[roomId]) {
        onlineClients[roomId] = {}
        onlineClients[roomId][socket.id] = {}
        onlineClients[roomId][socket.id].socketConn = true // add new client id
      } else {
        onlineClients[roomId][socket.id] = {}
        onlineClients[roomId][socket.id].socketConn = true // add new client id
      }

      // drawing canvas
      if (!drawHistory[roomId]) {
        // initialize draw history
        drawHistory[roomId] = {}
        const drawResult = await Canvas.getDrawHistory(roomId)
        if (drawResult.length) {
          for (let item of drawResult) {
            drawHistory[roomId][item.draw_id] = {
              userId: item.user_id,
              drawLayerCounter: item.draw_id,
              location: item.locations,
              toolType: item.tool,
              canvasImg: item.url
            }
          }
        }
      }
      // init load
      socket.emit('init load data', drawHistory[roomId])

      // get all users id in this room
      const sockets = await io.in(roomId).fetchSockets()
      clientList = sockets.map((item) => {
        return item.id
      })
      console.log(`room clients ${clientList}`)

      console.log(`user: ${socket.id} connected to this room ${roomId}`)

      // recieve real time draw history
      socket.on('start draw', (initDrawInfo) => {
        // defining last incoming id
        let topLayerId = Object.keys(drawHistory[roomId]).length - 1
        initDrawInfo.drawLayerCounter = topLayerId + 1
        drawHistory[roomId][initDrawInfo.drawLayerCounter] = initDrawInfo
        socket.emit(
          'update my draw',
          initDrawInfo.drawLayerCounter,
          drawHistory[roomId]
        )
        // socket.broadcast.emit('get latest id', initDrawInfo.drawLayerCounter)
        console.log(initDrawInfo.drawLayerCounter)
        // send drawing loction to others
        socket
          .to(roomId)
          .emit(
            'update start draw',
            initDrawInfo.drawLayerCounter,
            drawHistory[roomId]
          )
      })

      socket.on('add image', (cavasInfo) => {
        let topLayerId = Object.keys(drawHistory[roomId]).length
        drawHistory[roomId][topLayerId] = cavasInfo

        socket
          .to(roomId)
          .emit(
            'update add image',
            topLayerId,
            cavasInfo.canvasImg,
            cavasInfo.location
          )

        socket.emit(
          'update my image',
          topLayerId,
          cavasInfo.canvasImg,
          cavasInfo.location
        )
      })

      socket.on('drawing', (localLayerId, location) => {
        drawHistory[roomId][localLayerId].location =
          drawHistory[roomId][localLayerId].location.concat(location)
        // console.log(drawHistory)
        socket.to(roomId).emit('update drawing', localLayerId, location)

        // clean additional location of line layer
        const thisLocation = drawHistory[roomId][localLayerId].location
        if (drawHistory[roomId][localLayerId].toolType === 'line') {
          drawHistory[roomId][localLayerId].location = [
            thisLocation[0],
            thisLocation[1],
            thisLocation[thisLocation.length - 2],
            thisLocation[thisLocation.length - 1]
          ]
        }

        // console.log(drawHistory[roomId]);
        // console.log(drawHistory)
      })

      // socket.on('update drawing', (curSelectShape) => {
      //   console.log(JSON.parse(curSelectShape).attrs)
      // })

      socket.on('delete drawing', (drawingId) => {
        console.log('drawingId', drawingId)
        delete drawHistory[roomId][drawingId]
        console.log(Object.keys(drawHistory[roomId]))

        socket.to(roomId).emit('update delete drawing', drawingId)
      })

      socket.on('undo', (commandLayer) => {
        let topLayerId = commandLayer.drawObj.drawLayerCounter
        let commandType = commandLayer.command
        console.log('undo topLayerId', topLayerId)
        console.log('undo commandType', commandType)
        if (commandType === 'create') {
          delete drawHistory[roomId][topLayerId]
        } else {
          drawHistory[roomId][topLayerId] = commandLayer.drawObj
        }

        socket.to(roomId).emit('update undo', commandLayer)
      })

      socket.on('redo', (commandLayer) => {
        let topLayerId = commandLayer.drawObj.drawLayerCounter
        let commandType = commandLayer.command
        console.log('redo topLayerId', topLayerId)
        console.log('redo commandType', commandType)
        if (commandType === 'delete') {
          delete drawHistory[roomId][topLayerId]
        } else {
          drawHistory[roomId][topLayerId] = commandLayer.drawObj
        }

        socket.to(roomId).emit('update redo', commandLayer)
      })

      // Chat room
      if (!chatHistory[roomId]) {
        // initialization
        chatHistory[roomId] = []

        const chatResult = await Chat.getChatHistory(roomId)
        if (chatResult.length) {
          for (let item of chatResult) {
            // console.log(item)
            chatHistory[roomId].push([
              item.user_id,
              item.user_name,
              item.content,
              item.chat_time
            ])
          }
        }
      }
      socket.emit('all messages', chatHistory[roomId])

      // socket.on('get all messages', () => {
      //   console.log('sending all messages', chatHistory[roomId])
      //   socket.emit('all messages', chatHistory[roomId])
      // })

      socket.on('chat message', (msg, name, id) => {
        console.log('message: ' + msg, name)

        // store chat history
        chatHistory[roomId].push([
          id,
          name,
          msg,
          moment().format('YYYY-MM-DD hh:mm:ss')
        ])

        socket.to(roomId).emit('sendback', msg, name)
        // send my msg
        socket.emit('send my msg', msg, name)
      })

      // peerjs
      socket.on('start calling', (userId) => {
        console.log('Peer user: ', userId)
        // socket.to(roomId).emit('user-connected', userId)
        socket.on('ready', (hostId) => {
          if(!hostId) return
          onlineClients[roomId].host = hostId
          socket.emit('myself-connected', onlineClients[roomId].host)
          socket.to(roomId).emit('user-connected', userId)
        })

        socket.on('ban audio', (banUserId) => {
          socket.to(roomId).emit('update ban audio', banUserId)
        })

        onlineClients[roomId][socket.id].peerId = userId
      })

      socket.on('disconnect', async () => {
        console.log(
          `${
            onlineClients[roomId][socket.id].peerId
          } left this room(${roomId})!`
        )
        socket
          .to(roomId)
          .emit('user-disconnected', onlineClients[roomId][socket.id].peerId)
        console.log('going to delete', onlineClients[roomId][socket.id])
        delete onlineClients[roomId][socket.id]

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
    })
  }
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

module.exports = socketController
