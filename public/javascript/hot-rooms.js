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
        <div class="d-flex">
          <h3>${item.name} 開台中</h3>
          <h3>${item.company_name} (${item.stock_code})</h3>
        </div>
        
        <h4 id="war_room_title">${item.war_room_title}</h4>
        <p id="war-room-time">${item.date_time}</p>
      </div>
    </a>
    `
  })
  View.warRooms.innerHTML += warRoomHtml
}