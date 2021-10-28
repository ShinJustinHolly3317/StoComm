// Require mysql connection
const db = require('./config/mysqlConnection')

async function insertDrawHistory(drawHistoryData) {
  const qryString = `INSERT INTO drawing_history (user_id, draw_id, war_room_id, tool, thick, color, url, locations) VALUES ?`

  const [result] = await db.query(qryString, [drawHistoryData])
  return result.insertId
}

module.exports = insertDrawHistory