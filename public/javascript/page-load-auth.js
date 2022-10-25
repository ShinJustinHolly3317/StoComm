const accessToken = localStorage.getItem('access_token')
let userData
preventLoading()
userAuth()

async function userAuth() {
  const response = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if (response.status !== 200){
    await Swal.fire({
      icon: 'error',
      title: '請先登入喔!!',
      confirmButtonColor: '#315375'
    })

    window.location.href = '/'
  }

  const result = await response.json()
  if(result.error){
    await Swal.fire({
      icon: 'error',
      title: '請重新登入!!',
      confirmButtonColor: '#315375'
    })
    
    window.location.href = '/'
  } else {
    document.querySelector('.blocking-view').classList.add('hidden')
    userData = result.data
  }
  return result
}

function preventLoading() {
  document.querySelector('.blocking-view').classList.remove('hidden')
}
