const { server, request, db, redisClient } = require('./setup')
const { users } = require('./fake-data')
require('./teardown')()

describe('POST /api/1.0/user/log_in', () => {
  afterAll((done) => {
    redisClient.quit()
    done()
  })

  describe('Native signin by email and password', () => {
    test('should response with a 200 status code', async () => {
      const fakerUser = {
        provider: 'native',
        email: 'test1@gmail.com',
        password: 'test1password',
        access_token: null,
      }

      const response = await request(server).post('/api/1.0/user/log_in').send(fakerUser)

      expect(response.statusCode).toBe(200)
      // Make sure access_token has been updated
      expect(response.body.data.access_token).not.toEqual(users[0].access_token)
    })

    test('should response with a 403 status code', async () => {
      const fakerUser = {
        provider: 'native',
        email: 'test2@gmail.com',
        password: 'wrongpassword',
        access_token: null
      }

      const response = await request(server)
        .post('/api/1.0/user/log_in')
        .send(fakerUser)

      expect(response.statusCode).toBe(403)
    })
  })
})
