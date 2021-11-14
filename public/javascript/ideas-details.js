const View = {
  likeBtn: document.querySelector('.social-btn-area'),
  likedNumsEle: document.querySelector('.liked-num'),
  dltBtn: document.querySelector('.delete-idea-btn')
}

View.likeBtn.addEventListener('click', async (e) => {
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
  const userData = await userAuth()

  const dltResponse = await fetch(`/api/1.0/ideas?ideaId=${ideaId}`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if (dltResponse.status === 500) {
    await Swal.fire({
      icon: 'error',
      title: '伺服器出錯了!',
      confirmButtonColor: '#315375'
    })
  } else if (dltResponse.status === 500) {
    await Swal.fire({
      icon: 'error',
      title: '你並不是作者，請勿亂刪別人文章!',
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

// main
getIdeaLikes()
showDltByn()

// function
async function likeIdea() {
  const isLiked = document.querySelector('.liked').classList.contains('hidden')
    ? 0
    : 1
  let userId = JSON.parse(localStorage.getItem('user')).id
  if (!userId) {
    userId = await userAuth()
  }
  const ideaId = getQueryObject().id

  const response = await fetch(
    `/api/1.0/ideas/idea_like?userId=${userId}&ideaId=${ideaId}&isLiked=${isLiked}`,
    {
      method: 'PATCH'
    }
  )

  if (response.status !== 200) {
    const result = await response.json()
    console.log(result)
    if (result.overlimit) {
      await Swal.fire({
        imageUrl: 'https://i.gifer.com/SFc7.gif',
        title: result.overlimit,
        confirmButtonColor: '#315375'
      })
      return { error: result.overlimit }
    } else if (result.error){
      await Swal.fire({
        icon: 'error',
        title: '伺服器出錯了!',
        confirmButtonColor: '#315375'
      })
      return { error: result.error }
    }
  } else {
    return { likerOk: 'likeOk'}
  }
}

async function userAuth() {
  const accessToken = localStorage.getItem('access_token')
  const response = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if (response.status !== 200) {
    await Swal.fire({
      icon: 'error',
      title: '請重新登入!!',
      confirmButtonColor: '#315375'
    })
    console.log(response.status)
    window.location.href = '/'
  }

  const result = await response.json()
  return result
}

async function getIdeaLikes() {
  const ideaId = getQueryObject().id
  const response = await fetch(`/api/1.0/ideas/idea_like?ideaId=${ideaId}`)

  if (response.status !== 200) {
    console.log('problems when getting likes data', response.status)
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
  const userData = (await userAuth()).data
  const authorId = document.querySelector('.author').getAttribute('authorId')
  if (Number(authorId) === Number(userData.id)) {
    View.dltBtn.classList.remove('hidden')
  }
}
