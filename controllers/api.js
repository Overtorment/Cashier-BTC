/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

/**
 *
 * Handles all bitcoin payment gateway API calls
 * I.e. all calls responsible for invoicing and paying in BTC only
 *
 */

/* global exchanges */

let express = require('express')
let router = express.Router()
let config = require('../config')
let blockchain = require('../models/blockchain')
let storage = require('../models/storage')
let signer = require('../models/signer')

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

router.get('/request_payment/:expect/:currency/:message/:seller/:customer/:callback_url', function (req, res) {
  let exchangeRate, btcToAsk, satoshiToAsk

  if (undefined === typeof exchanges[req.params.currency]) return res.send(JSON.stringify({'error': 'bad currency'}))
  else exchangeRate = exchanges[req.params.currency]

  satoshiToAsk = Math.floor((req.params.expect / exchangeRate) * 100000000)
  btcToAsk = satoshiToAsk / 100000000

  let address = signer.generateNewSegwitAddress()

  let addressData = {
    'timestamp': Date.now(),
    'expect': req.params.expect,
    'currency': req.params.currency,
    'exchange_rate': exchangeRate,
    'btc_to_ask': btcToAsk,
    'message': req.params.message,
    'seller': req.params.seller,
    'customer': req.params.customer,
    'callback_url': decodeURIComponent(req.params.callback_url),
    'WIF': address.WIF,
    'address': address.address,
    'doctype': 'address',
    '_id': address.address
  }

  let paymentInfo = {
    address: addressData.address,
    message: req.params.message,
    label: req.params.message,
    amount: satoshiToAsk
  }

  let answer = {
    'link': signer.URI(paymentInfo),
    'qr': config.base_url_qr + '/generate_qr/' + encodeURIComponent(signer.URI(paymentInfo)),
    'qr_simple': config.base_url_qr + '/generate_qr/' + addressData.address,
    'address': addressData.address
  };

  (async function () {
    logger.info(req.id, 'checking seller existance...')
    let responseBody = await storage.getSellerPromise(req.params.seller)

    if (typeof responseBody.error !== 'undefined') { // seller doesnt exist
      logger.info(req.id, 'seller doesnt exist. creating...')
      let address = signer.generateNewSegwitAddress()
      let sellerData = {
        'WIF': address.WIF,
        'address': address.address,
        'timestamp': Date.now(),
        'seller': req.params.seller,
        '_id': req.params.seller,
        'doctype': 'seller'
      }
      logger.info(req.id, 'created', req.params.seller, '(', sellerData.address, ')')
      await storage.saveSellerPromise(req.params.seller, sellerData)
      await blockchain.importaddress(sellerData.address)
    } else { // seller exists
      logger.warn(req.id, 'seller already exists')
    }

    logger.info(req.id, 'created address', addressData.address)
    await storage.saveAddressPromise(addressData)
    await blockchain.importaddress(addressData.address)

    res.send(JSON.stringify(answer))
  })().catch((error) => {
    logger.error(req.id, error)
    res.send(JSON.stringify({error: error.message}))
  })
})

router.get('/check_payment/:address', function (req, res) {
  let promises = [
    blockchain.getreceivedbyaddress(req.params.address, config.minimum_confirmation_required),
    storage.getAddressPromise(req.params.address)
  ]

  Promise.all(promises).then((values) => {
    let received = values[0]
    let addressJson = values[1]

    if (addressJson && addressJson.btc_to_ask && addressJson.doctype === 'address') {
      let answer = {
        'btc_expected': addressJson.btc_to_ask,
        'btc_actual': received[1].result,
        'btc_unconfirmed': received[0].result
      }
      res.send(JSON.stringify(answer))
    } else {
      logger.error(req.id, 'storage error', JSON.stringify(addressJson))
      res.send(JSON.stringify({'error': 'storage error'}))
    }
  })
})

router.get('/payout/:seller/:amount/:currency/:address', async function (req, res) {
  if (req.params.currency !== 'BTC') {
    return res.send(JSON.stringify({'error': 'bad currency'}))
  }

  try {
    let btcToPay = req.params.amount
    let seller = await storage.getSellerPromise(req.params.seller)
    if (seller === false || typeof seller.error !== 'undefined') {
      return res.send(JSON.stringify({'error': 'no such seller'}))
    }

    let responses = await blockchain.listunspent(seller.address)
    let amount = 0
    for (const utxo of responses.result) {
      if (utxo.confirmations >= 2) {
        amount += utxo.amount
      }
    }

    if (amount >= btcToPay) { // balance is ok
      let unspentOutputs = await blockchain.listunspent(seller.address)
      logger.info(req.id, 'sending', btcToPay, 'from', req.params.seller, '(', seller.address, ')', 'to', req.params.address)
      let createTx = signer.createTransaction
      if (seller.address[0] === '3') {
        // assume source address is SegWit P2SH
        createTx = signer.createSegwitTransaction
      }
      let tx = createTx(unspentOutputs.result, req.params.address, btcToPay, 0.0001, seller.WIF, seller.address)
      logger.info(req.id, 'broadcasting', tx)
      let broadcastResult = await blockchain.broadcastTransaction(tx)
      logger.info(req.id, 'broadcast result:', JSON.stringify(broadcastResult))
      let data = {
        'seller': req.params.seller,
        'btc': btcToPay,
        'tx': tx,
        'transaction_result': broadcastResult,
        'to_address': req.params.address,
        'processed': 'payout_done',
        'timestamp': Date.now(),
        'doctype': 'payout'
      }
      await storage.savePayoutPromise(data)
      res.send(JSON.stringify(broadcastResult))
    } else {
      logger.warn(req.id, 'not enough balance')
      return res.send({'error': 'not enough balance'})
    }
  } catch (error) {
    logger.error(req.id, error)
    return res.send({'error': error.message})
  }
})

router.get('/get_seller_balance/:seller', function (req, res) {
  (async function () {
    let seller = await storage.getSellerPromise(req.params.seller)
    if (seller === false || typeof seller.error !== 'undefined') {
      logger.warn(req.id, 'no such seller')
      return res.send(JSON.stringify({'error': 'no such seller'}))
    }

    let responses = await blockchain.listunspent(seller.address)
    let answer = 0
    for (const utxo of responses.result) {
      answer += utxo.amount
    }
    res.send(JSON.stringify(answer))
  })().catch((error) => {
    logger.error(req.id, error)
    res.send(JSON.stringify({'error': error.message}))
  })
})

router.get('/get_exchange/:toCurrency', function (req, res) {
  let exchangeRate, satoshiRate
  if (undefined === typeof exchanges[req.params.toCurrency]) return res.send(JSON.stringify({'error': 'bad currency'}))
  else exchangeRate = exchanges[req.params.toCurrency]

  satoshiRate = exchangeRate / 100000000

  let response = {
    'from': 'BTC',
    'to': req.params.toCurrency,
    'rate': exchangeRate,
    'satoshiRate': satoshiRate
  }

  res.send(JSON.stringify(response))
})

router.get('/get_tx_info/:txId', async function (req, res) {
  let transactionResult = await blockchain.getTransactionInfo(req.params.txId)
  logger.info(req.id, 'transaction result:', JSON.stringify(transactionResult))
  let data = {
    'txId': req.params.txId,
    'result': transactionResult
  }
  res.send(JSON.stringify(data))
})

module.exports = router
