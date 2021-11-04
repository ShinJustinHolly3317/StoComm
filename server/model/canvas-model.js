// Require mysql connection
const db = require('./config/mysqlConnection')

async function insertDrawHistory(drawHistoryData, roomId) {
  const insertQry = `INSERT INTO drawing_history (user_id, draw_id, war_room_id, tool, thick, color, url, locations) VALUES ?`
  const dleteQry = `DELETE FROM drawing_history WHERE war_room_id = ?`

  const conn = await db.getConnection()
  try {
    await conn.query('START TRANSACTION')

    await conn.query(dleteQry, [roomId])
    const [result] = await conn.query(insertQry, [drawHistoryData])

    await conn.query('COMMIT')
    return result.insertId
  } catch (error) {
    console.error(error)
    await conn.query('ROLLBACK')
    return { error }
  } finally {
    await conn.release()
  }
}

async function getDrawHistory() {
  const qryString = `SELECT * FROM drawing_history`

  try {
    const [result] = await db.query(qryString)
    return result
  } catch (error) {
    console.error(error)
    return { error }
  }
}

module.exports = { insertDrawHistory, getDrawHistory }
