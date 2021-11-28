const Chat = require('../../model/chat-model')
const Canvas = require('../../model/canvas-model')
const WarRoom = require('../../model/war-room-model')
const redisClient = require('../../../utils/cache')
const { CACHE_EXPIRATION } = process.env
const moment = require('moment')

/**
 * Initialization of chat socket event
 */
async function chatEventLoad(socket, chatHistory, roomId, userName) {
  // Chat room
  if (!chatHistory[roomId]) {
    // Global history initialization
    chatHistory[roomId] = []

    // Cache History initialization
    let cacheChatHistory = null
    if (redisClient.ready) {
      cacheChatHistory = await redisClient.getAsync(`chat_history_${roomId}`)
    }
    if (cacheChatHistory) {
      // Read redis data first
      for (let item of JSON.parse(cacheChatHistory)) {
        chatHistory[roomId].push([
          item.user_id,
          item.user_name,
          item.content,
          item.chat_time
        ])
      }
    } else {
      // If Redis has been cleared, read data in Database
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
  }

  socket.emit('all messages', chatHistory[roomId])

  // Send enter notification to everyone
  socket.emit('send my msg', `${userName} 加入研究室囉`, userName, true)
  socket.to(roomId).emit('sendback', `${userName} 加入研究室囉`, userName, true)

  socket.on('chat message', async (msg, name, id) => {
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

    // Store data in Redis
    insertChatCache(redisClient, chatHistory[roomId], roomId)
  })
}

/**
 * Initialization of drawing socket event
 */
async function drawEventLoad(
  socket,
  drawHistory,
  roomId,
  roomPermission,
  hostId,
  roomClients,
  io
) {
  if (!drawHistory[roomId]) {
    // initialize draw history
    drawHistory[roomId] = {}

    // Cache draw history
    let cacheDrawHistory = null
    if (redisClient.ready) {
      cacheDrawHistory = await redisClient.getAsync(`draw_history_${roomId}`)
    }

    if (cacheDrawHistory) {
      for (let item of JSON.parse(cacheDrawHistory)) {
        drawHistory[roomId][item.draw_id] = {
          userId: item.user_id,
          drawLayerCounter: item.draw_id,
          location: item.locations,
          toolType: item.tool,
          canvasImg: item.url
        }
      }
    } else {
      // If Redis has been cleared, read data in Database
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
  }
  // init load
  socket.emit('init load data', drawHistory[roomId])

  socket.on('start draw', (initDrawInfo) => {
    // Not storing draw history now, this is for drawing layer order check
    const layerIds = Object.keys(drawHistory[roomId]) // defining lastest incoming id

    // define the last id, which is the last element
    let topLayerId = layerIds.length ? Number(layerIds[layerIds.length - 1]) : 0
    initDrawInfo.drawLayerCounter = !layerIds.length ? 0 : topLayerId + 1
    drawHistory[roomId][initDrawInfo.drawLayerCounter] = initDrawInfo

    socket.emit(
      'update my draw',
      initDrawInfo.drawLayerCounter,
      drawHistory[roomId]
    )
  })

  socket.on('delete all', (userId) => {
    // check if draw permission is turned on
    if (!roomPermission[roomId].drawToolTurnOn && userId !== hostId) {
      return
    }

    drawHistory[roomId] = {}
    socket.emit('update delete all')
    socket.to(roomId).emit('update delete all')

    // Storing data to redis
    insertDrawCache(redisClient, drawHistory[roomId], roomId)
  })

  socket.on('init draw tool', () => {
    socket.emit('update init draw tool', roomPermission[roomId].drawToolTurnOn)
  })

  socket.on('turn on draw', async () => {
    if (roomClients[socket.id].userId !== hostId) {
      return
    }

    try {
      await WarRoom.updateRoomRights(roomId, true, undefined)
      roomPermission[roomId].drawToolTurnOn = true
      socket.to(roomId).emit('update turn on draw')
    } catch (error) {
      return console.log(error)
    }
  })

  socket.on('turn off draw', async () => {
    if (roomClients[socket.id].userId !== hostId) {
      return
    }

    try {
      await WarRoom.updateRoomRights(roomId, false, undefined)
      roomPermission[roomId].drawToolTurnOn = false
      socket.to(roomId).emit('update turn off draw')
    } catch (error) {
      return console.log(error)
    }
  })

  socket.on('add image', (canvasInfo) => {
    // defining last incoming id
    const layerIds = Object.keys(drawHistory[roomId])

    // define the last id, which is the last element
    let topLayerId = layerIds.length ? Number(layerIds[layerIds.length - 1]) : 0
    canvasInfo.drawLayerCounter = !layerIds.length ? 0 : topLayerId + 1
    drawHistory[roomId][canvasInfo.drawLayerCounter] = canvasInfo
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

    // Storing data to redis
    insertDrawCache(redisClient, drawHistory[roomId], roomId)
  })

  socket.on('finish layer', (localLayerObject) => {
    const curLayerObj = JSON.parse(localLayerObject)
    drawHistory[roomId][curLayerObj.attrs.id].location =
      curLayerObj.attrs.points
    socket
      .to(roomId)
      .emit('update finish layer', drawHistory[roomId][curLayerObj.attrs.id])

    // Storing data to redis
    insertDrawCache(redisClient, drawHistory[roomId], roomId)
  })

  socket.on('move draw', (drawingId, position) => {
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

    // Storing data to redis
    insertDrawCache(redisClient, drawHistory[roomId], roomId)
  })

  socket.on('delete drawing', (drawingId) => {
    delete drawHistory[roomId][drawingId]
    socket.to(roomId).emit('update delete drawing', drawingId)

    // Storing data to redis
    insertDrawCache(redisClient, drawHistory[roomId], roomId)
  })

  socket.on('undo', (commandLayer) => {
    let topLayerId = commandLayer.drawObj.drawLayerCounter
    let commandType = commandLayer.command
    if (commandType === 'create') {
      delete drawHistory[roomId][topLayerId]
    } else {
      drawHistory[roomId][topLayerId] = commandLayer.drawObj
    }

    socket.to(roomId).emit('update undo', commandLayer)

    // Storing data to redis
    if (commandLayer.drawObj.toolType === 'image') {
      const undoLocation =
        drawHistory[roomId][topLayerId].moveLocation.slice(-4)
      drawHistory[roomId][topLayerId].location.x = undoLocation[0]
      drawHistory[roomId][topLayerId].location.y = undoLocation[1]
    } else {
      drawHistory[roomId][topLayerId].moveLocation.splice(
        drawHistory[roomId][topLayerId].moveLocation.length - 2,
        2
      )
    }
    insertDrawCache(redisClient, drawHistory[roomId], roomId)
  })

  socket.on('redo', (commandLayer) => {
    let topLayerId = commandLayer.drawObj.drawLayerCounter
    let commandType = commandLayer.command

    if (commandType === 'delete') {
      delete drawHistory[roomId][topLayerId]
    } else {
      drawHistory[roomId][topLayerId] = commandLayer.drawObj
    }

    socket.to(roomId).emit('update redo', commandLayer)

    // Storing data to redis
    if (commandLayer.drawObj.toolType === 'image') {
      const undoLocation =
        drawHistory[roomId][topLayerId].prevMoveLocation.slice(-2)
      drawHistory[roomId][topLayerId].location.x = undoLocation[0]
      drawHistory[roomId][topLayerId].location.y = undoLocation[1]
    } else {
      drawHistory[roomId][topLayerId].moveLocation = drawHistory[roomId][
        topLayerId
      ].moveLocation.concat(
        drawHistory[roomId][topLayerId].prevMoveLocation.slice(-2)
      )
    }
    insertDrawCache(redisClient, drawHistory[roomId], roomId)
  })
}

/**
 * Initialization of voice chat event
 */
async function peerjsLoad(socket, roomId, hostId, roomClients) {
  socket.on('start calling', (userId) => {
    socket.on('ready', () => {
      socket.to(roomId).emit('user-connected', userId)
    })

    socket.on('mute all', async () => {
      if (roomClients[socket.id].userId !== hostId) {
        return
      }

      try {
        await WarRoom.updateRoomRights(roomId, undefined, false)
        socket.emit('update mute all')
        socket.to(roomId).emit('update mute all')
      } catch (error) {
        return
      }
    })

    socket.on('unmute all', async () => {
      if (roomClients[socket.id].userId !== hostId) {
        return
      }

      try {
        await WarRoom.updateRoomRights(roomId, undefined, true)
        socket.emit('update unmute all')
        socket.to(roomId).emit('update unmute all')
      } catch (error) {
        return
      }
    })
  })
}

async function insertChatCache(redisClient, roomChatHistory, roomId) {
  // Store data in Redis
  if (redisClient.ready) {
    await redisClient.delAsync(`chat_history_${roomId}`)
    await redisClient.setAsync(
      `chat_history_${roomId}`,
      CACHE_EXPIRATION,
      JSON.stringify(roomChatHistory)
    )
  }
}

async function insertDrawCache(redisClient, roomDrawHistory, roomId) {
  const isEmptyDraw = Object.keys(roomDrawHistory).length === 0

  // Store data in Redis
  if (redisClient.ready) {
    await redisClient.delAsync(`draw_history_${roomId}`)

    if (isEmptyDraw) {
      // Delete all draw history
      return
    }

    await redisClient.setAsync(
      `draw_history_${roomId}`,
      CACHE_EXPIRATION,
      JSON.stringify(roomDrawHistory)
    )
  }
}

module.exports = { chatEventLoad, drawEventLoad, peerjsLoad }
