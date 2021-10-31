const WWS_URL = `wss://api.fugle.tw/realtime/v0.3/intraday/quote?symbolId=${STOCK_CODE}&apiToken=06108efd4883e72e0f65cc1672eaa4a1`

const realTimePriceCtx = document.querySelector('#stock-real-price')
const dayPriceCtx = document.querySelector('#stock-day-history')
const stockWrapper = document.querySelector('#stock-real-price-wrapper')
const minStockWrapper = document.querySelector('.min-stock-real-price')
const stockShrinkBtn = document.querySelector('#js-stock-shrink-btn')
const stockEnlargeBtn = document.querySelector('#js-stock-enlarge-btn')

// real time price temp
const timeStamps = []
const stockPrice = []

// chart ID
let realTimePriceChart = ''
let dayPriceChart = ''

// carousel setting
const myCarousel = document.querySelector('#carouselExampleDark')
const carousel = new bootstrap.Carousel(myCarousel, {
  interval: false
})

// first load
;(async function () {
  await renderRevenueChart(dayPriceCtx, STOCK_CODE)
  await renderRealPriceChart(realTimePriceCtx)
  await renderNews(STOCK_CODE)
  anychart.onDocumentReady(yearPriceHistory)
})()

// wws keep updating stock price
const wss = new WebSocket(WWS_URL)
wss.onopen = (res) => {
  console.log('wss msg:', res)
}
wss.onmessage = (res) => {
  stockPrice.push(JSON.parse(res.data).data.quote.trade.price)
  timeStamps.push(
    moment(JSON.parse(res.data).data.quote.trade.at).format(
      'YYYY-MM-DDTHH:mm:ss'
    )
  )
  renderRealPriceChart(realTimePriceCtx)
}

// functions
async function renderRealPriceChart(ctx) {
  // Get day prices info
  const { prevClosePrice, limitUp, limitDown } = await fetchDayPrices(
    STOCK_CODE
  )

  // stock price data (x:time, Y:price)
  const data = {
    labels: timeStamps,
    datasets: [
      {
        label: 'Dataset 1',
        data: stockPrice,
        borderColor: 'red'
        // backgroundColor: Utils.transparentize(Utils.CHART_COLORS.red, 0.5),
      }
    ]
  }

  // delete old chart when refreshing
  if (realTimePriceChart) {
    realTimePriceChart.destroy()
  }

  // Create new price-time chart
  realTimePriceChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          display: false
        },
        title: {
          display: true,
          text: `${company_name}(${STOCK_CODE}) 即時股價`,
          font: {
            size: 30
          }
        }
      },
      animation: {
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize

      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            stepSize: 30
          },
          min: tradingDuration().openTime,
          max: tradingDuration().closeTime
          // title: {
          //   display: true,
          //   text: 'Date'
          // }
        },
        y: {
          min: limitDown,
          max: limitUp
        }
      },
      elements: {
        point: {
          radius: 0
        }
      }
    }
  })
}

async function fetchStockQuote() {
  const response = await fetch(REAL_TIME_URL)
  const result = await response.json()
  stockPrice.push(result.data.quote.trade.price)
  timeStamps.push(moment().format('YYYY-MM-DDTHH:mm:ss'))
}

function tradingDuration() {
  // get friday date
  let friday
  if (Date().slice(0, 3) === 'Sun') {
    friday = moment().subtract(2, 'days')
  } else if (Date().slice(0, 3) === 'Sat') {
    friday = moment().subtract(1, 'days')
  }

  const openTime =
    Date().slice(0, 3) !== 'Sun' && Date().slice(0, 3) !== 'Sat'
      ? moment().format('YYYY-MM-DD') + 'T09:00:00'
      : friday.format('YYYY-MM-DD') + 'T09:00:00'
  const closeTime =
    Date().slice(0, 3) !== 'Sun' && Date().slice(0, 3) !== 'Sat'
      ? moment().format('YYYY-MM-DD') + 'T13:30:00'
      : friday.format('YYYY-MM-DD') + 'T13:30:00'

  console.log(openTime, closeTime)
  return { openTime, closeTime }
}

