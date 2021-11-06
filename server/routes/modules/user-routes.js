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
  setUserPermisstion
} = require('../../controller/user-controller')

router.get('/user_auth', authentication)
router.get('/user_data', userData)
router.post('/check_user_exist', upload.array(), checkUserExist)

router.post('/log_in', login)
router.post('/sign_up', upload.array(), signUp)

router.patch('/user_permission', setUserPermisstion)

module.exports = router
