;(function () {
  //取資料
  const BASE_URL = 'https://lighthouse-user-api.herokuapp.com/'
  const INDEX_URL = BASE_URL + 'api/v1/users/'
  //存放API進來的資料
  const data = []

  //找元件
  const dataPanel = document.getElementById('data-panel')
  const searchForm = document.getElementById('search')
  const searchInput = document.getElementById('search-input')
  const pagination = document.getElementById('pagination')
  const modalBody = document.querySelector('.modal-body')
  const confirmedCase = document.getElementById('confirmed-case')
  //分頁準備
  const ITEM_PER_PAGE = 12
  //mode control
  const modeControl = document.querySelector('#mode-control')
  let displayMode = 'card'

  //收藏準備
  const myConfirmedDataList =
    JSON.parse(localStorage.getItem('feverUsers')) || []

  //透過API取得使用者資料
  axios
    .get(INDEX_URL)
    .then((response) => {
      data.push(...response.data.results)
      showLists(data)
    })
    .catch((error) => console.log(error))
  // ===============EventListeners======================
  //listen to data panel
  dataPanel.addEventListener('click', function () {
    if (
      event.target.matches('.btn-show-user') ||
      event.target.matches('.avatar') ||
      event.target.matches('.list-avatar')
    ) {
      //清掉上一個使用者資料
      modalBody.innerHTML = ''
      displayProfile(event.target.dataset.id)
    } else if (event.target.classList.contains('btn-add-fever')) {
      if (event.target.classList.contains('btn-info')) {
        turnButtonRed(event.target)
      } else if (event.target.classList.contains('btn-danger')) {
        turnButtonGreen(event.target)
      }
      addConfirmedList(event.target.dataset.id)
    }
  })
  //listen to search form submit event
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault()
    let results = []
    const regex = new RegExp(searchInput.value, 'i')
    results = data.filter(
      (user) => user.name.match(regex) || user.surname.match(regex)
    )
    showLists(results)
  })
  //listen to pagination click event
  pagination.addEventListener('click', (event) => {
    const lis = document.querySelectorAll('.page-item')
    //先進去把active都清掉一次
    lis.forEach((li) => li.classList.remove('active'))
    // console.log(event.target)
    if (event.target.tagName === 'A') {
      getPageData(event.target.dataset.page)
      event.target.parentElement.classList.add('active')
    }
  })
  confirmedCase.addEventListener('click', (event) => {
    changeConfirmCaseContext(event.target)
  })

  //listen to mode-control click event
  modeControl.addEventListener('click', (event) => {
    if (event.target.matches('#card-mode')) {
      PlaySound()
      displayMode = 'card'
      getPageData(currentPage)
    } else if (event.target.matches('#list-mode')) {
      PlaySound()
      displayMode = 'list'
      getPageData(currentPage)
    }
  })
  //===============functions======================
  //display in card mode
  function displayInCards(data) {
    let htmlContent = ''
    data.forEach((item) => {
      //這是什麼寫法？
      const { id, avatar, gender, name, surname, region } = item
      htmlContent += `
            <div class="col-6 col-sm-3 mt-3 card-deck">
                <div class="card mb-2">
                    <!-- card img -->
                    <img class="avatar" src="${avatar}" alt="Card image" data-id="${id}" data-toggle="modal"
                    data-target="#show-user-modal">
                        <!-- card body -->
                        <div class="card-body">
                        <i class="gender-icon ${gender} mr-1"></i><span class="card-title user-name h6">${name} ${surname}</span><br>
                 <i class="fas fa-plane text-dark"></i> <span class="card-content user-region">${region}</span>
                        </div>
                        <!-- "More" button -->
                        <button
                          class="btn btn-secondary btn-sm btn-show-user"
                          data-toggle="modal"
                          data-target="#show-user-modal"
                          data-id="${id}"
                        >詳細資料</button>
                        <!-- favorite button --> 
                        <button id="confirmed-button"
                        class="btn btn-info btn-add-fever btn-sm " data-id="${id}">加入確診名單</button>
                </div>
            </div>
            `
    })
    dataPanel.innerHTML = htmlContent
    addIcon()
    showFeverColor()
  }

  //display in list mode
  function displayInList(data) {
    let htmlContent = '<ul class="list-group list-group-flush">'
    data.forEach((item) => {
      const { id, avatar, gender, name,surname,region, age } = item
      htmlContent += `     
      <li class="user-in-list list-group-item list-group-item-action d-flex align-items-center px-5">
      <img
        class="list-avatar rounded-circle ${gender}-color"
        data-id="${id}"
        data-toggle="modal"
        data-target="#show-user-modal"
        src="${avatar}"
      />
      <div class="list-name">${name} ${surname} (${age})</div>
      <div class="list-region">
        <i class="fas fa-plane text-dark"></i> ${region}
      </div>
      <button
        id="confirmed-button"
        class="btn btn-info btn-add-fever btn-sm list-btn"
        data-id="${id}"
      >
        加入確診名單
      </button>

    </li>
        `
    })
    htmlContent += '</ul>'
    dataPanel.innerHTML = htmlContent
    addIcon()
    showFeverColor()
  }
  //add gender icons
  function addIcon() {
    const genderIcon = document.querySelectorAll('.gender-icon')
    genderIcon.forEach((item) => {
      if (item.matches('.female')) {
        item.classList.add('fas', 'fa-venus', 'text-danger')
      } else {
        item.classList.add('fas', 'fa-mars', 'text-primary')
      }
    })
  }
  //04/13增加這個功能
  //show favorite icon
  function showFeverColor() {
    const feverIcon = document.querySelectorAll('.btn-add-fever')
    feverIcon.forEach((item) => {
      if (
        myConfirmedDataList.some(
          (profile) => profile.id === Number(item.dataset.id)
        )
      ) {
        item.classList.replace('btn-info', 'btn-danger')
        item.innerText = '確診!'
      }
    })
  }

  //display profile in modal
  function displayProfile(id) {
    //set request url
    const url = INDEX_URL + id
    //send request to Show API
    axios
      .get(url)
      .then((response) => {
        const data = response.data
        //insert data into modal UI
        modalBody.innerHTML = `
          <div class="row d-flex align-items-center">
          <!-- user avatar -->       
          <img src="${
            data.avatar
          }" alt="..." class="col-sm-5 modal-img img-fluid rounded-circle " id="modal-avatar">
          <!-- user information --> 
          <div class="col-sm-7 modal-detail">
            <p id="user-name">${data.name} ${data.surname}</p>
            <p id="user-bd">${data.birthday} age(${data.age})</p>
            <p id="user-region">Travel from:${data.region}</p>
            <p id="user-email">Contact Info:\n ${data.email}</p>
            <p id="user-updated">Entry time: ${data.updated_at.slice(0, 10)}</p>
          </div>
        </div>
          `
      })
      .catch((error) => console.log(error))
  }
  //add pagination並計算分幾頁
  function getTotalPages(data) {
    let totalPages = Math.ceil(data.length / ITEM_PER_PAGE) || 1
    let pageItemContent = ''
    for (let i = 0; i < totalPages; i++) {
      pageItemContent += `
        <li class="page-item">
          <a class="page-link" href="javascript:;" data-page="${i + 1}">${
        i + 1
      }</a>
        </li>
        `
      pagination.innerHTML = pageItemContent
    }
  }
  //存放計算後當前頁面要顯示的資料
  let pageData = []
  let paginationData = []
  let currentPage = 1
  //get page data and display data
  function getPageData(pageNum, data) {
    paginationData = data || paginationData
    currentPage = pageNum || currentPage
    let offset = (pageNum - 1) * ITEM_PER_PAGE
    pageData = paginationData.slice(offset, offset + ITEM_PER_PAGE)
    if (displayMode === 'card') {
      displayInCards(pageData)
    } else if (displayMode === 'list') displayInList(pageData)
  }

  //加入確診名單
  function addConfirmedList(id) {
    const user = data.find((item) => item.id === Number(id))
    if (myConfirmedDataList.some((item) => item.id === Number(id))) {
      const confirmation = confirm(
        `您確定要將 ${user.name} ${user.surname}自確診名單移出嗎？ `
      )
      if (confirmation === true) removeConfirmedList(id)
    } else {
      myConfirmedDataList.unshift(user)
      alert(`成功將${user.name} ${user.surname}加入確診名單。`)
    }
    localStorage.setItem('feverUsers', JSON.stringify(myConfirmedDataList))
    console.log(myConfirmedDataList)
  }

  //移出確診名單
  function removeConfirmedList(id) {
    const index = myConfirmedDataList.findIndex(
      (item) => item.id === Number(id)
    )
    if (index === -1) return

    myConfirmedDataList.splice(index, 1)
    localStorage.setItem('feverUsers', JSON.stringify(myConfirmedDataList))
  }

  //顯示名單
  function showLists(data) {
    getTotalPages(data)
    getPageData(1, data)
  }

  //控制卡片上"確診"按鈕內容
  //變紅
  function turnButtonRed(target) {
    target.classList.replace('btn-info', 'btn-danger')
    target.innerText = '確診!'
  }
  //變綠
  function turnButtonGreen(target) {
    // console.log(target.innerText)
    target.classList.replace('btn-danger', 'btn-info')
    target.innerText = '加入確診名單'
  }

  //控制"查看確診名單"按鈕的內容
  function changeConfirmCaseContext(target) {
    // console.log(target.innerText)
    //是紅色
    if (target.classList.contains('btn-danger')) {
      target.classList.replace('btn-danger', 'btn-primary')
      target.innerText = '看全部名單'
      showLists(myConfirmedDataList)
      let deleteButton = document.querySelectorAll(
        'button[id="confirmed-button"]'
      )
      $(deleteButton).remove()
      //是藍色
    } else if (target.classList.contains('btn-primary')) {
      target.classList.replace('btn-primary', 'btn-danger')
      target.innerText = '看確診名單'
      showLists(data)
    }
  }
  function PlaySound() {
    let sound = document.getElementById('audio')
    sound.play()
  }
})()
