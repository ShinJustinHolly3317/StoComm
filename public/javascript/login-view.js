const View = {
  submitBtn: document.querySelector('#enter-btn'),
  loginForm: document.querySelector('#js-login-form'),

  welcomeLogIn: document.querySelector('.js-login-msg'),
  welcomeSignUp: document.querySelector('.js-signup-msg'),
  userEmail: document.querySelector('#user-email'),
  userPassword: document.querySelector('#user-password'),
  loginBtn: document.querySelector('#js-login-btn'),
  signUpBtn: document.querySelector('#js-signup-btn'),

  logInModal: document.querySelector('#login-modal'),
  signUpModal: document.querySelector('#signup-modal'),

  signUpData: document.querySelector('.signup-data')
}

const Controller = {
  checkNameExist: async (inputForm) => {
    const resposne = await fetch('/user/login', {
      method: 'POST',
      body: new FormData(inputForm)
    })
    const result = await resposne.json()
  }
}

View.submitBtn.addEventListener('click', async (e) => {
  const response = await fetch('/api/1.0/user/check_user_exist', {
    method: 'POST',
    body: new FormData(View.loginForm)
  })
  const result = await response.json()

  const logInModal = new bootstrap.Modal(View.logInModal, {
    keyboard: false
  })
  const signUpModal = new bootstrap.Modal(View.signUpModal, {
    keyboard: false
  })

  if (result.searchResult) {
    logInModal.show()
    View.welcomeLogIn.innerText = `歡迎回來，${result.name}`
    View.userEmail.value = result.email
  } else {
    signUpModal.show()
    View.welcomeSignUp.innerText = `你還沒有加入會員喔，快點加入吧`
  }
})

View.loginBtn.addEventListener('click', async (e) => {
  e.preventDefault()
  const loginData = {
    provider: 'native',
    email: View.userEmail.value,
    password: View.userPassword.value
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
      alert(result.error)
      break
    case 200:
      localStorage.setItem('access_token', result.data.access_token)

      const userRole = {
        id: result.data.user.id,
        name: result.data.user.name,
        email: result.data.user.email,
        role: 'visitor'
      }
      localStorage.setItem('userRole', JSON.stringify(userRole))

      alert('登入成功 !!')
      window.location.href = '/hot-rooms'
  }
})

View.signUpBtn.addEventListener('click', async (e) => {
  e.preventDefault()
  const response = await fetch('/api/1.0/user/sign_up', {
    method: 'POST',
    body: new FormData(View.signUpData)
  })
  const result = await response.json()

  switch (response.status) {
    case 500:
    case 403:
    case 400:
      alert(result.error)
      break
    case 200:
      alert('註冊成功 !!')
      localStorage.setItem('access_token', result.data.access_token)

      const userRole = {
        id: result.data.user.id,
        name: result.data.user.name,
        email: result.data.user.email,
        role: 'visitor'
      }
      localStorage.setItem('userRole', JSON.stringify(userRole))

      
      window.location.href = '/hot-rooms'
  }
})

async function userAuth() {
  const response = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem('access_token')
    }
  })

  const result = await response.json()
  if(result.error){
    return 
  } else {
    window.location.href = '/hot-rooms'
  }
}

userAuth()