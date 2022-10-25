const express = require('express')
const router = express.Router()
const { getIdea } = require('../../controller/ideas-controller')

router.get('/', (req, res) => {
  res.render('home', { style: 'home.css' })
})

router.get('/explore', (req, res) => {
  res.render('explore', { style: 'hot-rooms.css' })
})

router.get('/following', (req, res) => {
  res.render('following', { style: 'member.css' })
})

router.get('/hot-rooms', (req, res) => {
  res.render('hot-rooms', { style: 'hot-rooms.css' })
})

router.get('/member', (req, res) => {
  res.render('member', { style: 'member.css' })
})

router.get('/personal-articles/:id', (req, res) => {
  const followId = req.params.id
  res.render('personal-articles', { style: 'member.css', followId })
})

router.get('/personal-following/:id', (req, res) => {
  const followId = req.params.id
  res.render('personal-following', { style: 'member.css', followId })
})

router.get('/war-room', (req, res) => {
  res.render('war-room', { style: 'war-room.css' })
})

router.get('/post', (req, res) => {
  res.render('post-page', { style: 'post.css' })
})

router.get('/ideas-details', getIdea)

module.exports = router
