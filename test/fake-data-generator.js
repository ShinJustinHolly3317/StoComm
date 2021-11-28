require('dotenv').config()
const { MODE } = process.env
const bcrypt = require('bcrypt')
const pool = require('../server/model/config/mysqlConnection')
const salt = parseInt(process.env.BCRYPT_SALT)
const { users, ideaLikes, warRoom } = require('./fake-data')

async function createUsers(conn) {
  const insertQry =
    'INSERT INTO user (name, email, password, picture, access_token, access_expired, role, provider) VALUES ?'
  const encryptedUsers = users.map((user) => {
    user.password = user.password ? bcrypt.hashSync(user.password, salt) : null
    return [
      user.name,
      user.email,
      user.password,
      user.picture,
      user.access_token,
      user.access_expired,
      user.role,
      user.provider
    ]
  })

  return await conn.query(insertQry, [encryptedUsers])
}

async function createWarRoom(conn) {
  const insertQry = 'INSERT INTO war_room SET ?'

  return await conn.query(insertQry, warRoom)
}

async function createIdeaLikes(conn) {
  const insertQry = 
    'INSERT INTO idea_likes (user_id, idea_id, likes_num) VALUES ?'

  const fakeIdeaLikes = ideaLikes.map(item => {
    return [
      item.user_id,
      item.idea_id,
      item.likes_num
    ]
  })

  return await conn.query(insertQry, [fakeIdeaLikes])
}

async function getIdeaLikes(conn) {
  const getQry =
    'SELECT idea_id, SUM(likes_num) AS total_likes FROM idea_likes GROUP BY idea_id'
  const [result] = await conn.query(getQry)
  return result
}

async function truncateFakeData() {
  const conn = await pool.getConnection()
  await conn.query('BEGIN')
  await conn.query('SET FOREIGN_KEY_CHECKS = ?', 0)
  await conn.query('TRUNCATE TABLE user')
  await conn.query('TRUNCATE TABLE idea_likes')
  await conn.query('TRUNCATE TABLE war_room')
  await conn.query('SET FOREIGN_KEY_CHECKS = ?', 1)
  await conn.query('COMMIT')
  await conn.release
}

async function createrFakeData() {
  const conn = await pool.getConnection()
  await conn.query('BEGIN')
  await conn.query('SET FOREIGN_KEY_CHECKS = ?', 0)
  await createUsers(conn)
  await createIdeaLikes(conn)
  await createWarRoom(conn)
  await conn.query('SET FOREIGN_KEY_CHECKS = ?', 1)
  await conn.query('COMMIT')
  await conn.release
}

module.exports = {
  createrFakeData,
  truncateFakeData,
  getIdeaLikes
}
