const ROOM_ID = getQueryObject().roomId
const STOCK_CODE = getQueryObject().stockCode
let USER = JSON.parse(localStorage.getItem('user'))
let company_name
let roomHostId
const accessToken = localStorage.getItem('access_token')

const WarRoomView = {
  postBtn: document.querySelector('#js-post-war-room'),
  allowBtn: document.querySelector('#js-allow-draw'),
  denyBtn: document.querySelector('#js-deny-draw'),
  visitorLeaveBtn: document.querySelector('#leave-icon'),
  canvasEle: document.querySelector('#canvas'),
  confirmLeaveBtn: document.querySelector('#confirm-leave-btn'),
  modalBody: document.querySelector('.leaving-modal-body'),
  drawTool: document.querySelector('.draw-tool-area'),
  voiceCtrlBtn: document.querySelector('#group-btn'),
  voiceCtrlModal: new bootstrap.Modal(
    document.querySelector('#voice-control-modal'),
    { keyboard: false }
  ),
  groupMuteBtn: document.querySelector('.group-mute-btn'),
  groupMicBtn: document.querySelector('.group-mic-btn')
}

if (!ROOM_ID) {
  Swal.fire({
    icon: 'error',
    title: '無效的房間!',
    confirmButtonColor: '#315375'
  }).then(() => {
    window.location.href = '/'
  })
}
const socket = io()
let socketId
socket.on('connect', async () => {
  socketId = socket.id
  roomHostId = (await roomAuth()).user_id

  console.log('roomHostId', roomHostId)
  
  const userRole = await roleAuth()
  socket.emit('join room', ROOM_ID, USER.id, USER.name, userRole)
  await initPeer()
  // preventNavbar()
  // socket.emit('init draw tool')
})

// socket.on('update init draw tool', (drawToolTurnOn) => {
//   console.log('drawToolTurnOn', drawToolTurnOn)
//   if (drawToolTurnOn) {
//     WarRoomView.drawTool.classList.remove('hidden')
//   }
// })

socket.on('update turn on draw', () => {
  Swal.fire({
    title: '繪圖工具權限打開囉!',
    showConfirmButton: false,
    timer: 1500
  })
  WarRoomView.drawTool.classList.remove('hidden')
})

socket.on('update turn off draw', () => {
  Swal.fire({
    title: '繪圖工具權限已關閉!',
    showConfirmButton: false,
    timer: 1500
  })
  WarRoomView.drawTool.classList.add('hidden')
})

socket.on('update host leaving', () => {
  let timerInterval
  Swal.fire({
    title: '主持人要離開了!',
    html: '即將在 <b></b> 秒關閉研究室',
    timer: 3000,
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading()
      const b = Swal.getHtmlContainer().querySelector('b')
      timerInterval = setInterval(() => {
        b.textContent = (Swal.getTimerLeft()) / 1000
      }, 100)
    },
    willClose: () => {
      clearInterval(timerInterval)
    }
  }).then((result) => {
    /* Read more about handling dismissals below */
    if (result.dismiss === Swal.DismissReason.timer) {
      window.location.href = '/hot-rooms'
    }
  })
})

