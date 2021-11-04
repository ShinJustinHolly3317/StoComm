// Require mysql connection
const db = require('./config/mysqlConnection')

async function insertChatHistory(chatHistory) {
  const qryString = `INSERT INTO war_room_chat_history (user_id, war_room_id, content, chat_time) VALUES ?`
  const conn = await db.getConnection()

  try {
    await conn.query('START TRANSACTION')

    const [result] = await conn.query(qryString, [chatHistory])

    await conn.query('COMMIT')
    return result.insertId
  } catch(error) {
    console.error(error)
    await conn.query('ROLLBACK')
    return { error }
  } finally {
    await conn.release()
  }
}

async function getChatHistory(roomdId) {
  const qryString = `SELECT war_room_chat_history.*, user.name as user_name
  FROM war_room_chat_history 
  INNER JOIN user ON user.id = war_room_chat_history.user_id
  WHERE war_room_id = ?`
  try {
    const [result] = await db.query(qryString, [roomdId])
    return result
  } catch (error) {
    console.error(error)
    return { error }
  }
}

module.exports = { insertChatHistory, getChatHistory }