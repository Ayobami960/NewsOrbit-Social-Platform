const express = require('express')
const router = express.Router()
const cronAuth = require('../middlewares/cronAuth')
const { runScheduler } = require('../controllers/scheduler.controller')

router.get('/scheduler/run', cronAuth, runScheduler)

module.exports = router