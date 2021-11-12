const drawHistory = {}
const chatHistory = {}
const onlineClients = {}
let clientList
const Canvas = require('../../model/canvas-model')
const Chat = require('../../model/chat-model')
const WarRoom = require('../../model/war-room-model')
const moment = require('moment')
let drawToolTurnOn = false

async function socketController(io) {
  io.on('connection', mainSocketController)

  async function mainSocketController(socket) {
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

      // Handle clients
      if (userRole === 'streamer') {
        onlineClients[roomId].hostId = userId
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
        const layerIds = Object.keys(drawHistory[roomId])

        // define the last id, which is the last element
        let topLayerId = layerIds.length
          ? Number(layerIds[layerIds.length - 1])
          : 0
        initDrawInfo.drawLayerCounter = !layerIds.length ? 0 : topLayerId + 1
        drawHistory[roomId][initDrawInfo.drawLayerCounter] = initDrawInfo

        socket.emit(
          'update my draw',
          initDrawInfo.drawLayerCounter,
          drawHistory[roomId]
        )
        // socket.broadcast.emit('get latest id', initDrawInfo.drawLayerCounter)
        console.log('draw history', layerIds)
        console.log(initDrawInfo.drawLayerCounter)
        // send drawing loction to others
        // socket
        //   .to(roomId)
        //   .emit(
        //     'update start draw',
        //     initDrawInfo.drawLayerCounter,
        //     drawHistory[roomId]
        //   )
      })

      socket.on('delete all', () => {
        drawHistory[roomId] = {}
        io.to(roomId).emit('update delete all')
      })

      socket.on('init draw tool', () => {
        socket.emit('update init draw tool', drawToolTurnOn)
      })

      socket.on('turn on draw', () => {
        drawToolTurnOn = true
        socket.to(roomId).emit('update turn on draw')
      })

      socket.on('turn off draw', () => {
        drawToolTurnOn = false
        socket.to(roomId).emit('update turn off draw')
      })

      socket.on('add image', (canvasInfo) => {
        // defining last incoming id
        const layerIds = Object.keys(drawHistory[roomId])

        // define the last id, which is the last element
        let topLayerId = layerIds.length
          ? Number(layerIds[layerIds.length - 1])
          : 0
        canvasInfo.drawLayerCounter = !layerIds.length ? 0 : topLayerId + 1
        drawHistory[roomId][canvasInfo.drawLayerCounter] = canvasInfo
        console.log('image history', layerIds)
        console.log('image zindex', canvasInfo.drawLayerCounter)
        socket
          .to(roomId)
          .emit(
            'update add image',
            canvasInfo.drawLayerCounter,
            canvasInfo.canvasImg,
            canvasInfo.location
          )

        socket.emit(
          'update my image',
          canvasInfo.drawLayerCounter,
          canvasInfo.canvasImg,
          canvasInfo.location
        )
      })

      // socket.on('drawing', (localLayerId, location) => {
      //   drawHistory[roomId][localLayerId].location =
      //     drawHistory[roomId][localLayerId].location.concat(location)
      //   // console.log(drawHistory)
      //   socket.to(roomId).emit('update drawing', localLayerId, location)

      //   // clean additional location of line layer
      //   const thisLocation = drawHistory[roomId][localLayerId].location
      //   if (drawHistory[roomId][localLayerId].toolType === 'line') {
      //     drawHistory[roomId][localLayerId].location = [
      //       thisLocation[0],
      //       thisLocation[1],
      //       thisLocation[thisLocation.length - 2],
      //       thisLocation[thisLocation.length - 1]
      //     ]
      //   }

      //   // console.log(drawHistory[roomId]);
      //   // console.log(drawHistory)
      // })

      // socket.on('update drawing', (curSelectShape) => {
      //   console.log(JSON.parse(curSelectShape).attrs)
      // })

      socket.on('finish layer', (localLayerObject) => {
        const curLayerObj = JSON.parse(localLayerObject)
        drawHistory[roomId][curLayerObj.attrs.id].location =
          curLayerObj.attrs.points
        // console.log(drawHistory)
        socket
          .to(roomId)
          .emit(
            'update finish layer',
            drawHistory[roomId][curLayerObj.attrs.id]
          )
      })

      socket.on('delete drawing', (drawingId) => {
        console.log('drawingId', drawingId)
        delete drawHistory[roomId][drawingId]
        console.log('delete drawing', Object.keys(drawHistory[roomId]))

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

      // Send enter notification to everyone
      socket.emit('send my msg', `${userName} 加入研究室囉`, userName, true)
      socket
        .to(roomId)
        .emit('sendback', `${userName} 加入研究室囉`, userName, true)

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

        socket.to(roomId).emit('sendback', msg, name, false)
        // send my msg
        socket.emit('send my msg', msg, name, false)
      })

      // peerjs
      socket.on('start calling', (userId) => {
        console.log('Peer user: ', userId)
        socket.to(roomId).emit('user-connected', userId)

        socket.on('ready', () => {
          socket.to(roomId).emit('user-connected', userId)
        })

        /* mute person specifically */
        // socket.on('ban audio', (banUserId) => {
        //   socket.to(roomId).emit('update ban audio', banUserId)
        // })

        socket.on('mute all', async () => {
          try {
            console.log('mute all')
            await WarRoom.updateRoomRights(roomId, undefined, false)
            io.to(roomId).emit('update mute all')
          } catch (error) {
            return
          }
        })

        socket.on('unmute all', async () => {
          try {
            console.log('unmute all')
            await WarRoom.updateRoomRights(roomId, undefined, true)
            io.to(roomId).emit('update unmute all')
          } catch (error) {
            return
          }
        })
      })

      // host left
      socket.on('host leaving', () => {
        socket.to(roomId).emit('update host leaving')
      })

      socket.on('disconnect', async () => {
        console.log(
          `${
            onlineClients[roomId][socket.id].userId
          } left this room(${roomId})!`
        )

        // delete left peer user
        socket
          .to(roomId)
          .emit('user-disconnected', onlineClients[roomId][socket.id].userId)

        // user left notification
        socket.to(roomId).emit('user left msg', `${userName} 離開房間拉`)

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
