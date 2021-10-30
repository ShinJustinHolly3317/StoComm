// Require express router
const express = require('express')
const router = express.Router()

// routes
const {
  stockNews,
  stockRevenue,
  stockGross,
  getDayPrices,
} = require('../controller/stock-info-controller')
const render = require('./modules/render')
const userRoutes = require('./modules/user-routes')
const warRoomRoutes = require('./modules/war-room-routes')

router.use('/', render)
router.use('/api/1.0/user', userRoutes)
router.use('/api/1.0/war_room', warRoomRoutes)
router.use('/stockNews/:id', stockNews)
router.use('/stockRevenue/:id', stockRevenue)
router.use('/stockGross/:id', stockGross)
router.use('/dayPrices/:id', getDayPrices)

module.exports = router
