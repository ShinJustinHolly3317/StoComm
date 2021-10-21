// Require mysql connection
const db = require('./config/mysqlConnection')

async function insertRevenue(revenueData) {
  const qryString = `INSERT INTO revenue(stock_id, revenue, month) VALUES ?`

  try {
    const [result] = await db.query(qryString, [revenueData])
    return result.insertId
  } catch (err) {
    return console.log(err)
  }
}

async function getRevenue(id) {
  const qryString = `SELECT * FROM revenue WHERE stock_id = ?`

  try {
    const [result] = await db.query(qryString, [id])
    return result
  } catch (err) {
    return console.log(err)
  }
}

async function getNews(id) {
  const qryString = `SELECT * FROM news WHERE  stock_id = ?`

  try {
    const [result] = await db.query(qryString, [id])
    return result
  } catch (err) {
    return console.log(err)
  }
}

module.exports = { insertRevenue, getRevenue, getNews }
