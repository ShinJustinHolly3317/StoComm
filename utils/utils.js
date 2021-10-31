const crypto = require('crypto')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const port = process.env.PORT
const User = require('../server/model/user-model')
const { TOKEN_SECRET } = process.env // 30 days by seconds
const jwt = require('jsonwebtoken')

async function checkUserExist(req, res) {
  const inputEmail = req.body.email
  const searchResult = await User.findUserData(inputEmail)

  if (searchResult.length) {
    res.send({
      searchResult: true,
      name: searchResult[0].name,
      email: searchResult[0].email,
      provider: searchResult[0].provider,
      name: searchResult[0].name,
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

function wrapAsync(fn) {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next)
  }
}

async function authentication(req, res, next) {
  let accessToken = req.get('Authorization')
  if (!accessToken) {
    res.status(401).send({ error: 'Unauthorized' })
    return
  }

  accessToken = accessToken.replace('Bearer ', '')
  
  if (!accessToken) {
    res.status(401).send({ error: 'Unauthorized' })
    return
  }

  try {
    const user = jwt.verify(accessToken, TOKEN_SECRET)

    let userDetail = await User.getUserDetail(user.email)

    if (!userDetail) {
      res.status(403).send({ error: 'Your token is not valid!' })
    } else {
      res.send({ data: userDetail })
    }
    return
  } catch (err) {
    console.log(err)
    res.status(403).send({ error: 'Forbidden' })
    return
  }
}

module.exports = { checkUserExist, wrapAsync, authentication }
