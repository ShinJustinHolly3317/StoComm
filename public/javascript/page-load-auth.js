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

  const result = await response.json()
  if(result.error){
    alert('你沒有權限進來!!')
    window.location.href = '/'
  } else {
    document.querySelector('body').style.display = 'block'
    userData = result.data
  }
  return result
}

function preventLoading() {
  document.querySelector('body').style.display = 'none'
}
