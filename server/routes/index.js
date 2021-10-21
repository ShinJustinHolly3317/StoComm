// Require express router
const express = require('express')
const router = express.Router()

// routes
const {
  stockNews,
  stockRevenue,
  stockGross
} = require('../controller/stock-info-controller')

router.use('/stockNews/:id', stockNews)
router.use('/stockRevenue/:id', stockRevenue)
router.use('/stockGross/:id', stockGross)

module.exports = router