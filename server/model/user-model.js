// Require mysql connection
const db = require('./config/mysqlConnection')
const bcrypt = require('bcrypt')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds
const jwt = require('jsonwebtoken')
const moment = require('moment')

async function findUserName(email) {
  const qryString = `SELECT * FROM user WHERE email = ?`
  const [result] = await db.query(qryString, [email])
  return result
}

async function nativeSignIn(email, password) {
  const conn = await db.getConnection()
  try {
    await conn.query('BEGIN')

    const [result] = await conn.query('SELECT * FROM user WHERE email = ?', [
      email
    ])
    const user = result[0]

    // if (!bcrypt.compareSync(password, user.password)) {
    //   await conn.query('COMMIT')
    //   return { error: 'Wrong password' }
    // }

    const loginAt = new Date()
    const accessToken = jwt.sign(
      {
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture
      },
      TOKEN_SECRET,
      {
        expiresIn: TOKEN_EXPIRE
      }
    )

    const updateQry =
      'UPDATE user SET access_token = ?, access_expired = ? WHERE id = ?'
    await conn.query(updateQry, [accessToken, TOKEN_EXPIRE, user.id])

    await conn.query('COMMIT')

    user.access_token = accessToken
    user.login_at = loginAt
    user.access_expired = TOKEN_EXPIRE

    return { user }
  } catch (err) {
    await conn.query('ROLLBACK')
    console.log(err)
    return { err }
  } finally {
    await conn.release()
  }
}

async function signUp(name, email, password) {
  const conn = await db.getConnection()
  try {
    await conn.query('START TRANSACTION')

    const emails = await conn.query(
      'SELECT email FROM user WHERE email = ? FOR UPDATE',
      [email]
    )
    if (emails[0].length > 0) {
      await conn.query('COMMIT')
      return { error: 'This email has already existed!' }
    }

    const user = {
      provider: 'native',
      email: email,
      password: bcrypt.hashSync(password, salt),
      name: name,
      picture: null,
      access_expired: TOKEN_EXPIRE,
      followers: 0,
      following: 0
    }
    const accessToken = jwt.sign(
      {
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture
      },
      TOKEN_SECRET,
      {
        expiresIn: TOKEN_EXPIRE
      }
    )
    user.access_token = accessToken

    const queryStr = 'INSERT INTO user SET ?'
    const [result] = await conn.query(queryStr, user)

    user.id = result.insertId
    await conn.query('COMMIT')
    return { user }
  } catch (error) {
    console.log(error)
    await conn.query('ROLLBACK')
    return { error }
  } finally {
    await conn.release()
  }
}

async function getUserDetail(email) {
  try {
    const [users] = await db.query('SELECT * FROM user WHERE email = ?', [email])
    return users[0]
  } catch (err) {
    console.log(err);
    return null
  }
}

module.exports = { findUserName, nativeSignIn, signUp, getUserDetail }