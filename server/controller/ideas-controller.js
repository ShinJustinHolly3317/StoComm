const Ideas = require('../model/ideas-model')
const moment = require('moment')

async function createIdeas(req, res) {
  const ideasData = req.body

  const insertId = await Ideas.createIdeas(ideasData)
  if (insertId.error) {
    return res.status(500).send({ error: '發表觀點失敗，請重新發表' })
  }
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


module.exports = { createIdeas, getIdeas, getIdea }
