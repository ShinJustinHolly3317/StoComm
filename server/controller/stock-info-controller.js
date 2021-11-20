const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment')

// model
const Stock = require('../model/stock_info_model')

// functions
async function stockNews(req, res) {
  const { stockCode } = req.params
  const titleList = []

  const newsResult = await Stock.getNews(stockCode)

  if (newsResult.length) {
    for (let item of newsResult) {
      titleList.push({
        title: item.title,
        date: moment(item.date).format('MM-DD'),
        link: item.link
      })
    }

    return res.status(200).send({ data: titleList })
  } else {
    return res.status(404).send({ data: '' })
  }
}

async function stockRevenue(req, res) {
  const { stockCode } = req.params
  let revenueData = await Stock.getRevenue(stockCode)

  res.send({
    data: revenueData
  })
}

async function stockGross(req, res) {
  const { stockCode } = req.params
  let grossData = await Stock.getGross(stockCode)

  res.send({
    data: grossData
  })
}

async function getDayPrices(req, res) {
  const { stockCode } = req.params
  const dayPricesUrl = `https://tw.stock.yahoo.com/_td-stock/api/resource/FinanceChartService.ApacLibraCharts;autoRefresh=1634548365569;symbols=%5B%22${stockCode}.TW%22%5D;type=tick?bkt=tw-qsp-exp-no4&device=desktop&ecma=modern&feature=ecmaModern%2CuseVersionSwitch%2CuseNewQuoteTabColor%2ChideMarketInfo&intl=tw&lang=zh-Hant-TW&partner=none&prid=2vk2nmlgmqegi&region=TW&site=finance&tz=Asia%2FTaipei&ver=1.2.1173&returnMeta=true`

  try {
    const result = await axios.get(dayPricesUrl)
    res.send(result.data)
  } catch (error) {
    console.log(error)
    res.status(500).send({ error })
  }
  
}

async function getYearPrice(req, res) {
  const { stockCode } = req.params
  const result = await Stock.getYearPrice(stockCode)

  const dataTable = result.map((item) => {
    let date = moment(item.date).format('YYYY-MM-DD')
    return [
      date,
      item.open_price,
      item.high_price,
      item.low_price,
      item.close_price,
      item.volume
    ]
  })

  res.send({ data: dataTable })
}

async function stockChip(req, res) {
  let { stockCode } = req.params
  let chipData = await Stock.getChip(stockCode)

  const updateChipData = chipData.map((item) => {
    return [
      moment(item.date).format('YYYY-MM-DD'),
      item.foreigner,
      item.investment_trust,
      item.dealer
    ]
  })

  res.send(updateChipData)
}

async function getCompanyName(req, res) {
  const { stockCode } = req.params
  const companyName = await Stock.getCompanyName(stockCode)

  if (companyName.error) {
    res.status(404).send({ error: '無此代號' })
  } else {
    res.status(200).send({ data: companyName })
  }
}

module.exports = {
  stockNews,
  stockRevenue,
  stockGross,
  getDayPrices,
  getYearPrice,
  stockChip,
  getCompanyName
}
