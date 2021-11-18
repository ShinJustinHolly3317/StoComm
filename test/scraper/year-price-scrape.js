require('dotenv').config()
const cheerio = require('cheerio')
const axios = require('axios')
const moment = require('moment')
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
  getStockList,
  insertGross
} = require('../../server/model/stock_info_model')

// Require mysql connection
require('dotenv').config()
const db = require('../../server/model/config/mysqlConnection')

// missing counter
const missingStock = []

// functions
async function main() {
  const stockList = await getStockList()

  for (let i = 0; i < stockList.length; i++) {
    console.log('gogogo', i)

    let company = stockList[i][2].split('-')[0] // company name

    await stockInfoInsert(stockList[i][0], stockList[i][1], company)
    await sleep(Math.floor(Math.random() * 4000) + 8000)
    console.log('missingStock', missingStock)
  }
  console.log(stockList)

  process.exit()
}

// functions
async function yearPrice(stockCode) {
  const url = `https://tw.quote.finance.yahoo.net/quote/q?type=ta&perd=d&mkt=10&sym=${stockCode}&v=1&callback=jQuery111303695803332513008_1634658404346&_=1634658404347`

  const result = await axios.get(url, {
    headers: {
      'user-agent': USER_AGNET[Math.floor(Math.random() * 4)],
      'content-type': 'text/html; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
      'Accept-Encoding': 'br, gzip, deflate',
      'Accept-Language': 'en-gb',
      Accept: `test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`
    }
  })

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

  console.log(dataTable[159])
}

yearPrice(1234)