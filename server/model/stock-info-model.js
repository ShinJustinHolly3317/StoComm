// Require mysql connection
const db = require('./config/mysql-connection')

async function insertRevenue(revenueData) {
  const insertQry = `INSERT INTO revenue(stock_id, revenue, quarter, year) VALUES ?`
  try {
    await db.query(insertQry, [revenueData])
    return { message: 'success' }
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function insertGross(grossData) {
  const insertQry = `INSERT INTO gross(stock_id, gross, quarter, year) VALUES ?`
  try {
    await db.query(insertQry, [grossData])
    return { message: 'success' }
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getRevenue(stockCode) {
  const getQry = `SELECT * FROM revenue 
  INNER JOIN stock ON revenue.stock_id=stock.stock_id
  WHERE stock.stock_code = ?
  ORDER BY id DESC
  `
  try {
    const [result] = await db.query(getQry, [stockCode])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getGross(stockCode) {
  const getQry = `SELECT * FROM gross 
  INNER JOIN stock ON gross.stock_id=stock.stock_id
  WHERE stock.stock_code = ?
  ORDER BY id DESC
  `
  try {
    const [result] = await db.query(getQry, [stockCode])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getNews(stockCode) {
  const getQry = `SELECT * FROM news 
  INNER JOIN stock on stock.stock_id=news.stock_id
  WHERE stock.stock_code = ?
  ORDER BY date DESC 
  LIMIT 30
  `
  try {
    const [result] = await db.query(getQry, [stockCode])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function insertNews(newsData, stockId) {
  const insertQry = `INSERT INTO news(stock_id, title, date, link) VALUES ?`
  const updateNewsData = newsData.map((item) => {
    return [stockId, item.title, item.date, item.link]
  })
  try {
    await db.query(insertQry, [updateNewsData])
    return { message: 'success' }
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function insertChip(chipData) {
  const insertQry = `INSERT INTO chip_history(stock_id, date, foreigner, investment_trust, dealer) VALUES ?`
  try {
    await db.query(insertQry, [chipData])
    return { message: 'success' }
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getChip(stock_code) {
  const getQry = `SELECT * FROM chip_history 
  INNER JOIN stock ON chip_history.stock_id=stock.stock_id
  WHERE stock.stock_code = ?
  ORDER BY date DESC
  `
  try {
    const [result] = await db.query(getQry, [stock_code])
    return result
  } catch (error) {
    console.log(error)
    return { error }
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
    const companyName = await db.query(
      'SELECT * FROM stock WHERE stock_code = ?',
      [stockCode]
    )

    if (companyName[0].length) {
      return companyName[0][0].company_name
    } else {
      return { error: '無此代號' }
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
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getYearPrice(stockCode) {
  const getQry = `
  SELECT * FROM year_price 
  INNER JOIN stock on stock.stock_id = year_price.stock_id
  WHERE stock.stock_code = ?
  `
  try {
    const [result] = await db.query(getQry, [stockCode])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

module.exports = {
  insertRevenue,
  getRevenue,
  getGross,
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
