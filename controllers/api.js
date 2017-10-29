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

  let addressData = {
    'timestamp': Math.floor(Date.now() / 1000),
    'expect': req.params.expect,
    'currency': req.params.currency,
    'exchange_rate': exchangeRate,
    'btc_to_ask': btcToAsk,
    'message': req.params.message,
    'seller': req.params.seller,
    'customer': req.params.customer,
    'callback_url': decodeURIComponent(req.params.callback_url)
  }

  storage.saveAddress(addressData, function (saveAddressResponse) {
    if (saveAddressResponse.ok === true) {
      console.log(req.id, 'saveAddress()', JSON.stringify(addressData))

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
      }

      storage.getSeller(req.params.seller, function (responseBody) { // checking if seller's data in database
        console.log(req.id, 'checking seller existance...')
        if (typeof responseBody.error !== 'undefined') { // seller doesnt exist
          storage.saveSeller(req.params.seller, function (saveSellerResponse) { // creating seller
            console.log(req.id, 'seller doesnt exist. creating...')
            if (saveSellerResponse.ok === true) { // seller create success
              bitcoind.importaddress(saveSellerResponse.address).then(() => {
                console.log(req.id, 'seller create success')
                bitcoind.importaddress(addressData.address)
                  .then(() => res.send(JSON.stringify(answer)))
                  .catch(() => {
                    console.log(req.id, 'bitcoind.importaddress fail')
                    res.send(JSON.stringify({'error': 'bitcoind.importaddress fail'}))
                  })
              })
            } else { // seller create fail
              console.log(req.id, 'seller create fail')
              res.send(JSON.stringify({'error': 'Could not save seller'}))
            }
          })
        } else { // seller exists
          console.log(req.id, 'seller already exists')
          bitcoind.importaddress(answer.address) // bitcoind must watch this address without rescan
            .then(() => res.send(JSON.stringify(answer)))
            .catch(() => {
              console.log(req.id, 'bitcoind.importaddress fail')
              res.send(JSON.stringify({'error': 'bitcoind.importaddress fail'}))
            })
        }
      })
    } else { // saveAddress() failed
      res.send(saveAddressResponse.error + ': ' + saveAddressResponse.reason)
    }
  })
})

router.get('/check_payment/:address', function (req, res) {
  bitcoind.getreceivedbyaddress(req.params.address).then((responses) => {
    storage.getAddress(req.params.address, function (json) {
      if (json !== false && json.btc_to_ask) {
        let answer = {
          'btc_expected': json.btc_to_ask,
          'btc_actual': responses[1].result,
          'btc_unconfirmed': responses[0].result
        }
        res.send(JSON.stringify(answer))
      } else {
        console.log(req.id, 'storage error', JSON.stringify(json))
        res.send(JSON.stringify(json))
      }
    })
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
  storage.getSeller(req.params.seller, function (seller) { // checking if such seller exists
    if (seller === false || typeof seller.error !== 'undefined') {
      console.log(req.id, 'no such seller')
      return res.send(JSON.stringify({'error': 'no such seller'}))
    }
    bitcoind.getreceivedbyaddress(seller.address).then((responses) => {
      let answer = {
        'btc_actual': responses[1].result,
        'btc_unconfirmed': responses[0].result
      }
      res.send(JSON.stringify(answer))
    }).catch(() => {
      console.log(req.id, 'bitcoind.getreceivedbyaddress fail')
      res.send(JSON.stringify({'error': 'bitcoind.getreceivedbyaddress fail'}))
    })
  })
})

router.get('/get_address_confirmed_balance/:address', function (req, res) {
  bitcoind.getreceivedbyaddress(req.params.address).then((responses) => {
    return res.send(JSON.stringify(responses[1].result))
  })
})

module.exports = router
