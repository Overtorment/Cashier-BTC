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
/* global sellers:true */

var express = require('express')
var router = express.Router()
var bitcore = require('bitcore-lib')
var config = require('../config')
var blockchain = require('../models/blockchain')
var storage = require('../models/storage')

router.get('/request_payment/:expect/:currency/:message/:seller/:customer/:callback_url', function (req, res) {
  var exchangeRate, btcToAsk

  switch (req.params.currency) {
    case 'USD': exchangeRate = btcUsd
      break
    case 'EUR': exchangeRate = btcEur
      break
    case 'BTC': exchangeRate = 1
      break
    default:
      return res.send('bad currency')
  }

  btcToAsk = Math.floor((req.params.expect / exchangeRate) * 100000000) / 100000000

  var data = {
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

  storage.saveAddress(data, function (responseBody) {
    if (responseBody.ok === true) {
      console.log(req.id, 'saveAddress()', JSON.stringify(data))

      var paymentInfo = {
        address: data.address,
        message: req.params.message,
        label: req.params.message,
        amount: Math.floor(btcToAsk * 100000000) // satoshis
      }

      var answer = {
        'link': new bitcore.URI(paymentInfo).toString(),
        'qr': config.base_url_qr + '/generate_qr/' + encodeURIComponent(new bitcore.URI(paymentInfo).toString()),
        'qr_simple': config.base_url_qr + '/generate_qr/' + data.address,
        'address': data.address
      }

      if (typeof sellers[req.params.seller] === 'undefined') { // seller is not in local cache
        storage.getSeller(req.params.seller, function (responseBody) { // checking if seller's data in database
          console.log(req.id, 'checking seller existance...')
          if (typeof responseBody.error !== 'undefined') { // seller doesnt exist
            storage.saveSeller(req.params.seller, function (responseBody) { // creating seller
              console.log(req.id, 'seller doesnt exist. creating...')
              if (responseBody.ok === true) { // seller create success
                console.log(req.id, 'seller create success')
                sellers[req.params.seller] = 1
                res.send(JSON.stringify(answer))
              } else { // seller create fail
                console.log(req.id, 'seller create fail')
                res.send(JSON.stringify({'error': 'Could not save seller'}))
              }
            })
          } else { // seller exists, so we just mark local cache that this one exists
            console.log(req.id, 'seller already exists')
            sellers[req.params.seller] = 1
            res.send(JSON.stringify(answer))
          }
        })
      } else { // seller is in local cache, no need to create it
        res.send(JSON.stringify(answer))
      }
    } else { // saveAddress() failed
      res.send(responseBody.error + ': ' + responseBody.reason)
    }
  })
})

router.get('/check_payment/:address', function (req, res) {
  blockchain.getAddress(req.params.address, function (resp) {
    storage.getAddress(req.params.address, function (json) {
      if (json !== false && json.btc_to_ask) {
        var answer = {
          'btc_expected': json.btc_to_ask,
          'btc_actual': resp.btc_actual,
          'btc_unconfirmed': resp.btc_unconfirmed
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
  var exchangeRate
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

  var btcToPay = Math.floor((req.params.amount / exchangeRate) * 100000000) / 100000000

  storage.getSeller(req.params.seller, function (seller) { // checking if such seller exists
    if (seller === false || typeof seller.error !== 'undefined') {
      return res.send(JSON.stringify({'error': 'no such seller'}))
    }

    blockchain.createTransaction(req.params.address, btcToPay - 0.0001 /* fee */, 0.0001, seller.WIF, function (txhex) {
      blockchain.broadcastTransaction(txhex, function (response) {
        if (typeof response.error !== 'undefined') { // error
          console.log(req.id, 'payout error:', response)
          return res.send(response)
        } else { // no error
          console.log(req.id, 'sent ' + btcToPay + ' from ' + req.params.seller + ' (' + seller.address + ')' + ' to ' + req.params.address)
          console.log(req.id, JSON.stringify(response))
          var data = {
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
    blockchain.getAddress(seller.address, function (resp) {
      var answer = {
        'btc_actual': resp.btc_actual,
        'btc_unconfirmed': resp.btc_unconfirmed
      }
      res.send(JSON.stringify(answer))
    })
  })
})

router.get('/get_address_confirmed_balance/:address', function (req, res) {
  blockchain.getAddress(req.params.address, function (resp) {
    return res.send(resp.btc_actual + '')
  })
})

module.exports = router
