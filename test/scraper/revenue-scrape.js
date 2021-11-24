require('dotenv').config()
const cheerio = require('cheerio')
const axios = require('axios')
const moment = require('moment')
// MySQL
const mysqlConn = require('../../server/model/config/mysqlConnection')

// User agent list
const USER_AGNET = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36 ',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9 ',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1',
  'Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36 '
]

// Model
const {
  insertRevenue,
  getStockList,
  insertGross
} = require('../../server/model/stock_info_model')

// Quarter
const quarters = ['Q4', 'Q3', 'Q2', 'Q1']

// Missing collector
const missingStock = []

// Functions
async function main() {
  const stockList = await getStockList()

  for (let i = 1623; i < stockList.length; i++) {
    let company = stockList[i][2].split('-')[0] // company name
    console.log(`stock_id:${i}, ${stockList[i][1]}, ${company}`)

    await stockInsertRevenue(stockList[i][0], stockList[i][1], company)
    await sleep(Math.floor(Math.random() * 4000) + 8000)
    console.log('missingStock', missingStock)
  }
  console.log(stockList)

  process.exit()
}

async function stockInsertRevenue(stockId, stockCode, companyName) {
  const url = `https://marketinfo.api.cnyes.com/mi/api/v1/statement/TWS:${stockCode}:STOCK/income/quarter`

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

  const rawFinanceData = result.data
  const rawRevenueData = rawFinanceData.data.datas[0].datasets
  const rawGrossData = rawFinanceData.data.datas[4].datasets
  const revenueData = []
  const grossData = []

  if (!rawRevenueData.length) {
    missingStock.push([stockId, stockCode, companyName])
  }

  let startingIndex
  let curMonth = Number(moment().format('MM'))
  switch (Math.ceil((curMonth / 12) * 4)) {
    case 4:
      startingIndex = 1
      break
    case 3:
      startingIndex = 2
      break
    case 2:
      startingIndex = 3
      break
    case 1:
      startingIndex = 0
      break
  }

  // first scrape
  for (let index in rawRevenueData) {
    if (Number(index) + startingIndex > 7) {
      continue
    }
    let quarter = quarters[(Number(index) + startingIndex) % 4]
    console.log(Number(index) + startingIndex)
    let year =
      Number(index) + startingIndex < 4
        ? moment().format('YYYY')
        : moment().subtract(1, 'years').format('YYYY')
    revenueData.push([stockId, rawRevenueData[index].amount || 0, quarter, year])
    grossData.push([stockId, rawGrossData[index].amount || 0, quarter, year])
  }

  await insertRevenue(revenueData)
  await insertGross(grossData)
}

async function getAllStockId() {
  const url = `https://histock.tw/stock/rank.aspx?p=all`
  const result = await axios.get(url, {
    headers: {
      'user-agent': USER_AGNET[Math.floor(Math.random() * 4)],
      'content-type': 'text/html; charset=UTF-8',
      'sec-ch-ua-platform': 'Windows',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
      Referer: 'https://www.google.com/' + Math.random()
    }
  })

  const $ = cheerio.load(result.data)
  const rawStockIdList = $('.gvTB tr')
  const stockIdList = []
  let counter = 1

  for (let item of rawStockIdList) {
    let id = item.children[1].children[0].data
    if (!id || id.length !== 4) continue
    stockIdList.push([
      counter,
      item.children[1].children[0].data,
      item.children[2].children[1].children[0].data
    ])
    counter++
  }

  // insert into mysql
  const [sqlResult] = await mysqlConn.query(
    'insert into stock(stock_id, stock_code, company_name) values ?',
    [stockIdList]
  )
  console.log(sqlResult)
  return sqlResult
}

function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))
}

// Main function
main()

// scrape all listed company
//getAllStockId()