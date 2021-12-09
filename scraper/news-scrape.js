require('dotenv').config()
const axios = require('axios')
const moment = require('moment')
const SLEEP_TIME = Math.floor(Math.random() * 4000) + 8000

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
  insertNews,
  getStockList
} = require('../server/model/stock_info_model')

// Require mysql connection
require('dotenv').config()

// Missing collector
const missingStock = []

// Functions
async function main() {
  const stockList = await getStockList()

  for (let i = 0; i < stockList.length; i++) {
    console.log('This round ID', i)

    let company = stockList[i][2].split('-')[0] // company name
    let chineseChar
    if (company.match(/[\u4E00-\u9FFF]/g)) {
      chineseChar = company.match(/[\u4E00-\u9FFF]/g).join('')
    }
    companySufix = company.replace(/[^\w\s]/gi, '')

    await stockInfoInsert(
      stockList[i][0],
      stockList[i][1],
      chineseChar || '' + companySufix
    )
    await sleep(SLEEP_TIME)
    console.log('missingStock', missingStock)
  }
  console.log(stockList)

  process.exit()
}

async function stockInfoInsert(stockId, stockCode, companyName) {
  console.log('companyName', companyName)
  const encodedStr = encodeURI(companyName)
  const titleList = []
  const url = `https://api.cnyes.com/media/api/v1/search?q=${encodedStr}`

  try {
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

    console.log(stockCode, companyName)

    const today = moment().format('YYYY-MM-DD')
    const rawNewsData = result.data.items.data
    console.log(result.data)
    for (let item of rawNewsData) {
      console.log(
        'news date',
        moment(item.publishAt * 1000).format('YYYY-MM-DD')
      )
      if (today !== moment(item.publishAt * 1000).format('YYYY-MM-DD')) {
        console.log('old news');
        continue
      }
      console.log(moment(item.publishAt * 1000).format('YYYY-MM-DD'))
      titleList.push({
        title: item.title,
        date: moment(item.publishAt * 1000).format('YYYY-MM-DD'),
        link: `https://news.cnyes.com/news/id/${item.newsId}?exp=a`
      })
    }

    if (!titleList.length) {
      console.log(result.data)
      missingStock.push([stockCode, companyName])
      console.log('No scraping result')
      return
    }

    const insertResult = await insertNews(titleList, stockId)
  } catch (error) {
    console.log(error)
  }
}

function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))
}

// Main 
main()
