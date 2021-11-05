const express = require('express')
const router = express.Router()
const Ideas = require('../../model/ideas-model')
const moment = require('moment')

router.get('/', (req, res) => {
  res.render('home', { style: 'home.css' })
})

router.get('/explore', (req, res) => {
  res.render('explore', { style: 'explore.css' })
})

router.get('/following', (req, res) => {
  res.render('following', { style: 'member.css' })
})

router.get('/hot-rooms', (req, res) => {
  res.render('hot-rooms', { style: 'hot-rooms.css' })
})

router.get('/industry', (req, res) => {
  res.render('industry', { style: 'industry.css' })
})

router.get('/member', (req, res) => {
  res.render('member', { style: 'member.css' })
})

router.get('/personal-articles', (req, res) => {
  res.render('personal-articles', { style: 'personal-articles.css' })
})

router.get('/stock-rooms', (req, res) => {
  res.render('stock-rooms', { style: 'stock-rooms.css' })
})

router.get('/war-room', (req, res) => {
  res.render('war-room', { style: 'war-room.css' })
})

router.get('/watchlist', (req, res) => {
  res.render('watchlist', { style: 'member.css' })
})

router.get('/post', (req, res) => {
  res.render('post-page', { style: 'post.css' })
})

router.get('/ideas-details', async (req, res) => {
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

  res.render('ideas-details', { style: 'ideas-details.css', ideaData: ideaData[0] })
})

module.exports = router
