// Require mysql connection
const db = require('./config/mysqlConnection')
const moment = require('moment')

async function insertRevenue(revenueData, code) {
  try {
    const [res_stock_id] = await db.query(
      'SELECT stock_id, company_name FROM stock WHERE stock_code = ?',
      [code]
    )

    const stock_id = res_stock_id[0].stock_id
    const company_name = res_stock_id[0].company_name
    const qryString = `INSERT INTO revenue(stock_id, revenue, month) VALUES ?`
    const updateRevenueData = revenueData.map(item => {
      return [stock_id, item[1], moment(item[2]).format('YYYY-MM-DD')]
    })

    const [result] = await db.query(qryString, [updateRevenueData])
    return { stock_id, company_name }
  } catch (err) {
    return console.log(err)
  }
}

async function getRevenue(id) {
  const qryString = `SELECT * FROM revenue 
  INNER JOIN stock ON revenue.stock_id=stock.stock_id
  WHERE stock.stock_code = ?`

  try {
    const [result] = await db.query(qryString, [id])
    return result
  } catch (err) {
    return console.log(err)
  }
}

async function getNews(id) {
  const qryString = `SELECT * FROM news 
  INNER JOIN stock on stock.stock_id=news.stock_id
  WHERE stock.stock_code = ?`

  try {
    const [result] = await db.query(qryString, [id])
    return result
  } catch (err) {
    return console.log(err)
  }
}

async function insertNews(newsData, id) {
  const [res_stock_id] = await db.query(
    'SELECT stock_id FROM stock WHERE stock_code = ?',
    id
  )
  const qryString = `INSERT INTO news(stock_id, title, date, link) VALUES ?`
  const updateNewsData = newsData.map((item) => {
    return [
      res_stock_id[0].stock_id,
      item.title,
      item.date,
      item.link
    ]
  })

  try {
    const [result] = await db.query(qryString, [updateNewsData])
    return result.insertId
  } catch (err) {
    return console.log(err)
  }
}

module.exports = { insertRevenue, getRevenue, getNews, insertNews }
