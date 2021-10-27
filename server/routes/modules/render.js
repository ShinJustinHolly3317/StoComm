const express = require('express')
const router = express.Router()

router.get('/article-details', (req, res)=>{
  res.render('article-details', {style: 'article-details.css'})
})
router.get('/explore', (req, res) => {
  res.render('explore', { style: 'explore.css' })
})
router.get('/following', (req, res) => {
  res.render('following', { style: 'following.css' })
})
router.get('/home', (req, res) => {
  res.render('home', { style: 'home.css' })
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
  res.render('watchlist', { style: 'watchlist.css' })
})

module.exports = router