const accessToken = localStorage.getItem('access_token')
const followId = window.location.pathname.split('/')[2]
let userId

const View = {
  profileEle: document.querySelector('#profile-icon'),
  memberNameEle: document.querySelector('#member-name'),
  followingInfoEle: document.querySelectorAll('.following-info span'),
  ideasListEle: document.querySelector('.ideas-list'),

  followBtn: document.querySelector('.js-follow-btn'),
  unFollowBtn: document.querySelector('.js-unfollow-btn'),
  followedBadge: document.querySelector('.isFollowed'),

  pagination: document.querySelector('.pagination'),
  page: 0
}

const Controller = {
  init: async function () {
    // check paging
    if (getQueryObject().page) {
      View.page = Number(getQueryObject().page) - 1
    }

    let userInfoUrl = `/api/1.0/user/user_info?userId=${followId}`
    let ideasUrl = `/api/1.0/ideas/all?userId=${followId}&page=${View.page}`
    let followingUrl = `/api/1.0/user/following_num?userId=${followId}`
    const pathname = window.location.pathname
    if (pathname.includes('following')) {
      ideasUrl = `/api/1.0/ideas/hot_ideas?filter=byFollowing&userId=${followId}&page=${View.page}`
    }

    const userInfoResponse = await fetch(userInfoUrl)
    const userResult = await userInfoResponse.json()
    const ideasResponse = await fetch(ideasUrl)
    const ideasResult = await ideasResponse.json()
    const followingResponse = await fetch(followingUrl)
    const follwingResult = await followingResponse.json()

    View.memberNameEle.innerText = userResult.data[0].name
    View.followingInfoEle[0].innerText = follwingResult.data.followers
    View.followingInfoEle[1].innerText = follwingResult.data.following
    View.profileEle.src = userResult.data[0].picture

    // check if followed
    if (accessToken) {
      userId = (await this.userAuth()).data.id

      if (Number(userId) === Number(followId)) {
        window.location.href = '/member'
      }

      const response = await fetch(
        `/api/1.0/user/check_follow?userId=${userId}&followId=${followId}`,
        {
          headers: {
            Authorization: 'Bearer ' + accessToken
          }
        }
      )
      if (response.status === 200) {
        const result = await response.json()
        View.followedBadge.classList.remove('hidden')
        View.followBtn.classList.add('hidden')
        View.unFollowBtn.classList.remove('hidden')
      } else {
        const result = await response.json()
      }
    }

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
  },
  userAuth: async function () {
    const response = await fetch('/api/1.0/user/user_auth', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    })

    if (response.status !== 200) {
      return
    }

    const result = await response.json()
    return result
  }
}

Controller.init()

// Listeners
View.followBtn.addEventListener('click', async () => {
  // check user logged in or not
  const loginResult = await showLoginModal()
  if (!loginResult) return

  const response = await fetch(
    `/api/1.0/user/follow_user?userId=${userId}&followId=${followId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }
  )

  if (response.status === 409) {
    const result = await Swal.fire({
      title: '已經追蹤過拉!',
      confirmButtonColor: '#315375'
    })
    window.location.reload()
  } else if (response.status === 200) {
    const result = await Swal.fire({
      title: '追蹤成功!',
      confirmButtonColor: '#315375'
    })
    View.followBtn.classList.add('hidden')
    View.unFollowBtn.classList.remove('hidden')
    View.followedBadge.classList.remove('hidden')
  } else {
    const result = await Swal.fire({
      icon: 'error',
      title: '伺服器內部錯誤拉!',
      confirmButtonColor: '#315375'
    })
    window.location.reload()
  }
})

View.unFollowBtn.addEventListener('click', async () => {
  const response = await fetch(
    `/api/1.0/user/unfollow_user?userId=${userId}&followId=${followId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }
  )

  if (response.status !== 200) {
    const result = await Swal.fire({
      icon: 'error',
      title: '伺服器內部錯誤拉!',
      confirmButtonColor: '#315375'
    })
    window.location.reload()
  } else {
    const result = await Swal.fire({
      title: '取消追蹤成功!',
      confirmButtonColor: '#315375'
    })
    View.followBtn.classList.remove('hidden')
    View.unFollowBtn.classList.add('hidden')
    View.followedBadge.classList.add('hidden')
  }
})
