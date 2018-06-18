/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

let config = require('../config')
let jayson = require('jayson/promise')
let url = require('url')
let rpc = url.parse(config.bitcoind.rpc)
rpc.timeout = 5000
let client = jayson.client.http(rpc)

function importaddress (address) {
  return client.request('importaddress', [address, address, false])
}

function getreceivedbyaddress (address) {
  let reqs = [
    client.request('getreceivedbyaddress', [address, 0]),
    client.request('getreceivedbyaddress', [address, 3])
  ]

  return Promise.all(reqs)
}

function getblockchaininfo () {
  return client.request('getblockchaininfo', [])
}

function listunspent (address) {
  return client.request('listunspent', [0, 9999999, [address], true])
}

function getTransactionInfo (txid) {
  return client.request('gettransaction', [txid])
}

function broadcastTransaction (tx) {
  return client.request('sendrawtransaction', [tx])
}

exports.importaddress = importaddress
exports.getreceivedbyaddress = getreceivedbyaddress
exports.getblockchaininfo = getblockchaininfo
exports.listunspent = listunspent
exports.broadcastTransaction = broadcastTransaction
