const router = require('express').Router()
const multer = require('multer')
const upload = multer()

const {
  wrapAsync,
  checkUserExist,
  authentication
} = require('../../../utils/utils')
const {
  login,
  signUp,
  userData,
  setUserPermisstion,
  followUser,
  unfollowUser,
  checkFollowState
} = require('../../controller/user-controller')

router.get('/user_auth', authentication)
router.get('/user_data', userData)
router.post('/check_user_exist', upload.array(), checkUserExist)

router.post('/log_in', login)
router.post('/sign_up', upload.array(), signUp)

router.patch('/user_permission', setUserPermisstion)
router.patch('/follow_user', authentication, followUser)
router.patch('/unfollow_user', authentication, unfollowUser)
router.get('/check_follow', authentication, checkFollowState)
module.exports = router
