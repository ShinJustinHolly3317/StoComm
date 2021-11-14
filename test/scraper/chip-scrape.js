require('dotenv').config()
const axios = require('axios')
const express = require('express')
const app = express()
const port = 3000
const URL = 'https://tw.stock.yahoo.com/rank/turnover'
const cheerio = require('cheerio')
const moment = require('moment')
const puppeteer = require('puppeteer')
// MySQL
const mysqlConn = require('../../server/model/config/mysqlConnection')

// user agent list
const USER_AGNET = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36 ',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9 ',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1',
  'Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36 '
]

// model
const {
  insertRevenue,
  getRevenue,
  getNews,
  insertNews,
  insertChip,
  getChip,
  getStockList
} = require('../../server/model/stock_info_model')

// Require mysql connection
require('dotenv').config()
const db = require('../../server/model/config/mysqlConnection')

// missing counter
const missingStock = []

// Functions
async function main() {
  const stockList = await getStockList()

  for (let i = 83; i < stockList.length; i++) {
    console.log('Round ID', i)

    console.log('Company:', stockList[i])
    await chipScrape(stockList[i][1])
    await sleep(Math.floor(Math.random() * 4000) + 8000)
    console.log('missingStock', missingStock)
  }
  console.log(stockList)

  process.exit()
}

async function chipScrape(stockCode) {
  const url = `https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.tradesWithQuoteStats;limit=60;period=week;symbol=${stockCode}.TW?bkt=tw-qsp-exp-no4&device=desktop&ecma=modern&feature=ecmaModern,useVersionSwitch,useNewQuoteTabColor,hideMarketInfo&intl=tw&lang=zh-Hant-TW&partner=none&prid=3pf2d09gnvivj&region=TW&site=finance&tz=Asia/Taipei&ver=1.2.1177&returnMeta=true`
  const rawChipData = []
  let result

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
    if (!result) {
      missingStock.push([stockCode])
      return
    }

    for (let item of result.data.data.list) {
      rawChipData.push([
        moment(item.date).format('YYYY-MM-DD'),
        item.foreignDiffVolK,
        item.investmentTrustDiffVolK,
        item.dealerDiffVolK
      ])
    }

    console.log('This round', rawChipData)
    await insertChip(rawChipData, stockCode)
  }
}

function sleep(ms) {
  return new Promise((resolve, resject) => setTimeout(resolve, ms))
}

main()