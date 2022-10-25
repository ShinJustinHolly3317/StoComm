const View = {
  ideasList: document.querySelector('.ideas-list'),
  ideasFilter: document.querySelector('.ideas-filter'),
  page: 0,
  filter:'time',
  pagination: document.querySelector('.pagination')
}

const Controller = {
  init: async function (filter) {
    // check paging
    if (getQueryObject().page) {
      View.page = Number(getQueryObject().page) - 1
    }

    const response = await fetch(
      `/api/1.0/ideas/hot_ideas?filter=${filter}&page=${View.page}`
    )
    const ideasResult = await response.json()

    if (!ideasResult.data.length) {
      View.ideasList.innerHTML = `
        <h5 class="mt-5 text-center">目前還沒有發表任何觀點喔!</h5>
        `
    }

    let ideasListHtml = ''
    for (let item of ideasResult.data) {
      ideasListHtml += `
          <a href='/ideas-details?id=${item.id}'>
            <div class='ideas-card shadow'>
              <div class="d-flex justify-content-between">
                <h3>${item.title}</h3>
                <p class="date text-secondary mt-1">${item.date}</p>
              </div>
              
              <p class="badge bg-secondary my-3 fs-6">${item.company_name} (${
        item.stock_code
      })</p>

              <div class="ideas-card-img overflow-hidden" >
                <img src="${item.image}" class="img-fluid">
              </div>
              
              <div class="user-name d-flex justify-content-between">
                <div class="d-flex align-items-center">
                  <img src="${item.user_picture}" class="user-picture rounded">
                  <h5 class="mx-3 mt-2">${item.user_name}</h5>
                </div>
                
                <div class="d-flex align-items-center">
                  <div class="d-flex align-items-center justify-content-center border rounded-pill like-area">
                    <img src='/img/liked.png' class='social-btn liked' />
                    <div class="liked-num ms-2 me-0 mt-1">${
                      item.total_likes || 0
                    }</div>
                  </div>
                  <img src="/img/${item.future}.png" class="${
        item.future
      }-icon rounded-pill border mx-2">   
                </div>
              </div>
            </div>
          </a>
        `
    }
    View.ideasList.innerHTML = ideasListHtml
    const totalCount = Math.ceil(Number(ideasResult.totalCount) / 10)

    let pageHtml = ''
    for (let i = 0; i < totalCount; i++) {
      pageHtml += `
        <li class="page-item"><a class="page-link" href="/explore?page=${
        i + 1
      }">${i + 1}</a></li>
      `
    }
    View.pagination.innerHTML = pageHtml

    // select current page
    document
      .querySelector('.pagination')
      .children[View.page].classList.add('active')

    closeLoading()
  }
}

Controller.init('time')

// Listener
View.ideasFilter.addEventListener('change', (e) => {
  let filter = e.target.value
  View.filter = filter
  Controller.init(filter)
})

View.pagination.addEventListener('click', (e) => {
  if(e.target.classList.contains('page-link')){
    View.page = Number(e.target.innerText) - 1
    Controller.init(View.filter)
  }
})
