const cheerio = require('cheerio')
const axios = require('axios')
// MongoDB
const StoComm = require('../../utils/stock-schema')
const db = require('../../utils/mongoose')

async function stockRevenue(id) {
  const url = `https://goodinfo.tw/StockInfo/ShowSaleMonChart.asp?STOCK_ID=${id}`
  const cssSelector = '#divSaleMonChartDetail table tr[align="center"] td'

  const result = await axios.get(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      'content-type': 'text/html; charset=UTF-8'
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

  console.log(allRevenueList)
}

async function stockGross(id) {
  const url = `https://goodinfo.tw/StockInfo/StockFinDetail.asp?RPT_CAT=IS_M_QUAR_ACC&STOCK_ID=${id}`
  const grossSelector =
    '#divFinDetail table tbody tr[bgcolor="white"][align="right"][valign="middle"]'
  const titleSelector = '#divFinDetail table tbody tr.bg_h1'

  const result = await axios.get(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      'content-type': 'text/html; charset=UTF-8',
      'sec-ch-ua-platform': 'Windows',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest'
    }
  })

  const $ = cheerio.load(result.data)

  const grossRawData = $(grossSelector)
  const titleRawData = $(titleSelector)
  const grossData = []
  const titleList = []
  const grossDataByQuarter = {}

  // extract title name
  if (!titleRawData[0]){
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
        'asfadfhsfghs',
      'content-type': 'text/html; charset=UTF-8',
      'sec-ch-ua-platform': 'Windows',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest'
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

async function main() {
  const stockIdList = await getAllStockId()

  let counter = 0
  for (let item of stockIdList) {
    counter++
    console.log(item)
    if (counter < 300) continue
    console.log(counter)

    let result = await stockGross(item)
    while (result === 'no result'){
      result = await stockGross(item)
      let now = new Date()
      while (new Date() - now < 10000) continue
    }

    let now = new Date()
    while (new Date() - now < 10000) continue
  }
}
main()
// getAllStockId()
