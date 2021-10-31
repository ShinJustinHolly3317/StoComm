const validator = require('validator')
const WarRoom = require('../model/war-room-model')

async function createWarRoom(req, res) {
  const createData = req.body
  const result = await WarRoom.createWarRoom(createData)

  if (result.error) {
    return res.status(404).send({error: '無此代號或名稱'})
  }

  res.send({
    data: { insertId: result.insertId, stock_code: result.stock_code }
  })
}

async function showOnlineRooms(req, res) {
  const onlineRooms = await WarRoom.showOnlineRooms()
  res.send({ data: onlineRooms })
}

async function endWarRoom(req, res) {
  const userRole = req.body
  const result = await WarRoom.endWarRoom(userRole.roomId)

  if (result.error) {
    res.status(500).send({ error: result.error })
  } else if (!result.affectedRows) {
    res.status(404).send({ message: 'invalid roomId' })
  } else {
    res.status(200).send({ message: 'War room ended!' })
  }
}

module.exports = { createWarRoom, showOnlineRooms, endWarRoom }
