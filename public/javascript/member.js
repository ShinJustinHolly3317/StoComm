const View = {
  warRoomBtn: document.querySelector('.js-start-war-btn'),
  warRoomModal: new bootstrap.Modal(document.querySelector('#war-room-check'), {
    keyboard: false
  }),
  nameInput: document.querySelector('#user-name'),
  createBtn: document.querySelector('#js-create-war-room-btn'),
  createFormData: document.querySelector('.war-room-check-data'),
  userIdInput: document.querySelector('#user_id'),

  memberNameEle: document.querySelector('#member-name'),
  logoutBtn: document.querySelector('.js-logout-btn'),
  followingInfoEle: document.querySelectorAll('.following-info span'),
  ideasListEle: document.querySelector('.ideas-list')
}

const Controller = {
  init: async () => {
    const userData = (await userAuth()).data
    let ideasUrl = `/api/1.0/ideas/all?userId=${userData.id}`
    const pathname = window.location.pathname
    if(pathname.includes('following')){
      ideasUrl = `/api/1.0/ideas/hot_ideas?filter=byFollowing&userId=${userData.id}&page=0`
    }
    
    View.memberNameEle.innerText = userData.name
    View.followingInfoEle[0].innerText = userData.followers
    View.followingInfoEle[1].innerText = userData.following

    const ideasResponse = await fetch(ideasUrl)
    const ideasResult = await ideasResponse.json()

    if (!ideasResult.data.length) {
      View.ideasListEle.innerHTML = `
        <h5 class="mt-5 text-center">目前還沒有追蹤任何觀點喔!</h5>
        `
    }

    for (let item of ideasResult.data) {
      View.ideasListEle.innerHTML += `
          <a href='/ideas-details?id=${item.id}'>
            <div class='ideas-card shadow'>
              <h3>${item.title}</h3>
              <p class="badge bg-secondary">${item.company_name} (${
        item.stock_code
      })</p>

              <div id="ideas-card-img">
                <img src="${item.image}" class="img-fluid">
              </div>
              
              <div class="user-name d-flex justify-content-around">
                <h3>${item.user_name}</h3>
                <div class="d-flex">
                  <img src='/img/liked.png' class='social-btn liked' />
                  <div class="liked-num">${item.total_likes || 0}</div>
                </div>
                <p class="date">${item.date}</p>
              </div>
            </div>
          </a>
        `
    }
  }
}

Controller.init()

View.warRoomBtn.addEventListener('click', (e) => {
  // View.nameInput.value = userData.name
  View.warRoomModal.show()
})

View.createBtn.addEventListener('click', async (e) => {
  e.preventDefault()
  View.userIdInput.value = userData.id
  const createData = new FormData(View.createFormData)
  const response = await fetch('/api/1.0/war_room/create_war_room', {
    method: 'POST',
    Authorization: 'Bearer ' + accessToken,
    body: createData
  })
  const result = await response.json()
  console.log(result)

  if (response.status !== 200) {
    await Swal.fire({
      icon: 'error',
      title: result.error,
      confirmButtonColor: '#315375'
    })
    return 
  }
  const roomId = result.data.insertId
  const stockCode = result.data.stock_code

  window.location.href = `/war-room?roomId=${roomId}&stockCode=${stockCode}`
})

View.logoutBtn.addEventListener('click', (e) => {
  localStorage.removeItem('user')
  localStorage.removeItem('access_token')

  window.location.href = '/'
})
