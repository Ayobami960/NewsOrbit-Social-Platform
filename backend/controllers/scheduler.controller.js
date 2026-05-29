const { runAllJobs } = require('../jobs/scheduler')
const logger = require('../utils/logger')

const runScheduler = async (req, res) => {
  try {
    logger.info('Cron job triggered at: ' + new Date().toISOString())

    await runAllJobs()

    logger.info('Cron job completed successfully')
    return res.status(200).json({ 
      success: true, 
      message: 'Scheduler ran successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Cron job failed: ' + error.message)
    return res.status(500).json({ 
      success: false, 
      message: 'Scheduler failed',
      error: error.message 
    })
  }
}

module.exports = { runScheduler }