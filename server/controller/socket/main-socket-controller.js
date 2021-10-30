const drawHistory = {}
let clientList
let isAdmin

function socketListener (io) {
  io.on('connection', mainSocketController)

  function mainSocketController(socket) {
    socket.on('join room', async (roomId) => {
      socket.join(roomId)
      if (!drawHistory[roomId]){
        drawHistory[roomId] = {}
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
          'get latest id',
          initDrawInfo.drawLayerCounter,
          drawHistory[roomId]
        )
        // socket.broadcast.emit('get latest id', initDrawInfo.drawLayerCounter)

        // send drawing loction to others
        socket
          .to(roomId)
          .emit(
            'start sync draw',
            initDrawInfo.drawLayerCounter,
            drawHistory[roomId]
          )
      })

      socket.on('drawing', (localLayerId, location) => {
        drawHistory[roomId][localLayerId].location =
          drawHistory[roomId][localLayerId].location.concat(location)
        console.log(drawHistory)
        socket.to(roomId).emit('latest draw history', localLayerId, location)

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
      })

      // Chat room
      socket.on('chat message', (msg, name) => {
        console.log('message: ' + msg, name)

        socket.to(roomId).emit('sendback', msg, name)
        // send my msg
        socket.emit('send my msg', msg, name)
      })

      // peerjs
      socket.on('start calling', (userId) => {
        console.log('Peer user: ', userId)
        // socket.to(roomId).emit('user-connected', userId)

        // for local test
        socket.on('ready', () => {
          socket.to(roomId).emit('user-connected', userId)
        })

        socket.on('disconnect', () => {
          console.log(`${userId} left this room(${roomId})!`)
          socket.to(roomId).emit('user-disconnected', userId)
        })
      })
    })
  }
}



module.exports = socketListener
