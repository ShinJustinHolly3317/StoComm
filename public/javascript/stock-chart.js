const REAL_TIME_URL =
  'https://api.fugle.tw/realtime/v0.3/intraday/quote?symbolId=3037&apiToken=06108efd4883e72e0f65cc1672eaa4a1'
const WWS_URL =
  'wss://api.fugle.tw/realtime/v0.3/intraday/quote?symbolId=3037&apiToken=06108efd4883e72e0f65cc1672eaa4a1'

const realTimePriceCtx = document.querySelector('#stock-real-price')
const dayPriceCtx = document.querySelector('#stock-day-history')

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
renderRealPriceChart(realTimePriceCtx)
renderDayPriceChart(dayPriceCtx, 2303)
renderNews(2303)

// keep updating stock price
// setInterval(() => {
//   fetchStockQuote()
//   renderChart(realTimePriceCtx)
// }, 2000)

// wws test
// const wss = new WebSocket(WWS_URL)
// console.log('state', wws.readyState)
// wss.onopen = (res) => {
//   console.log('wss msg:', res.data)
// }
// wss.onmessage = (res) => {
//   console.log('wss msg:', res.data)
// }

// functions
async function renderRealPriceChart(ctx) {
  // Get day prices info
  const { prevClosePrice, limitUp, limitDown, dayPrices, timestamps } =
    await fetchDayPrices(2303)

  // stock price data (x:time, Y:price)
  const data = {
    labels: timestamps,
    datasets: [
      {
        label: 'Dataset 1',
        data: dayPrices,
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
          text: `聯電(2330) 即時股價`,
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

  console.log(moment().format('YYYY-MM-DDTHH:mm:ss'))
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
  const dayPrices = result.data[0].chart.indicators.quote[0].close.map(
    (price, i) => {
      if (price) {
        return price
      } else {
        if (i === 0) {
          return result.data[0].chart.indicators.quote[0].close[i + 1]
        } else {
          return result.data[0].chart.indicators.quote[0].close[i - 1]
        }
      }
    }
  )

  const timestamps = result.data[0].chart.timestamp.map((timeByMinute) => {
    return moment(timeByMinute * 1000).format('YYYY-MM-DDTHH:mm:ss')
  })

  return { prevClosePrice, limitUp, limitDown, dayPrices, timestamps }
}

async function renderDayPriceChart(ctx, id) {
  const response = await fetch(`/stockRevenue/${id}`)
  const result = await response.json()
  const revenueData = result.data
  
  // arrange revenue data
  const monthList = []
  const revenueByMonth = []
  for (let item of revenueData) {
    if (item.month === '2018/01') break
    monthList.push(item.month)
    revenueByMonth.push(item.revenue)
  }

  const data = {
    labels: monthList,
    datasets: [
      {
        label: '聯電(2303) 月營收',
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

async function renderNews(id){
  const response = await fetch(`/stockNews/${id}`)
  const result = await response.json()
  const newsData = result.data
  console.log(newsData)

  const newsCard = document.querySelector('.news-card')
  

  for (let item of newsData){
    const titleEle = document.createElement('li')
    titleEle.classList.add('list-group')
    titleEle.innerText = item.title
    newsCard.appendChild(titleEle)
  } 
}