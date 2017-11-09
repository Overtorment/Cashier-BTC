/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

/**
 * simple smoke tests check accessibility of
 * database and RPC
 *
 */

let bitcoind = require('./models/blockchain')
let rp = require('request-promise')
let config = require('./config')
let assert = require('assert')

;(async () => {
  try {
    let info = await bitcoind.getblockchaininfo()
    assert(info.result.chain)
  } catch (err) {
    console.log('Bitcoin Core RPC problem: ', err)
    process.exit(1)
  }

  try {
    let couchdb = await rp.get({url: config.couchdb, json: true})
    assert(couchdb.db_name)
  } catch (err) {
    console.log('couchdb problem: ', err)
    process.exit(1)
  }
})()
