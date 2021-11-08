const View = {
  warRooms: document.querySelector('.war-rooms')
}

socketInit()

async function fetchOnlineRooms(onlineClients) {
  const response = await fetch('/api/1.0/war_room/show_online_rooms')
  const result = await response.json()
  const onlineRooms = result.data

  if (!onlineRooms.length) {
    View.warRooms.innerHTML = `<h5 class="text-center">目前沒有人開討論室喔!</h5>`
  } else {
    let warRoomHtml = ''
    onlineRooms.forEach((item) => {
      const clients = onlineClients[item.id]
        ? Object.keys(onlineClients[item.id]).length
        : 0
      warRoomHtml += `
    <a href='/war-room?roomId=${item.id}&stockCode=${item.stock_code}'>
      <div class='war-room shadow-lg'>
        <div>
          <div class="d-flex align-items-center">
            <h3>${item.name} 開台中</h3>
            <img src="/img/live.png" class="live-icon">
            <span class="online-people"><img src="/img/clients.png" class="clients-icon">在線人數:<span room="${item.id}">${clients}</span></span>
          </div>
          <h4 id="war_room_title">${item.war_room_title}</h4>
        </div>
        
        <div class="war-room-preview">
          <div class="d-flex stock-code-title rounded-pill">
            <p>${item.company_name}</p>
            <span class="war-room-code">${item.stock_code}</span>
          </div>
          <div id="stock-preview-${item.id}" class="stock-preview"></div>
        </div>
      </div>
    </a>
    `
    })
    View.warRooms.innerHTML += warRoomHtml

    onlineRooms.forEach((item) => {
      renderRealPriceChart(item.stock_code, item.id)
    })
  }

  
}

async function renderRealPriceChart(stockCode, id) {
  // Get day prices info
  const { isBull, stockPrice } = await fetchDayPrices(stockCode)

  // create a chart
  const chart = anychart.line()

  var ylabels = chart.yAxis().labels()
  ylabels.enabled(false)
  var xlabels = chart.xAxis().labels()
  xlabels.enabled(false)

  chart.xAxis().enabled(false)
  chart.yAxis().enabled(false)

  // create a line series and set the data
  const series = chart.line(stockPrice)
  series.stroke(isBull ? '#f35350' : '#14c9ba')

  // set the container id
  chart.container(`stock-preview-${id}`)

  // initiate drawing the chart
  chart.draw()
}

async function fetchDayPrices(id) {
  const response = await fetch(`/dayPrices/${id}`)
  const result = await response.json()

  // price info
  const stockPrice = []

  result.data[0].chart.indicators.quote[0].close.forEach((price, i) => {
    if (price) {
      stockPrice.push(price)
    } else {
      if (i === 0) {
        stockPrice.push(result.data[0].chart.indicators.quote[0].close[i + 1])
      } else {
        stockPrice.push(result.data[0].chart.indicators.quote[0].close[i - 1])
      }
    }
  })

  const isBull = stockPrice[stockPrice.length - 1] > stockPrice[0]
  return { isBull, stockPrice }
}

async function updateRoomClients(roomId, clients){

}

async function socketInit() {
  const socket = io()
  let socketId

  socket.on('connect', () => {
    console.log('conennetc')
    socketId = socket.id
    socket.emit('get all room clients')
  })

  socket.on('recieve all room clients', (roomClients) => {
    if(!View.warRooms.children.length){
      View.warRooms.innerHTML = ''
      fetchOnlineRooms(roomClients)
    }
    console.log(roomClients)
  })
}
