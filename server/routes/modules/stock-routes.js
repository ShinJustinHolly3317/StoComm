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

router.get('/stock_news/:stockCode', getStockNews)
router.get('/stock_revenue/:stockCode', getStockRevenue)
router.get('/stock_gross/:stockCode', getStockGross)
router.get('/day_prices/:stockCode', getDayPrices)
router.get('/year_price/:stockCode', getYearPrice)
router.get('/stock_chip/:stockCode', getStockChip)
router.get('/company_name/:stockCode', getCompanyName)

module.exports = router
