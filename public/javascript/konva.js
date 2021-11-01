// Global variables
const drawHistory = {}
let localLayerCounter = 0
let width = window.innerWidth
let height = window.innerHeight - 150

// DOM
const cavasWrapper = document.querySelector('#canvas-wrapper')
const addCanvasBtn = document.querySelector('.add-canvas')

// tool controller
const toolController = {
  brush: function (layerObject, location) {
    let newPoints = layerObject.points().concat(location)
    layerObject.points(newPoints)
  },
  straightLine: function (layerCounter, location, layerObject) {
    let newPoints = drawHistory[layerCounter].location.concat(location)
    layerObject.points(newPoints)
  }
}

// first we need Konva core things: stage and layer
const stage = new Konva.Stage({
  container: 'canvas',
  width: width,
  height: height
})

const layer = new Konva.Layer()
stage.add(layer)

let isPaint = false
let localToolType = 'brush'
let localLayerObject

stage.on('mousedown touchstart', function (e) {
  if (localToolType === 'select') {
    isPaint = false
    return
  }
  isPaint = true

  let latestLayerId
  const pos = stage.getPointerPosition()

  // socket send new layer msg
  const initDrawInfo = {
    userId: socketId,
    drawLayerCounter: null, // latest id
    location: [pos.x, pos.y, pos.x, pos.y],
    toolType: localToolType
  }

  socket.emit('start draw', initDrawInfo)
})

stage.on('mouseup touchend', function () {
  isPaint = false
  localLayerObject = null // clear local drawing layer
})

// and core function - drawing
stage.on('mousemove touchmove', function (e) {
  if (!isPaint) {
    return
  }

  // prevent scrolling on touch devices
  e.evt.preventDefault()

  const pos = stage.getPointerPosition()

  switch (localToolType) {
    case 'brush':
      toolController.brush(localLayerObject, [pos.x, pos.y])
      break
    case 'eraser':
      toolController.brush(localLayerObject, [pos.x, pos.y])
      break
    case 'line':
      toolController.straightLine(
        localLayerCounter,
        [pos.x, pos.y],
        localLayerObject
      )
      break
  }

  socket.emit('drawing', localLayerCounter, [pos.x, pos.y])
})

// listener
const select = document.getElementById('tool')
select.addEventListener('change', function () {
  localToolType = select.value
})

/* text block */
// var textNode = new Konva.Text({
//   text: 'Some text here',
//   x: 50,
//   y: 50,
//   fontSize: 20
// })

// layer.add(textNode)

// textNode.on('dblclick dbltap', () => {
//   // create textarea over canvas with absolute position

//   // first we need to find position for textarea
//   // how to find it?

//   // at first lets find position of text node relative to the stage:
//   var textPosition = textNode.getAbsolutePosition()

//   // then lets find position of stage container on the page:
//   var stageBox = stage.container().getBoundingClientRect()

//   // so position of textarea will be the sum of positions above:
//   var areaPosition = {
//     x: stageBox.left + textPosition.x,
//     y: stageBox.top + textPosition.y
//   }

//   // create textarea and style it
//   var textarea = document.createElement('textarea')
//   document.body.appendChild(textarea)

//   textarea.value = textNode.text()
//   textarea.style.position = 'absolute'
//   textarea.style.top = areaPosition.y + 'px'
//   textarea.style.left = areaPosition.x + 'px'
//   textarea.style.width = textNode.width()

//   textarea.focus()

//   textarea.addEventListener('keydown', function (e) {
//     // hide on enter
//     if (e.keyCode === 13) {
//       textNode.text(textarea.value)
//       document.body.removeChild(textarea)
//     }
//   })
// })

// socket listener
socket.on('get latest id', (id, remoteDrawHistory) => {
  latestLayerId = id
  localLayerCounter = id

  // create new kayer

  localLayerObject = new Konva.Line({
    stroke: '#df4b26',
    strokeWidth: 5,
    globalCompositeOperation:
      localToolType === 'eraser' ? 'destination-out' : 'source-over',
    lineCap: 'round',
    // add point twice, so we have some drawings even on a simple click
    points:
      remoteDrawHistory[Object.keys(remoteDrawHistory).length - 1].location,
    draggable: true
  })
  drawHistory[latestLayerId] = {
    userId: socketId,
    drawLayerCounter: localLayerCounter, // latest id
    location:
      remoteDrawHistory[Object.keys(remoteDrawHistory).length - 1].location,
    toolType: localToolType
  }
  console.log(drawHistory)

  layer.add(localLayerObject)
})

