const Ideas = require('../model/ideas-model')
const moment = require('moment')
const fs = require('fs')

async function createIdeas(req, res) {
  const ideasData = req.body

  const insertId = await Ideas.createIdeas(ideasData)
  if (insertId.error) {
    return res.status(500).send({ error: '發表觀點失敗，請重新發表' })
  }

  // upload
  // const image64 = ideasData.image.replace('data:image/jpeg;base64,','')
  // fs.writeFile(__dirname + '/out.png', image64, 'base64', (err) => {
  //   if (err) throw err
  //   console.log('The file has been saved!')
  // })

  res.status(200).send({ data: { insertId } })
}

async function getIdeas(req, res) {
  const { userId } = req.query
  const result = await Ideas.getIdeas(userId)
  if (result.error) {
    return res.status(500).send({ error: '無法找到資料，請重試' })
  }

  // change date format
  for (let i in result) {
    result[i].date = moment(result[i].date).format('YYYY-MM-DD')
  }

  res.status(200).send({ data: result })
}

async function getIdea(req, res) {
  const { ideaId } = req.params

  const result = await Ideas.getIdea(ideaId)
  if (insertId.error) {
    return res.status(500).send({ error: '無法找到資料，請重試' })
  }
  
  // formating time data
  result[0].date = moment(result[0].date).format('YYYY-MM-DD')

  res.status(200).send({ data: result })
}

async function getHotIdeas(req, res) {
  const {filter, page, userId, limit} = req.query

  const result = await Ideas.getHotIdeas(filter, page, {userId})

  if (result.error) {
    return res.status(500).send({ error: '無法找到資料，請重試' })
  }

  // change date format
  for (let i in result) {
    result[i].date = moment(result[i].date).format('YYYY-MM-DD')
  }

  res.status(200).send({ data: result })
}

async function addLikes(req, res) {
  const {userId, ideaId, isLiked} = req.query

  const result = await Ideas.addLikes(userId, ideaId, isLiked)

  if (result.error) {
    return res.status(500).send({ error: 'Internal error' })
  }

  res.status(200).send({ data: result })
}

async function getIdeaLikes(req, res) {
  const { ideaId } = req.query

  const result = await Ideas.getIdeaLikes(ideaId)

  if (result.error) {
    return res.status(500).send({ error: 'Internal error' })
  }

  res.status(200).send({ data: result })
}
 

module.exports = {
  createIdeas,
  getIdeas,
  getIdea,
  getHotIdeas,
  addLikes,
  getIdeaLikes
}
