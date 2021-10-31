const ROOM_ID = getQueryObject().roomId
const STOCK_CODE = getQueryObject().stockCode
let company_name

const WarRoomView = {
  postBtn: document.querySelector('#js-post-war-room'),
  visitorLeaveBtn: document.querySelector('button.visitor')
}
const postBtn = document.querySelector('#js-post-war-room')


if(!ROOM_ID){
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
  const userRole = JSON.parse(localStorage.getItem('userRole'))
  if (userRole.role !== 'streamer') {
    return
  } else {
    userRole.roomId = ROOM_ID
  }

  const response = await fetch('/api/1.0/war_room/end_war_room', {
    method: 'PATCH',
    body: JSON.stringify(userRole),
    headers:{
      'Content-type': 'application/json'
    }
  })
  const result = await response.json()

  if (response.status === 200) {
    window.location.href = `/post?stockCode=${STOCK_CODE}`
  } else {
    alert('錯誤的操作')
  }
})

// Functions
function showRoleBtn() {
  const userRole = JSON.parse(localStorage.getItem('userRole'))
  console.log(userRole)
  if(userRole.role === 'visitor') {
    WarRoomView.visitorLeaveBtn.style.display = 'block'
  } else if (userRole.role === 'streamer') {
    WarRoomView.postBtn.style.display = 'block'
  }
}