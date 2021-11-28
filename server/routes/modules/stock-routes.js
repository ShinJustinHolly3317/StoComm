const router = require('express').Router()

// stock controller
const {
  getStockNews,
  getStockRevenue,
  getStockGross,
  getDayPrices,
  getYearPrice,
  getStockChip,
  getCompanyName
} = require('../../controller/stock-info-controller')

router.get('/stock-news/:stockCode', getStockNews)
router.get('/stock-revenue/:stockCode', getStockRevenue)
router.get('/stock-gross/:stockCode', getStockGross)
router.get('/day-prices/:stockCode', getDayPrices)
router.get('/year-price/:stockCode', getYearPrice)
router.get('/stock-chip/:stockCode', getStockChip)
router.get('/company-name/:stockCode', getCompanyName)

module.exports = router
