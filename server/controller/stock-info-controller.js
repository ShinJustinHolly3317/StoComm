const axios = require('axios')
const express = require('express')
const app = express()
const port = 3000
const URL = 'https://goodinfo.tw/StockInfo/'
const cheerio = require('cheerio')

// model
const {
  insertRevenue,
  getRevenue
} = require('../model/stock_info_model')

// functions
async function stockNews(req, res) {
  const { id } = req.params
  const url = `https://goodinfo.tw/StockInfo/StockDetail.asp?STOCK_ID=${id}`

  const result = await axios.get(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      'content-type': 'text/html; charset=UTF-8'
    }
  })

  const $ = cheerio.load(result.data)

  const rawTitleData = $(
    'table.b0.row_bg_2n.row_mouse_over tr[valign="top"] a.link_black'
  )

  const titleList = []

  for (let item of rawTitleData) {
    titleList.push({
      title: item.children[0].data,
      link: URL + item.attribs.href
    })
  }

  res.send({ data: titleList })
}

async function stockRevenue(req, res) {
  const { id } = req.params
  const url = `https://goodinfo.tw/StockInfo/ShowSaleMonChart.asp?STOCK_ID=${id}`
  const cssSelector = '#divSaleMonChartDetail table tr[align="center"] td'

  const revenueData = await getRevenue(id)
  if (!revenueData.length) {
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
    const rawData = $(cssSelector)
    const allRevenueList = {}
    let thisMonth = ''
    let counter = 0
    for (let item of rawData) {
      if (counter % 17 === 0) {
        thisMonth = item.children[0].children[0].data
        allRevenueList[thisMonth] = []
      } else {
        allRevenueList[thisMonth].push(item.children[0].children[0].data)
      }
      counter++
    }
    const sqlRevenueList = []
    for (let key in allRevenueList) {
      sqlRevenueList.push([Number(id), Number(allRevenueList[key][6]), key])
    }
    const inserId = await insertRevenue(sqlRevenueList)
  }

  res.send({
    data: !revenueData.length ? allRevenueList : revenueData
  })
}

async function stockGross(req, res) {
  // const { id } = req.params
  const url = `https://goodinfo.tw/StockInfo/StockFinDetail.asp?RPT_CAT=IS_M_QUAR_ACC&STOCK_ID=${3037}`
  const grossSelector =
    '#divFinDetail table tbody tr[bgcolor="white"][align="right"][valign="middle"]'
  const titleSelector = '#divFinDetail table tbody tr.bg_h1'

  const result = await axios.get(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      'content-type': 'text/html; charset=UTF-8'
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
  // res.send({ data: [] })
}

async function getDayPrices(req, res) {
  const { id } = req.params
  const dayPricesUrl = `https://tw.stock.yahoo.com/_td-stock/api/resource/FinanceChartService.ApacLibraCharts;autoRefresh=1634548365569;symbols=%5B%22${id}.TW%22%5D;type=tick?bkt=tw-qsp-exp-no4&device=desktop&ecma=modern&feature=ecmaModern%2CuseVersionSwitch%2CuseNewQuoteTabColor%2ChideMarketInfo&intl=tw&lang=zh-Hant-TW&partner=none&prid=2vk2nmlgmqegi&region=TW&site=finance&tz=Asia%2FTaipei&ver=1.2.1173&returnMeta=true`

  const result = await axios.get(dayPricesUrl)
  res.send(result.data)
}

module.exports = {
  stockNews,
  stockRevenue,
  stockGross,
  getDayPrices
}
