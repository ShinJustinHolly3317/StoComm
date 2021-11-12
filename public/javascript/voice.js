const videoGrid = document.querySelector('#video-grid')
const hostArea = document.querySelector('.host-area')
const myVideo = document.createElement('video')
const peers = {}

// const peerId = USER.id
myVideo.muted = true

socket.on('user-disconnected', (userId) => {
  console.log(`${userId} left this room`)
  const streamEles = document.querySelectorAll(`[peer_user_id="${userId}"]`)

  if (streamEles) {
    for (let item of streamEles) {
      item.remove()
    }
  }

  if (peers[userId]) {
    peers[userId].close()
  }
})

WarRoomView.groupMicBtn.addEventListener('click', async (e) => {
  // mute those bitches
  const userCheckResult = await userAuth()
  if (userCheckResult.data.role !== 'streamer') {
    await Swal.fire({
      icon: 'error',
      title: '你不是主持人，不要來亂',
      confirmButtonColor: '#315375'
    })
  }

  socket.emit('unmute all')
})

WarRoomView.groupMuteBtn.addEventListener('click', async (e) => {
  // mute those bitches
  const userCheckResult = await userAuth()
  if (userCheckResult.data.role !== 'streamer') {
    await Swal.fire({
      icon: 'error',
      title: '你不是主持人，不要來亂',
      confirmButtonColor: '#315375'
    })
  }

  socket.emit('mute all')
})

