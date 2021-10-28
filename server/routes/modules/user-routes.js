const router = require('express').Router()
const multer = require('multer')
const upload = multer()

const { wrapAsync, checkUserExist } = require('../../../utils/utils')
const { login, signUp } = require('../../controller/user-controller')

router.post(
  '/check_user_exist',
  upload.array(),
  checkUserExist,
)

router.post('/log_in', login)
router.post('/sign_up', upload.array(), signUp)

module.exports = router