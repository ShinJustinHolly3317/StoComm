const Ideas = require('../model/ideas-model')
const moment = require('moment')
const { uploadBase64Pic } = require('../../utils/aws-s3')

// Functions
async function createIdeas(req, res) {
  const ideasData = req.body

  // upload to S3
  const imageUrl = await uploadBase64Pic(ideasData.image)
  ideasData.image = imageUrl
  const result = await Ideas.createIdeas(ideasData)

  if (result.error) {
    return res.status(500).send({ error: 'Server Error' })
  }
  res.status(200).send({ data: result })
}

async function getIdeas(req, res) {
  const { userId, page } = req.query
  const result = await Ideas.getIdeas(userId, page)
  if (result.error) {
    return res.status(500).send({ error: 'Server Error' })
  }

  // change date format
  for (let i in result.data) {
    result.data[i].date = moment(result.data[i].date).format('YYYY-MM-DD')
  }

  res.status(200).send({ data: result.data, totalCount: result.totalCount })
}

async function getIdea(req, res) {
  const { id } = req.query
  const ideaData = await Ideas.getIdea(id)
  const analysisList = [
    '基本分析',
    '財務分析',
    '籌碼分析',
    '技術分析',
    '你的獨特觀點'
  ]

  // formating time data
  ideaData[0].date = moment(ideaData[0].date).format('YYYY-MM-DD')
  let content = JSON.parse(ideaData[0].content)
  let contentKeys = Object.keys(content)
  let tempContent = {}
  for (let i in contentKeys) {
    // delete empty content
    if (!content[contentKeys[i]]) {
      continue
    }
    tempContent[analysisList[i]] = content[contentKeys[i]]
  }
  ideaData[0].content = tempContent

  res.render('ideas-details', {
    style: 'ideas-details.css',
    ideaData: ideaData[0]
  })
}

async function getHotIdeas(req, res) {
  const { filter, page, userId } = req.query
  const { result, totalCount } = await Ideas.getHotIdeas(filter, page, {
    userId
  })

  if (result.error) {
    return res.status(500).send({ error: 'Server Error' })
  }

  // change date format
  for (let i in result) {
    result[i].date = moment(result[i].date).format('YYYY-MM-DD')
  }

  res.status(200).send({ data: result, totalCount })
}

async function addLikes(req, res) {
  const { userId, ideaId } = req.query
  const result = await Ideas.addLikes(userId, ideaId)

  if (result.error) {
    return res.status(500).send({ error: 'Server error' })
  } else if (result.overlimit) {
    return res.status(500).send({ overlimit: true })
  }

  res.status(200).send({ data: result })
}

async function getIdeaLikes(req, res) {
  const { ideaId } = req.query
  const result = await Ideas.getIdeaLikes(ideaId)

  if (result.error) {
    return res.status(500).send({ error: 'Server error' })
  }

  res.status(200).send({ data: result })
}

async function deleteIdea(req, res) {
  const { ideaId } = req.query
  const result = await Ideas.deleteIdea(ideaId, req.user.id)

  if (result.error) {
    console.log(result.error)
    return res.status(500).send({ error: 'Server error' })
  } else if (result.forbidden) {
    console.log(result.forbidden)
    return res.status(403).send({ error: result.forbidden })
  }

  res.status(200).send({ data: result })
}

module.exports = {
  createIdeas,
  getIdeas,
  getHotIdeas,
  addLikes,
  getIdeaLikes,
  deleteIdea,
  getIdea
}
