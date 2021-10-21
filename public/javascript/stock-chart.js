const URL =
  'https://api.fugle.tw/realtime/v0.3/intraday/quote?symbolId=3037&apiToken=06108efd4883e72e0f65cc1672eaa4a1'

var ctx = document.getElementById('stock-real-price')

const timeStamps = []
const stockPrice = []
let myChart = ''

// first load
renderChart(ctx)

// keep updating stock price
setInterval(() => {
  fetchStockQuote()
  renderChart(ctx)
}, 2000)

function renderChart(ctx) {
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

  if (myChart) {
    myChart.destroy()
  }

  myChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Stock-Real-time-price'
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
            unit: 'hour'
          },
          min: moment().format('YYYY-MM-DD') + 'T09:00:00',
          max: moment().format('YYYY-MM-DD') + 'T13:30:00'
          // title: {
          //   display: true,
          //   text: 'Date'
          // }
        },
        y: {
          min: 140,
          max: 160
        }
      }
    }
  })
}

async function fetchStockQuote() {
  const response = await fetch(URL)
  const result = await response.json()
  stockPrice.push(result.data.quote.trade.price)
  timeStamps.push(moment().format('YYYY-MM-DDTHH:mm:ss'))
  // timeStamps.push('09:00:00')
  console.log(moment().format('YYYY-MM-DDTHH:mm:ss'))
}

function newTime(mins) {
  return moment().add(mins, 'm').format('hh:mm:ss')
}
