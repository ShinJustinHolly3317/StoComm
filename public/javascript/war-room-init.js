const ROOM_ID = getQueryObject().roomId
const STOCK_CODE = getQueryObject().stockCode
const USER_ROLE = JSON.parse(localStorage.getItem('userRole'))
let company_name

const WarRoomView = {
  postBtn: document.querySelector('#js-post-war-room'),
  visitorLeaveBtn: document.querySelector('button.visitor'),
  canvasEle: document.querySelector('#canvas')
}

if (!ROOM_ID) {
  alert('無效的房間!')
  window.location.href = '/home.html'
}

const socket = io()
let socketId
socket.on('connect', () => {
  socketId = socket.id
  socket.emit('join room', ROOM_ID)
})

showRoleBtn()

// listener
WarRoomView.postBtn.addEventListener('click', async (e) => {
  if (USER_ROLE.role !== 'streamer') {
    return
  } else {
    USER_ROLE.roomId = ROOM_ID
  }

  const response = await fetch('/api/1.0/war_room/end_war_room', {
    method: 'PATCH',
    body: JSON.stringify(USER_ROLE),
    headers: {
      'Content-type': 'application/json'
    }
  })
  const result = await response.json()

  const canvas = await html2canvas(WarRoomView.canvasEle)
  let canvasImg = canvas.toDataURL('image/jpeg')
  localStorage.setItem('canvas', canvasImg)

  if (response.status === 200) {
    window.location.href = `/post?stockCode=${STOCK_CODE}`
  } else {
    alert('錯誤的操作')
  }
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
function showRoleBtn() {
  if (USER_ROLE.role === 'visitor') {
    WarRoomView.visitorLeaveBtn.style.display = 'block'
  } else if (USER_ROLE.role === 'streamer') {
    WarRoomView.postBtn.style.display = 'block'
  }
}
