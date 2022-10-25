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

    if (canvas) {
      this.analysisImg.src = canvas
    }

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
  if (e.target.tagName !== 'A') return

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
})

PostView.closeBtn.addEventListener('click', async (e) => {
  // PostView.closeModal.show()
  const swalResult = await Swal.fire({
    title: '即將離開',
    text: '即將離開頁面，內容將不會保存，確定要離開嗎?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#adb5bd',
    confirmButtonText: '沒錯，我要離開',
    cancelButtonText: '沒事，我按錯了'
  })
  if (swalResult.isConfirmed) {
    window.location.href = '/hot-rooms'
  }
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
  if (textLenCheck(textData.title) >= 32) {
    // Check title length
    const swalResult = await Swal.fire({
      title: '標題字數太長',
      text: '標題字數太長會影響閱讀體驗，您仍然可以發表，確定要發表嗎?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#adb5bd',
      confirmButtonText: '沒錯，我要發文了',
      cancelButtonText: '我再想想好了'
    })
    closeLoading()
    if (!swalResult.isConfirmed){
      return
    }
  }

  if (!textData.title) {
    await Swal.fire({
      icon: 'error',
      title: '請至少輸入標題!',
      confirmButtonColor: '#315375'
    })
    closeLoading()
    return
  }

  for (let item of textDataEle) {
    let analysisType = item.id
    textData.content[analysisType] = item.value
  }
  textData.content = JSON.stringify(textData.content)
  textData.stock_code = getQueryObject().stockCode

  if (!getQueryObject().stockCode) {
    await Swal.fire({
      icon: 'error',
      title: '您已遺失正確的網址，即將轉跳首頁!',
      confirmButtonColor: '#315375'
    })
    window.location.href = '/'
    return
  }

  textData.user_id = JSON.parse(localStorage.getItem('user')).id

  // check bear or bull
  const isBull =
    document.querySelector('.checked').getAttribute('id') === 'bullish'
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
