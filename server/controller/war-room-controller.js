const WarRoom = require('../model/war-room-model')

// Functions
async function createWarRoom(req, res) {
  const createData = req.body
  const result = await WarRoom.createWarRoom(createData)

  if (result.error) {
    return res
      .status(404)
      .send({ error: 'stock code or company name not found' })
  } else {
    res.status(200).send({
      data: { insertId: result.insertId, stock_code: result.stock_code }
    })
  }
}

async function getOnlineRooms(req, res) {
  const result = await WarRoom.getOnlineRooms()
  if (result.error) {
    console.log(error)
    return res.status(500).send({ error })
  } else {
    res.status(200).send({ data: result })
  }
}

async function endWarRoom(req, res) {
  const { roomId } = req.params
  const userId = req.user.id
  const result = await WarRoom.endWarRoom(roomId, userId)

  if (result.error) {
    res.status(500).send({ error: result.error })
  } else if (!result.affectedRows) {
    res.status(404).send({ message: 'invalid roomId' })
  } else {
    res.status(200).send({ message: 'War room ended!' })
  }
}

async function getRoomInfo(req, res) {
  const { roomId } = req.query
  const result = await WarRoom.getRoomInfo(roomId)
  if (result.error) {
    console.log(error)
    return res.status(500).send({ error })
  } else {
    res.status(200).send({ data: result })
  }
}

async function updateRoomRights(req, res) {
  const { roomId, open_draw, open_mic } = req.query

  const result = await WarRoom.updateRoomRights(roomId, open_draw, open_mic)
  if (result.error) {
    return res.status(500).send({ error: result })
  } else {
    res.status(200).send({ message: 'update successfully' })
  }
}

module.exports = {
  createWarRoom,
  getOnlineRooms,
  endWarRoom,
  getRoomInfo,
  updateRoomRights
}
