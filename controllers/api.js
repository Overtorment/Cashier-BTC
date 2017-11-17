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

/* global btcUsd */
/* global btcEur */

let express = require('express')
let router = express.Router()
let bitcore = require('bitcore-lib')
let config = require('../config')
let blockchain = require('../models/blockchain')
let storage = require('../models/storage')
let signer = require('../models/signer')

router.get('/request_payment/:expect/:currency/:message/:seller/:customer/:callback_url', function (req, res) {
  let exchangeRate, btcToAsk, satoshiToAsk

  switch (req.params.currency) {
    case 'USD': exchangeRate = btcUsd
      break
    case 'EUR': exchangeRate = btcEur
      break
    case 'BTC': exchangeRate = 1
      break
    default:
      return res.send(JSON.stringify({'error': 'bad currency'}))
  }

  satoshiToAsk = Math.floor((req.params.expect / exchangeRate) * 100000000)
  btcToAsk = satoshiToAsk / 100000000

  let privateKey = new bitcore.PrivateKey()
  let address = new bitcore.Address(privateKey.toPublicKey())

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
    'WIF': privateKey.toWIF(),
    'address': address.toString(),
    'private_key': privateKey.toString(),
    'public_key': privateKey.toPublicKey().toString(),
    'doctype': 'address',
    '_id': address.toString()
  }

  let paymentInfo = {
    address: addressData.address,
    message: req.params.message,
    label: req.params.message,
    amount: satoshiToAsk
  }

  let answer = {
    'link': new bitcore.URI(paymentInfo).toString(),
    'qr': config.base_url_qr + '/generate_qr/' + encodeURIComponent(new bitcore.URI(paymentInfo).toString()),
    'qr_simple': config.base_url_qr + '/generate_qr/' + addressData.address,
    'address': addressData.address
  };

  (async function () {
    console.log(req.id, 'checking seller existance...')
    let responseBody = await storage.getSellerPromise(req.params.seller)

    if (typeof responseBody.error !== 'undefined') { // seller doesnt exist
      console.log(req.id, 'seller doesnt exist. creating...')
      let privateKey = new bitcore.PrivateKey()
      let address = new bitcore.Address(privateKey.toPublicKey())
      let sellerData = {
        'WIF': privateKey.toWIF(),
        'address': address.toString(),
        'private_key': privateKey.toString(),
        'public_key': privateKey.toPublicKey().toString(),
        'timestamp': Date.now(),
        'seller': req.params.seller,
        '_id': req.params.seller,
        'doctype': 'seller'
      }
      await storage.saveSellerPromise(req.params.seller, sellerData)
      await blockchain.importaddress(sellerData.address)
    } else { // seller exists
      console.log(req.id, 'seller already exists')
    }

    console.log(req.id, 'saveAddress()', JSON.stringify(addressData))
    await storage.saveAddressPromise(addressData)
    await blockchain.importaddress(addressData.address)

    res.send(JSON.stringify(answer))
  })().catch((error) => {
    console.log(req.id, JSON.stringify(error))
    res.send(JSON.stringify({error: error}))
  })
})

router.get('/check_payment/:address', function (req, res) {
  let promises = [
    blockchain.getreceivedbyaddress(req.params.address),
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
      console.log(req.id, 'storage error', JSON.stringify(addressJson))
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
    let received = await blockchain.getreceivedbyaddress(seller.address)

    if (+received[1].result === +received[0].result && received[0].result >= btcToPay) { // balance is ok
      let unspentOutputs = await blockchain.listunspent(seller.address)
      console.log(req.id, 'sending', btcToPay, 'from', req.params.seller, '(', seller.address, ')', 'to', req.params.address)
      let tx = signer.createTransaction(unspentOutputs.result, req.params.address, btcToPay, 0.0002, seller.WIF)
      console.log(req.id, 'broadcasting', tx)
      let broadcastResult = await blockchain.broadcastTransaction(tx)
      console.log(req.id, 'broadcast result:', JSON.stringify(broadcastResult))
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
      console.log(req.id, 'not enough balance')
      return res.send(JSON.stringify({'error': 'not enough balance'}))
    }
  } catch (error) {
    console.log(req.id, error)
    return res.send(JSON.stringify({'error': error}))
  }
})

router.get('/get_seller_balance/:seller', function (req, res) {
  (async function () {
    let seller = await storage.getSellerPromise(req.params.seller)
    if (seller === false || typeof seller.error !== 'undefined') {
      console.log(req.id, 'no such seller')
      return res.send(JSON.stringify({'error': 'no such seller'}))
    }

    let responses = await blockchain.listunspent(seller.address)
    let answer = 0
    for (const utxo of responses.result) {
      answer += utxo.amount
    }
    res.send(JSON.stringify(answer))
  })().catch((error) => {
    console.log(req.id, JSON.stringify(error))
    res.send(JSON.stringify({'error': error}))
  })
})

module.exports = router
