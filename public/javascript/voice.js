const videoGrid = document.querySelector('#video-grid')
const myVideo = document.createElement('video')
const peers = {}
const peerId = USER_ROLE.id
myVideo.muted = true

const myPeer = new Peer({
  host: '/' + window.location.hostname,
  port: window.location.hostname === 'localhost' ? '3000' : '443',
  path: '/peerjs',
  debug: 0
})

myPeer.on('open', (id) => {
  console.log('my id: ', id)
  socket.emit('start calling', id)

  // executing media stream
  navigator.mediaDevices
    .getUserMedia({
      video: false,
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
        console.log('call in', call.peer)
        call.answer(stream)

        const video = document.createElement('video')
        video.setAttribute('peer_user_id', call.peer)

        call.on('stream', (userVideoStream) => {
          addVideoStream(video, userVideoStream)
        })
      })
      socket.emit('ready')

      // setTimeout(() => {
      //   stream.getAudioTracks()[0].enabled = false
      //   console.log(stream.getAudioTracks())
      // }, 5000);
    })
})

socket.on('user-disconnected', (userId) => {
  console.log(`${userId} left this room`)

  if(document.querySelector(`[peer_user_id="${userId}"]`)){
    document.querySelector(`[peer_user_id="${userId}"]`).remove()
  }

  if (peers[userId]) {
    peers[userId].close()
  }
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
  video.setAttribute('peer_user_id', userId)

  call.on('stream', (userVideoStream) => {
    console.log('on stream')
    addVideoStream(video, userVideoStream)
  })

  // call.on('close', () => {
  //   video.remove()
  // })

  peers[userId] = call
  console.log('perssss:', peers)
}
