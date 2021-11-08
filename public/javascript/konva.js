// Global variables
const drawHistory = {}
const commandHistory = []
const undoHistory = []
let localLayerCounter = 0
let width = window.innerWidth
let height = window.innerHeight - 150

// DOM
const cavasWrapper = document.querySelector('#canvas-wrapper')
const addCanvasBtn = document.querySelector('.add-canvas')
const undoBtn = document.querySelector('#undo-btn')
const redoBtn = document.querySelector('#redo-btn')

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

// transformer
const tr = new Konva.Transformer()
tr.rotateEnabled(false)
tr.resizeEnabled(false)
tr.padding(10)
layer.add(tr)

// add a new feature, lets add ability to draw selection rectangle
const selectionRectangle = new Konva.Rect({
  fill: 'rgba(200, 200, 200, 0.5)',
  visible: false
})
layer.add(selectionRectangle)

let isPaint = false
let localToolType = 'select'
let localLayerObject
let curSelectShape

stage.on('mousedown touchstart', async (e) => {
  // prevent drawing
  // const isDrawAble = (await userAuth()).data.is_drawable

  // if (!isDrawAble) {
  //   return
  // }

  if (localToolType === 'select') {
    isPaint = false
    return
  }
  isPaint = true

  let latestLayerId
  const pos = stage.getPointerPosition()

  // socket send new layer msg
  const initDrawInfo = {
    userId: USER.id,
    drawLayerCounter: null, // latest id
    location: [pos.x, pos.y, pos.x, pos.y],
    toolType: localToolType
  }

  socket.emit('start draw', initDrawInfo)
})

stage.on('mouseup touchend', function () {
  isPaint = false
  localLayerObject = null // clear local drawing layer
  console.log(drawHistory);
})

// and core function - drawing
stage.on('mousemove touchmove', function (e) {
  if (!isPaint) {
    return
  }

  // prevent scrolling on touch devices
  e.evt.preventDefault()

  const pos = stage.getPointerPosition()

  if (!localLayerObject) return

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

  if (localToolType === 'brush') {
    drawHistory[localLayerCounter].location = drawHistory[
      localLayerCounter
    ].location.concat([pos.x, pos.y])
  } else if (localToolType === 'line') {
    drawHistory[localLayerCounter].location[2] = pos.x
    drawHistory[localLayerCounter].location[3] = pos.y
  }

  socket.emit('drawing', localLayerCounter, [pos.x, pos.y])
})

// clicks should select/deselect shapes
stage.on('click tap', function (e) {
  // if user us drawing 
  if (localToolType !== 'select') {
    return
  }

  // if click on empty area - remove all selections
  if (e.target === stage) {
    tr.nodes([])
    // console.log('curSelectShape', curSelectShape)
    // console.log('cursleectshape', stage.find(`#${0}`))
    if (curSelectShape) {
      // socket.emit('update drawing', curSelectShape)
      // curSelectShape.draggable(false)
      curSelectShape = null
    }
    return
  }

  // if we are selecting with rect, do nothing
  if (selectionRectangle.visible()) {
    return
  }

  // do nothing if clicked NOT on our rectangles
  if (!e.target.hasName('select')) {
    return
  }

  // do we pressed shift or ctrl?
  const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey
  const isSelected = tr.nodes().indexOf(e.target) >= 0
  console.log(e.target)
  if (!metaPressed && !isSelected) {
    // if no key pressed and the node is not selected
    // select just one
    tr.nodes([e.target])
    curSelectShape = e.target

    // e.target.draggable(true)
  } else if (metaPressed && isSelected) {
    // if we pressed keys and node was selected
    // we need to remove it from selection:
    const nodes = tr.nodes().slice() // use slice to have new copy of array
    // remove node from array
    nodes.splice(nodes.indexOf(e.target), 1)
    tr.nodes(nodes)
  } else if (metaPressed && !isSelected) {
    // add the node into selection
    const nodes = tr.nodes().concat([e.target])
    tr.nodes(nodes)
  }
})

