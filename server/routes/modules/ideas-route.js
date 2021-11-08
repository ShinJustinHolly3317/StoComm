const router = require('express').Router()

const {
  wrapAsync,
  checkUserExist,
  authentication
} = require('../../../utils/utils')
const {
  createIdeas,
  getIdeas,
  getIdea,
  getHotIdeas,
  addLikes,
  getIdeaLikes
} = require('../../controller/ideas-controller')

router.post('/', createIdeas)
router.get('/all', getIdeas)
router.get('/hot_ideas', getHotIdeas)
router.get('/idea_like', getIdeaLikes)
router.patch('/idea_like', addLikes)

router.get('/', getIdea)

module.exports = router