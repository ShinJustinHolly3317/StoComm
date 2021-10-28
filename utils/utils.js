require('dotenv').config()
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
  const searchResult = await User.findUserName(inputEmail)

  if (searchResult.length) {
    res.send({
      searchResult: true,
      name: searchResult[0].name,
      email: searchResult[0].email
    })
  } else {
    res.send({ searchResult: false })
  }
}

const wrapAsync = (fn) => {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next)
  }
}

module.exports = { checkUserExist, wrapAsync }