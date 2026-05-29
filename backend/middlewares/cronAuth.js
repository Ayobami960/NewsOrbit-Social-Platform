const cronAuth = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}

module.exports = cronAuth