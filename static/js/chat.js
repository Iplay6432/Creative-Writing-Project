document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('messages')
  const dateSticky = document.getElementById('date-sticky')
  const composer = document.getElementById('composer')
  const input = document.getElementById('input')
  const chatListEl = document.querySelector('.chat-list')

  let currentChatId = null
  let currentMessages = []

  function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  }

  function formatDateLabel(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const today = new Date()
    const dayDiff = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000)
    if (dayDiff === 0) return 'Today'
    if (dayDiff === 1) return 'Yesterday'
    return d.toLocaleDateString(undefined, {month:'short', day:'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric'})
  }

  function getDayKey(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
  }

  function renderMessages(msgs){
    messagesEl.innerHTML = ''
    let lastDay = null
    msgs.forEach(m => {
      const dayKey = m.time ? getDayKey(m.time) : 'nodate'
      if (dayKey !== lastDay) {
        const sep = document.createElement('div')
        sep.className = 'date-sep'
        sep.textContent = formatDateLabel(m.time)
        messagesEl.appendChild(sep)
        lastDay = dayKey
      }

      const row = document.createElement('div')
      row.className = 'bubble-row ' + (m.sender === 'me' ? 'me' : 'them')
      row.dataset.day = dayKey

      const bubble = document.createElement('div')
      bubble.className = 'bubble ' + (m.sender === 'me' ? 'me' : 'them')
      bubble.textContent = m.text

      row.appendChild(bubble)
      messagesEl.appendChild(row)

      if (m.time) {
        const ts = document.createElement('div')
        ts.className = 'timestamp'
        ts.textContent = formatTime(m.time)
        messagesEl.appendChild(ts)
      }
    })
    updateSticky()
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  function updateSticky(){
    const sepEls = messagesEl.querySelectorAll('.date-sep')
    if (!sepEls.length) { dateSticky.style.display = 'none'; return }

    const messagesRect = messagesEl.getBoundingClientRect()
    let current = null
    sepEls.forEach(sep => {
      const r = sep.getBoundingClientRect()
      const offset = r.top - messagesRect.top
      if (offset <= 12) current = sep
    })

    if (!current) current = sepEls[0]

    const nearBottom = (messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight) < 60
    if (nearBottom) {
      dateSticky.style.display = 'none'
    } else {
      dateSticky.textContent = current.textContent
      dateSticky.style.display = 'block'
    }
  }

  messagesEl.addEventListener('scroll', () => {
    updateSticky()
  })

  async function loadChat(id){
    currentChatId = id
    const res = await fetch(`/api/getChat?chatNum=${id}`)
    if (!res.ok) {
      messagesEl.innerHTML = '<div class="timestamp">Unable to load chat</div>'
      return
    }
    const data = await res.json()
    currentMessages = data.messages || []
    renderMessages(currentMessages)
  }

  async function loadChatList(){
    const res = await fetch('/api/getChatList')
    if (!res.ok) return
    const list = await res.json()
    chatListEl.innerHTML = ''
    list.forEach(c => {
      const li = document.createElement('li')
      li.className = 'chat-item'
      li.dataset.id = c.id

      const avatarWrap = document.createElement('div')
      avatarWrap.className = 'chat-avatar'
      const img = document.createElement('img')
      const avatarPath = c.avatar ? (`/static/${c.avatar}`) : ''
      if (avatarPath) img.src = avatarPath
      avatarWrap.appendChild(img)

      const meta = document.createElement('div')
      meta.className = 'chat-meta'
      const name = document.createElement('div')
      name.className = 'chat-name'
      name.textContent = c.name
      const preview = document.createElement('div')
      preview.className = 'chat-preview'
      preview.textContent = c.lastMessage || ''

      meta.appendChild(name)
      meta.appendChild(preview)

      const time = document.createElement('div')
      time.className = 'chat-time'
      time.textContent = c.lastTime ? formatDateLabel(c.lastTime) : ''

      li.appendChild(avatarWrap)
      li.appendChild(meta)
      li.appendChild(time)

      li.addEventListener('click', () => {
        document.querySelectorAll('.chat-item').forEach(n=>n.classList.remove('active'))
        li.classList.add('active')
        loadChat(c.id)
        document.querySelector('.chat-title').textContent = c.name
      })

      chatListEl.appendChild(li)
    })
    if (list.length) {
      const first = chatListEl.querySelector('.chat-item')
      if (first) { first.classList.add('active'); first.click() }
    }
  }

  composer.addEventListener('submit', (e) => {
    e.preventDefault()
    return
  })

  loadChatList()
  const resizer = document.getElementById('resizer')
  const sidebar = document.querySelector('.sidebar')
  const sidebarToggle = document.getElementById('sidebar-toggle')
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', ()=>{
      if (!sidebar) return
      sidebar.classList.toggle('collapsed')
    })
  }

  if (resizer && sidebar) {
    let isResizing = false
    resizer.addEventListener('mousedown', (e) => {
      isResizing = true
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
      resizer.classList.add('active')
    })
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return
      if (sidebar.classList.contains('collapsed')) sidebar.classList.remove('collapsed')
      const min = 80
      const max = Math.max(260, window.innerWidth - 200)
      let newWidth = e.clientX
      newWidth = Math.max(min, Math.min(max, newWidth))
      sidebar.style.width = newWidth + 'px'
    })
    document.addEventListener('mouseup', () => {
      if (!isResizing) return
      isResizing = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      resizer.classList.remove('active')
    })
  }
  const themeToggle = document.getElementById('theme-toggle')
  function setTheme(dark){
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme-dark', dark ? '1' : '0')
    themeToggle.textContent = dark ? '☀️' : '🌙'
  }
  const stored = localStorage.getItem('theme-dark')
  if (stored === null) {
    const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefers)
  } else {
    setTheme(stored === '1')
  }
  themeToggle.addEventListener('click', ()=> setTheme(!document.documentElement.classList.contains('dark')))
})
