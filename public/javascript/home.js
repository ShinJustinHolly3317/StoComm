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

  if (result.searchResult) {
    // use global modal from main.js
    loginModal.show()
    View.welcomeLogIn.innerText = `歡迎回來，${result.name}`
    View.userEmail.value = result.email
    View.navSignUpBtn.classList.add('hidden')
  } else {
    signupModal.show()
    View.welcomeSignUp.innerText = `你還沒有加入會員喔，快點加入吧`
    View.signUpEmail.value = View.enterEmail.value
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

// Main
(async function(){
  document.querySelector('.description-wrapper').classList.add('hidden')
  document.querySelector('.home-wrapper').classList.add('hidden')

  await userAuth()

  document.querySelector('.description-wrapper').classList.remove('hidden')
  document.querySelector('.home-wrapper').classList.remove('hidden')
  closeLoading()
})()





