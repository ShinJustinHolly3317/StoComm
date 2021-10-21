const { default: axios } = require('axios')
const express = require('express')
const app = express()
const port = 3000
const URL = 'https://tw.stock.yahoo.com/rank/turnover'
const cheerio = require('cheerio')
const moment = require('moment')

// app.use(express.static('public'))

// app.get('/', async (req, res) => {
//   stockStats(2330, req, res)
// })

// app.listen(port, () => {
//   console.log('server on port 3000')
// })

// functions
async function stockStats(id, req, res) {
  const url = `https://tw.stock.yahoo.com/_td-stock/api/resource/FinanceChartService.ApacLibraCharts;autoRefresh=1634548365569;symbols=%5B%22${id}.TW%22%5D;type=tick?bkt=tw-qsp-exp-no4&device=desktop&ecma=modern&feature=ecmaModern%2CuseVersionSwitch%2CuseNewQuoteTabColor%2ChideMarketInfo&intl=tw&lang=zh-Hant-TW&partner=none&prid=2vk2nmlgmqegi&region=TW&site=finance&tz=Asia%2FTaipei&ver=1.2.1173&returnMeta=true`

  const result = await axios.get(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      'content-type': 'text/html; charset=UTF-8',
    }
  })
  
  const timeStamps = result.data.data[0].chart.timestamp.map(item=>moment(item+28800))

  console.log(result.data.data[0].chart.indicators.quote[0].close)
  // console.log(timeStamps)
  // res.send(result.data)
}

stockStats(2330)
stockStats(2303)
stockStats(3037)