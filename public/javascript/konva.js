// Global variables
const drawHistory = {}
const commandHistory = []
const undoHistory = []
let localLayerCounter = 0
let width = window.innerWidth
let height = window.innerHeight - 130

// DOM
const cavasWrapper = document.querySelector('#canvas-wrapper')
const addCanvasBtnArea = document.querySelector('.carousel-inner')
const undoBtn = document.querySelector('#undo-btn')
const redoBtn = document.querySelector('#redo-btn')
const delBtn = document.querySelector('.draw-tool-icon[value="delete"]')
const selectBtn = document.querySelector('.draw-tool-icon[value="select"]')

// tool controller
const toolController = {
  brush: function (layerObject, location) {
    let newPoints = layerObject.points().concat(location)
    layerObject.points(newPoints)
  },
  straightLine: function (layerCounter, location, layerObject) {
    let newPoints = drawHistory[layerCounter].location
      .slice(0, 2)
      .concat(location)
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
let tr = new Konva.Transformer()
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
let curSelectShape = null

stage.on('mousedown touchstart', async (e) => {
  localLayerObject = null // clear local drawing layer
  isPaint = true

  // prevent drawing
  const role = (await userAuth()).data.role
  if (role !== 'streamer') {
    const drawOpen = (await roomAuth()).open_draw
    if (!drawOpen) {
      return
    }
  }

  if (localToolType !== 'brush' && localToolType !== 'line') {
    isPaint = false
    return
  }

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

  if (!localLayerObject) {
    return
  }
  console.log(localLayerObject)
  socket.emit('finish layer', localLayerObject)

  // console.log(drawHistory);
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
  // socket.emit('drawing', localLayerCounter, [pos.x, pos.y])
})

socket.on('update finish layer', (curLayerObj) => {
  console.log('update finish layer', drawHistory)
  let newLine = new Konva.Line({
    stroke: '#df4b26',
    strokeWidth: 5,
    globalCompositeOperation:
      curLayerObj.toolType === 'eraser' ? 'destination-out' : 'source-over',
    // round cap for smoother lines
    lineCap: 'round',
    // add point twice, so we have some drawings even on a simple click
    points: curLayerObj.location,
    name: 'select',
    id: curLayerObj.drawLayerCounter.toString() // use string for consistancy
  })
  drawHistory[curLayerObj.drawLayerCounter] = curLayerObj
  // drawHistory[curLayerObj.drawLayerCounter].layerObject = newLine

  layer.add(newLine)

  // reset z index
  newLine.zIndex(curLayerObj.drawLayerCounter)
})

// clicks should select/deselect shapes
stage.on('click tap', function (e) {
  // if user us drawing
  if (localToolType !== 'select') {
    return
  }

  // if click on empty area - remove all selections
  // if (e.target === stage) {
  //   if (!tr.nodes()[0]) {
  //     return
  //   }
  //   tr.nodes()[0].draggable(false)
  //   tr.nodes([])


  //   console.log('curSelectShape', curSelectShape)
    
  //   // console.log('cursleectshape', stage.find(`#${0}`))
  //   if (curSelectShape) {
  //     // socket.emit('update drawing', curSelectShape)
  //     // curSelectShape.draggable(false)
  //     curSelectShape = null
  //   }
  //   return
  // }

  if(e.target !== curSelectShape && curSelectShape !== null){
    console.log();
    if (!tr.nodes()[0]) {
      return
    }
    tr.nodes()[0].draggable(false)
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
  console.log('Selected Target', e.target)
  console.log(stage.find(`#0`))
  console.log('Select drawhostory', drawHistory)
  if (!metaPressed && !isSelected) {
    // if no key pressed and the node is not selected
    // select just one
    tr.nodes([e.target])
    curSelectShape = e.target
    tr.moveToTop()
    e.target.draggable(true)
  } else if (metaPressed && isSelected) {
    // if we pressed keys and node was selected
    // we need to remove it from selection:
    // const nodes = tr.nodes().slice() // use slice to have new copy of array
    // remove node from array
    // nodes.splice(nodes.indexOf(e.target), 1)
    // tr.nodes(nodes)
  } else if (metaPressed && !isSelected) {
    // add the node into selection
    // const nodes = tr.nodes().concat([e.target])
    // tr.nodes(nodes)
  }
})

layer.on('dragend', (e) => {
  if (e.target.attrs.id === undefined) {
    return
  }
  socket.emit('move draw', e.target.attrs.id, [
    e.target.attrs.x,
    e.target.attrs.y
  ])
})

// listener
const toolArea = document.querySelector('.draw-tool-area')
toolArea.addEventListener('click', (e) => {
  if (e.target.tagName === 'IMG') {
    if (
      e.target.getAttribute('value') === 'undo' ||
      e.target.getAttribute('value') === 'redo'
    ) {
      setTimeout(() => {
        undoBtn.classList.remove('tool-active')
        redoBtn.classList.remove('tool-active')
        if (document.querySelector('.tool-active')) {
          document.querySelector('.tool-active').classList.remove('tool-active')
          selectBtn.classList.add('tool-active')
        }
      }, 100)
      localToolType = 'select'
      return
    }
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
  console.log(id)
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
    userId: USER.id,
    drawLayerCounter: id.toString(), // latest id
    location: remoteDrawHistory[id].location,
    toolType: localToolType
  }

  // push into conmmand history
  commandHistory.push({ command: 'create', drawObj: drawHistory[id] })
  // console.log(drawHistory)

  // clear undo history
  undoHistory.length = 0
  console.log('localLayerObject', localLayerObject)
  // attach to layer
  layer.add(localLayerObject)

  // setting correct z index
  console.log('zindex', id)
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

// socket.on('update drawing', (id, location) => {
//   tracking(id, drawHistory[id].layerObject, location)
// })

socket.on('update move draw', (drawingId, position) => {
  if (drawHistory[drawingId].toolType === 'image') {
    drawHistory[drawingId].location.x = position[0]
    drawHistory[drawingId].location.y = position[1]
    stage.find(`#${drawingId}`)[0].position({
      x: position[0],
      y: position[1]
    })
  } else {
    drawHistory[drawingId].moveLocation = position
    console.log('old x ', stage.find(`#${drawingId}`)[0])
    stage.find(`#${drawingId}`)[0].position({
      x: position[0],
      y: position[1]
    })
  }
})

socket.on('update my move draw', (drawingId, position) => {
  if (!drawHistory[drawingId].moveLocation) {
    drawHistory[drawingId].moveLocation = position
  } else {
    drawHistory[drawingId].moveLocation =
      drawHistory[drawingId].moveLocation.concat(position)
  }

  // add to command history
  const prevDrawObj = drawHistory[drawingId]
  commandHistory.push({ command: 'move', drawObj: prevDrawObj })
  console.log(commandHistory)

  if (drawHistory[drawingId].toolType === 'image') {
    drawHistory[drawingId].location.x = position[0]
    drawHistory[drawingId].location.y = position[1]
    stage.find(`#${drawingId}`)[0].position({
      x: position[0],
      y: position[1]
    })
  } else {
    console.log('old x ', stage.find(`#${drawingId}`)[0])
    stage.find(`#${drawingId}`)[0].position({
      x: position[0],
      y: position[1]
    })
  }
})

socket.on('init load data', (remoteDrawHistory) => {
  if (!Object.keys(remoteDrawHistory).length) {
    console.log(Object.keys(remoteDrawHistory))
    return
  }

  for (let key in remoteDrawHistory) {
    if (remoteDrawHistory[key].toolType === 'image') {
      console.log(
        'remoteDrawHistory[key].location',
        remoteDrawHistory[key].location
      )
      addImg(
        remoteDrawHistory[key].canvasImg,
        key,
        remoteDrawHistory[key].location
      )
    } else {
      let layerObj = new Konva.Line({
        points: remoteDrawHistory[key].location,
        stroke: '#df4b26',
        strokeWidth: 5,
        lineCap: 'round',
        lineJoin: 'round',
        globalCompositeOperation:
          remoteDrawHistory[key].toolType === 'eraser'
            ? 'destination-out'
            : 'source-over',
        name: 'select',
        id: key
      })
      layer.add(layerObj)

      // set z index
      layerObj.zIndex(key)

      // check if line moved
      if (remoteDrawHistory[key].moveLocation) {
        stage.find(`#${key}`)[0].position({
          x: remoteDrawHistory[key].moveLocation[
            remoteDrawHistory[key].moveLocation.length - 2
          ],
          y: remoteDrawHistory[key].moveLocation[
            remoteDrawHistory[key].moveLocation.length - 1
          ]
        })
      }
    }

    drawHistory[key] = remoteDrawHistory[key]
  }
  console.log(remoteDrawHistory)
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
    moveLocation: [location.x, location.y],
    toolType: 'image',
    canvasImg
  }

  // push into conmmand history
  commandHistory.push({ command: 'create', drawObj: drawHistory[topLayerId] })

  // clear undo history
  undoHistory.length = 0
})

socket.on('update undo', (commandLayer) => {
  console.log('this is update', commandLayer)
  undoLayer(commandLayer)

  // add drawHistory
  // drawHistory[Object.keys(drawHistory).length + 1] = commandLayer.drawObj
})

socket.on('update redo', (commandLayer) => {
  redoLayer(commandLayer)
})

socket.on('update delete all', () => {
  layer.destroyChildren()

  // transformer
  tr = new Konva.Transformer()
  tr.rotateEnabled(false)
  tr.resizeEnabled(false)
  tr.padding(10)
  layer.add(tr)
  for (let key in drawHistory) {
    delete drawHistory[key]
  }
  commandHistory.length = 0
  undoHistory.length = 0
})

/* window listener */
window.addEventListener('resize', resumeHistory)
cavasWrapper.addEventListener('mouseout', (e) => {
  isPaint = false
})

addCanvasBtnArea.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('add-canvas')) {
    return
  }

  showLoading()

  // add image to canvas
  // prevent drawing
  const role = (await userAuth()).data.role

  if (role !== 'streamer') {
    const drawOpen = (await roomAuth()).open_draw
    if (!drawOpen) {
      closeLoading()
      return
    }
  }

  const curStockInfo = document.querySelector('.carousel-item.active')
  let isYearHistory = false
  if (curStockInfo.children['1'].getAttribute('id') === 'year-history') {
    isYearHistory = true
  }

  const canvas = await html2canvas(curStockInfo, {
    y: isYearHistory ? -120 : -60
  })
  let canvasImg = canvas.toDataURL('image/jpeg')
  const cavasInfo = {
    userId: USER.id,
    drawLayerCounter: null,
    location: {
      x: window.innerWidth / 2 - 250,
      y: isYearHistory ? -180 : -60,
      width: isYearHistory ? 500 : 400,
      height: isYearHistory ? 600 : 450
    },
    toolType: 'image',
    canvasImg
  }

  socket.emit('add image', cavasInfo)
  closeLoading()
  document.querySelector('#stock-real-price-wrapper').classList.add('hidden')
})

window.addEventListener('keydown', async (e) => {
  // delete selected object
  if (e.code === 'Delete' || e.code === 'Backspace') {
    // prevent drawing
    const role = (await userAuth()).data.role

    if (role !== 'streamer') {
      const drawOpen = (await roomAuth()).open_draw
      if (!drawOpen) {
        return
      }
    }

    if (curSelectShape) {
      curSelectShape.destroy()

      console.log('command history', commandHistory)

      socket.emit('delete drawing', curSelectShape.attrs.id)
      commandHistory.push({
        command: 'delete',
        drawObj: drawHistory[curSelectShape.attrs.id]
      })

      delete drawHistory[curSelectShape.attrs.id]

      // clear undo history
      undoHistory.length = 0

      curSelectShape = null // reset curSelectShape
      tr.nodes([])
    }
  }
})

undoBtn.addEventListener('click', (e) => {
  console.log('commandHistory', commandHistory)
  console.log('drawHistory', drawHistory)
  undoBtn.classList.add('tool-active')
  if (!commandHistory.length) {
    return
  }

  console.log(
    'Before poped undocommand',
    commandHistory[commandHistory.length - 1].drawObj.prevMoveLocation
  )

  socket.emit('undo', commandHistory[commandHistory.length - 1])
  undoLayer(commandHistory[commandHistory.length - 1])

  console.log(
    'poped undocommand',
    commandHistory[commandHistory.length - 1].drawObj.prevMoveLocation
  )
  undoHistory.push(commandHistory[commandHistory.length - 1])
  console.log('undoHistory', undoHistory)

  const undoCommandObj = commandHistory.pop()
})

redoBtn.addEventListener('click', (e) => {
  // console.log(undoHistory)
  // console.log(drawHistory)
  redoBtn.classList.add('tool-active')
  if (!undoHistory.length) {
    return
  }

  socket.emit('redo', undoHistory[undoHistory.length - 1])
  redoLayer(undoHistory[undoHistory.length - 1])

  const redoCommandObj = undoHistory.pop()
  commandHistory.push(redoCommandObj)
})

delBtn.addEventListener('click', async (e) => {
  const result = await Swal.fire({
    title: '確定要刪除所有圖層嗎?',
    confirmButtonColor: '#315375'
  })
  console.log(localStorage.getItem('user'))
  if (result.isConfirmed) {
    socket.emit('delete all', JSON.parse(localStorage.getItem('user')).id)
  }
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
  console.log('redo add imagew');
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
      id: topLayerId.toString() // use string for consistancy,
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
    if (!stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0]) {
      return
    }

    if (commandLayer.drawObj.moveLocation) {
      let prevMoveY = commandLayer.drawObj.moveLocation.pop()
      let prevMovex = commandLayer.drawObj.moveLocation.pop()

      if (!commandLayer.drawObj.prevMoveLocation) {
        console.log('prevMovex, prevMoveY', prevMovex, prevMoveY)
        commandLayer.drawObj.prevMoveLocation = [prevMovex, prevMoveY]
      } else {
        console.log('fuckkk', prevMovex, prevMoveY)
        commandLayer.drawObj.prevMoveLocation =
          commandLayer.drawObj.prevMoveLocation.concat([
            prevMovex,
            prevMoveY
          ])
      }
    }

    stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].destroy()
    delete drawHistory[commandLayer.drawObj.drawLayerCounter]
    console.log(`${commandLayer.drawObj.drawLayerCounter} is deleted`)
  } else if (commandLayer.command === 'delete') {
    // undo delete
    if (commandLayer.drawObj.toolType === 'image') {
      addImg(
        commandLayer.drawObj.canvasImg,
        commandLayer.drawObj.drawLayerCounter,
        commandLayer.drawObj.location
      )

      // setTimeout(() => {
      //   if (!commandLayer.drawObj.moveLocation) {
      //     return
      //   }

      //   stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].position({
      //     x: commandLayer.drawObj.moveLocation[
      //       commandLayer.drawObj.moveLocation.length - 2
      //     ],
      //     y: commandLayer.drawObj.moveLocation[
      //       commandLayer.drawObj.moveLocation.length - 1
      //     ]
      //   })

      //   let prevMoveY = commandLayer.drawObj.moveLocation.pop()
      //   let prevMovex = commandLayer.drawObj.moveLocation.pop()

      //   if(prevMovex !== undefined) {
      //     if (!commandLayer.drawObj.prevMoveLocation) {
      //       commandLayer.drawObj.prevMoveLocation = [prevMovex, prevMoveY]
      //     } else {
      //       commandLayer.drawObj.prevMoveLocation =
      //         commandLayer.drawObj.prevMoveLocation.concat([
      //           prevMovex,
      //           prevMoveY
      //         ])
      //     }
      //   }
      // }, 0)
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

      // check if line moved
      if (commandLayer.drawObj.moveLocation) {
        console.log(`#${commandLayer.drawObj.drawLayerCounter}`)
        stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].position({
          x: commandLayer.drawObj.moveLocation[
            commandLayer.drawObj.moveLocation.length - 2
          ],
          y: commandLayer.drawObj.moveLocation[
            commandLayer.drawObj.moveLocation.length - 1
          ]
        })
      }

      // reset z index
      layerObj.zIndex(commandLayer.drawObj.drawLayerCounter)
    }

    // add back drawhistory
    drawHistory[commandLayer.drawObj.drawLayerCounter] = commandLayer.drawObj

    setTimeout(() => {
      if (!commandLayer.drawObj.moveLocation) {
        return
      }

      stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].position({
        x: commandLayer.drawObj.moveLocation[
          commandLayer.drawObj.moveLocation.length - 2
        ],
        y: commandLayer.drawObj.moveLocation[
          commandLayer.drawObj.moveLocation.length - 1
        ]
      })

      let prevMoveY = commandLayer.drawObj.moveLocation.pop()
      let prevMovex = commandLayer.drawObj.moveLocation.pop()

      if(prevMovex !== undefined) {
        if (!commandLayer.drawObj.prevMoveLocation) {
          commandLayer.drawObj.prevMoveLocation = [prevMovex, prevMoveY]
        } else {
          commandLayer.drawObj.prevMoveLocation =
            commandLayer.drawObj.prevMoveLocation.concat([prevMovex, prevMoveY])
        }
      }
    }, 0)
  } else if (commandLayer.command === 'move') {
    let prevMoveY = commandLayer.drawObj.moveLocation.pop()
    let prevMovex = commandLayer.drawObj.moveLocation.pop()
    console.log('befoe undo commandobj', commandLayer)

    if (!commandLayer.drawObj.prevMoveLocation) {
      commandLayer.drawObj.prevMoveLocation = [prevMovex, prevMoveY]
    } else {
      commandLayer.drawObj.prevMoveLocation =
        commandLayer.drawObj.prevMoveLocation.concat([prevMovex, prevMoveY])
    }

    console.log(prevMovex, prevMoveY)
    console.log('undo undohistory:', undoHistory)

    console.log(
      commandLayer.drawObj.moveLocation[
        commandLayer.drawObj.moveLocation.length - 2
      ]
    )

    stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].position({
      x: commandLayer.drawObj.moveLocation[
        commandLayer.drawObj.moveLocation.length - 2
      ],
      y: commandLayer.drawObj.moveLocation[
        commandLayer.drawObj.moveLocation.length - 1
      ]
    })
  }
}

