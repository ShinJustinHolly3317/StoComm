const PostView = {
  toggleBtns: document.querySelector('.toggle-btns-area'),
  closeBtn: document.querySelector('#close-icon'),
  closeModal: new bootstrap.Modal(document.querySelector('#leaving-modal'), {
    keyboard: false
  }),
  publishBtn: document.querySelector('#js-publish-btn')
}

PostView.toggleBtns.addEventListener('click', (e) => {
  if(!e.target.tagName === 'BUTTON') return
  let toggleTyps = e.target.attributes['toggle-type'].value
  document.querySelector(`#${toggleTyps}`).classList.toggle('hidden')

  if(document.querySelectorAll('.hidden.analysis').length < 5) {
    // if any textarea displayed
    PostView.publishBtn.classList.remove('hidden')
  } else {
    PostView.publishBtn.classList.add('hidden')
  }
})

PostView.closeBtn.addEventListener('click', (e) => {
  PostView.closeModal.show()
})

PostView.publishBtn.addEventListener('click', async (e) => {
  const textData = {}
  textData.content = {}
  const textDataEle = document.querySelectorAll('.analysis-text')

  // manage data into json
  textData.title = document.querySelector('#idea-title-input').value
  textData.image = document.querySelector('#analysis-img').src.split(`${location.hostname}:${location.port}`)[1]
  for (let item of textDataEle) {
    let analysisType = item.id
    console.log(analysisType)
    textData.content[analysisType] = item.value
  }
  textData.content = JSON.stringify(textData.content)
  console.log();
  textData.stock_code = getQueryObject().stockCode
  textData.user_id = JSON.parse(localStorage.getItem('userRole')).id

  const response = await fetch('/api/1.0/ideas', {
    method: 'POST',
    body: JSON.stringify(textData),
    headers: {
      'Content-type': 'application/json'
    }
  })
  
  if (response.status === 200) {
    alert('發表成功!')
    const userRole = JSON.parse(localStorage.getItem('userRole'))
    userRole.role = 'visitor'
    localStorage.setItem('userRole', JSON.stringify(userRole))
    
    window.location.href = '/member'
  } else {
    alert('伺服器出錯了，請重新發送')
  }
})