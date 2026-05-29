const env = require("../lib/env");

const cronAuth = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}

module.exports = cronAuth