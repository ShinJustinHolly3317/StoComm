// Require mysql connection
const db = require('./config/mysql-connection')

async function insertChatHistory(chatHistory, roomId) {
  const deleteQry = `DELETE FROM war_room_chat_history WHERE war_room_id = ?`
  const insertQry = `INSERT INTO war_room_chat_history (user_id, war_room_id, content, chat_time) VALUES ?`
  const conn = await db.getConnection()

  try {
    await conn.query('BEGIN')

    await conn.query(deleteQry, [roomId])
    const [result] = await conn.query(insertQry, [chatHistory])

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

async function getChatHistory(roomdId) {
  const getQry = `SELECT war_room_chat_history.*, user.name AS user_name
  FROM war_room_chat_history 
  INNER JOIN user ON user.id = war_room_chat_history.user_id
  WHERE war_room_id = ?`
  try {
    const [result] = await db.query(getQry, [roomdId])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

module.exports = { insertChatHistory, getChatHistory }
