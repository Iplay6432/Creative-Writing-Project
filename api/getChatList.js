const fs = require('fs')
const path = require('path')

module.exports = (req, res) => {
  const chatDir = path.join(process.cwd(), 'static', 'chats')
  const listPath = path.join(chatDir, 'chatlist.json')
  if (!fs.existsSync(listPath)) {
    res.status(404).json({ error: 'chat list not found' })
    return
  }

  try {
    const raw = fs.readFileSync(listPath, 'utf8')
    const chatList = JSON.parse(raw)

    chatList.forEach(entry => {
      const cid = entry.id
      if (!cid) return
      const chatFile = path.join(chatDir, `chat${cid}.json`)
      if (!fs.existsSync(chatFile)) return
      try {
        const chatRaw = fs.readFileSync(chatFile, 'utf8')
        const data = JSON.parse(chatRaw)
        const msgs = data.messages || []
        let last = null
        for (let i = msgs.length - 1; i >= 0; i--) {
          const m = msgs[i]
          if (m && m.text) { last = m; break }
        }
        if (last) {
          entry.lastMessage = last.text
          entry.lastTime = last.time
        }
      } catch (e) {
        // ignore per-entry errors
      }
    })

    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(JSON.stringify(chatList))
  } catch (err) {
    res.status(500).json({ error: 'invalid chat list' })
  }
}
