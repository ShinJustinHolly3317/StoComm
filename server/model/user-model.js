// Require mysql connection
const db = require('./config/mysqlConnection')
const bcrypt = require('bcrypt')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds
const jwt = require('jsonwebtoken')
const moment = require('moment')

async function findUserDataByEmail(email) {
  const qryString = `SELECT * FROM user WHERE email = ?`
  const [result] = await db.query(qryString, [email])
  return result
}

async function getUserDetail(userId) {
  try {
    const [users] = await db.query('SELECT * FROM user WHERE id = ?', [userId])
    if(users.length){
      return users[0]
    } else {
      return users
    }
  } catch (err) {
    console.log(err)
    return null
  }
}

async function nativeSignIn(email, password) {
  const conn = await db.getConnection()
  try {
    await conn.query('BEGIN')

    const [result] = await conn.query('SELECT * FROM user WHERE email = ?', [
      email
    ])

    if(!result.length){
      await conn.query('COMMIT')
      return { error: '你還沒有註冊過喔!' }
    }

    const user = result[0]


    if (!bcrypt.compareSync(password, user.password)) {
      await conn.query('COMMIT')
      return { error: '密碼錯誤喔!' }
    }

    const loginAt = new Date()
    const accessToken = jwt.sign(
      {
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture,
        id: user.id
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
      picture: '/img/profile-icon.png',
      access_expired: TOKEN_EXPIRE,
      followers: 0,
      following: 0,
      role: 'visitor',
      is_drawable: 0,
      is_mic_on: 0
    }
    

    const queryStr = 'INSERT INTO user SET ?'
    const [result] = await conn.query(queryStr, user)
    user.id = result.insertId

    // add userid in access token
    const accessToken = jwt.sign(
      {
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture,
        id: user.id
      },
      TOKEN_SECRET,
      {
        expiresIn: TOKEN_EXPIRE
      }
    )
    user.access_token = accessToken

    const accessTokenQry = `UPDATE user SET access_token = ? WHERE id = ?`
    await conn.query(accessTokenQry, [accessToken, user.id])

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

async function changeToStreamer(userId) {
  const [result] = await db.query(
    'UPDATE user SET role = streamer WHERE id = ?',
    [userId]
  )
  return result
}

async function allowUserDraw(userId) {
  const [result] = await db.query(
    'UPDATE user SET is_drawable = 1 WHERE id = ?',
    [userId]
  )
  return result
}

async function denyUserDraw(userId) {
  const [result] = await db.query(
    'UPDATE user SET is_drawable = 0 WHERE id = ?',
    [userId]
  )
  return result
}

async function allowUserMic(userId) {
  const [result] = await db.query(
    'UPDATE user SET is_mic_on = 1 WHERE id = ?',
    [userId]
  )
  return result
}

async function denyUserMic(userId) {
  const [result] = await db.query(
    'UPDATE user SET is_mic_on = 0 WHERE id = ?',
    [userId]
  )
  return result
}

async function allowAllUserDraw(usersId) {
  try {
    const [result] = await db.query(
      'UPDATE user SET is_drawable = 1 WHERE id in ?',
      [[usersId]]
    )
    return result
  } catch (error) {
    console.log(error)
  }
}

async function denyAllUserDraw(usersId) {
  try {
    const [result] = await db.query(
      'UPDATE user SET is_drawable = 0 WHERE id in ?',
      [[usersId]]
    )
    return result
  } catch (error) {
    console.log(error)
  }
}

async function followUser(userId, followId) {
  const conn = await db.getConnection()
  try {
    console.log('userid', userId);
    await conn.query('BEGIN')

    const [searchResult] = await conn.query('SELECT * FROM follow_status WHERE user_id = ? AND following_id = ?', [userId, followId])

    if(searchResult.length !== 0) {
      return { error : 'duplicate'}
    }

    const [result] = await conn.query(
      'INSERT INTO follow_status (user_id, following_id) VALUES ?',
      [[[userId, followId]]]
    )
    await conn.query('UPDATE user SET following = following + 1 WHERE id = ?', [
      userId
    ])
    await conn.query('UPDATE user SET followers = followers + 1 WHERE id = ?', [
      followId
    ])

    await conn.query('COMMIT')

    return result.insertId
  } catch(error) {
    await conn.query('ROLLBACK')
    console.error(error);
    return { error }
  } finally {
    await conn.release()
  }
}

async function unFollowUser(userId, followId) {
  const conn = await db.getConnection()
  try {
    await conn.query('BEGIN')

    const [result] = await conn.query(
      'DELETE FROM follow_status WHERE user_id = ? AND following_id = ?',
      [[userId], [followId]]
    )
    await conn.query('UPDATE user SET following = following - 1 WHERE id = ?', [
      userId
    ])
    await conn.query('UPDATE user SET followers = followers - 1 WHERE id = ?', [
      followId
    ])

    await conn.query('COMMIT')

    return result.insertId
  } catch (error) {
    await conn.query('ROLLBACK')
    console.error(error)
    return { error }
  } finally {
    await conn.release()
  }
}

async function checkFollowState(userId, followId) {
  try {
    const [result] = await db.query(
      'SELECT * FROM follow_status WHERE user_id = ? AND following_id = ?',
      [userId, followId]
    )
    return result
  } catch (error) {
    console.log(error);
    return {error}
  }
}

module.exports = {
  nativeSignIn,
  signUp,
  getUserDetail,
  changeToStreamer,
  allowUserDraw,
  denyUserDraw,
  allowUserMic,
  denyUserMic,
  allowAllUserDraw,
  denyAllUserDraw,
  followUser,
  unFollowUser,
  checkFollowState,
  findUserDataByEmail
}
