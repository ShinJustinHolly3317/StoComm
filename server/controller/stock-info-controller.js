const axios = require('axios')
const URL = 'https://goodinfo.tw/StockInfo/'
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
  const url = `https://goodinfo.tw/StockInfo/StockFinDetail.asp?RPT_CAT=IS_M_QUAR_ACC&STOCK_ID=${stockCode}}`
  const grossSelector =
    '#divFinDetail table tbody tr[bgcolor="white"][align="right"][valign="middle"]'
  const titleSelector = '#divFinDetail table tbody tr.bg_h1'

  const result = await axios.get(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
      'content-type': 'text/html; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
      'Accept-Encoding': 'br, gzip, deflate',
      'Accept-Language': 'en-gb',
      Accept: `test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`
    }
  })

  const $ = cheerio.load(result.data)

  const grossRawData = $(grossSelector)
  const titleRawData = $(titleSelector)
  const grossData = []
  const titleList = []
  const grossDataByQuarter = {}

  // extract title name
  for (let item of titleRawData[0].children) {
    titleList.push(item.children[0].children[0].data)
  }

  // extract gross value and percentage
  for (let item of grossRawData[3].children) {
    grossData.push(item.children[0].children[0].data)
  }
  titleList.splice(0, 1)
  grossData.splice(0, 1)

  for (let i in titleList) {
    grossDataByQuarter[titleList[i]] = [
      grossData[2 * i],
      `${grossData[2 * i + 1]} %`
    ]
  }

  console.log(grossDataByQuarter)
  res.send({ data: grossDataByQuarter })
}

async function getDayPrices(req, res) {
  const { stockCode } = req.params
  const dayPricesUrl = `https://tw.stock.yahoo.com/_td-stock/api/resource/FinanceChartService.ApacLibraCharts;autoRefresh=1634548365569;symbols=%5B%22${stockCode}.TW%22%5D;type=tick?bkt=tw-qsp-exp-no4&device=desktop&ecma=modern&feature=ecmaModern%2CuseVersionSwitch%2CuseNewQuoteTabColor%2ChideMarketInfo&intl=tw&lang=zh-Hant-TW&partner=none&prid=2vk2nmlgmqegi&region=TW&site=finance&tz=Asia%2FTaipei&ver=1.2.1173&returnMeta=true`

  const result = await axios.get(dayPricesUrl)
  res.send(result.data)
}

async function getYearPrice(req, res) {
  const { stockCode } = req.params
  const url = `https://tw.quote.finance.yahoo.net/quote/q?type=ta&perd=d&mkt=10&sym=${stockCode}&v=1&callback=jQuery111303695803332513008_1634658404346&_=1634658404347`
  const result = await axios.get(url)

  let pricehistory = JSON.parse(result.data.split(`"ta":`)[1].split(',"ex"')[0])
  const dataTable = pricehistory.map((item) => {
    let date = item.t.toString()
    return [
      date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.substr(6, 2),
      item.o,
      item.h,
      item.l,
      item.c,
      item.v
    ]
  })

  res.send(dataTable)
}

async function stockChip(req, res) {
  let { stockCode } = req.params
  const url = `https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.tradesWithQuoteStats;limit=60;period=week;symbol=${stockCode}.TW?bkt=tw-qsp-exp-no4&device=desktop&ecma=modern&feature=ecmaModern,useVersionSwitch,useNewQuoteTabColor,hideMarketInfo&intl=tw&lang=zh-Hant-TW&partner=none&prid=3pf2d09gnvivj&region=TW&site=finance&tz=Asia/Taipei&ver=1.2.1177&returnMeta=true`
  const rawChipData = []
  let result
  let chipData = await Stock.getChip(stockCode)

  if (!chipData.length) {
    try {
      result = await axios.get(url, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
          'content-type': 'text/html; charset=UTF-8',
          'x-requested-with': 'XMLHttpRequest',
          'Accept-Encoding': 'br, gzip, deflate',
          'Accept-Language': 'en-gb',
          Accept: `test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`
        }
      })
    } catch (error) {
      // handle OTC
      const otcUrl = `
      https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.tradesWithQuoteStats;limit=100;period=day;symbol=${stockCode}.TWO?bkt=tw-qsp-exp-no4&device=desktop&ecma=modern&feature=ecmaModern,useVersionSwitch,useNewQuoteTabColor,hideMarketInfo&intl=tw&lang=zh-Hant-TW&partner=none&prid=0jqb8o9go9qt5&region=TW&site=finance&tz=Asia/Taipei&ver=1.2.1177&returnMeta=true
      `
      result = await axios.get(otcUrl, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
          'content-type': 'text/html; charset=UTF-8',
          'x-requested-with': 'XMLHttpRequest',
          'Accept-Encoding': 'br, gzip, deflate',
          'Accept-Language': 'en-gb',
          Accept: `test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`
        }
      })
    } finally {
      for (let item of result.data.data.list) {
        rawChipData.push([
          moment(item.date).format('YYYY-MM-DD'),
          item.foreignDiffVolK,
          item.investmentTrustDiffVolK,
          item.dealerDiffVolK
        ])
      }
      await Stock.insertChip(rawChipData, stockCode)
      chipData = await Stock.getChip(stockCode)
    }
  }

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
