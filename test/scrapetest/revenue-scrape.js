const cheerio = require('cheerio')
const axios = require('axios')
// MongoDB
const StoComm = require('../../utils/stock-schema')
const StoComm_revenue = require('../../utils/revenue-schema')
const db = require('../../utils/mongoose')

// user agent list
const USER_AGNET = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36 ',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9 ',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1',
  'Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36 '
]

async function stockRevenue(id) {
  const url = `https://goodinfo.tw/StockInfo/ShowSaleMonChart.asp?STOCK_ID=${id}`
  const cssSelector = '#divSaleMonChartDetail table tr[align="center"] td'

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

  // insert into mongo
  StoComm_revenue.create({ id, revenue_on_month: allRevenueList })
    .then(() => {
      console.log('mongo ok')
    })
    .catch((err) => {
      console.log(err)
    })

  console.log(allRevenueList)
}

async function stockGross(id) {
  const url = `https://goodinfo.tw/StockInfo/StockFinDetail.asp?RPT_CAT=IS_M_QUAR_ACC&STOCK_ID=${id}`
  const grossSelector =
    '#divFinDetail table tbody tr[bgcolor="white"][align="right"][valign="middle"]'
  const titleSelector = '#divFinDetail table tbody tr.bg_h1'

  const result = await axios.get(url, {
    headers: {
      'user-agent': USER_AGNET[Math.floor(Math.random() * 4)],
      'content-type': 'text/html; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
      'Accept-Encoding': 'br, gzip, deflate',
      'Accept-Language': 'en-gb',
      "Accept": `test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`
    }
  })

  const $ = cheerio.load(result.data)

  const grossRawData = $(grossSelector)
  const titleRawData = $(titleSelector)
  const grossData = []
  const titleList = []
  const grossDataByQuarter = {}

  // extract title name
  if (!grossRawData[0]) {
    console.log(result.data)
    return 'no result'
  }
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

  // insert into mongo
  StoComm.create({ id, gross_on_quarter: grossDataByQuarter })
    .then(() => {
      console.log('mongo ok')
    })
    .catch((err) => {
      console.log(err)
    })

  return 'ok'
}

// let tetes ={ 'user-agent':
//         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'}

async function getAllStockId() {
  const url = `https://histock.tw/stock/rank.aspx?p=all`
  const result = await axios.get(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
      'content-type': 'text/html; charset=UTF-8',
      'sec-ch-ua-platform': 'Windows',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
      'Referer': 'https://www.google.com/' + Math.random()
    }
  })

  const $ = cheerio.load(result.data)
  const rawStockIdList = $('.gvTB tr')
  const stockIdList = []

  for (let item of rawStockIdList) {
    let id = item.children[1].children[0].data
    if (!id || id.length !== 4) continue
    stockIdList.push(item.children[1].children[0].data)
  }
  console.log(stockIdList.length)

  return stockIdList
}

async function multiScrapeGross() {
  const stockIdList = await getAllStockId()

  let counter = 0
  for (let item of stockIdList) {
    counter++
    console.log(item)
    if (counter < 600) continue
    console.log(counter)

    let result = await stockGross(item)
    while (result === 'no result') {
      result = await stockGross(item)
      let now = new Date()
      while (new Date() - now < Math.floor(Math.random() * 10000) + 15000)
        continue
    }
    // if(result === 'no result') return

    let now = new Date()
    while (new Date() - now < Math.floor(Math.random()*10000) + 15000) continue
  }
}

async function multiScrapeRevenue() {
  const stockIdList = await getAllStockId()

  let counter = 0
  for (let item of stockIdList) {
    counter++
    console.log(item)
    if (counter < 15) continue
    console.log(counter)

    let result = await stockRevenue(item)
    while (result === 'no result') {
      result = await stockRevenue(item)
      let now = new Date()
      while (new Date() - now < Math.floor(Math.random() * 10000) + 15000){
        continue
      }
        
    }
    // if(result === 'no result') return

    let now = new Date()
    while (new Date() - now < Math.floor(Math.random() * 10000) + 15000){
      continue
    }
      
  }
}

// multiScrapeGross()
multiScrapeRevenue()
// getAllStockId()
