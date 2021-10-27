const drawHistory = []

function mainSocketController(socket) {
  console.log(`user: ${socket.id} connected`)

  // recieve real time draw history
  socket.on('start draw', (initDrawInfo) => {
    console.log('start draw', initDrawInfo)

    // defining last incoming id
    let topLayerId = drawHistory.length - 1
    initDrawInfo.drawLayerCounter = topLayerId + 1
    drawHistory.push(initDrawInfo)
    socket.emit('get latest id', initDrawInfo.drawLayerCounter, drawHistory)
    // socket.broadcast.emit('get latest id', initDrawInfo.drawLayerCounter)

    // send drawing loction to others
    socket.broadcast.emit(
      'start sync draw',
      initDrawInfo.drawLayerCounter,
      drawHistory
    )
  })

  socket.on('drawing', (localLayerId, location) => {
    socket.broadcast.emit('latest draw history', localLayerId, location)
  })

  // Chat room
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
    socket.on('ready', () => {
      socket.broadcast.to(roomId).emit('user-connected', userId)
    })

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  })
}

module.exports = mainSocketController