socket.on('start sync draw', (remoteLatestLayerId, remoteDrawHistory) => {
  let newLine = new Konva.Line({
    stroke: '#df4b26',
    strokeWidth: 5,
    globalCompositeOperation:
      remoteDrawHistory[Object.keys(remoteDrawHistory).length - 1].toolType ===
      'eraser'
        ? 'destination-out'
        : 'source-over',
    // round cap for smoother lines
    lineCap: 'round',
    // add point twice, so we have some drawings even on a simple click
    points:
      remoteDrawHistory[Object.keys(remoteDrawHistory).length - 1].location,
    draggable: true
  })
  drawHistory[remoteLatestLayerId] =
    remoteDrawHistory[Object.keys(remoteDrawHistory).length - 1]
  drawHistory[remoteLatestLayerId].layerObject = newLine

  layer.add(newLine)
})

socket.on('latest draw history', (id, location) => {
  tracking(id, drawHistory[id].layerObject, location)
})

socket.on('init load data', (drawHistory) => {
  if (!Object.keys(drawHistory).length) {
    console.log(Object.keys(drawHistory))
    return
  }

  for (let key in drawHistory) {
    let layerObj = new Konva.Line({
      points: drawHistory[key].location,
      stroke: '#df4b26',
      strokeWidth: 5,
      lineCap: 'round',
      lineJoin: 'round',
      globalCompositeOperation:
        drawHistory[key].toolType === 'eraser'
          ? 'destination-out'
          : 'source-over',
      draggable: true
    })

    layer.add(layerObj)
  }
})

/* window listener */
window.addEventListener('resize', resumeHistory)
cavasWrapper.addEventListener('mouseout', (e) => {
  isPaint = false
})

addCanvasBtn.addEventListener('click', async (e) => {
  const curStockInfo = document.querySelector('.carousel-item.active')
  const canvas = await html2canvas(curStockInfo)
  let canvasImg = canvas.toDataURL('image/jpeg')

  addImg(canvasImg, layer)
})

/* function */
function resumeHistory() {
  // if resizing
  let width = window.innerWidth
  let height = window.innerHeight - 150
  stage.width(width)
  stage.height(height)

  // reloading drawing history
  for (let item of drawHistory) {
    let curLine = new Konva.Line({
      points: item.lastLinePosition,
      stroke: '#df4b26',
      strokeWidth: 5,
      lineCap: 'round',
      lineJoin: 'round',
      globalCompositeOperation:
        item.toolType === 'eraser' ? 'destination-out' : 'source-over',
      draggable: true
    })

    curLine.move({
      x: 0,
      y: 50
    })

    layer.add(curLine)
    stage.add(layer)
  }
}

function tracking(id, layerObject, locations) {
  // let newPoints = layerObject.points().concat([locations[0], locations[1]])
  // console.log(newPoints)
  // layerObject.points(newPoints)
  console.log(drawHistory[id].toolType)

  switch (drawHistory[id].toolType) {
    case 'brush':
      toolController.brush(layerObject, locations)
      break
    case 'eraser':
      toolController.brush(layerObject, locations)
      break
    case 'line':
      toolController.straightLine(id, locations, layerObject)
      break
  }
}

function initLoadLayer() {
  socket.emit('init load')
  socket.on('init load data', (drawHistory) => {
    console.log('ggggqqqq', drawHistory)
    if (!Object.keys(drawHistory).length) return

    for (let key in drawHistory) {
      let layerObj = new Konva.Line({
        points: drawHistory[key].location,
        stroke: '#df4b26',
        strokeWidth: 5,
        lineCap: 'round',
        lineJoin: 'round',
        globalCompositeOperation:
          drawHistory[key].toolType === 'eraser'
            ? 'destination-out'
            : 'source-over',
        draggable: true
      })

      layer.add(layerObj)
    }
  })
}

function addImg(imageBase64, layer) {
 var imageObj = new Image()
 imageObj.onload = function () {
   var yoda = new Konva.Image({
     x: window.innerWidth / 2 - (window.innerHeight - 150) / 2,
     y: 10,
     image: imageObj,
     width: window.innerHeight - 150,
     height: window.innerHeight - 150
   })

   // add the shape to the layer
   layer.add(yoda)
 }
 imageObj.src = imageBase64
}