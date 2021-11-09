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
  const conn = await db.getConnection()

  // search stock code or stock name
  if (validator.isNumeric(createData['stock_name_code'])) {
    const [result] = await db.query(
      'SELECT * FROM stock WHERE stock_code = ?',
      [createData['stock_name_code']]
    )

    if (!result.length) {
      return { error: 'no match' }
    }
    tempId = result[0].stock_id
  } else {
    const [result] = await db.query(
      'SELECT * FROM stock WHERE company_name = ?',
      [createData['stock_name_code']]
    )

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

  
  try {
    await conn.query('BEGIN')
    const [roomResult] = await conn.query(qryString, createData)
    await conn.query(
      `UPDATE user SET role = 'streamer', is_drawable=1, is_mic_on=1 
      WHERE id = ?`,
      [createData.user_id]
    )
    console.log(roomResult)

    conn.query('COMMIT')
    const { insertId } = roomResult
    return { insertId, stock_code }
  } catch (error) {
    console.error(error)
    conn.query('ROLLBACK')
    return { error }
  } finally {
    await conn.release()
  }
}

async function showOnlineRooms() {
  const qryString = `SELECT war_room.*, user.name as name, stock.company_name as company_name, stock.stock_code as stock_code
  FROM war_room 
  INNER JOIN user on war_room.user_id=user.id 
  INNER JOIN stock on war_room.stock_id=stock.stock_id
  WHERE state=1 `
  const [result] = await db.query(qryString)

  for (let item of result) {
    item.date_time = moment(item.date_time).format('YYYY-MM-DD')
  }
  return result
}

async function endWarRoom(roomId, userId) {
  const conn = await db.getConnection()

  try {
    await conn.query('BEGIN')
    const [result] = await conn.query(
      'UPDATE war_room SET state = 0 WHERE id = ?',
      [roomId]
    )
    await conn.query(
      'UPDATE user SET role = "visitor", is_drawable=0, is_mic_on=0 WHERE id = ?',
      [userId]
    )
    await conn.query('COMMIT')
    
    return result
  } catch (error) {
    conn.query('ROLLBACK')
    console.log(error)
    return { error }
  } finally {
    await conn.release()
  }
}

async function getRoomInfo(roomId) {
  const qryString = `
  SELECT * FROM war_room WHERE id = ?
  `

  const [result] = await db.query(qryString, [roomId])
  return result
}

async function updateRoomRights(roomId, draw_on) {
  const qryString = `
  UPDATE war_room SET open_draw = ?
  WHERE id = ?
  `

  try {
    const [result] = await db.query(qryString, [Number(draw_on), roomId])
    return result.insertId
  } catch (error) {
    console.error(error)
    return {error}
  }
}


module.exports = {
  createWarRoom,
  showOnlineRooms,
  endWarRoom,
  getRoomInfo,
  updateRoomRights
}
