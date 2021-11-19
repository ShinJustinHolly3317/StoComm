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

async function getGross(stock_code) {
  const qryString = `SELECT * FROM gross 
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
  WHERE stock.stock_code = ?
  ORDER BY date DESC 
  LIMIT 30
  `

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

  const updateChipData = chipData.map((item) => {
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

async function getStockList() {
  const stockList = await db.query('SELECT * FROM stock')

  return stockList[0].map((item) => {
    if (item.stock_code) {
      return [item.stock_id, item.stock_code, item.company_name]
    }
  })
}

async function getCompanyName(stockCode) {
  try {
    const companyName = await db.query('SELECT * FROM stock WHERE stock_code = ?', [
      stockCode
    ])

    if (companyName[0].length) {
      return companyName[0][0].company_name
    } else {
      return { error: '無此代號'}
    }
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function insertYearPrice(yearPriceData) {
  const insertQry = `
  INSERT INTO year_price (stock_id, date, open_price, high_price, low_price, close_price,volume) VALUES ?
  `

  try {
    const [result] = await db.query(insertQry, [yearPriceData])
    console.log('Year Price Insert Result', result)
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getYearPrice(stockCode) {
  const yearPriceQry = `
  SELECT * FROM year_price 
  INNER JOIN stock on stock.stock_id = year_price.stock_id
  WHERE stock.stock_code = ?
  `

  try{
    const [result] = await db.query(yearPriceQry, [stockCode])
    return result
  } catch(error) {
    console.log(error)
    return { error }
  }
}

module.exports = {
  insertRevenue,
  getRevenue,
  getNews,
  insertNews,
  insertChip,
  getChip,
  getStockList,
  insertGross,
  getCompanyName,
  insertYearPrice,
  getYearPrice
}