async function fetchDayPrices(id) {
  const response = await fetch(`/dayPrices/${id}`)
  const result = await response.json()

  // price info
  const prevClosePrice = result.data[0].chart.meta.previousClose
  const limitUp = prevClosePrice * 1.1
  const limitDown = prevClosePrice * 0.9
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

  result.data[0].chart.timestamp.forEach((timeByMinute) => {
    timeStamps.push(moment(timeByMinute * 1000).format('YYYY-MM-DDTHH:mm:ss'))
  })

  return { prevClosePrice, limitUp, limitDown }
}

async function renderRevenueChart(ctx, id) {
  const response = await fetch(`/stockRevenue/${id}`)
  const result = await response.json()
  const revenueData = result.data
  company_name = revenueData[0].company_name

  // arrange revenue data
  const monthList = []
  const revenueByMonth = []
  for (let item of revenueData) {
    if (item.month === '2018/01') break
    monthList.push(moment(item.month).format('YYYY-MM'))
    revenueByMonth.push(item.revenue)
  }

  const data = {
    labels: monthList,
    datasets: [
      {
        label: `${company_name}(${STOCK_CODE}) 月營收 (億)`,
        data: revenueByMonth,
        backgroundColor: ['rgba(54, 162, 235)'],
        borderColor: ['rgb(54, 162, 235)'],
        borderWidth: 1
      }
    ]
  }

  dayPriceChart = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true
        }
      }
    }
  })
}

async function renderNews(id) {
  const response = await fetch(`/stockNews/${id}`)
  const result = await response.json()
  const newsData = result.data
  const newsCard = document.querySelector('.news-card')

  let titleHtml = ``
  for (let item of newsData) {
    let searchUrl = new URLSearchParams(item.link.split('LINK=')[1])
    let url
    for (let serachItem of searchUrl) {
      url = serachItem
    }
    titleHtml += `
    <li class="list-group"><a href="${url}">${item.title}</a></li>
    `
  }
  newsCard.innerHTML += titleHtml
}

async function yearPriceHistory() {
  let table, mapping, chart
  const url = `/year_price/${STOCK_CODE}`
  const resposne = await fetch(url)
  const result = await resposne.json()

  table = anychart.data.table()
  table.addData(result)

  // mapping the data
  mapping = table.mapAs()
  mapping.addField('open', 1, 'first')
  mapping.addField('high', 2, 'max')
  mapping.addField('low', 3, 'min')
  mapping.addField('close', 4, 'last')
  const valueMapping = table.mapAs({
    value: 5
  })

  // defining the chart type
  chart = anychart.stock()

  // turn off scroll bar
  // chart.scroller().enabled(false)
  chart.plot(0).xGrid().enabled(true)
  chart.plot(0).yGrid().enabled(true)

  const yScale = chart.plot(0).yScale()
  const yTicks = yScale.ticks()
  yTicks.interval(20)
  var scale = chart.xScale()
  scale.ticks([
    { major: { unit: 'month', count: 1 }, minor: { unit: 'month', count: 1 } }
  ])

  // set the series type
  const series_globex = chart.plot(0).candlestick(mapping)
  const volumeSeries = chart.plot(1).column(valueMapping)
  series_globex.name(`${company_name}(${STOCK_CODE})`)
  volumeSeries.name('volumes')

  // set max height of volume series and attach it to the bottom of plot
  chart.plot(1).height('30%').bottom(0)

  // color setting
  series_globex.risingStroke('#f35350')
  series_globex.risingFill('#f35350')
  series_globex.fallingStroke('#14c9ba')
  series_globex.fallingFill('#14c9ba')

  // setting the chart title
  chart.title(`${company_name}(${STOCK_CODE})歷史走勢`)

  // display the chart
  chart.container('year-history')
  chart.draw()
}

// Listener
stockShrinkBtn.addEventListener('click', () => {
  stockWrapper.style.display = 'none'
  minStockWrapper.style.display = 'flex'
})

stockEnlargeBtn.addEventListener('click', () => {
  stockWrapper.style.display = 'flex'
  minStockWrapper.style.display = 'none'
})
