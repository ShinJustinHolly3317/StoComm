const View = {
  ideasList: document.querySelector('.ideas-list'),
  ideasFilter: document.querySelector('.ideas-filter'),
  page: 0
}

const Controller = {
  init: async function (filter) {
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
              <h3>${item.title}</h3>
              <p class="badge bg-secondary">
              ${item.company_name} (${item.stock_code})</p>

              <div id="ideas-card-img">
                <img src="${item.image}" class="img-fluid">
              </div>
              
              <div class="user-name d-flex justify-content-around">
                <h3>${item.user_name}</h3>
                <div class="d-flex">
                  <img src='/img/liked.png' class='social-btn liked' />
                  <div class="liked-num">${item.total_likes || 0}</div>
                </div>
                <p class="date">${item.date}</p>
              </div>
            </div>
          </a>
        `
    }
    View.ideasList.innerHTML = ideasListHtml
  }
}

Controller.init('time')


// Listener
View.ideasFilter.addEventListener('change', (e) => {
  let filter = e.target.value
  Controller.init(filter)
})