const { FB_API, CLOUDFRONT_PATH } = process.env
const validator = require('validator')
const User = require('../model/user-model')
const axios = require('axios')
const { textLenCheck } = require('../../utils/utils')
const { uploadDefaultPic } = require('../../utils/aws-s3')

async function login(req, res) {
  const { provider, email, password, access_token } = req.body

  let result
  switch (provider) {
    case 'native':
      result = await User.nativeSignIn(email, password)
      break
    case 'facebook':
      try {
        const fbResponse = await axios(FB_API + access_token)
        const fbUserData = fbResponse.data
        const userData = {
          provider,
          name: fbUserData.name,
          email: fbUserData.email,
          password: 'Third-party',
          picture: fbUserData.picture.data.url
        }
        result = await User.fbSignIn(userData, access_token)
      } catch (error) {
        return res.status(500).send({ error })
      }
      break
    default:
      result = { error: 'Wrong Request' }
  }

  if (result.error) {
    switch (result.type) {
      case 'user error':
        return res.status(403).send({ error: result.error })
      case 'internal error':
        return res.status(500).send({ error: result.error })
    }
  }

  const user = result.user

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

async function signUp(req, res) {
  let { name } = req.body
  const { email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).send({ error: 'empty input', type: 'user error' })
  }

  if (!validator.isEmail(email)) {
    return res.status(400).send({ error: 'wrong format', type: 'user error' })
  }

  if (textLenCheck(email) > 32) {
    return res
      .status(400)
      .send({ error: 'too long', type: 'user error', target: 'email' })
  }
  if (textLenCheck(name) > 32) {
    return res
      .status(400)
      .send({ error: 'too long', type: 'user error', target: 'name' })
  }

  name = validator.escape(name)

  const result = await User.signUp(name, email, password)

  if (result.error) {
    switch (result.type) {
      case 'user error':
        return res.status(403).send({ error: result.error })
      case 'internal error':
        return res.status(500).send({ error: result.error })
    }
  }

  const user = result.user

  // upload default image
  await uploadDefaultPic(user.id)

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

async function getUserInfo(req, res) {
  const { userId } = req.query
  const result = await User.getUserInfo(userId)

  if (result.error) {
    res.status(500).send({ error: result.error })
  } else {
    res.send({ data: result })
  }
}

async function followUser(req, res) {
  const { userId, followId } = req.query

  const result = await User.followUser(userId, followId)
  if (result.error) {
    if (result.error === 'duplicate') {
      return res.status(409).send({ error: result.error })
    } else {
      return res.status(500).send({ error: result.error })
    }
  }

  res.status(200).send({ message: 'update follow data successfully' })
}

async function unfollowUser(req, res) {
  const { userId, followId } = req.query

  const result = await User.unFollowUser(userId, followId)
  if (result.error) {
    console.log(result.error)
    return res.status(500).send({ error: result.error })
  }

  res.status(200).send({ message: 'update follow data successfully' })
}

async function checkFollowState(req, res) {
  const { userId, followId } = req.query

  const result = await User.checkFollowState(userId, followId)
  if (result.length) {
    res.status(200).send({ data: result })
  } else {
    res.status(404).send({ message: 'No followed records' })
  }
}

async function editProfile(req, res) {
  const userData = {}
  const { user_name, user_id } = req.body

  // Handle cloudFront image url
  if (req.file) {
    let s3Url = req.file.location
    let cdnUrl = CLOUDFRONT_PATH + 'users/' + s3Url.split('/users/')[1]
    userData.picture = req.file ? cdnUrl : ''
  }

  userData.name = user_name || ''
  userData.id = Number(user_id)

  // Prevent over length name
  if (textLenCheck(userData.name) > 32) {
    return res.status(400).send({ error: 'Name is too long!' })
  }

  const result = await User.editProfile(userData)

  if (result.error) {
    res.status(500).send({ error: 'Server Problem' })
  } else {
    res.status(200).send({ data: result.insertId })
  }
}

async function getFollowingNums(req, res) {
  const { userId } = req.query
  const result = await User.getFollwingNums(userId)

  if (result.error) {
    res.status(500).send({ error: 'Server Problem' })
  } else {
    res.status(200).send({
      data: { followers: result.following, following: result.followers }
    })
  }
}

async function checkUserExist(req, res) {
  // For home page login welcom message
  const inputEmail = req.body.email
  const searchResult = await User.findUserDataByEmail(inputEmail)

  if (searchResult.length) {
    res.send({
      searchResult: true,
      name: searchResult[0].name,
      email: searchResult[0].email,
      provider: searchResult[0].provider,
      email: searchResult[0].email,
      picture: searchResult[0].picture,
      id: searchResult[0].id,
      access_expired: searchResult[0].access_expired,
      access_token: searchResult[0].access_token
    })
  } else {
    res.send({ searchResult: false })
  }
}

module.exports = {
  login,
  signUp,
  getUserInfo,
  followUser,
  unfollowUser,
  checkFollowState,
  editProfile,
  getFollowingNums,
  checkUserExist
}