// listener
const toolArea = document.querySelector('.draw-tool-area')
toolArea.addEventListener('click', (e) => {
  if (e.target.tagName === 'IMG') {
    if (document.querySelector('.tool-active')) {
      document.querySelector('.tool-active').classList.toggle('tool-active')
    }
    e.target.classList.toggle('tool-active')
  }
  localToolType = e.target.getAttribute('value')
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
socket.on('update my draw', (id, remoteDrawHistory) => {
  console.log(remoteDrawHistory)
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
    points: remoteDrawHistory[id].location,
    name: 'select',
    id: id.toString() // use string for consistancy
  })

  drawHistory[id] = {
    userId: socketId,
    drawLayerCounter: id.toString(), // latest id
    location: remoteDrawHistory[id].location,
    toolType: localToolType
  }

  // push into conmmand history
  commandHistory.push({ command: 'create', drawObj: drawHistory[id] })
  // console.log(drawHistory)

  // clear undo history
  undoHistory.length = 0

  // attach to layer
  layer.add(localLayerObject)

  // setting correct z index
  localLayerObject.zIndex(id)
})

socket.on('update start draw', (remoteLatestLayerId, remoteDrawHistory) => {
  let newLine = new Konva.Line({
    stroke: '#df4b26',
    strokeWidth: 5,
    globalCompositeOperation:
      remoteDrawHistory[remoteLatestLayerId].toolType === 'eraser'
        ? 'destination-out'
        : 'source-over',
    // round cap for smoother lines
    lineCap: 'round',
    // add point twice, so we have some drawings even on a simple click
    points: remoteDrawHistory[remoteLatestLayerId].location,
    name: 'select',
    id: remoteLatestLayerId.toString() // use string for consistancy
  })
  drawHistory[remoteLatestLayerId] = remoteDrawHistory[remoteLatestLayerId]
  drawHistory[remoteLatestLayerId].layerObject = newLine

  layer.add(newLine)

  // reset z index
  newLine.zIndex(remoteLatestLayerId)
})

socket.on('update drawing', (id, location) => {
  tracking(id, drawHistory[id].layerObject, location)
})

socket.on('init load data', (drawHistory) => {
  if (!Object.keys(drawHistory).length) {
    console.log(Object.keys(drawHistory))
    return
  }

  // for (let key in drawHistory) {
  //   let layerObj = new Konva.Line({
  //     points: drawHistory[key].location,
  //     stroke: '#df4b26',
  //     strokeWidth: 5,
  //     lineCap: 'round',
  //     lineJoin: 'round',
  //     globalCompositeOperation:
  //       drawHistory[key].toolType === 'eraser'
  //         ? 'destination-out'
  //         : 'source-over',
  //     name: 'select',
  //     id: key
  //   })

  //   layer.add(layerObj)
  // }

  for (let key in drawHistory) {
    if (drawHistory[key].toolType === 'image') {
      addImg(drawHistory[key].canvasImg, key, drawHistory[key].location)
    } else {
      // setTimeout(() => {
      //   // handle html render async
      //   let layerObj = new Konva.Line({
      //     points: drawHistory[key].location,
      //     stroke: '#df4b26',
      //     strokeWidth: 5,
      //     lineCap: 'round',
      //     lineJoin: 'round',
      //     globalCompositeOperation:
      //       drawHistory[key].toolType === 'eraser'
      //         ? 'destination-out'
      //         : 'source-over',
      //     name: 'select',
      //     id: key
      //   })
      //   layer.add(layerObj)
      // }, 0)

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
        name: 'select',
        id: key
      })
      layer.add(layerObj)

      // set z index
      layerObj.zIndex(key)
    }
  }
  console.log(drawHistory)
})

socket.on('update delete drawing', (drawingId) => {
  console.log(stage.find(`#${drawingId}`))
  stage.find(`#${drawingId}`)[0].destroy()
})