function redoLayer(commandLayer) {
  // check delete or create
  if (commandLayer.command === 'delete') {
    // undo create
    if (!stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0]) {
      return
    }

    if (commandLayer.drawObj.prevMoveLocation) {
      let prevMoveY = commandLayer.drawObj.prevMoveLocation.pop()
      let prevMovex = commandLayer.drawObj.prevMoveLocation.pop()

      if(prevMovex !== undefined){
        if (!commandLayer.drawObj.moveLocation) {
          commandLayer.drawObj.moveLocation = [prevMovex, prevMoveY]
        } else {
          console.log('redo concat', prevMovex, prevMoveY)
          commandLayer.drawObj.moveLocation =
            commandLayer.drawObj.moveLocation.concat([prevMovex, prevMoveY])
        }
      }
    }

    stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].destroy()
    delete drawHistory[commandLayer.drawObj.drawLayerCounter]
  } else if (commandLayer.command === 'create') {
    // undo delete
    if (commandLayer.drawObj.toolType === 'image') {
      addImg(
        commandLayer.drawObj.canvasImg,
        commandLayer.drawObj.drawLayerCounter,
        commandLayer.drawObj.location
      )

      // setTimeout(() => {
      //   if (!commandLayer.drawObj.prevMoveLocation) {
      //     return
      //   }

      //   console.log(
      //     'redo addimg ',
      //     stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0]
      //   )
      //   stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].position({
      //     x: commandLayer.drawObj.prevMoveLocation[
      //       commandLayer.drawObj.prevMoveLocation.length - 2
      //     ],
      //     y: commandLayer.drawObj.prevMoveLocation[
      //       commandLayer.drawObj.prevMoveLocation.length - 1
      //     ]
      //   })

      //   let prevMoveY = commandLayer.drawObj.prevMoveLocation.pop()
      //   let prevMovex = commandLayer.drawObj.prevMoveLocation.pop()

      //   if (prevMovex !== undefined) {
      //     if (!commandLayer.drawObj.moveLocation) {
      //       commandLayer.drawObj.moveLocation = [prevMovex, prevMoveY]
      //     } else {
      //       commandLayer.drawObj.moveLocation =
      //         commandLayer.drawObj.moveLocation.concat([prevMovex, prevMoveY])
      //     }
      //   }
      // }, 0)
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

      // check if line moved
      if (commandLayer.drawObj.moveLocation) {
        stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].position({
          x: commandLayer.drawObj.moveLocation[0],
          y: commandLayer.drawObj.moveLocation[1]
        })
      }

      // reset z index
      layerObj.zIndex(commandLayer.drawObj.drawLayerCounter)
    }
    // add back drawhistory
    drawHistory[commandLayer.drawObj.drawLayerCounter] = commandLayer.drawObj

    setTimeout(() => {
      if (!commandLayer.drawObj.prevMoveLocation) {
        return
      }

      stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].position({
        x: commandLayer.drawObj.prevMoveLocation[
          commandLayer.drawObj.prevMoveLocation.length - 2
        ],
        y: commandLayer.drawObj.prevMoveLocation[
          commandLayer.drawObj.prevMoveLocation.length - 1
        ]
      })

      let prevMoveY = commandLayer.drawObj.prevMoveLocation.pop()
      let prevMovex = commandLayer.drawObj.prevMoveLocation.pop()

      if (prevMovex !== undefined) {
        if (!commandLayer.drawObj.moveLocation) {
          commandLayer.drawObj.moveLocation = [prevMovex, prevMoveY]
        } else {
          commandLayer.drawObj.moveLocation =
            commandLayer.drawObj.moveLocation.concat([prevMovex, prevMoveY])
        }
      }
    }, 0)
  } else if (commandLayer.command === 'move') {
    console.log('undohistory:', commandLayer.drawObj.prevMoveLocation)

    stage.find(`#${commandLayer.drawObj.drawLayerCounter}`)[0].position({
      x: commandLayer.drawObj.prevMoveLocation[
        commandLayer.drawObj.prevMoveLocation.length - 2
      ],
      y: commandLayer.drawObj.prevMoveLocation[
        commandLayer.drawObj.prevMoveLocation.length - 1
      ]
    })

    let prevMoveY = commandLayer.drawObj.prevMoveLocation.pop()
    let prevMovex = commandLayer.drawObj.prevMoveLocation.pop()

    if (!commandLayer.drawObj.moveLocation) {
      commandLayer.drawObj.moveLocation = [prevMovex, prevMoveY]
    } else {
      commandLayer.drawObj.moveLocation =
        commandLayer.drawObj.moveLocation.concat([prevMovex, prevMoveY])
    }
  }
}
