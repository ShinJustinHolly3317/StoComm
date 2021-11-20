const validator = require('validator')
const User = require('../model/user-model')
const fs = require('fs')

// AWS S3
const AWS = require('aws-sdk')
AWS.config.update({ region: 'ap-northeast-1' })
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY
})

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

  // upload default image
  const defaultImg = fs.createReadStream(__dirname + '/../../public/img/profile-icon.png')
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME + '/users',
    Key: user.id + '-profile',
    Body: defaultImg,
    ACL: 'public-read',
    ContentType: 'image/png'
  }

  // upload to S3
  s3.upload(uploadParams, function (err, data) {
    if (err) {
      console.log('Error', err)
      res.status(500).send({error: '伺服器內部出錯了'})
      return
    }
    if (data) {
      console.log('Upload Success', data.Location)
    }
  })

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

async function editProfile (req, res){
  const userData = {}
  const { user_name, user_id } = req.body
  
  userData.name = user_name || ''
  userData.id = Number(user_id)
  userData.picture = req.file ? req.file.location : ''
  const result = await User.editProfile(userData)
  
  if(result.error) {
    res.status(500).send({ error: 'Server Problem'})
  } else {
    res.status(200).send({ data: result.insertId })
  }
}

async function getFollwingNums(req, res) {
  const { userId } = req.query
  const result = await User.getFollwingNums(userId)

  if (result.error) {
    res.status(500).send({ error: 'Server Problem' })
  } else {
    res.status(200).send({ data: { followers:result.following, following:result.followers } })
  }
}

module.exports = {
  login,
  signUp,
  userData,
  setUserPermisstion,
  followUser,
  unfollowUser,
  checkFollowState,
  editProfile,
  getFollwingNums
}
