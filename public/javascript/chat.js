const form = document.getElementById('form')
const input = document.getElementById('js-input')
const messages = document.querySelector('#messages')
const chatRoomEle = document.querySelector('.chat-room')
const chatHistoryEle = document.querySelector('.chat-history')
const minChatRoomEle = document.querySelector('.min-chat-room')
const chatShrinkBtn = document.querySelector('#js-chat-shrink-btn')
const chatEnlargeBtn = document.querySelector('#js-chat-enlarge-btn')

form.addEventListener('submit', function (e) {
  e.preventDefault()
  if (input.value) {
    socket.emit('chat message', input.value, USER_ROLE.name, USER_ROLE.id)
    input.value = ''
  }
})

chatShrinkBtn.addEventListener('click', () => {
  chatRoomEle.style.display = 'none'
  chatRoomEle.style.zIndex = 2
  minChatRoomEle.style.display = 'flex'
})

chatEnlargeBtn.addEventListener('click', () => {
  chatRoomEle.style.display = 'flex'
  chatRoomEle.style.zIndex = 3
  minChatRoomEle.style.display = 'none'
})

socket.on('all messages', (chatHistory)=>{
  if (!chatHistory || !chatHistory.length) return
  for (let item of chatHistory) {
    console.log('userid', Number(USER_ROLE.id))
    if (item[0] === Number(USER_ROLE.id)) {
      const otherChat = document.createElement('li')
      otherChat.textContent = `${item[1]}: ${item[2]}`
      otherChat.classList.add(
        'list-group-item',
        'rounded-pill',
        'my-msg',
        'border-0'
      )
      messages.appendChild(otherChat)
    } else {
      const myChat = document.createElement('li')
      myChat.textContent = `${item[1]}: ${item[2]}`
      myChat.classList.add('list-group-item', 'rounded-pill')
      messages.appendChild(myChat)
    }
  }
  chatHistoryEle.scrollTo(0, chatHistoryEle.scrollHeight)
})



socket.on('sendback', (msg, name) => {
  const myChat = document.createElement('li')
  myChat.textContent = `${name}: ${msg}`
  myChat.classList.add('list-group-item', 'rounded-pill')
  messages.appendChild(myChat)
  chatHistoryEle.scrollTo(0, chatHistoryEle.scrollHeight)
})

socket.on('send my msg', (msg, name) => {
  const otherChat = document.createElement('li')
  otherChat.textContent = `${name}: ${msg}`
  otherChat.classList.add(
    'list-group-item',
    'rounded-pill',
    'my-msg',
    'border-0'
  )
  messages.appendChild(otherChat)
  chatHistoryEle.scrollTo(0, chatHistoryEle.scrollHeight)
})
