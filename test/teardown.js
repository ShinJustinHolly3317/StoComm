const { server, redisClient,db } = require('./setup')

module.exports = async () => {
  afterAll(async () => {
    redisClient.quit()
    server.close()
    await db.end()
  })
}
