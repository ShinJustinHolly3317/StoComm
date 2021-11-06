const videoGrid = document.querySelector('#video-grid')
const myVideo = document.createElement('video')
const peers = {}
// const peerId = USER.id
myVideo.muted = true

socket.on('user-disconnected', (userId) => {
  console.log(`${userId} left this room`)

  if (document.querySelector(`[peer_user_id="${userId}"]`)) {
    document.querySelector(`[peer_user_id="${userId}"]`).remove()
  }

  if (peers[userId]) {
    peers[userId].close()
  }
})

// function
async function initPeer() {
  const peerId = (await userAuth()).data.id
  const myPeer = new Peer(peerId, {
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
      .then(async (stream) => {
        addVideoStream(myVideo, stream)

        // default visitor mic is off
        const isMicOn = (await userAuth()).data.is_mic_on
        if (!isMicOn) {
          stream.getAudioTracks()[0].enabled = false
        }

        socket.on('user-connected', (userId) => {
          // call to others
          console.log('userid: ', userId)
          console.log('stream: ', stream)
          connectToNewUser(userId, stream)
        })

        // create myself audio icon
        const audioIcon = document.createElement('div')
        audioIcon.setAttribute('peer_user_id', id)
        if (isMicOn) {
          audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${id}">
          <img src="/img/mic.png" class="mic-icon">`
        } else {
          audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${id}">
          <img src="/img/mute.png" class="mute-icon">`
        }
        
        videoGrid.append(audioIcon)

        myPeer.on('call', (call) => {
          // others call me
          console.log('call in', call.peer)
          call.answer(stream)

          const video = document.createElement('video')
          // video.setAttribute('peer_user_id', call.peer)

          const audioIcon = document.createElement('div')
          audioIcon.setAttribute('peer_user_id', call.peer)
          audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${call.peer}">
          <img src="/img/mute.png" class="mute-icon">
          `
          videoGrid.append(audioIcon)

          call.on('stream', (userVideoStream) => {
            addVideoStream(video, userVideoStream)
          })
        })
        socket.emit('ready')

        socket.on('update ban audio', (banUserId) => {
          if (banUserId === id) {
            console.log('banUserId', banUserId)
            stream.getAudioTracks()[0].enabled = true
            console.log(stream.getAudioTracks()[0])

            const banAudioIcon = document.querySelector(
              `img[peer_user_id="${banUserId}"]`
            ).nextElementSibling
            console.log(banAudioIcon)
            banAudioIcon.src = '/img/mic.png'
            banAudioIcon.classList.remove('mute-icon')
            banAudioIcon.classList.add('mic-icon')
          }
        })

        videoGrid.addEventListener('click', async (e) => {
          // mute those bitches
          const userCheckResult = await userAuth()
          if (userCheckResult.data.role !== 'streamer') {
            return
          }

          if (e.target.classList.contains('audio-icon')) {
            socket.emit('ban audio', e.target.getAttribute('peer_user_id'))
          }
        })
        // setTimeout(() => {
        //   stream.getAudioTracks()[0].enabled = false
        //   console.log(stream.getAudioTracks())
        // }, 5000);
        console.log('init stream', stream.getAudioTracks())
      })
  })

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
    // video.setAttribute('peer_user_id', userId)
    // console.log(USER.picture)

    const audioIcon = document.createElement('div')
    audioIcon.setAttribute('peer_user_id', userId)
    audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${userId}">
    <img src="/img/mute.png" class="mute-icon">`
    console.log(audioIcon)
    videoGrid.append(audioIcon)

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
}
