// Require mysql connection
const db = require('./config/mysqlConnection')
const moment = require('moment')

async function createIdeas(ideasData) {
  try {
    const [stockIdResult] = await db.query(
      'SELECT * FROM stock WHERE stock_code = ?',
      [ideasData.stock_code]
    )

    ideasData.stock_id = stockIdResult[0].stock_id
    ideasData.likes = 0
    ideasData.date = moment().format('YYYY-MM-DD')
    delete ideasData['stock_code']

    const [result] = await db.query('INSERT INTO ideas SET ?', [ideasData])
    const insertId = result.insertId
    return insertId
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getIdeas(userId) {
  const qryString = `
  SELECT ideas.*, user.name as user_name, stock.stock_code as stock_code, stock.company_name as company_name
  FROM ideas
  INNER JOIN user ON user.id = ideas.user_id
  INNER JOIN stock ON stock.stock_id = ideas.stock_id
  WHERE user.id = ?
  `

  try {
    const [result] = await db.query(qryString, [userId])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function getIdea(ideaId) {
  const qryString = `
    SELECT ideas.*, user.name as user_name, user.picture as user_picture ,stock.stock_code as stock_code, stock.company_name as company_name
    FROM ideas
    INNER JOIN user ON user.id = ideas.user_id
    INNER JOIN stock ON stock.stock_id = ideas.stock_id
    WHERE ideas.id = ?
  `
  try {
    const [result] = await db.query(qryString, [ideaId])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

module.exports = { createIdeas, getIdeas, getIdea }
