const Ideas = require('../model/ideas-model')
const moment = require('moment')
const fs = require('fs')

// AWS S3
const AWS = require('aws-sdk')
AWS.config.update({ region: 'ap-northeast-1' })
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY
})

async function createIdeas(req, res) {
  const ideasData = req.body

  // upload
  const image64 = ideasData.image.replace('data:image/jpeg;base64,', '')
  const buffdata = new Buffer.from(image64, 'base64')

  const imgName = moment().unix()
  ideasData.image = process.env.S3_IDEAS_PATH + '/' + imgName
  const insertId = await Ideas.createIdeas(ideasData)
  if (insertId.error) {
    return res.status(500).send({ error: '發表觀點失敗，請重新發表' })
  }

  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME + '/ideas',
    Key: imgName.toString(),
    Body: buffdata,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  }

  // upload to S3
  s3.upload(uploadParams, function (err, data) {
    if (err) {
      console.log('Error', err)
    }
    if (data) {
      console.log('Upload Success', data.Location)
    }
  })

  res.status(200).send({ data: { insertId } })
}

async function getIdeas(req, res) {
  const { userId,page } = req.query
  const result = await Ideas.getIdeas(userId, page)
  if (result.error) {
    return res.status(500).send({ error: '無法找到資料，請重試' })
  }

  // change date format
  for (let i in result.data) {
    result.data[i].date = moment(result.data[i].date).format('YYYY-MM-DD')
  }

  res.status(200).send({ data: result.data, totalCount: result.totalCount })
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

  const { result, totalCount } = await Ideas.getHotIdeas(filter, page, {
    userId
  })

  if (result.error) {
    return res.status(500).send({ error: '無法找到資料，請重試' })
  }

  // change date format
  for (let i in result) {
    result[i].date = moment(result[i].date).format('YYYY-MM-DD')
  }

  res.status(200).send({ data: result, totalCount })
}

async function addLikes(req, res) {
  const {userId, ideaId, isLiked} = req.query

  const result = await Ideas.addLikes(userId, ideaId, isLiked)

  if (result.error) {
    return res.status(500).send({ error: 'Internal error' })
  } else if (result.overlimit){
    return res.status(500).send({ overlimit: '祝大家Demo順利!!' })
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

async function deleteIdea(req, res) {
  const { ideaId } = req.query

  const result = await Ideas.deleteIdea(ideaId, req.user.id)

  if (result.error) {
    console.log(result.error)
    return res.status(500).send({ error: 'Internal error' })
  } else if(result.forbidden){
    console.log(result.forbidden)
    return res.status(403).send({ error: result.forbidden })
  }

  res.status(200).send({ data: result })
}
 
module.exports = {
  createIdeas,
  getIdeas,
  getIdea,
  getHotIdeas,
  addLikes,
  getIdeaLikes,
  deleteIdea
}
