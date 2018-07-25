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
let logger = require('./utils/logger')

require('./smoke-test')

;(async () => {
  while (1) {
    logger.log('worker.js', '.')
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
    logger.log('worker.js', [ 'address:', json.address, 'expect:', json.btc_to_ask, 'confirmed:', received[1].result, 'unconfirmed:', received[0].result ])
    if (
        (json.btc_to_ask > config.small_amount_threshhold && (received[1].result >= json.btc_to_ask)) ||
        (json.btc_to_ask <= config.small_amount_threshhold && (received[0].result >= json.btc_to_ask))
      ) {
        // paid ok
      json.processed = 'paid'
      json.paid_on = Date.now()
      await storage.saveJobResultsPromise(json)
      logger.log('worker.js', 'firing callback: ' + json.callback_url)
      await rp({ uri: json.callback_url, timeout: 10 * 1000 })
      // marked as paid and fired a callback. why not forward funds instantly?
      // because in case of zero-conf accepted balance we wound need to wait for a couple of
      // confirmations till we can forward funds
    }
  }
}
