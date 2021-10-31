// Require mysql connection
const db = require('./config/mysqlConnection')
const bcrypt = require('bcrypt')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds
const jwt = require('jsonwebtoken')
const moment = require('moment')
const validator = require('validator')

async function createWarRoom(createData) {
  const qryString = `INSERT INTO war_room SET ?`
  let stock_code = createData['stock_name_code']
  let tempId

  // search stock code or stock name
  if (validator.isNumeric(createData['stock_name_code'])) {
    const [result] = await db.query('SELECT * FROM stock WHERE stock_code = ?', [
      createData['stock_name_code']
    ])

    if (!result.length) {
      return {error: 'no match'}
    }
    tempId = result[0].stock_id
  } else {
    const [result] = await db.query('SELECT * FROM stock WHERE company_name = ?', [
      createData['stock_name_code']
    ])

    if (!result.length) {
      return { error: 'no match' }
    }
    tempId = result[0].stock_id
    stock_code = result[0].stock_code
  }

  createData['stock_id'] = tempId
  createData['date_time'] = moment().format('YYYY-MM-DD HH:mm:ss')
  createData['state'] = true
  delete createData['stock_name_code']
  console.log(createData)
  const [result] = await db.query(qryString, createData)

  const { insertId } = result
  return { insertId, stock_code }
}

async function showOnlineRooms() {
  const qryString = `SELECT war_room.*, user.name as name, stock.company_name as company_name, stock.stock_code as stock_code
  FROM war_room 
  INNER JOIN user on war_room.user_id=user.id 
  INNER JOIN stock on war_room.stock_id=stock.stock_id
  WHERE state=1 `
  const [result] = await db.query(qryString)
  return result
}

async function endWarRoom(userId) {
  try {
    const [result] = await db.query(
      'UPDATE war_room SET state = 0 WHERE id = ?',
      [userId]
    )
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

module.exports = { createWarRoom, showOnlineRooms, endWarRoom }
