const View = {
  warRoomBtn: document.querySelector('.js-start-war-btn'),
  warRoomModal: new bootstrap.Modal(document.querySelector('#war-room-check'), {
    keyboard: false
  }),
  nameInput: document.querySelector('#user-name'),
  createBtn: document.querySelector('#js-create-war-room-btn'),
  createFormData: document.querySelector('.war-room-check-data'),
  userIdInput: document.querySelector('#user_id')
}

View.warRoomBtn.addEventListener('click', (e) => {
  View.nameInput.value = userData.name
  View.warRoomModal.show()
})

View.createBtn.addEventListener('click', async (e) => {
  e.preventDefault()
  View.userIdInput.value = userData.id
  const response = await fetch('/api/1.0/war_room/create_war_room', {
    method: 'POST',
    Authorization: 'Bearer ' + accessToken,
    body: new FormData(View.createFormData)
  })
  const result = await response.json()
  console.log(result)
  const roomId = result.data.insertId

  const streamerRole = JSON.parse(localStorage.getItem('userRole'))
  streamerRole.role = 'streamer'
  localStorage.setItem('userRole', JSON.stringify(streamerRole))

  window.location.href = `/war-room?roomId=${roomId}`
})