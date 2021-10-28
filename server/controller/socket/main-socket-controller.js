const drawHistory = {}

function mainSocketController(socket) {
  console.log(`user: ${socket.id} connected`)
  // init load
  socket.on('init load', ()=>{
    socket.emit('init load data', drawHistory)
  })

  // recieve real time draw history
  socket.on('start draw', (initDrawInfo) => {

    // defining last incoming id
    let topLayerId = Object.keys(drawHistory).length - 1
    initDrawInfo.drawLayerCounter = topLayerId + 1
    drawHistory[initDrawInfo.drawLayerCounter] = initDrawInfo
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
    drawHistory[localLayerId].location =
      drawHistory[localLayerId].location.concat(location)
    socket.broadcast.emit('latest draw history', localLayerId, location)

    // clean additional location of line layer
    const thisLocation = drawHistory[localLayerId].location
    if (drawHistory[localLayerId].toolType === 'line'){
      drawHistory[localLayerId].location = [
        thisLocation[0],
        thisLocation[1],
        thisLocation[thisLocation.length - 2],
        thisLocation[thisLocation.length - 1]
      ]
    }
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
