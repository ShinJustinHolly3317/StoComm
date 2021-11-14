const View = {
  submitBtn: document.querySelector('#enter-btn'),
  loginForm: document.querySelector('#js-login-form'),
  enterEmail: document.querySelector('#enter-email'),

  welcomeLogIn: document.querySelector('.js-login-msg'),
  welcomeSignUp: document.querySelector('.js-signup-msg'),
  userEmail: document.querySelector('#nav-user-email'),
  userPassword: document.querySelector('#nav-user-password'),
  loginBtn: document.querySelector('#js-login-btn'),
  signUpBtn: document.querySelector('#js-signup-btn'),

  logInModal: document.querySelector('#nav-login-modal'),
  signUpModal: document.querySelector('#nav-signup-modal'),

  signUpData: document.querySelector('.signup-data'),
  signUpEmail: document.querySelector('#signup-user-mail'),

  navBarBtns: document.querySelector('.functional-part .functional-btns'),
  homeLoginBtns: document.querySelector('.home-login-btns'),

  memberLink: document.querySelector('#member-link'),
  navSignUpBtn: document.querySelector('.nav-signup-btn')
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

View.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const response = await fetch('/api/1.0/user/check_user_exist', {
    method: 'POST',
    body: new FormData(View.loginForm)
  })
  const result = await response.json()

  // const logInModal = new bootstrap.Modal(View.logInModal, {
  //   keyboard: false
  // })
  // const signUpModal = new bootstrap.Modal(View.signUpModal, {
  //   keyboard: false
  // })

  if (result.searchResult) {
    // use global modal from main.js
    loginModal.show()
    View.welcomeLogIn.innerText = `歡迎回來，${result.name}`
    View.userEmail.value = result.email
    View.navSignUpBtn.classList.add('hidden')
  } else {
    signupModal.show()
    View.welcomeSignUp.innerText = `你還沒有加入會員喔，快點加入吧`
    console.log(View.signUpEmail)
    View.signUpEmail.value = View.enterEmail.value
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

async function userAuth() {
  const accessToken = localStorage.getItem('access_token')
  // const pathname = window.location.pathname

  // render nav btns
  View.navBarBtns.classList.add('hidden')
  // View.homeLoginBtns.style.display = 'flex'

  if (!accessToken) return

  const response = await fetch('/api/1.0/user/user_auth', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })

  const result = await response.json()
  if (result.error) {
    return
  } else {
    window.location.href = '/hot-rooms'
  }
}
userAuth()



