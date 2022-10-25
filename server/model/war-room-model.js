// Require mysql connection
const db = require('./config/mysql-connection')
const moment = require('moment')
const validator = require('validator')

async function createWarRoom(createData) {
  const insertQry = `INSERT INTO war_room SET ?`
  let stockCode = createData['stock_name_code']
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
    stockCode = result[0].stock_code
  }

  createData['stock_id'] = tempId
  createData['date_time'] = moment().format('YYYY-MM-DD HH:mm:ss')
  createData['state'] = true
  createData['open_draw'] = true
  delete createData['stock_name_code']

  try {
    await conn.query('BEGIN')
    const [roomResult] = await conn.query(insertQry, createData)
    await conn.query(`UPDATE user SET role = 'streamer' WHERE id = ?`, [
      createData.user_id
    ])
    conn.query('COMMIT')
    const { insertId } = roomResult
    return { insertId, stock_code: stockCode }
  } catch (error) {
    console.log(error)
    conn.query('ROLLBACK')
    return { error }
  } finally {
    await conn.release()
  }
}

async function getOnlineRooms() {
  const getQry = `SELECT war_room.*, user.name as name, stock.company_name as company_name, stock.stock_code as stock_code
  FROM war_room 
  INNER JOIN user on war_room.user_id=user.id 
  INNER JOIN stock on war_room.stock_id=stock.stock_id
  WHERE state=1 `
  try {
    const [result] = await db.query(getQry)
    for (let item of result) {
      item.date_time = moment(item.date_time).format('YYYY-MM-DD')
    }
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function endWarRoom(roomId, userId) {
  const conn = await db.getConnection()

  try {
    await conn.query('BEGIN')
    const [result] = await conn.query(
      'UPDATE war_room SET state = 0 WHERE id = ?',
      [roomId]
    )
    await conn.query('UPDATE user SET role = "visitor" WHERE id = ?', [userId])
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
  const getQry = `
  SELECT * FROM war_room WHERE id = ?
  `
  try {
    const [result] = await db.query(getQry, [roomId])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function updateRoomRights(roomId, open_draw, open_mic) {
  let updateQry
  if (open_mic === undefined) {
    updateQry = `
    UPDATE war_room SET open_draw = ?
    WHERE id = ?
    `
  } else if (open_draw === undefined) {
    updateQry = `
    UPDATE war_room SET open_mic = ?
    WHERE id = ?
    `
  }
  try {
    const [result] = await db.query(updateQry, [
      Number(open_mic === undefined ? open_draw : open_mic),
      roomId
    ])
    return result.insertId
  } catch (error) {
    console.log(error)
    return { error }
  }
}

module.exports = {
  createWarRoom,
  getOnlineRooms,
  endWarRoom,
  getRoomInfo,
  updateRoomRights
}
