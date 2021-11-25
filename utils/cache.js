const { CACHE_HOST, CACHE_PORT } = process.env
const Redis = require('redis')
const redisClient = Redis.createClient({ host: CACHE_HOST, port: CACHE_PORT })

const { promisify } = require('util')
const getAsync = promisify(redisClient.get).bind(redisClient)
const setAsync = promisify(redisClient.setex).bind(redisClient)
const delAsync = promisify(redisClient.del).bind(redisClient)

redisClient.on('error', (error) => {
  console.error(error) // this is for dev check
  console.log('Redis is not connected....');
})

redisClient.on('connect', () => {
  console.error('Redis connected..!') // this is for dev check
})

redisClient['getAsync'] = getAsync
redisClient['setAsync'] = setAsync
redisClient['delAsync'] = delAsync

module.exports = redisClient
