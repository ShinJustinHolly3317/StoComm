const { server, request, db, redisClient } = require('./setup')
const { ideaLikes } = require('./fake-data')
const { getIdeaLikes } = require('./fake-data-generator')
require('./teardown')()

describe('PATCH /api/1.0/user/', () => {
  afterAll((done) => {
    redisClient.quit()
    done()
  })

  describe('Total likes should plus one more', () => {
    test('Total likes should plus one more', async () => {
      const fakerUser = {
        provider: 'native',
        email: 'test1@gmail.com',
        password: 'test1password',
        access_token: null
      }
      const fakeIdea = {
        userId: 1,
        ideaId: 1
      }

      const userResponse = await request(server)
        .post('/api/1.0/user/log_in')
        .send(fakerUser)
      const accessToken = userResponse.body.data.access_token
      const likeResponse = await request(server)
        .patch(
          `/api/1.0/ideas/idea_like?userId=${fakeIdea.userId}&ideaId=${fakeIdea.ideaId}`
        )
        .set({ Authorization: 'Bearer ' + accessToken })

      let totalLikes = 0
      ideaLikes.forEach((item) => {
        totalLikes += item.likes_num
      })

      const [addedIdeaLikes] = await getIdeaLikes(db)
      expect(Number(addedIdeaLikes.total_likes)).toEqual(totalLikes + 1)
    })

    test('Should get 403 without access token', async () => {
      const fakerUser = {
        provider: 'native',
        email: 'test1@gmail.com',
        password: 'test1password',
        access_token: null
      }
      const fakeIdea = {
        userId: 1,
        ideaId: 1
      }

      const userResponse = await request(server)
        .post('/api/1.0/user/log_in')
        .send(fakerUser)
      const likeResponse = await request(server).patch(
        `/api/1.0/ideas/idea_like?userId=${fakeIdea.userId}&ideaId=${fakeIdea.ideaId}`
      )

      expect(likeResponse.statusCode).toBe(401)
    })
  })
})
