// Require express router
const express = require('express')
const router = express.Router()

// routes
const render = require('./modules/render')
const userRoutes = require('./modules/user-routes')
const warRoomRoutes = require('./modules/war-room-routes')
const ideasRoute = require('./modules/ideas-route')
const stockInfoRoute = require('./modules/stock-routes')

router.use('/', render)
router.use('/api/1.0/user', userRoutes)
router.use('/api/1.0/war_room', warRoomRoutes)
router.use('/api/1.0/ideas', ideasRoute)
router.use('/api/1.0/stock', stockInfoRoute)

module.exports = router
