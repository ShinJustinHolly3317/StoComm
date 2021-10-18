const URL =
  'https://api.fugle.tw/realtime/v0.3/intraday/quote?symbolId=3037&apiToken=06108efd4883e72e0f65cc1672eaa4a1'

var ctx = document.getElementById('myChart')

const timeStamps = []
const stockPrice = []
let myChart = ''

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
          text: 'Chart.js Line Chart'
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              time: {
                displayFormats: {
                  second: 'hh:mm:ss',
                  minute: 'hh:mm:ss',
                  hour: 'hh:mm:ss'
                  // day: 'MMM DD',
                  // week: 'MMM DD',
                  // month: 'MMM DD',
                  // quarter: 'MMM DD',
                  // year: 'MMM DD'
                }
              }
            }
          ]
        },
        animation: {
          duration: 0 // general animation time
        },
        hover: {
          animationDuration: 0 // duration of animations when hovering an item
        },
        responsiveAnimationDuration: 0 // animation duration after a resize
      }
    }
  })
}

async function fetchStockQuote() {
  const response = await fetch(URL)
  const result = await response.json()
  stockPrice.push(result.data.quote.trade.price)
  timeStamps.push(moment().format('hh:mm:ss'))
}

function newTime(mins) {
  return moment().add(mins, 'm').format('hh:mm:ss')
}
