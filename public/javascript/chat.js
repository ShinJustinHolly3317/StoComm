const form = document.getElementById('form')
const input = document.getElementById('js-input')
const messages = document.querySelector('#messages')

form.addEventListener('submit', function (e) {
  e.preventDefault()
  if (input.value) {
    socket.emit('chat message', input.value)
    input.value = ''
  }
})

socket.on('sendback', (msg) => {
  console.log(msg)
  const item = document.createElement('li')
  item.textContent = msg
  item.classList.add('list-group-item')
  messages.appendChild(item)
  // window.scrollTo(0, document.body.scrollHeight)
})
