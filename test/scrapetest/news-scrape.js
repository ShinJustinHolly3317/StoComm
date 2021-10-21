const axios = require('axios')
const express = require('express')
const app = express()
const port = 3000
const URL = 'https://tw.stock.yahoo.com/rank/turnover'
const cheerio = require('cheerio')
const moment = require('moment')
const puppeteer = require('puppeteer')

// Require mysql connection
require('dotenv').config()
const db = require('../../server/model/config/mysqlConnection')

// functions
async function stockNews(id, req, res) {
  const url = `https://tw.stock.yahoo.com/quote/${id}/news`

  const result = await axios.get(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      'content-type': 'text/html; charset=UTF-8'
    }
  })

  const $ = cheerio.load(result.data)

  const rawTitleData = $('.Cf u')
  const rawContentData = $('.Cf p')
  const titleList = []
  const contentList = []

  for (let item of rawTitleData) {
    titleList.push(item.next.data)
  }

  for (let item of rawContentData) {
    contentList.push(item.children[0].data)
  }

  // console.log(rawTitleData.length, rawContentData.length)
  console.log(contentList.length, titleList.length)

  // console.log(titleList)
  res.send({ titleList, contentList })
}

// normal scrape
async function newsApi() {
  const url = `https://tw.stock.yahoo.com/_td-stock/api/resource?bkt=tw-qsp-exp-no4&crumb=nfoRUgESdl.&device=desktop&ecma=modern&feature=ecmaModern,useVersionSwitch,useNewQuoteTabColor,hideMarketInfo&intl=tw&lang=zh-Hant-TW&partner=none&prid=4f8drbpgmsljh&region=TW&site=finance&tz=Asia/Taipei&ver=1.2.1173`

  const newsReq = {}

  try {
    const result = await axios({
      url: url,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
        'content-type': 'text/html; charset=UTF-8'
      },
      data: newsReq,
      method: 'POST'
    })

    console.log(result.data)
  } catch (err) {
    console.log(err.message)
  }
}

// test puppeteer
let getListData = async function (id) {
  const url = `https://tw.stock.yahoo.com/quote/${id}/news`

  const browser = await puppeteer.launch({
    headless: false
  })
  const page = await browser.newPage()
  await page.goto(url)
  let contentInfo = await scrollDown(page)
  while (contentInfo.dataLength < 100) {
    contentInfo = await scrollDown(page)
    console.log(contentInfo.dataLength < 100)
  }

  console.log(contentInfo.contentList, contentInfo.titleList)
  insertNews(id, contentInfo.contentList, contentInfo.titleList)
  // await browser.close()
}

async function scrollDown(page) {
  const content = await page.content()
  const $ = cheerio.load(content)

  // scroll down
  await page.evaluate(() => {
    for (var y = 0; y <= 1000000; y += 100) {
      window.scrollTo(0, y)
    }
  })

  const rawTitleData = $('.Cf u')
  const rawContentData = $('.Cf p')
  const titleList = []
  const contentList = []

  for (let item of rawTitleData) {
    titleList.push(item.next.data)
  }

  for (let item of rawContentData) {
    contentList.push(item.children[0].data)
  }

  console.log(contentList.length, titleList.length)
  return { dataLength: contentList.length, contentList, titleList }
}

async function insertNews(id, contentList, titleList) {
  const qryString = `INSERT INTO news (stock_id, title, preview) VALUES ?`

  const newsDataList = []
  for (let i in contentList){
    if (titleList[i]){
      newsDataList.push([Number(id), titleList[i], contentList[i]])
    }
  }

  const [result] = await db.query(qryString, [newsDataList])
  return result.insertId
}

// Main
// getListData(2303)
newsApi(2303)