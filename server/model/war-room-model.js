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
  // search stock code or stock name
  // if (isNumeric(createData['stock_name_code'])) {
  //   const [result] = db.query('SELECT * FROM stock WHERE stock_code = ?', [
  //     createData['stock_name_code']
  //   ])
  //   console.log(result);
  // } else {
  //   const [result] = db.query('SELECT * FROM stock WHERE stock_name = ?', [
  //     createData['stock_name_code']
  //   ])
  //   console.log(result)
  // }

  createData['stock_id'] = createData['stock_name_code']
  createData['date_time'] = moment().format('YYYY-MM-DD HH:mm:ss')
  createData['state'] = true
  delete createData['stock_name_code']
  console.log(createData)
  const [result] = await db.query(qryString, createData)

  const { insertId } = result
  return insertId
}

async function showOnlineRooms() {
  const qryString = `SELECT war_room.*, user.name as name FROM war_room 
  INNER JOIN user on war_room.user_id=user.id 
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
