const router = require('express').Router()

const { authentication } = require('../../../utils/utils')
const {
  createIdeas,
  getIdeas,
  getHotIdeas,
  addLikes,
  getIdeaLikes,
  deleteIdea
} = require('../../controller/ideas-controller')

router.post('/', createIdeas)
router.delete('/', authentication, deleteIdea)
router.get('/all', getIdeas)
router.get('/hot_ideas', getHotIdeas)
router.get('/idea_like', getIdeaLikes)
router.patch('/idea_like', authentication, addLikes)

module.exports = router
