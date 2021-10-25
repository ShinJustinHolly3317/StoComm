const form = document.getElementById('form')
const input = document.getElementById('js-input')
const messages = document.querySelector('#messages')
const chatRoomEle = document.querySelector('.chat-room')
const minChatRoomEle = document.querySelector('.min-chat-room')
const chatShrinkBtn = document.querySelector('#js-chat-shrink-btn')
const chatEnlargeBtn = document.querySelector('#js-chat-enlarge-btn')

form.addEventListener('submit', function (e) {
  e.preventDefault()
  if (input.value) {
    socket.emit('chat message', input.value)
    input.value = ''
  }
})

chatShrinkBtn.addEventListener('click', ()=>{
  chatRoomEle.style.display = 'none'
  minChatRoomEle.style.display = 'flex'
})

chatEnlargeBtn.addEventListener('click', () => {
  chatRoomEle.style.display = 'flex'
  minChatRoomEle.style.display = 'none'
})

socket.on('sendback', (msg) => {
  console.log(msg)
  const item = document.createElement('li')
  item.textContent = msg
  item.classList.add('list-group-item', 'rounded-pill')
  messages.appendChild(item)
  // window.scrollTo(0, document.body.scrollHeight)
})

socket.on('send my msg', (msg) => {
  console.log(msg)
  const item = document.createElement('li')
  item.textContent = msg
  item.classList.add('list-group-item', 'rounded-pill', 'my-msg', 'border-0')
  messages.appendChild(item)
})