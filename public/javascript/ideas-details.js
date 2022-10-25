const View = {
  likeBtn: document.querySelector('.social-btn-area'),
  likedNumsEle: document.querySelector('.liked-num'),
  dltBtn: document.querySelector('.delete-idea-btn')
}

View.likeBtn.addEventListener('click', async (e) => {
  if(!e.target.classList.contains('social-btn')){
    return
  }

  e.target.classList.toggle('hit-like')

  if (e.target.classList.contains('no-like')) {
    const likeResult = await likeIdea()
    if(likeResult.error){
      return
    }
    e.target.classList.toggle('hidden')
    document.querySelector('.liked').classList.toggle('hidden')
    document.querySelector('.liked-num').classList.toggle('hidden')
  } else {
    const likeResult = await likeIdea()
    if (likeResult.error) {
      return
    }
    let likedNums = Number(document.querySelector('.liked-num').innerText) + 1
    document.querySelector('.liked-num').innerText = likedNums
  }

  setTimeout(() => {
    e.target.classList.toggle('hit-like')
  }, 300)
})

View.dltBtn.addEventListener('click', async (e) => {
  const accessToken = localStorage.getItem('access_token')
  const ideaId = getQueryObject().id

  const userpicRes = await Swal.fire({
    title: '確定要刪除嗎? 刪除後無法復原!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#315375',
    cancelButtonColor: '#14c9ba',
    confirmButtonText: '是的，我要把它刪掉!'
  })
  if (!userpicRes.isConfirmed) {
    return
  }

  const dltResponse = await fetch(`/api/1.0/ideas?ideaId=${ideaId}`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if (dltResponse.status === 500) {
    await Swal.fire({
      icon: 'error',
      title: '伺服器忙碌中，請再試一次!',
      confirmButtonColor: '#315375'
    })
  } else if (dltResponse.status === 500) {
    await Swal.fire({
      icon: 'error',
      title: '你不是作者，請勿亂刪別人文章!',
      confirmButtonColor: '#315375'
    })
  } else {
    await Swal.fire({
      position: 'center',
      icon: 'success',
      title: '刪除成功啦!!',
      showConfirmButton: false,
      timer: 1500
    })
  }
  window.location.href = '/member'
})

// function
async function likeIdea() {
  const accessToken = localStorage.getItem('access_token')
  const isLiked = document.querySelector('.liked').classList.contains('hidden')
    ? 0
    : 1

  const loginResult = await showLoginModal()
  if (!loginResult) return

  let userId = JSON.parse(localStorage.getItem('user')).id
  if (!userId) {
    userId = await userBtnAuth()
  }
  const ideaId = getQueryObject().id

  const response = await fetch(
    `/api/1.0/ideas/idea_like?userId=${userId}&ideaId=${ideaId}&isLiked=${isLiked}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }
  )

  if (response.status !== 200) {
    const result = await response.json()
    if (result.overlimit) {
      await Swal.fire({
        imageUrl: 'https://media.giphy.com/media/nbQhrNzt8tSqaKwhRt/giphy.gif',
        title: '你已經按太多讚啦!!',
        confirmButtonColor: '#315375'
      })
      return { error: result.overlimit }
    } else if (result.error){
      await Swal.fire({
        icon: 'error',
        title: '伺服器忙碌中，請再試一次!',
        confirmButtonColor: '#315375'
      })
      return { error: result.error }
    }
  } else {
    return { likerOk: 'likeOk'}
  }
}

async function userBtnAuth() {
  const accessToken = localStorage.getItem('access_token')
  const response = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if (response.status === 200) {
    const result = await response.json()
    return result
  } else {
    return {}
  }
}

async function getIdeaLikes() {
  const ideaId = getQueryObject().id
  const response = await fetch(`/api/1.0/ideas/idea_like?ideaId=${ideaId}`)

  if (response.status !== 200) {
    return
  }

  const likesResult = (await response.json()).data
  let totlaLikes = 0
  if (likesResult.length) {
    document.querySelector('.no-like').classList.toggle('hidden')
    document.querySelector('.liked').classList.toggle('hidden')
    document.querySelector('.liked-num').classList.toggle('hidden')

    for (let item of likesResult) {
      totlaLikes += Number(item.likes_num)
    }
    View.likedNumsEle.innerText = totlaLikes
  }
}

async function showDltByn() {
  const userData = (await userBtnAuth()).data
  const authorId = document.querySelector('.author').getAttribute('authorId')
  if (Number(authorId) === Number(userData.id)) {
    View.dltBtn.classList.remove('hidden')
  }
}

// main
;(async function(){
  getIdeaLikes()
  showDltByn()
  closeLoading()
})()