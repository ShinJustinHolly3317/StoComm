const PostView = {
  toggleBtns: document.querySelector('.analysis-tab'),
  closeBtn: document.querySelector('#close-icon'),
  closeModal: new bootstrap.Modal(document.querySelector('#leaving-modal'), {
    keyboard: false
  }),
  publishBtn: document.querySelector('#js-publish-btn'),
  analysisImg: document.querySelector('#analysis-img'),
  init: function () {
    canvas = localStorage.getItem('canvas')
    this.analysisImg.src = canvas
    closeLoading()
  },
  futureBtn: document.querySelector('.choose-future'),
  bullCheck: document.querySelector('#bullish'),
  bearCheck: document.querySelector('#bearish')
}

PostView.futureBtn.addEventListener('click', (e) => {

  if (e.target.classList.contains('bull-btn')) {
    
    PostView.bullCheck.classList.add('checked')
    PostView.bearCheck.classList.remove('checked')
    

  } else if (e.target.classList.contains('bear-btn')) {
    
    PostView.bearCheck.classList.add('checked')
    PostView.bullCheck.classList.remove('checked')

  }
})

PostView.toggleBtns.addEventListener('click', (e) => {
  if(e.target.tagName !== 'A') return

  // Handle textarea
  let toggleTyps = e.target.attributes['toggle-type'].value
  document.querySelector(`#${toggleTyps}`).classList.remove('hidden')
  if (document.querySelector(`.cur-show`)) {
    if (e.target.classList.contains('active')) {
      return
    }
    document.querySelector(`.cur-show`).classList.add('hidden')
    document.querySelector(`.cur-show`).classList.remove('cur-show')
  }
  document.querySelector(`#${toggleTyps}`).classList.add('cur-show')

  // Handle tab
  document.querySelector('.nav-link.active').classList.toggle('active')
  e.target.classList.toggle('active')

  // if(document.querySelectorAll('.hidden.analysis').length < 5) {
  //   // if any textarea displayed
  //   PostView.publishBtn.classList.remove('hidden')
  // } else {
  //   PostView.publishBtn.classList.add('hidden')
  // }
})

PostView.closeBtn.addEventListener('click', (e) => {
  PostView.closeModal.show()
})

PostView.publishBtn.addEventListener('click', async (e) => {
  showLoading()
  const textData = {}
  textData.content = {}
  const textDataEle = document.querySelectorAll('.analysis-text')

  // manage data into json
  textData.title = document.querySelector('#idea-title-input').value
  textData.image = document.querySelector('#analysis-img').src

  // check text title length
  if (textLenCheck(textData.title) >= 24) {
    // Check title length
    await Swal.fire({
      icon: 'error',
      title: '字數請勿超過32位!!',
      showConfirmButton: false,
      timer: 1500
    })
    window.location.reload()
    return
  }

  if (!textData.title) {
    await Swal.fire({
      icon: 'error',
      title: '請至少輸入標題!',
      confirmButtonColor: '#315375'
    })
    window.location.reload()
    return
  }

  for (let item of textDataEle) {
    let analysisType = item.id
    console.log(analysisType)
    textData.content[analysisType] = item.value
  }
  textData.content = JSON.stringify(textData.content)
  textData.stock_code = getQueryObject().stockCode

  if (!getQueryObject().stockCode) {
    await Swal.fire({
      icon: 'error',
      title: '你網址怪怪的!',
      confirmButtonColor: '#315375'
    })
    window.location.reload()
    return
  }

  textData.user_id = JSON.parse(localStorage.getItem('user')).id

  // check bear or bull
  const isBull = document.querySelector('.checked').getAttribute('id') === 'bullish'
  if (isBull) {
    textData.future = 'bull'
  } else {
    textData.future = 'bear'
  }

  const response = await fetch('/api/1.0/ideas', {
    method: 'POST',
    body: JSON.stringify(textData),
    headers: {
      'Content-type': 'application/json'
    }
  })

  closeLoading()
  
  if (response.status === 200) {
    await Swal.fire({
      title: '發表成功!',
      confirmButtonColor: '#315375'
    })
    
    window.location.href = '/member'
  } else {
    await Swal.fire({
      icon: 'error',
      title: '伺服器出錯了，請重新發送',
      confirmButtonColor: '#315375'
    })
  }
})

PostView.init()