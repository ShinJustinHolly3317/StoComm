const axios = require('axios')
const moment = require('moment')
const Stock = require('../model/stock_info_model')

// functions
async function getStockNews(req, res) {
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
    return res.status(404).send({ error: 'News of this company not found' })
  }
}

async function getStockRevenue(req, res) {
  const { stockCode } = req.params
  let revenueData = await Stock.getRevenue(stockCode)

  if (revenueData.length) {
    return res.status(200).send({
      data: revenueData
    })
  } else {
    return res.status(404).send({ error: 'Revenue of this company not found' })
  }
}

async function getStockGross(req, res) {
  const { stockCode } = req.params
  let grossData = await Stock.getGross(stockCode)

  if (grossData.length) {
    return res.status(200).send({
      data: grossData
    })
  } else {
    return res.status(404).send({ error: 'Gross of this company not found' })
  }
}

async function getDayPrices(req, res) {
  // Directly use yahoo finance API
  const { stockCode } = req.params
  const dayPricesUrl = `https://tw.stock.yahoo.com/_td-stock/api/resource/FinanceChartService.ApacLibraCharts;autoRefresh=1634548365569;symbols=%5B%22${stockCode}.TW%22%5D;type=tick?bkt=tw-qsp-exp-no4&device=desktop&ecma=modern&feature=ecmaModern%2CuseVersionSwitch%2CuseNewQuoteTabColor%2ChideMarketInfo&intl=tw&lang=zh-Hant-TW&partner=none&prid=2vk2nmlgmqegi&region=TW&site=finance&tz=Asia%2FTaipei&ver=1.2.1173&returnMeta=true`

  try {
    const result = await axios.get(dayPricesUrl)
    res.status(200).send(result.data)
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

  if (dataTable.length) {
    return res.status(200).send({ data: dataTable })
  } else {
    return res
      .status(404)
      .send({ error: 'Year price of this company not found' })
  }
}

async function getStockChip(req, res) {
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

  if (updateChipData.length) {
    return res.status(200).send(updateChipData)
  } else {
    return res
      .status(404)
      .send({ error: 'Chip data of this company not found' })
  }
}

async function getCompanyName(req, res) {
  const { stockCode } = req.params
  const companyName = await Stock.getCompanyName(stockCode)

  if (companyName.error) {
    res.status(404).send({ error: 'This company not found' })
  } else {
    res.status(200).send({ data: companyName })
  }
}

module.exports = {
  getStockNews,
  getStockRevenue,
  getStockGross,
  getDayPrices,
  getYearPrice,
  getStockChip,
  getCompanyName
}
