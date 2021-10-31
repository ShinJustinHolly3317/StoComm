const router = require('express').Router()

const {
  wrapAsync,
  checkUserExist,
  authentication
} = require('../../../utils/utils')
const {
  createIdeas,
  getIdeas,
  getIdea
} = require('../../controller/ideas-controller')

router.post('/', createIdeas)
router.get('/all', getIdeas)

router.get('/', getIdea)

module.exports = router