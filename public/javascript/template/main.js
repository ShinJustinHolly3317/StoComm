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
const navSignUpBtn = document.querySelector('.nav-signup-btn')
const signUpBtn = document.querySelector('#js-signup-btn')
const inputEle = document.querySelectorAll('input')

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

    const warRoomTitle = createData.get('war_room_title')

    // Check title length
    if (textLenCheck(warRoomTitle) > 32) {
      await Swal.fire({
        icon: 'error',
        title: '研究室名稱字數請勿超過32位!!',
        showConfirmButton: false,
        timer: 1500
      })
      return
    }

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

  // Check title length
  if (textLenCheck(userEmail) > 32) {
    await Swal.fire({
      icon: 'error',
      title: 'Email 字數請勿超過32位!!',
      showConfirmButton: false,
      timer: 1500
    })
    return
  }

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

signUpBtn.addEventListener('click', async (e) => {
  e.preventDefault()
  signUpData = document.querySelector('.signup-data')
  const signUpFormData = new FormData(signUpData)
  const email = signUpFormData.get('email')
  const name = signUpFormData.get('name')

  // Check title length
  if (textLenCheck(email) > 32) {
    await Swal.fire({
      icon: 'error',
      title: 'Email 字數請勿超過32位!!',
      showConfirmButton: false,
      timer: 1500
    })
    return
  }
  if (textLenCheck(name) > 32) {
    await Swal.fire({
      icon: 'error',
      title: '綽號字數請勿超過32位!!',
      showConfirmButton: false,
      timer: 1500
    })
    return
  }

  const response = await fetch('/api/1.0/user/sign_up', {
    method: 'POST',
    body: signUpFormData
  })
  const result = await response.json()

  switch (response.status) {
    case 500:
    case 403:
    case 400:
      await Swal.fire({
        icon: 'error',
        title: result.error,
        confirmButtonColor: '#315375'
      })
      break
    case 200:
      await Swal.fire({
        title: '註冊成功!',
        confirmButtonColor: '#315375'
      })
      localStorage.setItem('access_token', result.data.access_token)

      const user = {
        id: result.data.user.id,
        name: result.data.user.name,
        email: result.data.user.email,
        piture: result.data.user.picture
      }
      localStorage.setItem('user', JSON.stringify(user))

      window.location.href = '/hot-rooms'
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

navSignUpBtn.addEventListener('click', (e) => {
  loginModal.hide()
  signupModal.show()
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

    if (result.email) {
      document.querySelector('#nav-user-email').value = result.email
    }

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

function showLoading() {
  document.querySelector('.loading-img-area').classList.remove('hidden')
}

function closeLoading() {
  document.querySelector('.loading-img-area').classList.add('hidden')
}

function textLenCheck(str) {
  return str.replace(/[\u4E00-\u9FFF]/g, 'xx').length
}

async function initInputValid() {
  for (let index in inputEle) {
    if (['0', '3', '5', '6'].includes(index)) {
      inputEle[index].addEventListener('change', async (e) => {
        if (textLenCheck(e.target.value) >= 32) {
          // Check title length
          await Swal.fire({
            icon: 'error',
            title: '字數請勿超過32位!!',
            showConfirmButton: false,
            timer: 1500
          })
          return
        }
      })
    }
  }
}

// Main
displayemeberBtn()
initInputValid()
