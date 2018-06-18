/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

/**
 * worker iterates through all paid addresses (which are actually hot wallets),
 * and sweeps (forwards funds) to seller final (aggregational) wallet
 *
 */

let storage = require('./models/storage')
let config = require('./config')
let blockchain = require('./models/blockchain')
let signer = require('./models/signer')

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
    logger.info('worker2.js', '.')
    let wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    let job = await storage.getPaidAdressesNewerThanPromise(Date.now() - config.process_paid_for_period)
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
    logger.info('worker2.js', 'address:', json.address, 'expect:', json.btc_to_ask, 'confirmed:', received[1].result, 'unconfirmed:', received[0].result)

    if (+received[1].result === +received[0].result && received[0].result > 0) { // balance is ok, need to transfer it
      let seller = await storage.getSellerPromise(json.seller)
      logger.info('worker2.js', 'transferring', received[0].result, 'BTC (minus fee) from', json.address, 'to seller', seller.seller, '(', seller.address, ')')
      let unspentOutputs = await blockchain.listunspent(json.address)

      let createTx = signer.createTransaction
      if (json.address[0] === '3') {
        // assume source address is SegWit P2SH
        // pretty safe to assume that since we generate those addresses
        createTx = signer.createSegwitTransaction
      }
      let tx = createTx(unspentOutputs.result, seller.address, received[0].result, 0.0001, json.WIF)
      logger.info('worker2.js', 'broadcasting', tx)
      let broadcastResult = await blockchain.broadcastTransaction(tx)
      logger.info('worker2.js', 'broadcast result:', JSON.stringify(broadcastResult))

      json.processed = 'paid_and_sweeped'
      json.sweep_result = json.sweep_result || {}
      json.sweep_result[Date.now()] = {
        'tx': tx,
        'broadcast': broadcastResult
      }

      await storage.saveJobResultsPromise(json)
    } else {
      logger.warn('worker2.js', 'balance is not ok, skip')
    }
  }
}
