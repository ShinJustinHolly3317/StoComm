const REAL_TIME_URL = `https://api.fugle.tw/realtime/v0.3/intraday/quote?symbolId=${STOCK_CODE}&apiToken=06108efd4883e72e0f65cc1672eaa4a1`

const realTimePriceCtx = document.querySelector('#stock-real-price')
const dayPriceCtx = document.querySelector('#stock-day-history')
const stockWrapper = document.querySelector('#stock-real-price-wrapper')
const minStockWrapper = document.querySelector('.min-stock-real-price')
const stockShrinkBtn = document.querySelector('#js-stock-shrink-btn')
const stockEnlargeBtn = document.querySelector('#js-stock-enlarge-btn')

// chart ID
let realTimePriceChart = ''
let dayPriceChart = ''

// carousel setting
const myCarousel = document.querySelector('#carouselExampleDark')
const carousel = new bootstrap.Carousel(myCarousel, {
  interval: false
})

// first load
let chartIntervalId
;(async function () {
  company_name = await getCompanyName(STOCK_CODE)
  await renderRevenueChart(STOCK_CODE)
  // await renderGrossChart(STOCK_CODE)
  await renderRealPriceChart(realTimePriceCtx)
  await renderNews(STOCK_CODE)
  await renderChips(STOCK_CODE)
  yearPriceHistory()

  chartIntervalId = setInterval(() => {
    if (new Date().getHours() * 60 + new Date().getMinutes() - 540 > 270) {
      clearInterval(chartIntervalId)
    }
    renderRealPriceChart(realTimePriceCtx)
  }, 60000)
})()

