// Require mysql connection
const db = require('./config/mysqlConnection')

async function insertDrawHistory(drawHistoryData, roomId) {
  const insertQry = `INSERT INTO drawing_history (user_id, draw_id, war_room_id, tool, thick, color, url, locations) VALUES ?`
  const deleteQry = `DELETE FROM drawing_history WHERE war_room_id = ?`

  const conn = await db.getConnection()
  try {
    await conn.query('START TRANSACTION')

    await conn.query(deleteQry, [roomId])
    const [result] = await conn.query(insertQry, [drawHistoryData])

    await conn.query('COMMIT')
    return result.insertId
  } catch (error) {
    console.log(error)
    await conn.query('ROLLBACK')
    return { error }
  } finally {
    await conn.release()
  }
}

async function getDrawHistory(roomId) {
  const getQry = `SELECT * FROM drawing_history WHERE war_room_id = ?`

  try {
    const [result] = await db.query(getQry, [roomId])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

module.exports = { insertDrawHistory, getDrawHistory }
