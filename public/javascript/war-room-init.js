const ROOM_ID = getQueryObject().roomId
const STOCK_CODE = getQueryObject().stockCode
let USER = JSON.parse(localStorage.getItem('user'))
let company_name
const accessToken = localStorage.getItem('access_token')

const WarRoomView = {
  postBtn: document.querySelector('#js-post-war-room'),
  allowBtn: document.querySelector('#js-allow-draw'),
  denyBtn: document.querySelector('#js-deny-draw'),
  visitorLeaveBtn: document.querySelector('#leave-icon'),
  canvasEle: document.querySelector('#canvas'),
  confirmLeaveBtn: document.querySelector('#confirm-leave-btn'),
  modalBody: document.querySelector('.modal-body'),
  drawTool: document.querySelector('.draw-tool-area')
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
  await roleAuth()
  socket.emit('join room', ROOM_ID, USER.id)
  await initPeer()
  socket.emit('init draw tool')
})

socket.on('update init draw tool', (drawToolTurnOn) => {
  if (drawToolTurnOn) {
    WarRoomView.drawTool.classList.remove('hidden')
  }
})

socket.on('update turn on draw', () => {
  Swal.fire({
    title: '繪圖工具打開囉!',
    showConfirmButton: false,
    timer: 1500
  })
  WarRoomView.drawTool.classList.remove('hidden')
})
socket.on('update turn off draw', () => {
  Swal.fire({
    title: '繪圖工具已關閉!',
    showConfirmButton: false,
    timer: 1500
  })
  WarRoomView.drawTool.classList.add('hidden')
})

// listener
WarRoomView.postBtn.addEventListener('click', async (e) => {
  // if (USER.role !== 'streamer') {
  //   return
  // } else {
  //   USER.roomId = ROOM_ID
  // }

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
    window.location.href = `/post?stockCode=${STOCK_CODE}`
  } else {
    Swal.fire({
      icon: 'error',
      title: '錯誤的操作',
      confirmButtonColor: '#315375'
    })
  }
})

WarRoomView.allowBtn.addEventListener('click', async (e) => {
  socket.emit('turn on draw')
  const clientsId = []
  const userResult = await userAuth()

  if (userResult.data.role !== 'streamer') return

  socket.once('recieve all room clients', async (onlineClients) => {
    for (let key in onlineClients[ROOM_ID]) {
      clientsId.push(onlineClients[ROOM_ID][key].peerId)
    }
    console.log(clientsId)

    const response = await fetch('/api/1.0/user/user_permission', {
      method: 'PATCH',
      body: JSON.stringify({
        type: 'is_allDrawable',
        isAllow: true,
        usersId: clientsId
      }),
      headers: {
        'Content-type': 'application/json'
      }
    })
    const result = await response.json()

    if (response.status === 200) {
      WarRoomView.denyBtn.style.display = 'block'
      WarRoomView.allowBtn.style.display = 'none'
    } else {
      Swal.fire({
        icon: 'error',
        title: '錯誤的操作',
        confirmButtonColor: '#315375'
      })
    }
  })
  socket.emit('get all room clients')
})

WarRoomView.denyBtn.addEventListener('click', async (e) => {
  socket.emit('turn off draw')
  const clientsId = []
  const userResult = await userAuth()

  if (userResult.data.role !== 'streamer') return

  socket.once('recieve all room clients', async (onlineClients) => {
    for (let key in onlineClients[ROOM_ID]) {
      clientsId.push(onlineClients[ROOM_ID][key].peerId)
    }
    console.log(clientsId)

    const response = await fetch('/api/1.0/user/user_permission', {
      method: 'PATCH',
      body: JSON.stringify({
        type: 'is_allDrawable',
        isAllow: false,
        usersId: clientsId
      }),
      headers: {
        'Content-type': 'application/json'
      }
    })
    const result = await response.json()

    if (response.status === 200) {
      WarRoomView.denyBtn.style.display = 'none'
      WarRoomView.allowBtn.style.display = 'block'
    } else {
      Swal.fire({
        icon: 'error',
        title: '錯誤的操作',
        confirmButtonColor: '#315375'
      })
    }
  })
  socket.emit('get all room clients')
})

document.querySelector('.navbar').addEventListener('click', (e) => {
  console.log(e.target.tagName)
  if (e.target.parentElement.tagName === 'A') {
    window.addEventListener('beforeunload', function (e) {
      // Cancel the event
      e.preventDefault() // If you prevent default behavior in Mozilla Firefox prompt will always be shown
      // Chrome requires returnValue to be set
      e.returnValue = ''
    })
  }
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

  // const response = await fetch('/api/1.0/user/user_auth', {
  //   method: 'GET',
  //   headers: {
  //     Authorization: 'Bearer ' + accessToken
  //   }
  // })

  // const result = await response.json()
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
      WarRoomView.postBtn.style.display = 'block'
      WarRoomView.allowBtn.style.display = 'block'
      WarRoomView.confirmLeaveBtn.innerHTML = '確定'
      WarRoomView.modalBody.innerText = '確定要離開嗎?你的粉絲在等著你'
      WarRoomView.confirmLeaveBtn.setAttribute('streamer', true)
      WarRoomView.drawTool.classList.remove('hidden')

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
            window.location.href = '/hot-rooms'
          }
        })
    } else if (!result.data.is_drawable) {
      document.querySelector('.add-canvas').style.display = 'none'
    }
    // USER = {
    //   id: result.data.id,
    //   name: result.data.name,
    //   email: result.data.email,
    //   piture: result.data.picture
    // }
  }
}

async function roomAuth() {
  // check this room exist or not
}

async function userAuth() {
  const response = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if(response.status !== 200){
    console.log(response.status)
    return 
  }

  const result = await response.json()
  return result
}
