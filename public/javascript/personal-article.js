const accessToken = localStorage.getItem('access_token')
const followId = window.location.pathname.split('/')[2]
let userId

const View = {
  memberNameEle: document.querySelector('#member-name'),
  followingInfoEle: document.querySelectorAll('.following-info span'),
  ideasListEle: document.querySelector('.ideas-list'),

  followBtn: document.querySelector('.js-follow-btn'),
  unFollowBtn: document.querySelector('.js-unfollow-btn'),
  followedBadge: document.querySelector('.isFollowed')
}

const Controller = {
  init: async function() {
    const userResponse = await fetch(
      `/api/1.0/user/user_data?userId=${followId}`
    )
    if (userResponse.status !== 200) return
    const userResult = await userResponse.json()
    const userData = userResult.data
    if (userData.length === 0) {
      const result = await Swal.fire({
        icon: 'error',
        title: '找不到這個人的資料!如果你是直接打網址，請不要再這樣做了喔',
        confirmButtonColor: '#315375'
      })
      if (result.isConfirmed) {
        window.location.href = '/hot-rooms'
      }
    }

    let ideasUrl = `/api/1.0/ideas/all?userId=${userData.id}`
    const pathname = window.location.pathname
    if (pathname.includes('following')) {
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
                <p>${item.date}</p>
              </div>
            </div>
          </a>
        `
    }

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
        console.log('error', result)
      }
    }
  },
  userAuth: async function() {
    const response = await fetch('/api/1.0/user/user_auth', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    })

    if (response.status !== 200) {
      console.log(response.status)
    }

    const result = await response.json()
    return result
  }
}

Controller.init()

// Listeners
View.followBtn.addEventListener('click', async () => {
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
    if (result.isConfirmed) {
      window.location.reload()
    }
  } else if (response.status === 200) {
    const result = await Swal.fire({
      title: '追蹤成功!',
      confirmButtonColor: '#315375'
    })
    window.location.reload()
  } else {
    const result = await Swal.fire({
      icon: 'error',
      title: '伺服器內部錯誤拉!',
      confirmButtonColor: '#315375'
    })
    if (result.isConfirmed) {
      window.location.reload()
    }
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
    if (result.isConfirmed) {
      window.location.reload()
    }
  } else {
    const result = await Swal.fire({
      title: '取消追蹤成功!',
      confirmButtonColor: '#315375'
    })
    if (result.isConfirmed) {
      window.location.reload()
    }
  }
})