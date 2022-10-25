const form = document.getElementById('form')
const input = document.getElementById('js-input')
const messages = document.querySelector('#messages')
const chatRoomEle = document.querySelector('.chat-room')
const chatHistoryEle = document.querySelector('.chat-history')
const minChatRoomEle = document.querySelector('.min-chat-room')
const chatShrinkBtn = document.querySelector('#js-chat-shrink-btn')
const chatEnlargeBtn = document.querySelector('#js-chat-enlarge-btn')
const chatNotification = document.querySelector('.chat-notification')

form.addEventListener('submit', function (e) {
  e.preventDefault()
  if (input.value) {
    socket.emit('chat message', input.value, USER.name, USER.id)
    input.value = ''
  }
})

chatShrinkBtn.addEventListener('click', () => {
  chatRoomEle.style.display = 'none'
  chatRoomEle.style.zIndex = 2
  // minChatRoomEle.style.display = 'flex'
})

chatEnlargeBtn.addEventListener('click', () => {
  chatNotification.classList.add('hidden')

  if (chatRoomEle.style.display === 'flex') {
    chatRoomEle.style.display = 'none'
  } else {
    chatRoomEle.style.display = 'flex'
    chatRoomEle.style.zIndex = 3
  }
})

socket.on('all messages', (chatHistory) => {
  if (!chatHistory || !chatHistory.length) return

  // add notification mark
  chatNotification.classList.remove('hidden')

  for (let item of chatHistory) {
    if (item[0] === Number(USER.id)) {
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

socket.on('sendback', (msg, name, enterMsg) => {
  const myChat = document.createElement('li')

  // add notification mark when other send messages
  chatNotification.classList.remove('hidden')

  if (enterMsg) {
    myChat.textContent = `${msg}`
    myChat.classList.add('list-group-item', 'rounded-pill', 'enter-msg')
  } else {
    myChat.textContent = `${name}: ${msg}`
    myChat.classList.add('list-group-item', 'rounded-pill')
  }

  messages.appendChild(myChat)
  chatHistoryEle.scrollTo(0, chatHistoryEle.scrollHeight)
})

socket.on('send my msg', (msg, name, enterMsg) => {
  const otherChat = document.createElement('li')

  if (enterMsg) {
    otherChat.textContent = `${msg}`
    otherChat.classList.add('list-group-item', 'rounded-pill', 'enter-msg')
  } else {
    otherChat.textContent = `${name}: ${msg}`
    otherChat.classList.add(
      'list-group-item',
      'rounded-pill',
      'my-msg',
      'border-0'
    )
  }

  messages.appendChild(otherChat)
  chatHistoryEle.scrollTo(0, chatHistoryEle.scrollHeight)
})

socket.on('user left msg', (msg) => {
  // add notification mark when other send messages
  chatNotification.classList.remove('hidden')

  const otherChat = document.createElement('li')
  otherChat.textContent = `${msg}`
  otherChat.classList.add('list-group-item', 'rounded-pill', 'enter-msg')
  messages.appendChild(otherChat)
  chatHistoryEle.scrollTo(0, chatHistoryEle.scrollHeight)
})