// listener
WarRoomView.postBtn.addEventListener('click', async (e) => {
  const swalResult = await Swal.fire({
    title: '即將關閉房間',
    text: '發文後即將關閉研究室，確定離開嗎?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#adb5bd',
    confirmButtonText: '沒錯，我要發文了',
    cancelButtonText: '沒事，我按錯了'
  })

  if (swalResult.isConfirmed) {
    const response = await fetch(`/api/1.0/war_room/end_war_room/${ROOM_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    })
    const result = await response.json()

    const canvas = await html2canvas(WarRoomView.canvasEle)
    let canvasImg = canvas.toDataURL('image/jpeg')
    localStorage.setItem('canvas', canvasImg)

    if (response.status === 200) {
      socket.emit('host leaving')
      window.location.href = `/post?stockCode=${STOCK_CODE}`
    } else {
      Swal.fire({
        icon: 'error',
        title: '錯誤的操作',
        confirmButtonColor: '#315375'
      })
    }
  }
})

WarRoomView.allowBtn.addEventListener('click', async (e) => {
  const clientsId = []
  const userResult = await userAuth()

  if (userResult.data.role !== 'streamer') return
  socket.emit('turn on draw')
  await Swal.fire({
    title: '繪圖工具權限打開囉!',
    showConfirmButton: false,
    timer: 1500
  })

  // socket.once('recieve all room clients', async (onlineClients) => {
  //   const hostId = onlineClients[ROOM_ID].host
  //   for (let key in onlineClients[ROOM_ID]) {
  //     if (
  //       onlineClients[ROOM_ID][key].userId &&
  //       onlineClients[ROOM_ID][key].userId !== hostId
  //     ) {
  //       // clientsId.push(onlineClients[ROOM_ID][key].peerId)
  //       clientsId.push(onlineClients[ROOM_ID][key].userId)
  //     }
  //   }
  //   console.log('clientsId', clientsId)

  //   const response = await fetch('/api/1.0/user/user_permission', {
  //     method: 'PATCH',
  //     body: JSON.stringify({
  //       type: 'is_allDrawable',
  //       isAllow: true,
  //       usersId: clientsId
  //     }),
  //     headers: {
  //       'Content-type': 'application/json'
  //     }
  //   })
  //   const result = await response.json()

  //   if (response.status === 200) {
  //     WarRoomView.denyBtn.classList.remove('hidden')
  //     WarRoomView.allowBtn.classList.add('hidden')
  //   } else {
  //     Swal.fire({
  //       icon: 'error',
  //       title: '錯誤的操作',
  //       confirmButtonColor: '#315375'
  //     })
  //   }
  // })
  // socket.emit('get all room clients')

  const response = await fetch(
    `/api/1.0/war_room/war_room_info?roomId=${ROOM_ID}&open_draw=1`,
    {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }
  )

  if (response.status !== 200) {
    Swal.fire({
      icon: 'error',
      title: '錯誤的操作',
      confirmButtonColor: '#315375'
    })
    const result = await response.json()
    console.log(result)
  } else {
    WarRoomView.denyBtn.classList.remove('hidden')
    WarRoomView.allowBtn.classList.add('hidden')
  }
})

WarRoomView.denyBtn.addEventListener('click', async (e) => {
  const clientsId = []
  const userResult = await userAuth()

  if (userResult.data.role !== 'streamer') return
  socket.emit('turn off draw')
  await Swal.fire({
    title: '繪圖工具權限關閉囉!',
    showConfirmButton: false,
    timer: 1500
  })

  // socket.once('recieve all room clients', async (onlineClients) => {
  //   const hostId = onlineClients[ROOM_ID].host
  //   for (let key in onlineClients[ROOM_ID]) {
  //     if (
  //       onlineClients[ROOM_ID][key].userId &&
  //       onlineClients[ROOM_ID][key].userId !== hostId
  //     ) {
  //       // clientsId.push(onlineClients[ROOM_ID][key].peerId)
  //       clientsId.push(onlineClients[ROOM_ID][key].userId)
  //     }
  //   }
  //   console.log('clientsId', clientsId)

  //   if (!clientsId.length) {
  //     // no people
  //     return
  //   }

  //   const response = await fetch('/api/1.0/user/user_permission', {
  //     method: 'PATCH',
  //     body: JSON.stringify({
  //       type: 'is_allDrawable',
  //       isAllow: false,
  //       usersId: clientsId
  //     }),
  //     headers: {
  //       'Content-type': 'application/json'
  //     }
  //   })
  //   const result = await response.json()

  //   if (response.status === 200) {
  //     WarRoomView.denyBtn.classList.add('hidden')
  //     WarRoomView.allowBtn.classList.move('hidden')
  //   } else {
  //     Swal.fire({
  //       icon: 'error',
  //       title: '錯誤的操作',
  //       confirmButtonColor: '#315375'
  //     })
  //   }
  // })
  // socket.emit('get all room clients')

  const response = await fetch(
    `/api/1.0/war_room/war_room_info?roomId=${ROOM_ID}&open_draw=0`,
    {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }
  )

  if (response.status !== 200) {
    Swal.fire({
      icon: 'error',
      title: '錯誤的操作',
      confirmButtonColor: '#315375'
    })
    const result = await response.json()
    console.log(result)
  } else {
    WarRoomView.denyBtn.classList.add('hidden')
    WarRoomView.allowBtn.classList.remove('hidden')
  }
})

// document.querySelector('.navbar').addEventListener('click', async (e) => {
//   console.log(e.target.parentElement.tagName)
//   if (e.target.parentElement.tagName === 'A') {
//     e.preventDefault()
//     const swalResult = await Swal.fire({
//       title: '即將關閉房間',
//       text: '確定離開嗎?',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#e6e6e6',
//       cancelButtonColor: '#14c9ba',
//       confirmButtonText: '沒錯，我要走了',
//       cancelButtonText: '沒事，我按錯了'
//     })
//   }
// })

WarRoomView.voiceCtrlBtn.addEventListener('click',(e) => {
  WarRoomView.voiceCtrlModal.show()
})

// Functions
async function roleAuth() {
  if (!accessToken) {
    Swal.fire({
      icon: 'error',
      title: '你沒有權限進來!!',
      confirmButtonColor: '#315375'
    }).then(() => {
      window.location.href = '/hot-rooms'
    })
  }

  const result = await userAuth()
  if (result.error) {
    Swal.fire({
      icon: 'error',
      title: '你沒有權限進來!!',
      confirmButtonColor: '#315375'
    }).then(() => {
      window.location.href = '/hot-rooms'
    })
  } else {
    if (result.data.role === 'streamer') {
      console.log('im streamer')
      WarRoomView.postBtn.classList.remove('hidden')
      WarRoomView.confirmLeaveBtn.innerHTML = '確定'
      WarRoomView.modalBody.innerText = '確定要離開嗎?你的粉絲在等著你'
      WarRoomView.confirmLeaveBtn.setAttribute('streamer', true)
      WarRoomView.drawTool.classList.remove('hidden')

      const roomPermission = (await roomAuth())
      if (roomPermission.open_draw) {
        WarRoomView.denyBtn.classList.remove('hidden')
      } else {
        WarRoomView.allowBtn.classList.remove('hidden')
      }

      if (roomPermission.open_mic) {
        WarRoomView.groupMuteBtn.classList.remove('hidden')
      } else {
        WarRoomView.groupMicBtn.classList.remove('hidden')
      }

      // closing room btn
      document
        .querySelector(`[streamer="true"]`)
        .addEventListener('click', async () => {
          const response = await fetch(
            `/api/1.0/war_room/end_war_room/${ROOM_ID}`,
            {
              method: 'PATCH',
              headers: {
                Authorization: 'Bearer ' + accessToken
              }
            }
          )

          if (response.status === 200) {
            socket.emit('host leaving')
            let timerInterval
            Swal.fire({
              title: '您即將要離開了!',
              html: '即將在 <b></b> 秒關閉研究室',
              timer: 3000,
              timerProgressBar: true,
              didOpen: () => {
                Swal.showLoading()
                const b = Swal.getHtmlContainer().querySelector('b')
                timerInterval = setInterval(() => {
                  b.textContent = Swal.getTimerLeft() / 1000
                }, 100)
              },
              willClose: () => {
                clearInterval(timerInterval)
              }
            }).then((result) => {
              /* Read more about handling dismissals below */
              if (result.dismiss === Swal.DismissReason.timer) {
                window.location.href = '/hot-rooms'
              }
            })
          }
        })
    } else if (result.data.role !== 'streamer') {
      document.querySelector('.add-canvas').classList.add('hidden')

      const openDraw = (await roomAuth()).open_draw
      if(openDraw) {
        WarRoomView.drawTool.classList.remove('hidden')
      }
      // if (result.data.is_drawable) {
      //   WarRoomView.drawTool.classList.remove('hidden')
      // }
    }
    // USER = {
    //   id: result.data.id,
    //   name: result.data.name,
    //   email: result.data.email,
    //   piture: result.data.picture
    // }

    return result.data.role
  }
}

async function roomAuth() {
  // check this room exist or not
  const response = await fetch(
    `/api/1.0/war_room/war_room_info?roomId=${ROOM_ID}`,
    {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }
  )
  const result = await response.json()

  if (response.status !== 200 || !result.data.length) {
    Swal.fire({
      icon: 'error',
      title: '你沒有權限進來!!',
      confirmButtonColor: '#315375'
    }).then(() => {
      window.location.href = '/hot-rooms'
    })
  } 
  return result.data[0]
}

async function userAuth() {
  const response = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if (response.status !== 200) {
    console.log(response.status)
    return
  }

  const result = await response.json()
  return result
}

// async function preventNavbar() {
//   const linkTags = document.querySelectorAll('.navbar a')
//   for (let item of linkTags){
//     item.classList.add('disable-link')
//   }
// }
