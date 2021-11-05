const router = require('express').Router()
const multer = require('multer')
const upload = multer()

const {
  wrapAsync,
  checkUserExist,
  authentication
} = require('../../../utils/utils')

const {
  createWarRoom,
  showOnlineRooms,
  endWarRoom
} = require('../../controller/war-room-controller')

router.get('/show_online_rooms', showOnlineRooms)
router.post('/create_war_room', upload.none(), createWarRoom)
router.patch('/end_war_room/:roomId', authentication, endWarRoom)

module.exports = router