socket.on('update add image', (topLayerId, canvasImg, location) => {
  console.log('update image')
  addImg(canvasImg, topLayerId, location)
  drawHistory[topLayerId] = {
    userId: USER.id,
    drawLayerCounter: topLayerId.toString(),
    location,
    toolType: 'image',
    canvasImg
  }
})

socket.on('update my image', (topLayerId, canvasImg, location) => {
  console.log('update image')
  addImg(canvasImg, topLayerId, location)
  drawHistory[topLayerId] = {
    userId: USER.id,
    drawLayerCounter: topLayerId.toString(),
    location,
    toolType: 'image',
    canvasImg
  }

  // push into conmmand history
  commandHistory.push({ command: 'create', drawObj: drawHistory[topLayerId] })

  // clear undo history
  undoHistory.length = 0
})

socket.on('update undo', (commandLayer) => {
  undoLayer(commandLayer)
})

socket.on('update redo', (commandLayer) => {
  redoLayer(commandLayer)
})

/* window listener */
window.addEventListener('resize', resumeHistory)
cavasWrapper.addEventListener('mouseout', (e) => {
  isPaint = false
})

addCanvasBtn.addEventListener('click', async (e) => {
  // add image to canvas

  // prevent drawing
  // const isDrawAble = (await userAuth()).data.is_drawable

  // if (!isDrawAble) {
  //   return
  // }

  const curStockInfo = document.querySelector('.carousel-item.active')
  const canvas = await html2canvas(curStockInfo)
  let canvasImg = canvas.toDataURL('image/jpeg')
  const cavasInfo = {
    userId: USER.id,
    drawLayerCounter: null,
    location: {
      x: window.innerWidth / 2 - (window.innerHeight - 150) / 2,
      y: 10,
      width: window.innerHeight - 150,
      height: window.innerHeight - 150
    },
    toolType: 'image',
    canvasImg
  }

  socket.emit('add image', cavasInfo)
})

window.addEventListener('keydown', async (e) => {
  // delete selected object
  if (e.code === 'Delete') {
    // prevent drawing
    // const isDrawAble = (await userAuth()).data.is_drawable

    // if (!isDrawAble) {
    //   return
    // }

    if (curSelectShape) {
      curSelectShape.destroy()
      socket.emit('delete drawing', curSelectShape.attrs.id)
      commandHistory.push({
        command: 'delete',
        drawObj: drawHistory[curSelectShape.attrs.id]
      })
      delete drawHistory[curSelectShape.attrs.id]

      curSelectShape = null // reset curSelectShape
      tr.nodes([])
    }
  }
})

undoBtn.addEventListener('click', (e) => {
  console.log(commandHistory)
  console.log(drawHistory)
  if (!commandHistory.length) {
    return
  }

  undoLayer(commandHistory[commandHistory.length - 1])
  socket.emit('undo', commandHistory[commandHistory.length - 1])
  const undoCommandObj = commandHistory.pop()
  undoHistory.push(undoCommandObj)
})

redoBtn.addEventListener('click', (e) => {
  console.log(undoHistory)
  console.log(drawHistory)
  if (!undoHistory.length) {
    return
  }

  redoLayer(undoHistory[undoHistory.length - 1])
  socket.emit('redo', undoHistory[undoHistory.length - 1])
  const redoCommandObj = undoHistory.pop()
  commandHistory.push(redoCommandObj)
})

/* function */
function resumeHistory() {
  // if resizing
  let width = window.innerWidth
  let height = window.innerHeight - 150
  stage.width(width)
  stage.height(height)

  // reloading drawing history
  // layer.removeChildren()
  // if (Object.keys(drawHistory).length) {
  //   for (let key in drawHistory) {
  //     if (drawHistory[key].toolType === 'image') {
  //       console.log(drawHistory[key])
  //       addImg(drawHistory[key].canvasImg, key)
  //     } else {
  //       console.log(drawHistory[key])
  //       let curLine = new Konva.Line({
  //         points: drawHistory[key].location,
  //         stroke: '#df4b26',
  //         strokeWidth: 5,
  //         lineCap: 'round',
  //         lineJoin: 'round',
  //         globalCompositeOperation:
  //           drawHistory[key].toolType === 'eraser'
  //             ? 'destination-out'
  //             : 'source-over',
  //         name: 'select',
  //         id: key
  //       })

  //       curLine.move({
  //         x: 0,
  //         y: 50
  //       })

  //       layer.add(curLine)
  //       stage.add(layer)
  //     }
  //   }
  // }
}

