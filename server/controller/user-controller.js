const { RssHandler } = require('htmlparser2')
const validator = require('validator')
const User = require('../model/user-model')

async function login(req, res) {
  const { provider, email, password, access_token } = req.body

  let result
  switch (provider) {
    case 'native':
      result = await User.nativeSignIn(email, password)
      break
    case 'facebook':
      result = await User.facebookSignIn(access_token)
      break
    default:
      result = { error: 'Wrong Request' }
  }

  if (result.error) {
    const status_code = result.status ? result.status : 403
    res.status(status_code).send({ error: result.error })
    return
  }

  const user = result.user
  if (!user) {
    res.status(500).send({ error: 'Database Query Error' })
    return
  }

  res.status(200).send({
    data: {
      access_token: user.access_token,
      access_expired: user.access_expired,
      login_at: user.login_at,
      user: {
        id: user.id,
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    }
  })
}

async function signUp(req, res) {
  let { name } = req.body
  const { email, password } = req.body

  if (!name || !email || !password) {
    res
      .status(400)
      .send({ error: 'Request Error: name, email and password are required.' })
    return
  }

  if (!validator.isEmail(email)) {
    res.status(400).send({ error: 'Request Error: Invalid email format' })
    return
  }

  name = validator.escape(name)

  const result = await User.signUp(name, email, password)
  if (result.error) {
    res.status(403).send({ error: result.error })
    return
  }

  const user = result.user
  if (!user) {
    res.status(500).send({ error: 'Database Query Error' })
    return
  }

  res.status(200).send({
    data: {
      access_token: user.access_token,
      access_expired: user.access_expired,
      user: {
        id: user.id,
        provider: user.provider,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    }
  })
}

async function userData(req, res) {
  const { userId } = req.query
  const result = await User.getUserDetail(userId)

  if (result.error) {
    res.status(500).send({ error: result.error })
  } else {
    res.send({ data: result })
  }
}

async function setUserPermisstion(req, res) {
  const permissionType = req.body.type
  const { isAllow, userId, usersId } = req.body

  try {
    switch (permissionType) {
      case 'is_drawable':
        if (isAllow) {
          User.allowUserDraw(userId)
        } else {
          User.denyUserDraw(userId)
        }
        break
      case 'is_mic_on':
        if (isAllow) {
          User.allowUserMic(userId)
        } else {
          User.denyUserMic(userId)
        }
        break
      case 'is_allDrawable':
        if (isAllow) {
          User.allowAllUserDraw(usersId)
        } else {
          User.denyAllUserDraw(usersId)
        }
        break
    }
    res.status(200).send({ message: 'user permission set successfully!' })
  } catch (error) {
    console.error(error)
    return { error }
  }
}

async function followUser(req, res) {
  const { userId, followId } = req.query

  const result = await User.followUser(userId, followId)
  if (result.error) {
    if (result.error === 'duplicate') {
      res.status(409).send({ error: result.error })
      return
    }
    res.status(500).send({ error: result.error })
    return
  }

  res.status(200).send({ message: 'update follow data successfully'})
}

async function unfollowUser(req, res) {
  const { userId, followId } = req.query

  const result = await User.unFollowUser(userId, followId)
  if (result.error) {
console.log(result.error)    
    res.status(500).send({ error: result.error })
    return
  }

  res.status(200).send({ message: 'update follow data successfully' })
}

async function checkFollowState(req, res) {
  const { userId, followId } = req.query

  const result = await User.checkFollowState(userId, followId) 
  if(result.length) {
    res.status(200).send({ data: result })
    return 
  } else {
    res.status(404).send({ message: 'No followed records'})
    return
  }
}

module.exports = {
  login,
  signUp,
  userData,
  setUserPermisstion,
  followUser,
  unfollowUser,
  checkFollowState
}
