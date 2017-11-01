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
let bitcoind = require('../models/blockchain')
let storage = require('../models/storage')

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
    'timestamp': Math.floor(Date.now() / 1000),
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
        'timestamp': Math.floor(Date.now() / 1000),
        'seller': req.params.seller,
        '_id': req.params.seller,
        'doctype': 'seller'
      }
      let saveSellerResponse = await storage.saveSellerPromise(req.params.seller, sellerData)
      await bitcoind.importaddress(saveSellerResponse.address)
    } else { // seller exists
      console.log(req.id, 'seller already exists')
    }

    console.log(req.id, 'saveAddress()', JSON.stringify(addressData))
    await storage.saveAddressPromise(addressData)
    await bitcoind.importaddress(addressData.address)

    res.send(JSON.stringify(answer))
  })().catch((error) => {
    console.log(req.id, JSON.stringify(error))
    res.send(JSON.stringify({error: error}))
  })
})

router.get('/check_payment/:address', function (req, res) {
  let promises = [
    bitcoind.getreceivedbyaddress(req.params.address),
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

router.get('/payout/:seller/:amount/:currency/:address', function (req, res) {
  if (req.params.currency !== 'BTC') {
    return res.send(JSON.stringify({'error': 'bad currency'}))
  }

  let satoshiToPay = Math.floor((req.params.amount / 1) * 100000000)
  let btcToPay = satoshiToPay / 100000000

  storage.getSeller(req.params.seller, function (seller) { // checking if such seller exists
    if (seller === false || typeof seller.error !== 'undefined') {
      return res.send(JSON.stringify({'error': 'no such seller'}))
    }

    bitcoind.createTransaction(req.params.address, btcToPay - 0.0001 /* fee */, 0.0001, seller.WIF, function (txhex) {
      bitcoind.broadcastTransaction(txhex, function (response) {
        if (typeof response.error !== 'undefined') { // error
          console.log(req.id, 'payout error:', response)
          return res.send(response)
        } else { // no error
          console.log(req.id, 'sent ' + btcToPay + ' from ' + req.params.seller + ' (' + seller.address + ')' + ' to ' + req.params.address)
          console.log(req.id, JSON.stringify(response))
          let data = {
            'seller': req.params.seller,
            'btc': btcToPay,
            'transaction_result': response,
            'to_address': req.params.address
          }
          return storage.savePayout(data, function () { res.send(response) })
        }
      })
    })
  })
})

router.get('/get_seller_balance/:seller', function (req, res) {
  (async function () {
    let seller = await storage.getSellerPromise(req.params.seller)
    if (seller === false || typeof seller.error !== 'undefined') {
      console.log(req.id, 'no such seller')
      return res.send(JSON.stringify({'error': 'no such seller'}))
    }

    let responses = await bitcoind.getreceivedbyaddress(seller.address)
    let answer = {
      'btc_actual': responses[1].result,
      'btc_unconfirmed': responses[0].result
    }
    res.send(JSON.stringify(answer))
  })().catch((error) => {
    console.log(req.id, JSON.stringify(error))
    res.send(JSON.stringify({'error': error}))
  })
})

module.exports = router
