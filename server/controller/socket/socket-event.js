const Chat = require('../../model/chat-model')
const Canvas = require('../../model/canvas-model')
const WarRoom = require('../../model/war-room-model')
const moment = require('moment')

/**
 * Initialization of chat socket event
 */
async function chatEventLoad(socket, chatHistory, roomId, userName) {
  // Chat room
  if (!chatHistory[roomId]) {
    // initialization
    chatHistory[roomId] = []

    const chatResult = await Chat.getChatHistory(roomId)
    if (chatResult.length) {
      for (let item of chatResult) {
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
  socket.to(roomId).emit('sendback', `${userName} 加入研究室囉`, userName, true)

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
}

/**
 * Initialization of drawing socket event
 */
async function drawEventLoad(socket, drawHistory, roomId, roomPermission, hostId) {
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

  // recieve real time draw history
  socket.on('start draw', (initDrawInfo) => {
    // defining last incoming id
    const layerIds = Object.keys(drawHistory[roomId])

    // define the last id, which is the last element
    let topLayerId = layerIds.length ? Number(layerIds[layerIds.length - 1]) : 0
    initDrawInfo.drawLayerCounter = !layerIds.length ? 0 : topLayerId + 1
    drawHistory[roomId][initDrawInfo.drawLayerCounter] = initDrawInfo

    socket.emit(
      'update my draw',
      initDrawInfo.drawLayerCounter,
      drawHistory[roomId]
    )
    console.log('draw history', layerIds)
    console.log(initDrawInfo.drawLayerCounter)
  })

  socket.on('delete all', (userId) => {
    console.log(roomPermission)
    // check if draw permission is turned on
    if (!roomPermission[roomId].drawToolTurnOn && userId !== hostId) {
      return
    }

    drawHistory[roomId] = {}
    socket.emit('update delete all')
    socket.to(roomId).emit('update delete all')
  })

  socket.on('init draw tool', () => {
    socket.emit('update init draw tool', roomPermission[roomId].drawToolTurnOn)
  })

  socket.on('turn on draw', () => {
    roomPermission[roomId].drawToolTurnOn = true
    socket.to(roomId).emit('update turn on draw')
  })

  socket.on('turn off draw', () => {
    roomPermission[roomId].drawToolTurnOn = false
    socket.to(roomId).emit('update turn off draw')
  })

  socket.on('add image', (canvasInfo) => {
    // defining last incoming id
    const layerIds = Object.keys(drawHistory[roomId])

    // define the last id, which is the last element
    let topLayerId = layerIds.length ? Number(layerIds[layerIds.length - 1]) : 0
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

  socket.on('finish layer', (localLayerObject) => {
    const curLayerObj = JSON.parse(localLayerObject)
    drawHistory[roomId][curLayerObj.attrs.id].location =
      curLayerObj.attrs.points
    // console.log(drawHistory)
    socket
      .to(roomId)
      .emit('update finish layer', drawHistory[roomId][curLayerObj.attrs.id])
  })

  socket.on('move draw', (drawingId, position) => {
    console.log('move draw update', drawHistory[roomId][drawingId].moveLocation)
    if (drawHistory[roomId][drawingId].toolType === 'image') {
      drawHistory[roomId][drawingId].location.x = position[0]
      drawHistory[roomId][drawingId].location.y = position[1]
    } else {
      if (!drawHistory[roomId][drawingId].moveLocation) {
        drawHistory[roomId][drawingId].moveLocation = position
      } else {
        drawHistory[roomId][drawingId].moveLocation =
          drawHistory[roomId][drawingId].moveLocation.concat(position)
      }
    }

    socket.to(roomId).emit('update move draw', drawingId, position)
    socket.emit('update my move draw', drawingId, position)
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
}

/**
 * Initialization of voice chat event
 */
async function peerjsLoad(socket, roomId) {
  socket.on('start calling', (userId) => {
    console.log('Peer user: ', userId)

    socket.on('ready', () => {
      socket.to(roomId).emit('user-connected', userId)
    })

    socket.on('mute all', async () => {
      try {
        console.log('mute all')
        await WarRoom.updateRoomRights(roomId, undefined, false)
        socket.emit('update mute all')
        socket.to(roomId).emit('update mute all')
      } catch (error) {
        return
      }
    })

    socket.on('unmute all', async () => {
      try {
        console.log('unmute all')
        await WarRoom.updateRoomRights(roomId, undefined, true)
        socket.emit('update unmute all')
        socket.to(roomId).emit('update unmute all')
      } catch (error) {
        return
      }
    })
  })
}

module.exports = { chatEventLoad, drawEventLoad, peerjsLoad }
