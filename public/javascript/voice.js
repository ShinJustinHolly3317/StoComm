const videoGrid = document.querySelector('#video-grid')
const hostArea = document.querySelector('.host-area')
const myVideo = document.createElement('video')
const peers = {}

// const peerId = USER.id
myVideo.muted = true

socket.on('user-disconnected', (userId) => {
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

  // Initialize myPeerJS
  const myPeer = new Peer(peerId, {
    host: '/' + window.location.hostname,
    port: window.location.hostname === 'localhost' ? '3000' : '443',
    path: '/peerjs',
    debug: 0
  })

  myPeer.on('error', (error) => {
    // Only one voice stream for each user
    document.querySelector('#voice-control-modal .modal-body').innerHTML = `
          <p>此用戶已經擁有語音頻道，如果打開多個瀏覽器分頁，請關閉多餘的分頁。</p>
          `
    document
      .querySelector('#voice-control-modal .modal-body')
      .classList.add('d-flex', 'align-items-center', 'justify-content-center')
  })

  myPeer.on('open', (id) => {
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
        if (!isMicOnInit && userData.role !== 'streamer') {
          stream.getAudioTracks()[0].enabled = false
        }

        socket.on('user-connected', (userId) => {
          // call to others
          connectToNewUser(userId, stream)
        })

        // create myself audio icon
        const audioIcon = document.createElement('div')
        audioIcon.setAttribute('peer_user_id', id)

        // get user picture url
        const userPicUrl = await getUserPic(id)
        if (userData.role === 'streamer') {
          audioIcon.innerHTML = `<img src="${userPicUrl}" class="audio-icon" peer_user_id="${id}">
          <img src="/img/mic.png" class="mic-icon">`

          hostArea.append(audioIcon)
        } else {
          if (isMicOnInit) {
            audioIcon.innerHTML = `<img src="${userPicUrl}" class="audio-icon" peer_user_id="${id}">
            <img src="/img/mic.png" class="mic-icon">`
          } else {
            audioIcon.innerHTML = `<img src="${userPicUrl}" class="audio-icon" peer_user_id="${id}">
            <img src="/img/mute.png" class="mute-icon">`
          }

          videoGrid.append(audioIcon)
        }

        myPeer.on('call', (call) => {
          // others call me
          call.answer(stream)

          const video = document.createElement('video')
          // video.setAttribute('peer_user_id', call.peer)

          // get user picture url
          getUserPic(call.peer).then((userPicUrl) => {
            if (Number(call.peer) === Number(roomHostId)) {
              const audioIcon = document.createElement('div')
              audioIcon.setAttribute('peer_user_id', call.peer)
              audioIcon.innerHTML = `<img src="${userPicUrl}" class="audio-icon" peer_user_id="${call.peer}">
            <img src="/img/mic.png" class="mic-icon">
            `
              hostArea.append(audioIcon)
            } else {
              const audioIcon = document.createElement('div')
              audioIcon.setAttribute('peer_user_id', call.peer)

              if (isMicOnInit) {
                audioIcon.innerHTML = `<img src="${userPicUrl}" class="audio-icon" peer_user_id="${call.peer}">
              <img src="/img/mic.png" class="mic-icon">`
              } else {
                audioIcon.innerHTML = `<img src="${userPicUrl}" class="audio-icon" peer_user_id="${call.peer}">
              <img src="/img/mute.png" class="mute-icon">`
              }
              videoGrid.append(audioIcon)
            }
          })

          call.on('stream', (userVideoStream) => {
            addVideoStream(video, userVideoStream)
          })
        })

        socket.emit('ready')

        socket.on('update mute all', async () => {
          const mutedPeople = document.querySelectorAll('#video-grid .mic-icon')
          for (let item of mutedPeople) {
            item.src = '/img/mute.png'
            item.classList.remove('mic-icon')
            item.classList.add('mute-icon')
          }

          const userCheckResult = await userAuth()
          if (userCheckResult.data.role === 'streamer') {
            WarRoomView.groupMicBtn.classList.remove('hidden')
            WarRoomView.groupMuteBtn.classList.add('hidden')
          } else {
            stream.getAudioTracks()[0].enabled = false
          }
        })

        socket.on('update unmute all', async () => {
          const mutedPeople = document.querySelectorAll(
            '#video-grid .mute-icon'
          )
          for (let item of mutedPeople) {
            item.src = '/img/mic.png'
            item.classList.remove('mute-icon')
            item.classList.add('mic-icon')
          }

          const userCheckResult = await userAuth()
          if (userCheckResult.data.role === 'streamer') {
            WarRoomView.groupMicBtn.classList.add('hidden')
            WarRoomView.groupMuteBtn.classList.remove('hidden')
          } else {
            stream.getAudioTracks()[0].enabled = true
          }
        })
      })
      .catch((error) => {
        if (error.message === 'Permission denied') {
          document.querySelector(
            '#voice-control-modal .modal-body'
          ).innerHTML = `
          <p>你沒有打開語音權限，請去瀏覽器設定打開，再重新整理頁面</p>
          `
          document
            .querySelector('#voice-control-modal .modal-body')
            .classList.add(
              'd-flex',
              'align-items-center',
              'justify-content-center'
            )
        }
      })
  })

  function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    videoGrid.append(video)
  }

  async function connectToNewUser(userId, stream) {
    const isMicOnInit = (await roomAuth()).open_mic

    const call = myPeer.call(userId, stream)
    /* No vedio call for now, maybe online in the future */
    const video = document.createElement('video')
    video.setAttribute('peer_user_id', userId)

    call.on('stream', (userVideoStream) => {

      // get user picture url
      getUserPic(userId).then((userPicUrl) => {
        if (Number(userId) === Number(roomHostId)) {
          const audioIcon = document.createElement('div')
          audioIcon.setAttribute('peer_user_id', userId)
          audioIcon.innerHTML = `<img src="${userPicUrl}" class="audio-icon" peer_user_id="${userId}">
            <img src="/img/mic.png" class="mic-icon">
            `
          hostArea.append(audioIcon)
        } else {
          const audioIcon = document.createElement('div')
          audioIcon.setAttribute('peer_user_id', userId)

          if (isMicOnInit) {
            audioIcon.innerHTML = `<img src="${userPicUrl}" class="audio-icon" peer_user_id="${userId}">
            <img src="/img/mic.png" class="mic-icon">`
          } else {
            audioIcon.innerHTML = `<img src="${userPicUrl}" class="audio-icon" peer_user_id="${userId}">
            <img src="/img/mute.png" class="mute-icon">`
          }
          videoGrid.append(audioIcon)
        }
        /* No vedio call for now, maybe online in the future */
        addVideoStream(video, userVideoStream)
      })
    })

    peers[userId] = call
  }

  async function getUserPic(userId) {
    const response = await fetch(`/api/1.0/user/user_info?userId=${userId}`)
    const result = await response.json()
    let picUrl
    if(result.data.length){
      picUrl = result.data[0].picture
    }
    return picUrl
  }
}
