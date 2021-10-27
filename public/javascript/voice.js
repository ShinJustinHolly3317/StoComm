const ROOM_ID = 'appworksggg'
const videoGrid = document.querySelector('#video-grid')

const myVideo = document.createElement('video')
myVideo.muted = true

const myPeer = new Peer({
  host: '/' + window.location.hostname,
  port: window.location.hostname === 'localhost' ? '3000' : '443',
  path: '/peerjs',
  debug: 3
})

myPeer.on('open', (id) => {
  console.log('my id: ', id)
  socket.emit('join-room', ROOM_ID, id)
})

const peers = {}

// executing media stream
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true
  })
  .then((stream) => {
    addVideoStream(myVideo, stream)

    socket.on('user-connected', (userId) => {
      console.log('userid: ', userId)
      console.log('stream: ', stream)
      connectToNewUser(userId, stream)
    })

    myPeer.on('call', (call) => {
      console.log('call in')
      call.answer(stream)
      const video = document.createElement('video')
      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream)
      })
    })
    socket.emit('ready')
  })

socket.on('user-disconnected', (userId) => {
  if (peers[userId]) peers[userId].close()
})

// function
function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)

  const video = document.createElement('video')
  call.on('stream', (userVideoStream) => {
    console.log('on stream')
    addVideoStream(video, userVideoStream)
  })

  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}
