const View = {
  warRooms: document.querySelector('.war-rooms')
}

fetchOnlineRooms()

async function fetchOnlineRooms() {
  const response = await fetch('/api/1.0/war_room/show_online_rooms')
  const result = await response.json()
  const onlineRooms = result.data

  let warRoomHtml = ''
  onlineRooms.forEach(item => {
    warRoomHtml += `
    <a href='/war-room?roomId=${item.id}'>
      <div class='war-room shadow-lg'>
        <h3>${item.name} 開台中</h3>
        <h3>${item.stock_id}</h3>
        <h3>${item.date_time}</h3>
      </div>
    </a>
    `
  })
  View.warRooms.innerHTML += warRoomHtml
}