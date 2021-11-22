const router = require('express').Router()

// stock controller
const {
  stockNews,
  stockRevenue,
  stockGross,
  getDayPrices,
  getYearPrice,
  stockChip,
  getCompanyName
} = require('../../controller/stock-info-controller')

router.use('/stock-news/:stockCode', stockNews)
router.use('/stock-revenue/:stockCode', stockRevenue)
router.use('/stock-gross/:stockCode', stockGross)
router.use('/day-prices/:stockCode', getDayPrices)
router.use('/year-price/:stockCode', getYearPrice)
router.use('/stock-chip/:stockCode', stockChip)
router.use('/company-name/:stockCode', getCompanyName)

module.exports = router