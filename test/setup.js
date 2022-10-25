require('dotenv').config()
const { MODE } = process.env
const { server } = require('../app')
const { createrFakeData, truncateFakeData } = require('./fake-data-generator')
const request = require('supertest')
const db = require('../server/model/config/mysql-connection')
const redisClient = require('../utils/cache')

beforeAll(async () => {
  if (MODE !== 'test') {
    console.log('Not in test env')
    return
  }
  await truncateFakeData()
  await createrFakeData()
})

module.exports = {
  server,
  request,
  db,
  redisClient
}
