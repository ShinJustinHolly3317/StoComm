// Require mysql connection
const db = require('./config/mysql-connection')
const bcrypt = require('bcrypt')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds
const jwt = require('jsonwebtoken')

async function findUserDataByEmail(email) {
  const qryString = `SELECT * FROM user WHERE email = ?`
  const [result] = await db.query(qryString, [email])
  return result
}

async function getUserInfo(userId) {
  try {
    const [userInfo] = await db.query(
      'SELECT name, picture, role, access_token FROM user WHERE id = ?',
      [userId]
    )
    return userInfo
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function nativeSignIn(email, password) {
  const conn = await db.getConnection()
  try {
    await conn.query('BEGIN')

    const [result] = await conn.query('SELECT * FROM user WHERE email = ?', [
      email
    ])

    if (!result.length) {
      await conn.query('COMMIT')
      return { error: 'no signup', type: 'user error' }
    }

    const user = result[0]

    if (!bcrypt.compareSync(password, user.password)) {
      await conn.query('COMMIT')
      return { error: 'wrong password', type: 'user error' }
    }

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
    user.access_expired = TOKEN_EXPIRE

    return { user }
  } catch (error) {
    await conn.query('ROLLBACK')
    console.log(error)
    return { error, type: 'internal error' }
  } finally {
    await conn.release()
  }
}

async function fbSignIn(user, accesstoken) {
  const conn = await db.getConnection()
  try {
    await conn.query('BEGIN')
    // Check if this email exists
    const emailResult = await findUserDataByEmail(user.email)

    if (!emailResult.length) {
      user.role = 'visitor'
      user.access_expired = TOKEN_EXPIRE

      // Insert data into db
      const isnertQry = 'INSERT INTO user SET ?'
      const [insertResult] = await conn.query(isnertQry, user)
      user.id = insertResult.insertId
    } else {
      // add userid in access token
      user.id = emailResult[0].id
    }

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
    await conn.query('COMMIT')

    user.access_token = accessToken
    return { user }
  } catch (error) {
    console.log(error)
    await conn.query('ROLLBACK')
    return { error, type: 'internal error' }
  } finally {
    await conn.release()
  }
}

async function signUp(name, email, password) {
  const conn = await db.getConnection()
  try {
    await conn.query('BEGIN')

    const emails = await conn.query(
      'SELECT email FROM user WHERE email = ? FOR UPDATE',
      [email]
    )
    if (emails[0].length > 0) {
      await conn.query('COMMIT')
      return { error: 'email exist', type: 'user error' }
    }

    const user = {
      provider: 'native',
      email: email,
      password: bcrypt.hashSync(password, salt),
      name: name,
      picture: '/img/profile-icon.png',
      access_expired: TOKEN_EXPIRE,
      role: 'visitor'
    }

    const queryStr = 'INSERT INTO user SET ?'
    const [result] = await conn.query(queryStr, user)
    user.id = result.insertId

    // update user picture url
    const updatePicQry = 'UPDATE user SET picture = ? WHERE id = ?'
    const defaultImg = `https://stocomm.s3.ap-northeast-1.amazonaws.com/users/${result.insertId}-profile`
    const [picResult] = await conn.query(updatePicQry, [
      defaultImg,
      result.insertId
    ])

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
    return { error, type: 'internal error' }
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

async function followUser(userId, followId) {
  const conn = await db.getConnection()
  try {
    const [searchResult] = await conn.query(
      'SELECT * FROM follow_status WHERE user_id = ? AND following_id = ?',
      [userId, followId]
    )

    if (searchResult.length !== 0) {
      return { error: 'duplicate' }
    }

    const [result] = await conn.query(
      'INSERT INTO follow_status (user_id, following_id) VALUES ?',
      [[[userId, followId]]]
    )

    return result.insertId
  } catch (error) {
    console.log(error)
    return { error }
  } finally {
    await conn.release()
  }
}

async function unFollowUser(userId, followId) {
  try {
    const [result] = await db.query(
      'DELETE FROM follow_status WHERE user_id = ? AND following_id = ?',
      [[userId], [followId]]
    )
    return result.insertId
  } catch (error) {
    console.log(error)
    return { error }
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
    console.log(error)
    return { error }
  }
}

async function getFollwingNums(userId) {
  const followingQry = `
  select count(*) as following from follow_status 
  where following_id = ?
  `
  const followerQry = `
  select count(*) as follower from follow_status 
  where user_id = ?
  `
  try {
    const [followerResult] = await db.query(followerQry, [userId])
    const [followingResult] = await db.query(followingQry, [userId])
    const followers = followerResult.length ? followerResult[0].follower : 0
    const following = followingResult.length ? followingResult[0].following : 0
    return { following, followers }
  } catch (error) {
    console.log(error)
    return { error }
  }
}

async function editProfile(userData) {
  const qryString = `
    UPDATE user 
    SET  
    name = IF(?, ?, name),
    picture = IF(?, ?, picture)
    WHERE id = ?
  `
  try {
    const [result] = await db.query(qryString, [
      userData.name.length,
      userData.name,
      userData.picture ? userData.picture.length : 0,
      userData.picture,
      userData.id
    ])
    return result
  } catch (error) {
    console.log(error)
    return { error }
  }
}

module.exports = {
  nativeSignIn,
  fbSignIn,
  signUp,
  getUserInfo,
  changeToStreamer,
  followUser,
  unFollowUser,
  checkFollowState,
  findUserDataByEmail,
  editProfile,
  getFollwingNums
}
