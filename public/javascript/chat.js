const form = document.getElementById('form')
const input = document.getElementById('js-input')
const messages = document.querySelector('#messages')
const chatRoomEle = document.querySelector('.chat-room')
const chatHistory = document.querySelector('.chat-history')
const minChatRoomEle = document.querySelector('.min-chat-room')
const chatShrinkBtn = document.querySelector('#js-chat-shrink-btn')
const chatEnlargeBtn = document.querySelector('#js-chat-enlarge-btn')

form.addEventListener('submit', function (e) {
  e.preventDefault()
  if (input.value) {
    socket.emit('chat message', input.value, JSON.parse(localStorage.getItem('userRole')).name)
    input.value = ''
  }
})

chatShrinkBtn.addEventListener('click', () => {
  chatRoomEle.style.display = 'none'
  minChatRoomEle.style.display = 'flex'
})

chatEnlargeBtn.addEventListener('click', () => {
  chatRoomEle.style.display = 'flex'
  minChatRoomEle.style.display = 'none'
})

socket.on('all msg', ()=>{
  
})

socket.on('sendback', (msg, name) => {
  console.log(msg)
  const item = document.createElement('li')
  item.textContent = `${name}: ${msg}`
  item.classList.add('list-group-item', 'rounded-pill')
  messages.appendChild(item)
  chatHistory.scrollTo(0, chatHistory.scrollHeight)
})

socket.on('send my msg', (msg, name) => {
  console.log(msg)
  const item = document.createElement('li')
  item.textContent = `${name}: ${msg}`
  item.classList.add('list-group-item', 'rounded-pill', 'my-msg', 'border-0')
  messages.appendChild(item)
  chatHistory.scrollTo(0, chatHistory.scrollHeight)
})
