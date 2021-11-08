const View = {
  likeBtn: document.querySelector('.social-btn-area'),
  likedNumsEle: document.querySelector('.liked-num')
}

View.likeBtn.addEventListener('click', async (e) => {
  e.target.classList.toggle('hit-like')

  if (e.target.classList.contains('no-like')) {
    await likeIdea()
    e.target.classList.toggle('hidden')
    document.querySelector('.liked').classList.toggle('hidden')
    document.querySelector('.liked-num').classList.toggle('hidden')
  } else {
    let likedNums = Number(document.querySelector('.liked-num').innerText) + 1
    document.querySelector('.liked-num').innerText = likedNums
    await likeIdea()
  }

  setTimeout(() => {
    e.target.classList.toggle('hit-like')
  }, 300)
})

// main
getIdeaLikes()

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
    await Swal.fire({
      icon: 'error',
      title: '伺服器出錯了!',
      confirmButtonColor: '#315375'
    })
  }
}

async function userAuth() {
  const response = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if (response.status !== 200) {
    console.log(response.status)
    return
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
