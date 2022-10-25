const router = require('express').Router()
const multer = require('multer')
const upload = multer()

const { authentication } = require('../../../utils/utils')

const {
  createWarRoom,
  getOnlineRooms,
  endWarRoom,
  getRoomInfo,
  updateRoomRights
} = require('../../controller/war-room-controller')

router.get('/show_online_rooms', getOnlineRooms)
router.get('/war_room_info', authentication, getRoomInfo)
router.post('/create_war_room', upload.none(), createWarRoom)
router.patch('/end_war_room/:roomId', authentication, endWarRoom)
router.patch('/war_room_info', authentication, updateRoomRights)

module.exports = router