// functions
async function renderRealPriceChart(ctx) {
  // Get day prices info
  const { prevClosePrice, limitUp, limitDown, stockPrice, timeStamps } =
    await fetchDayPrices(STOCK_CODE)

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
        },
        tooltip: {
          callbacks: {
            label: function (contenxt) {
              return '股價: ' + contenxt.parsed.y + '元'
            }
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

  // disble loading img
  document.querySelector('.stock-real-price-loading').classList.add('hidden')
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

  return { openTime, closeTime }
}

async function fetchDayPrices(id) {
  const response = await fetch(`/dayPrices/${id}`)
  const result = await response.json()

  // price info
  const prevClosePrice = result.data[0].chart.meta.previousClose
  const limitUp = prevClosePrice * 1.1
  const limitDown = prevClosePrice * 0.9
  const stockPrice = []
  const timeStamps = []

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

  result.data[0].chart.timestamp.forEach((timeByMinute) => {
    timeStamps.push(moment(timeByMinute * 1000).format('YYYY-MM-DDTHH:mm:ss'))
  })

  return { prevClosePrice, limitUp, limitDown, stockPrice, timeStamps }
}

async function renderRevenueChart(id) {
  const response = await fetch(`/stockRevenue/${id}`)
  const result = await response.json()
  const revenueData = result.data
  console.log(revenueData)
  if (!revenueData.length) {
    document.querySelector('#revenue-chart').innerHTML = `
      <div class="d-flex justify-content-center align-items-center h-100">
        <h4 class="m-auto">查無此公司財務資訊</h4>
      </div>
    `
    // disble loading img
    document.querySelector('.revenue-loading').classList.add('hidden')
    return
  }

  const revenueByMonth = []
  for (let item of revenueData) {
    revenueByMonth.push([item.year + item.quarter, item.revenue / 100000])
  }

  // create a chart
  const chart = anychart.column()

  // set chart title text settings
  chart.title(`${company_name}(${STOCK_CODE}) 月營收 (億)`)

  // create a column series and set the data
  var series = chart.column(revenueByMonth)

  // set series tooltip settings
  series.tooltip().titleFormat('{%X}')

  series
    .tooltip()
    .position('center-top')
    .anchor('center-bottom')
    .offsetX(0)
    .offsetY(5)
    .format('${%Value}(億)')

  // set yAxis labels formatter
  chart.yAxis().labels().format('${%Value}(億)')

  // set the container id
  chart.container('revenue-chart')

  // initiate drawing the chart
  chart.draw()

  // disble loading img
  document.querySelector('.revenue-loading').classList.add('hidden')
}

async function renderGrossChart(id) {
  const response = await fetch(`/stockGross/${id}`)
  const result = await response.json()
  const grossData = result.data

  const grossByQuarter = []
  for (let key of grossData) {
    grossByQuarter.push([key, grossData[key][0]])
  }

  // create a chart
  const chart = anychart.column()

  // set chart title text settings
  chart.title(`${company_name}(${STOCK_CODE}) 季毛利(億)`)

  // create a column series and set the data
  var series = chart.column(grossByQuarter)

  // set series tooltip settings
  series.tooltip().titleFormat('{%X}')

  series
    .tooltip()
    .position('center-top')
    .anchor('center-bottom')
    .offsetX(0)
    .offsetY(5)
    .format('${%Value}(億)')

  // set yAxis labels formatter
  chart.yAxis().labels().format('${%Value}(億)')

  // set the container id
  chart.container('gross-chart')

  // initiate drawing the chart
  chart.draw()
}

async function renderChips(stockCode) {
  const response = await fetch(`/stockChip/${stockCode}`)
  const chipData = await response.json()
  const foreign = []
  const investmentTrust = []
  const dealer = []

  if (!chipData.length) {
    document.querySelector('#chip-chart').innerHTML = `
      <div class="d-flex justify-content-center align-items-center h-100">
        <h4 class="m-auto">查無此公司籌碼資訊</h4>
      </div>
    `
    // disble loading img
    document.querySelector('.chip-loading').classList.add('hidden')
    return
  }

  for (let index in chipData) {
    if (index > 10) {
      break
    }
    foreign.push([chipData[index][0], chipData[index][1]])
    investmentTrust.push([chipData[index][0], chipData[index][2]])
    dealer.push([chipData[index][0], chipData[index][3]])
  }

  // create a chart
  const chart = anychart.column()

  // set chart title text settings
  chart.title(`${company_name}(${STOCK_CODE})三大法人買賣超`)

  // create a column series and set the data
  var series1 = chart.column(foreign)
  var series2 = chart.column(investmentTrust)
  var series3 = chart.column(dealer)

  // set series tooltip settings
  series1.tooltip().titleFormat('{%X}')
  series1
    .tooltip()
    .position('center-top')
    .anchor('center-bottom')
    .offsetX(0)
    .offsetY(5)
    .format('外資{%Value}(張)')
  series2.tooltip().titleFormat('{%X}')
  series2
    .tooltip()
    .position('center-top')
    .anchor('center-bottom')
    .offsetX(0)
    .offsetY(5)
    .format('投信{%Value}(張)')
  series3.tooltip().titleFormat('{%X}')
  series3
    .tooltip()
    .position('center-top')
    .anchor('center-bottom')
    .offsetX(0)
    .offsetY(5)
    .format('自營商{%Value}(張)')

  // set yAxis labels formatter
  chart.yAxis().labels().format('${%Value}(張)')
  chart.xAxis().labels().rotation(-90)

  // set the container id
  chart.container('chip-chart')

  // initiate drawing the chart
  chart.draw()

  // disble loading img
  document.querySelector('.chip-loading').classList.add('hidden')
}

async function renderNews(id) {
  const response = await fetch(`/stockNews/${id}`)
  if (response.status === 404) {
    document.querySelector('.news-card').innerHTML = `
      <div class="d-flex justify-content-center align-items-center h-100">
        <h4 class="m-auto">查無此公司新聞資訊</h4>
      </div>
    `
    // disable loading image
    document.querySelector('.news-loading').classList.add('hidden')
    return
  } else {
    const result = await response.json()
    const newsData = result.data
    const newsCard = document.querySelector('.news-card')

    let titleHtml = ``
    for (let item of newsData) {
      titleHtml += `
    <li class="list-group py-2 px-2">
      <p class="mb-0 text-secondary">${item.date}</p>
      <a href="${item.link}">${item.title}</a>
    </li>
    `
    }
    newsCard.innerHTML += titleHtml
  }

  // disable loading image
  document.querySelector('.news-loading').classList.add('hidden')
}

async function yearPriceHistory() {
  let table, mapping, chart
  const url = `/yearPrice/${STOCK_CODE}`
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

  // disble loading img
  document.querySelector('.year-history-loading').classList.add('hidden')
}

async function getCompanyName(stockCode) {
  const response = await fetch(`/companyName/${stockCode}`)

  if (response.status !== 200) {
    company_name = '無法取得'
    return
  }

  const result = await response.json()
  return result.data
}

// Listener
stockShrinkBtn.addEventListener('click', () => {
  stockWrapper.style.display = 'none'
  stockWrapper.style.zIndex = 2
  // minStockWrapper.style.display = 'flex'
})

stockEnlargeBtn.addEventListener('click', () => {
  if (stockWrapper.style.display === 'flex') {
    stockWrapper.style.display = 'none'
  } else {
    stockWrapper.style.display = 'flex'
    stockWrapper.style.zIndex = 3
  }
  // minStockWrapper.style.display = 'none'
})
