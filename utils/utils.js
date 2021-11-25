const User = require('../server/model/user-model')
const { TOKEN_SECRET } = process.env
const jwt = require('jsonwebtoken')



async function authentication(req, res, next) {
  let accessToken = req.get('Authorization')
  const isMiddleware = !req.originalUrl.includes('user_auth')

  if (!accessToken) {
    res.status(401).send({ error: 'Unauthorized' })
    return
  }

  accessToken = accessToken.replace('Bearer ', '')

  if (accessToken == 'null') {
    res.status(401).send({ error: 'Unauthorized' })
    return
  }

  try {
    const user = jwt.verify(accessToken, TOKEN_SECRET)
    const userInfo = await User.getUserInfo(user.id)
    user.role = userInfo[0].role

    if (!user) {
      res.status(403).send({ error: 'Your token is not valid!' })
    } else {
      if (isMiddleware) {
        req.user = user
        next()
      } else {
        res.status(200).send({ data: user })
      }
    }
    return
  } catch (error) {
    console.log(error)
    res.status(403).send({ error: 'Forbidden' })
    return
  }
}

function textLenCheck(str) {
  return str.replace(/[\u4E00-\u9FFF]/g, 'xx').length
}

module.exports = { authentication, textLenCheck }