function tracking(id, layerObject, locations) {
  // let newPoints = layerObject.points().concat([locations[0], locations[1]])
  // console.log(newPoints)
  // layerObject.points(newPoints)
  // drawHistory[id][location].concat(locations)
  console.log(drawHistory[id])

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
    console.log('init load', drawHistory)
    if (!Object.keys(drawHistory).length) return
    console.log(drawHistory)
    resumeHistory()
    // for (let key in drawHistory) {
    //   let layerObj = new Konva.Line({
    //     points: drawHistory[key].location,
    //     stroke: '#df4b26',
    //     strokeWidth: 5,
    //     lineCap: 'round',
    //     lineJoin: 'round',
    //     globalCompositeOperation:
    //       drawHistory[key].toolType === 'eraser'
    //         ? 'destination-out'
    //         : 'source-over',
    //     name: 'select',
    //     id: key
    //   })

    //   layer.add(layerObj)
    // }
  })
}

function addImg(imageBase64, topLayerId, location) {
  // console.log(window.innerWidth / 2 - (window.innerHeight - 150) / 2)
  var imageObj = new Image()
  imageObj.src = imageBase64
  imageObj.onload = function () {
    const image = new Konva.Image({
      x: location.x,
      y: location.y,
      image: imageObj,
      width: location.width,
      height: location.height,
      name: 'select',
      id: topLayerId.toString() // use string for consistancy
    })

    // add the shape to the layer
    layer.add(image)

    // setting z index
    image.zIndex(topLayerId)
  }

  return {}
}

function undoLayer(commandLayer) {
  // check delete or create
  if (commandLayer.command === 'create') {
    // undo create
    stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].destroy()
    delete drawHistory[commandLayer.drawObj.drawLayerCounter]
  } else {
    // undo delete
    if (commandLayer.drawObj.toolType === 'image') {
      addImg(
        commandLayer.drawObj.canvasImg,
        commandLayer.drawObj.drawLayerCounter,
        commandLayer.drawObj.location
      )
    } else {
      let layerObj = new Konva.Line({
        points: commandLayer.drawObj.location,
        stroke: '#df4b26',
        strokeWidth: 5,
        lineCap: 'round',
        lineJoin: 'round',
        globalCompositeOperation:
          commandLayer.drawObj.toolType === 'eraser'
            ? 'destination-out'
            : 'source-over',
        name: 'select',
        id: commandLayer.drawObj.drawLayerCounter
      })

      // push back
      layer.add(layerObj)

      // reset z index
      layerObj.zIndex(commandLayer.drawObj.drawLayerCounter)
    }
  }
}

function redoLayer(commandLayer) {
  // check delete or create
  if (commandLayer.command === 'delete') {
    // undo create
    stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].destroy()
    delete drawHistory[commandLayer.drawObj.drawLayerCounter]
  } else {
    // undo delete
    if (commandLayer.drawObj.toolType === 'image') {
      addImg(
        commandLayer.drawObj.canvasImg,
        commandLayer.drawObj.drawLayerCounter,
        commandLayer.drawObj.location
      )
    } else {
      let layerObj = new Konva.Line({
        points: commandLayer.drawObj.location,
        stroke: '#df4b26',
        strokeWidth: 5,
        lineCap: 'round',
        lineJoin: 'round',
        globalCompositeOperation:
          commandLayer.drawObj.toolType === 'eraser'
            ? 'destination-out'
            : 'source-over',
        name: 'select',
        id: commandLayer.drawObj.drawLayerCounter
      })

      // push back
      layer.add(layerObj)

      // reset z index
      layerObj.zIndex(commandLayer.drawObj.drawLayerCounter)
    }
  }
}
