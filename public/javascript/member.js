const View = {
  warRoomBtn: document.querySelector('.js-start-war-btn'),
  warRoomModal: new bootstrap.Modal(document.querySelector('#war-room-check'), {
    keyboard: false
  }),
  nameInput: document.querySelector('#user-name')
}

View.warRoomBtn.addEventListener('click', (e) => {
  View.nameInput.value = userData.name
  View.warRoomModal.show()
})