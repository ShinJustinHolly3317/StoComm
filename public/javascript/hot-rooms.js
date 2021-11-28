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
      let clients
      if (onlineClients[item.id].hostId) {
        clients = Object.keys(onlineClients[item.id]).length - 1
      } else {
        clients = Object.keys(onlineClients[item.id]).length
      }
      let hiddenColsingMsg = !clients ? '' : 'hidden'

      warRoomHtml += `
      <a href='/war-room?roomId=${item.id}&stockCode=${item.stock_code}'>
        <div class='war-room shadow-lg'>
          <div>
            <div class="d-flex align-items-center">
              <h3>${item.name}<h5 class="my-0 me-3">的研究室</h5></h3>
              <img src="/img/live.png" class="live-icon">
              <div class="online-people-area">
                <span class="online-people"><img src="/img/clients.png" class="clients-icon">在線人數:<span room="${item.id}">${clients}</span></span>
                <div class="rounded-pill closing-warning ${hiddenColsingMsg}">即將在 1 分鐘後關閉</div>
              </div>
              
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

  // disable tooltip
  chart.tooltip(false)

  var ylabels = chart.yAxis().labels()
  ylabels.enabled(false)
  var xlabels = chart.xAxis().labels()
  xlabels.enabled(false)

  chart.xAxis().enabled(false)
  chart.yAxis().enabled(false)

  // create a line series and set the data
  const series = chart.line(stockPrice)
  series.stroke(isBull ? '#f35350' : '#14c9ba')

  series.hovered().markers(false)

  // set the container id
  chart.container(`stock-preview-${id}`)

  // initiate drawing the chart
  chart.draw()
}

async function fetchDayPrices(id) {
  const response = await fetch(`/api/1.0/stock/day-prices/${id}`)
  const result = await response.json()

  // price info
  const stockPrice = []
  const prevClosePrice = result.data[0].chart.meta.previousClose

  result.data[0].chart.indicators.quote[0].close.forEach((price, i) => {
    if (price) {
      stockPrice.push(price)
    } else {
      if (i === 0) {
        stockPrice.push(prevClosePrice)
      } else {
        stockPrice.push(stockPrice[i - 1])
      }
    }
  })

  const isBull = stockPrice[stockPrice.length - 1] > stockPrice[0]
  return { isBull, stockPrice }
}

async function socketInit() {
  const socket = io({
    auth: {
      visitorAccess: true,
      type: 'hot_rooms'
    }
  })

  socket.on('recieve all room clients', async (roomClients) => {
    if (!View.warRooms.children.length) {
      View.warRooms.innerHTML = ''
      await fetchOnlineRooms(roomClients)
      closeLoading()
    }
  })

  socket.on('connect', () => {
    socket.emit('get all room clients')
  })

  socket.on('connect_error', async (err) => {
    closeLoading()
    return
  })
}