// function
async function initPeer() {
  const userData = (await userAuth()).data
  const peerId = userData.id // equal to userId
  const myPeer = new Peer(peerId, {
    host: '/' + window.location.hostname,
    port: window.location.hostname === 'localhost' ? '3000' : '443',
    path: '/peerjs',
    debug: 0
  })

  myPeer.on('open', (id) => {
    // console.log('my id: ', id)
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
        const isMicOnInit = (await roomAuth()).open_mic
        if (!isMicOnInit && userData !== 'streamer') {
          stream.getAudioTracks()[0].enabled = false
        }

        socket.on('user-connected', (userId) => {
          // call to others
          // console.log('userid: ', userId)
          // console.log('stream: ', stream)
          connectToNewUser(userId, stream)
        })

        // create myself audio icon
        const audioIcon = document.createElement('div')
        audioIcon.setAttribute('peer_user_id', id)
        if (userData.role === 'streamer') {
          audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${id}">
          <img src="/img/mic.png" class="mic-icon">`

          hostArea.append(audioIcon)
        } else {
          audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${id}">
          <img src="/img/mute.png" class="mute-icon">`

          videoGrid.append(audioIcon)
        }

        myPeer.on('call', (call) => {
          // others call me
          // console.log('call in', call.peer)
          call.answer(stream)

          const video = document.createElement('video')
          // video.setAttribute('peer_user_id', call.peer)

          if (Number(call.peer) === Number(roomHostId)) {
            const audioIcon = document.createElement('div')
            audioIcon.setAttribute('peer_user_id', call.peer)
            audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${call.peer}">
            <img src="/img/mic.png" class="mic-icon">
            `
            hostArea.append(audioIcon)
          } else {
            const audioIcon = document.createElement('div')
            audioIcon.setAttribute('peer_user_id', call.peer)
            audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${call.peer}">
            <img src="/img/mute.png" class="mute-icon">
            `
            videoGrid.append(audioIcon)
          }

          call.on('stream', (userVideoStream) => {
            addVideoStream(video, userVideoStream)
          })
        })

        socket.emit('ready')

        socket.on('update mute all', async () => {
          const mutedPeople = document.querySelectorAll('#video-grid .mic-icon')
          console.log(mutedPeople)
          for (let item of mutedPeople) {
            item.src = '/img/mute.png'
            item.classList.remove('mic-icon')
            item.classList.add('mute-icon')
          }

          const userCheckResult = await userAuth()
          if (userCheckResult.data.role === 'streamer') {
            WarRoomView.groupMicBtn.classList.remove('hidden')
            WarRoomView.groupMuteBtn.classList.add('hidden')
          }
        })

        socket.on('update unmute all', async () => {
          const mutedPeople = document.querySelectorAll(
            '#video-grid .mute-icon'
          )
          console.log(mutedPeople)
          for (let item of mutedPeople) {
            item.src = '/img/mic.png'
            item.classList.remove('mute-icon')
            item.classList.add('mic-icon')
          }

          const userCheckResult = await userAuth()
          if (userCheckResult.data.role === 'streamer') {
            WarRoomView.groupMicBtn.classList.add('hidden')
            WarRoomView.groupMuteBtn.classList.remove('hidden')
          }
        })

        // socket.on('update ban audio', async (banUserId) => {
        //   if (banUserId === id) {
        //     const isMicOn = (await userAuth()).data.is_mic_on
        //     // console.log('isMicOn', isMicOn)
        //     if (isMicOn) {
        //       // console.log('banUserId', banUserId)
        //       stream.getAudioTracks()[0].enabled = false
        //       // console.log(stream.getAudioTracks()[0])

        //       await updateUserMic(false, banUserId)

        //       const banAudioIcon = document.querySelector(
        //         `img[peer_user_id="${banUserId}"]`
        //       ).nextElementSibling
        //       // console.log(banAudioIcon)
        //       banAudioIcon.src = '/img/mute.png'
        //       banAudioIcon.classList.remove('mic-icon')
        //       banAudioIcon.classList.add('mute-icon')
        //     } else {
        //       // console.log('banUserId', banUserId)
        //       stream.getAudioTracks()[0].enabled = true
        //       // console.log(stream.getAudioTracks()[0])

        //       await updateUserMic(true, banUserId)

        //       const banAudioIcon = document.querySelector(
        //         `img[peer_user_id="${banUserId}"]`
        //       ).nextElementSibling
        //       // console.log(banAudioIcon)
        //       banAudioIcon.src = '/img/mic.png'
        //       banAudioIcon.classList.remove('mute-icon')
        //       banAudioIcon.classList.add('mic-icon')
        //     }
        //   }
        // })

        videoGrid.addEventListener('click', async (e) => {
          // mute person specifically
          const userCheckResult = await userAuth()
          if (userCheckResult.data.role !== 'streamer') {
            return
          }

          const audioIcon = e.target
          if (audioIcon.classList.contains('audio-icon')) {
            socket.emit('ban audio', e.target.getAttribute('peer_user_id'))

            if (audioIcon.nextElementSibling.classList.contains('mic-icon')) {
              audioIcon.nextElementSibling.src = '/img/mute.png'
              audioIcon.nextElementSibling.classList.remove('mic-icon')
              audioIcon.nextElementSibling.classList.add('mute-icon')
            } else if (
              audioIcon.nextElementSibling.classList.contains('mute-icon')
            ) {
              audioIcon.nextElementSibling.src = '/img/mic.png'
              audioIcon.nextElementSibling.classList.remove('mute-icon')
              audioIcon.nextElementSibling.classList.add('mic-icon')
            }
          }
        })

        // console.log('init stream', stream.getAudioTracks())
      })
      .catch((error) => {
        if (error.message === 'Permission denied') {

          document.querySelector(
            '#voice-control-modal .modal-body'
          ).innerHTML = `
          <p>你沒有打開語音權限，請去瀏覽器設定打開，再重新整理頁面</p>
          `
          document.querySelector('#voice-control-modal .modal-body').classList.add('d-flex', 'align-items-center', 'justify-content-center')
        }
        console.log('You got an error:' + error)
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

    /* No vedio call for now, maybe online in the future */
    const video = document.createElement('video')
    video.setAttribute('peer_user_id', userId)
    // console.log(USER.picture)

    call.on('stream', (userVideoStream) => {
      // console.log('on stream')

      // Show profile icon when peer answer the call
      // const audioIcon = document.createElement('div')
      // audioIcon.setAttribute('peer_user_id', userId)
      // audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${userId}">
      // <img src="/img/mute.png" class="mute-icon">`
      // console.log(audioIcon)
      // videoGrid.append(audioIcon)
      if (Number(userId) === Number(roomHostId)) {
        const audioIcon = document.createElement('div')
        audioIcon.setAttribute('peer_user_id', userId)
        audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${userId}">
            <img src="/img/mic.png" class="mic-icon">
            `
        hostArea.append(audioIcon)
      } else {
        const audioIcon = document.createElement('div')
        audioIcon.setAttribute('peer_user_id', userId)
        audioIcon.innerHTML = `<img src="/img/profile-icon.png" class="audio-icon" peer_user_id="${userId}">
            <img src="/img/mute.png" class="mute-icon">
            `
        videoGrid.append(audioIcon)
      }

      /* No vedio call for now, maybe online in the future */
      addVideoStream(video, userVideoStream)
    })

    // call.on('close', () => {
    //   video.remove()
    // })

    peers[userId] = call
    // console.log('Peer answer my call:', peers)
  }

  async function updateUserMic(isAllow, userId) {
    const response = await fetch('/api/1.0/user/user_permission', {
      method: 'PATCH',
      body: JSON.stringify({
        type: 'is_mic_on',
        isAllow,
        userId
      }),
      headers: {
        'Content-type': 'application/json'
      }
    })

    return response.status
  }
}
