// Require mysql connection
const db = require('./config/mysqlConnection')
const moment = require('moment')

async function insertRevenue(revenueData) {
  try {
    const qryString = `INSERT INTO revenue(stock_id, revenue, quarter, year) VALUES ?`
    const [result] = await db.query(qryString, [revenueData])
    return result
  } catch (err) {
    return console.log(err)
  }
}

async function insertGross(grossData) {
  try {
    const qryString = `INSERT INTO gross(stock_id, gross, quarter, year) VALUES ?`
    const [result] = await db.query(qryString, [grossData])
    return result
  } catch (err) {
    return console.log(err)
  }
}

async function getRevenue(stock_code) {
  const qryString = `SELECT * FROM revenue 
  INNER JOIN stock ON revenue.stock_id=stock.stock_id
  WHERE stock.stock_code = ?`

  try {
    const [result] = await db.query(qryString, [stock_code])
    return result
  } catch (err) {
    return console.log(err)
  }
}

async function getNews(stock_code) {
  const qryString = `SELECT * FROM news 
  INNER JOIN stock on stock.stock_id=news.stock_id
  WHERE stock.stock_code = ?`

  try {
    const [result] = await db.query(qryString, [stock_code])
    return result
  } catch (err) {
    return console.log(err)
  }
}

async function insertNews(newsData, stockId) {
  const qryString = `INSERT INTO news(stock_id, title, date, link) VALUES ?`
  const updateNewsData = newsData.map((item) => {
    return [stockId, item.title, item.date, item.link]
  })

  try {
    const [result] = await db.query(qryString, [updateNewsData])
    return result.insertId
  } catch (err) {
    return console.log(err)
  }
}

async function insertChip(chipData, stock_code) {
  const [res_stock_id] = await db.query(
    'SELECT stock_id FROM stock WHERE stock_code = ?',
    stock_code
  )
  const qryString = `INSERT INTO chip_history(stock_id, date, foreigner, investment_trust, dealer) VALUES ?`

  const updateChipData = chipData.map(item => {
    return [res_stock_id[0].stock_id, item[0], item[1], item[2], item[3]]
  })

  try {
    const [result] = await db.query(qryString, [updateChipData])
    return result.insertId
  } catch (err) {
    return console.log(err)
  }
}

async function getChip(stock_code) {
  const qryString = `SELECT * FROM chip_history 
  INNER JOIN stock ON chip_history.stock_id=stock.stock_id
  WHERE stock.stock_code = ?`

  try {
    const [result] = await db.query(qryString, [stock_code])
    return result
  } catch (err) {
    return console.log(err)
  }
}

async function getStockList(){
  const stockList = await db.query('SELECT * FROM stock')
  
  return stockList[0].map((item) => {
    if (item.stock_code) {
      return [item.stock_id, item.stock_code, item.company_name]
    }
  })
}

module.exports = {
  insertRevenue,
  getRevenue,
  getNews,
  insertNews,
  insertChip,
  getChip,
  getStockList,
  insertGross
}
