const fs = require('fs')
const path = require('path')

module.exports = (req, res) => {
  const chatNum = req.query.chatNum
  if (!chatNum) {
    res.status(400).json({ error: 'chatNum query parameter required' })
    return
  }

  const chatFile = path.join(process.cwd(), 'static', 'chats', `chat${chatNum}.json`)
  if (!fs.existsSync(chatFile)) {
    res.status(404).json({ error: 'chat not found' })
    return
  }

  try {
    const raw = fs.readFileSync(chatFile, 'utf8')
    const data = JSON.parse(raw)
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(JSON.stringify(data))
  } catch (err) {
    res.status(500).json({ error: 'failed to read chat' })
  }
}
