/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

/**
 * worker iterates through all addresses,
 * marks paid and fires callbacks
 *
*/

let rp = require('request-promise')
let storage = require('./models/storage')
let blockchain = require('./models/blockchain')
let config = require('./config')

require('./smoke-test')

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf } = format

const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

const logger = createLogger({
  level: config.logging_level,
  format: combine(
      timestamp(),
      myFormat
    ), // winston.format.json(),
  transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      // or new transports.Console()
    new transports.File({ filename: './logs/error.log', level: 'error' }),
    new transports.File({ filename: './logs/combined.log' })
  ]
})

;(async () => {
  while (1) {
    logger.info('worker.js', '.')
    let wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    let job = await storage.getUnprocessedAdressesNewerThanPromise(Date.now() - config.process_unpaid_for_period)
    await processJob(job)
    await wait(15000)
  }
})()

async function processJob (rows) {
  rows = rows || {}
  rows.rows = rows.rows || []

  for (const row of rows.rows) {
    let json = row.doc
    let received = await blockchain.getreceivedbyaddress(json.address)
    logger.info('worker.js', 'address:', json.address, 'expect:', json.btc_to_ask, 'confirmed:', received[1].result, 'unconfirmed:', received[0].result)
    if (
        (json.btc_to_ask > config.small_amount_threshhold && (received[1].result >= json.btc_to_ask)) ||
        (json.btc_to_ask <= config.small_amount_threshhold && (received[0].result >= json.btc_to_ask))
      ) {
        // paid ok
      json.processed = 'paid'
      json.paid_on = Date.now()
      await storage.saveJobResultsPromise(json)
      logger.info('worker.js', 'firing callback: ' + json.callback_url)
      await rp({ uri: json.callback_url, timeout: 10 * 1000 })
      // marked as paid and fired a callack. why not forward funds instantly?
      // because in case of zero-conf accepted balance we wound need to wait for a couple of
      // confirmations till we can forward funds
    }
  }
}
