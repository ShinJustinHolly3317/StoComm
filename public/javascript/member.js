const View = {
  warRoomBtn: document.querySelector('.js-start-war-btn'),
  // warRoomModal: new bootstrap.Modal(document.querySelector('#war-room-check'), {
  //   keyboard: false
  // }),
  nameInput: document.querySelector('#user-name'),
  createBtn: document.querySelector('#js-create-war-room-btn'),
  createFormData: document.querySelector('.war-room-check-data'),
  userIdInput: document.querySelector('#user_id'),

  profileEle: document.querySelector('#profile-icon'),
  memberNameEle: document.querySelector('#member-name'),
  followingInfoEle: document.querySelectorAll('.following-info span'),
  ideasListEle: document.querySelector('.ideas-list'),

  pagination: document.querySelector('.pagination'),
  page: 0,

  editBtn: document.querySelector('.js-edit-btn'),
  editName: document.querySelector('#edit-user-name'),
  editEmail: document.querySelector('#edit-user-email'),
  editId: document.querySelector('#edit-user-id'),
  submitEdit: document.querySelector('.js-submit-edit'),

  profilePicture: document.querySelector('.profile-picture')
}

const Controller = {
  init: async () => {
    // check paging
    if (getQueryObject().page) {
      View.page = Number(getQueryObject().page) - 1
    }

    const userData = (await userAuth()).data
    let ideasUrl = `/api/1.0/ideas/all?userId=${userData.id}&page=${View.page}`
    let followingUrl = `/api/1.0/user/following_num?userId=${userData.id}`
    const pathname = window.location.pathname
    if (pathname.includes('following')) {
      ideasUrl = `/api/1.0/ideas/hot_ideas?filter=byFollowing&userId=${userData.id}&page=${View.page}`
    }

    const ideasResponse = await fetch(ideasUrl)
    const ideasResult = await ideasResponse.json()
    const followingResponse = await fetch(followingUrl)
    const follwingResult = await followingResponse.json()

    View.memberNameEle.innerText = userData.name
    View.followingInfoEle[0].innerText = follwingResult.data.followers
    View.followingInfoEle[1].innerText = follwingResult.data.following
    View.profileEle.src = userData.picture

    if (!ideasResult.data.length) {
      View.ideasListEle.innerHTML = `
        <h5 class="mt-5 text-center">目前還沒有任何觀點喔!</h5>
        `
      closeLoading()
      return
    }

    let ideasListHtml = ''
    for (let item of ideasResult.data) {
      ideasListHtml += `
          <a href='/ideas-details?id=${item.id}'>
            <div class='ideas-card shadow'>
              <div class="d-flex justify-content-between">
                <h3>${item.title}</h3>
                <p class="date text-secondary mt-1">${item.date}</p>
              </div>
              
              <p class="badge bg-secondary my-3 fs-6">${item.company_name} (${
        item.stock_code
      })</p>

              <div id="ideas-card-img">
                <img src="${item.image}" class="img-fluid">
              </div>
              
              <div class="user-name d-flex justify-content-between">
                <div class="d-flex align-items-center">
                  <img src="${item.user_picture}" class="user-picture rounded">
                  <h5 class="mx-3 mt-2">${item.user_name}</h5>
                </div>
                
                <div class="d-flex align-items-center">
                  <div class="d-flex align-items-center border rounded-pill like-area">
                    <img src='/img/liked.png' class='social-btn liked' />
                    <div class="liked-num ms-2 me-0 mt-1">${
                      item.total_likes || 0
                    }</div>
                  </div>
                  <img src="/img/${item.future}.png" class="${
        item.future
      }-icon rounded-pill border mx-2">   
                </div>
              </div>
            </div>
          </a>
        `
    }
    View.ideasListEle.innerHTML = ideasListHtml

    const totalCount = Math.ceil(Number(ideasResult.totalCount) / 10)
    if (!totalCount) {
      return
    }

    let pageHtml = ''
    for (let i = 0; i < totalCount; i++) {
      pageHtml += `
        <li class="page-item"><a class="page-link" href="${pathname}?page=${
        i + 1
      }">${i + 1}</a></li>
      `
    }
    View.pagination.innerHTML = pageHtml

    // select current page
    document
      .querySelector('.pagination')
      .children[View.page].classList.add('active')

    closeLoading()
  }
}

Controller.init()

// View.warRoomBtn.addEventListener('click', (e) => {
//   // View.nameInput.value = userData.name
//   View.warRoomModal.show()
// })


// View.pagination.addEventListener('click', (e) => {
//   if (e.target.classList.contains('page-link')) {
//     View.page = Number(e.target.innerText) - 1
//     Controller.init()
//     e.target.parentElement.classList.add('active')
//   }
// })

View.editBtn.addEventListener('click', async (e) => {
  const userData = await userAuth()
  View.editName.value = userData.data.name
  View.editId.value = userData.data.id
})

View.submitEdit.addEventListener('click', async (e) => {
  const userData = document.querySelector('.edit-user-data-form')
  const userFormData = new FormData(userData)
  const imgTypes = ['jpg', 'jpeg', 'png']

  console.log(View.profilePicture.files[0])
  if (View.profilePicture.files[0]) {
    const fileCat = View.profilePicture.files[0].type.split('/')[0]
    const fileType = View.profilePicture.files[0].type.split('/')[1]
    const fileSize = View.profilePicture.files[0].size

    if (fileCat !== 'image') {
      await Swal.fire({
        icon: 'error',
        title: '只能上傳圖片格式!!',
        showConfirmButton: false,
        timer: 1500
      })
      return
    }

    if (!imgTypes.includes(fileType)) {
      await Swal.fire({
        icon: 'error',
        title: '只能上傳JPEG / PNG!!',
        showConfirmButton: false,
        timer: 1500
      })
      return
    }

    if (fileSize > 2000000) {
      await Swal.fire({
        icon: 'error',
        title: '尺寸請勿超過 2 MB!!',
        showConfirmButton: false,
        timer: 1500
      })
      return
    }
  } else {
    const userpicRes = await Swal.fire({
      title: '你沒有選擇圖片，確定繼續嗎?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#315375',
      cancelButtonColor: '#14c9ba',
      confirmButtonText: '是的，我沒有要改照片!'
    })
    if (!userpicRes.isConfirmed) {
      return
    }
  }

  

  document.querySelector('.loading-img-area').classList.remove('hidden')
  const response = await fetch('/api/1.0/user/edit_user', {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    body: userFormData
  })

  if (response.status === 200) {
    document.querySelector('.loading-img-area').classList.add('hidden')
    await Swal.fire({
      position: 'center',
      icon: 'success',
      title: '修改成功啦!!',
      showConfirmButton: false,
      timer: 1500
    })
    window.location.href = '/member'
  }
})
