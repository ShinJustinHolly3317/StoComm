// Require mysql connection
const db = require('./config/mysqlConnection')
const moment = require('moment')

async function insertRevenue(revenueData, stock_code) {
  try {
    const [res_stock_id] = await db.query(
      'SELECT stock_id, company_name FROM stock WHERE stock_code = ?',
      [stock_code]
    )

    const stock_id = res_stock_id[0].stock_id
    const company_name = res_stock_id[0].company_name
    const qryString = `INSERT INTO revenue(stock_id, revenue, month) VALUES ?`
    const updateRevenueData = revenueData.map((item) => {
      return [stock_id, item[1], moment(item[2]).format('YYYY-MM-DD')]
    })

    const [result] = await db.query(qryString, [updateRevenueData])
    return { stock_id, company_name }
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

async function insertNews(newsData, stock_code) {
  const [res_stock_id] = await db.query(
    'SELECT stock_id FROM stock WHERE stock_code = ?',
    stock_code
  )
  const qryString = `INSERT INTO news(stock_id, title, date, link) VALUES ?`
  const updateNewsData = newsData.map((item) => {
    return [res_stock_id[0].stock_id, item.title, item.date, item.link]
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

module.exports = {
  insertRevenue,
  getRevenue,
  getNews,
  insertNews,
  insertChip,
  getChip
}
