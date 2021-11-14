const navWarRoomCheck = new bootstrap.Modal(
  document.querySelector('#war-room-check'),
  {
    keyboard: false
  }
)
const loginModal = new bootstrap.Modal(
  document.querySelector('#nav-login-modal'),
  {
    keyboard: false
  }
)
const signupModal = new bootstrap.Modal(
  document.querySelector('#nav-signup-modal'),
  {
    keyboard: false
  }
)
const quickWarRoomBtn = document.querySelector('.quick-war-room-btn')
const navLoginBtn = document.querySelector('#js-nav-login-btn')

// Listener
quickWarRoomBtn.addEventListener('click', async (e) => {
  e.preventDefault()
  const accessToken = localStorage.getItem('access_token')

  const userResponse = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })
  console.log(userResponse.status)
  if (userResponse.status !== 200) {
    loginModal.show()
  } else {
    navWarRoomCheck.show()
  }
})

document
  .querySelector('#js-create-war-room-btn')
  .addEventListener('click', async (e) => {
    e.preventDefault()
    const accessToken = localStorage.getItem('access_token')

    const userResponse = await fetch('/api/1.0/user/user_auth', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    })

    if (userResponse.status !== 200) {
      await Swal.fire({
        icon: 'error',
        title: '請重新登入!',
        confirmButtonColor: '#315375'
      })
      return
    }

    const userResult = await userResponse.json()
    const userData = userResult.data

    document.querySelector('#user_id').value = userData.id
    const createData = new FormData(
      document.querySelector('.war-room-check-data')
    )
    const roomResponse = await fetch('/api/1.0/war_room/create_war_room', {
      method: 'POST',
      Authorization: 'Bearer ' + accessToken,
      body: createData
    })
    const roomresult = await roomResponse.json()
    console.log(roomresult)

    if (roomResponse.status !== 200) {
      await Swal.fire({
        icon: 'error',
        title: roomresult.error,
        confirmButtonColor: '#315375'
      })
      return
    }

    const roomId = roomresult.data.insertId
    const stockCode = roomresult.data.stock_code
    window.location.href = `/war-room?roomId=${roomId}&stockCode=${stockCode}`
  })

navLoginBtn.addEventListener('click', async (e) => {
  e.preventDefault()
  const userEmail = document.querySelector('#nav-user-email').value
  const userpassword = document.querySelector('#nav-user-password').value

  const loginData = {
    provider: 'native',
    email: userEmail,
    password: userpassword
  }

  const response = await fetch('/api/1.0/user/log_in', {
    method: 'POST',
    body: JSON.stringify(loginData),
    headers: {
      'Content-type': 'application/json'
    }
  })
  const result = await response.json()

  switch (response.status) {
    case 500:
    case 403:
      await Swal.fire({
        icon: 'error',
        title: result.error,
        confirmButtonColor: '#315375'
      })
      break
    case 200:
      localStorage.setItem('access_token', result.data.access_token)

      const user = {
        id: result.data.user.id,
        name: result.data.user.name,
        email: result.data.user.email,
        piture: result.data.user.picture
      }
      localStorage.setItem('user', JSON.stringify(user))

      await Swal.fire({
        position: 'center',
        icon: 'success',
        title: '登入成功!',
        confirmButtonColor: '#315375',
        showConfirmButton: false,
        timer: 1000
      })
      window.location.reload()
  }
})

document.querySelector('#member-link').addEventListener('click', async (e) => {
  showLoginModal()
})

document.querySelector('#navbar-logou').addEventListener('click', async (e) => {
  localStorage.removeItem('user')
  localStorage.removeItem('access_token')

  await Swal.fire({
    position: 'center',
    icon: 'success',
    title: '登出成功',
    showConfirmButton: false,
    timer: 1000
  })

  window.location.href = '/'
})

// Function
async function displayemeberBtn() {
  document.querySelector('#dropdownMenuLink').setAttribute('data-bs-toggle', '')
  const accessToken = localStorage.getItem('access_token')

  if (!accessToken) return

  const response = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if (response.status === 200) {
    console.log('testtttt');
    document
      .querySelector('#dropdownMenuLink')
      .setAttribute('data-bs-toggle', 'dropdown')
  }
}

async function showLoginModal() {
  const accessToken = localStorage.getItem('access_token')

  const response = await fetch('/api/1.0/user/check_user_exist', {
    method: 'POST',
    body: new FormData(View.loginForm)
  })
  const result = await response.json()

  if (!accessToken) {
    document.querySelector('.js-login-msg').innerText = `StoComm 歡迎你!`
    document.querySelector('#nav-user-email').value = result.email
    loginModal.show()
    return false
  }

  const userresponse = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  if (userresponse.status === 200) {
    return true
  } else {
    loginModal.show()
    return false
  }
}

// Main
displayemeberBtn()
