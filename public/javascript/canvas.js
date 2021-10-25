let drawHistory = []
const socket = io()
const toolSelection = document.querySelector('#tool')
let toolType = 'brush'
let drawId = 0
let recievedDrawId = 0

// function
function sendDrawHistory() {
  socket.emit('send_draw_history', drawHistory)
}

function resumeHistory(ctx, drawHistoryItem) {
  ctx.strokeStyle = 'rgb(240,80,80)'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'

  // change tool
  if (drawHistoryItem.toolType === 'brush') {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = 'rgb(240,80,80)'
    ctx.lineWidth = 10
  } else if (drawHistoryItem.toolType === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineWidth = 30
  }

  // location
  const x = drawHistoryItem.location[0]
  const y = drawHistoryItem.location[1]

  // resuming prevx, prevy
  if (drawHistoryItem.drawId !== recievedDrawId) {
    ctx.beginPath()
    recievedDrawId = drawHistoryItem.drawId
  }

  ctx.lineTo(x, y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y)
}

// lisener
window.addEventListener('load', () => {
  const canvas = document.querySelector('#canvas')
  const ctx = canvas.getContext('2d')

  // loading drawing history
  socket.on('take_draw_history', (drawHistoryFromServer) => {
    ctx.beginPath()
    for (let item of drawHistoryFromServer) {
      resumeHistory(ctx, item)
    }
  })

  // resizing the canvas
  canvas.height = window.innerHeight * 0.9
  canvas.width = window.innerWidth

  // draw rect
  // ctx.fillStyle = 'rgb(121, 209, 201)'
  // ctx.fillRect(100, 100, 200, 500)
  // ctx.strokeStyle = 'rgb(240,80,80)'
  // ctx.lineWidth = 5
  // ctx.strokeRect(150, 150, 200, 500)

  // draw line
  // ctx.beginPath()
  // ctx.moveTo(400, 100)
  // ctx.lineTo(450, 100)
  // ctx.lineTo(450, 150)
  // ctx.stroke()
  // ctx.beginPath()
  // ctx.moveTo(500, 100)
  // ctx.lineTo(550, 100)
  // ctx.lineTo(550, 150)
  // ctx.stroke()

  // default image
  const defaultImg = document.querySelector('#default-img')
  ctx.drawImage(
    defaultImg,
    window.innerWidth / 2 - defaultImg.width / 2,
    window.innerHeight / 2 - defaultImg.height / 2
  )

  // paiting with mouse
  // control params
  let isPainting = false
  let prevX = 0
  let prevY = 0

  function startPosition(e) {
    isPainting = true
    ctx.beginPath()
    draw(e)
  }

  function finishPosition() {
    isPainting = false
    drawId++
  }

  function draw(e) {
    if (!isPainting) return
    console.log(toolType)
    if (toolType === 'brush') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = 'rgb(240,80,80)'
      ctx.lineWidth = 10
    } else if (toolType === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = 30
    }
    ctx.lineCap = 'round'

    // storing prevx, prevy
    prevX = e.clientX
    prevY = e.clientY

    ctx.lineTo(e.clientX, e.clientY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(e.clientX, e.clientY)

    drawHistory.push({ location: [e.clientX, e.clientY], toolType, drawId })
    sendDrawHistory()
  }

  // function offsetDraw() {
  //   ctx.beginPath()
  //   if (drawHistory[drawHistory.length-1]) {
  //     console.log(
  //       drawHistory[drawHistory.length-1][0],
  //       drawHistory[drawHistory.length-1][1]+500
  //     )
  //     ctx.beginPath()
  //     ctx.lineTo(
  //       drawHistory[drawHistory.length-1][0],
  //       drawHistory[drawHistory.length-1][1]+500
  //     )
  //     ctx.stroke()
  //   }
  // }

  // listener
  canvas.addEventListener('mousedown', startPosition)
  canvas.addEventListener('mouseup', finishPosition)
  canvas.addEventListener('mousemove', draw)
})

// window.addEventListener('resize', () => {
//   canvas.height = window.innerHeight
//   canvas.width = window.innerWidth
// })

toolSelection.addEventListener('change', () => {
  toolType = toolSelection.value
})
