const User = require('../server/model/user-model')
const { TOKEN_SECRET } = process.env
const jwt = require('jsonwebtoken')

async function authentication(req, res, next) {
  let accessToken = req.get('Authorization')
  const isMiddleware = !req.originalUrl.includes('user_auth')

  if (!accessToken) {
    return res.status(401).send({ error: 'Unauthorized' })
  }

  accessToken = accessToken.replace('Bearer ', '')

  if (accessToken == 'null') {
    return res.status(401).send({ error: 'Unauthorized' })
  }

  try {
    const user = jwt.verify(accessToken, TOKEN_SECRET)
    const userInfo = await User.getUserInfo(user.id)
    user.name = userInfo[0].name
    user.picture = userInfo[0].picture
    user.role = userInfo[0].role

    if (!user) {
      return res.status(403).send({ error: 'Your token is not valid!' })
    } else {
      if (isMiddleware) {
        req.user = user
        next()
      } else {
        return res.status(200).send({ data: user })
      }
    }
  } catch (error) {
    console.log(error)
    return res.status(403).send({ error: 'Forbidden' })
  }
}

function textLenCheck(str) {
  return str.replace(/[\u4E00-\u9FFF]/g, 'xx').length
}

module.exports = { authentication, textLenCheck }
