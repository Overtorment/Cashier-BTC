/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

var config = require('../../config')
var http = require('http')
var async = require('async')
var querystring = require('querystring')
var _ = require('lodash')

function getAddress (address, callback) {
  http.get('http://' + config.bitcore.host + ':' + config.bitcore.port + config.bitcore.base_path + '/addr/' + address + '?noTxList=1', function (res) {
    res.setEncoding('utf8')
    res.on('data', function (chunk) {
      try {
        var resp = JSON.parse(chunk)
      } catch (e) {
        return callback(false)
      }
      var ret = {}
      ret.btc_actual = resp.balance
      ret.btc_unconfirmed = resp.balance + resp.unconfirmedBalance
      callback(ret)
    })
  })
}

function fetchTransactionsByAddress (address, callback) {
  http.get('http://' + config.bitcore.host + ':' + config.bitcore.port + config.bitcore.base_path + '/txs/?address=' + address, function (ret) {
    var json = ''
    ret.on('data', function (d) { json += d })
    ret.on('end', function () {
      json = JSON.parse(json)

      if (json.pagesTotal > 1) {
        var allTx = []
        var jobs = []
        var jobsC = []
        for (var c = 0; c < json.pagesTotal; c++) {
          jobsC.push(c)
          jobs.push(function (callback) {
            var cc = jobsC.pop()
            http.get('http://' + config.bitcore.host + ':' + config.bitcore.port + config.bitcore.base_path + '/txs/?address=' + address + '&pageNum=' + cc, function (ret2) {
              var json2 = ''
              ret2.on('data', function (d2) { json2 += d2 })
              ret2.on('end', function () {
                json2 = JSON.parse(json2)
                callback(null, json2)
              })
            })
          })
        }

        async.parallel(jobs, function (err, results) {
          if (err) {
            return callback(false, new Error('bitcore: could not fetch transactions'))
          }

          for (var i = 0; i < results.length; i++) {
            allTx = allTx.concat(results[i].txs)
          }
          return callback(transformTxs(allTx))
        })
      } else {
        return callback(transformTxs(json.txs))
      } // if
    })
  })
}

function transformTxs (txs) { // transforming in format expected by others
  for (var i = 0, l = txs.length; i < l; i++) {
    txs[i].hash = txs[i].txid
    for (var ii = 0, ll = txs[i].vout.length; ii < ll; ii++) {
      if (typeof txs[i].vout[ii].scriptPubKey.addresses !== 'undefined') { // genesis?
        txs[i].vout[ii].addr = txs[i].vout[ii].scriptPubKey.addresses[0]
      }
      txs[i].vout[ii].value = parseInt(txs[i].vout[ii].value * 100000000) // btc to satoshis
      if (txs[i].vout[ii].spentTxId) txs[i].vout[ii].spent_by = txs[i].vout[ii].spentTxId
      txs[i].vout[ii].n = ii
      txs[i].vout[ii].script = txs[i].vout[ii].scriptPubKey.hex
    }
    txs[i].out = txs[i].vout
  }
  return txs
}

function broadcastTransaction (txhex, callback) {
  if (typeof txhex === 'object') txhex = txhex.uncheckedSerialize()

  var postData = querystring.stringify({
    'rawtx': txhex
  })

  var options = {
    host: config.bitcore.host,
    port: config.bitcore.port,
    path: config.bitcore.base_path + '/tx/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  var req = http.request(options, function (res) {
    res.setEncoding('utf8')
    res.on('data', function (chunk) {
      if (chunk.indexOf('dust') !== -1) {
        return callback({error: 'dust transaction'})
      }
      chunk = _.attempt(JSON.parse.bind(null, chunk))
      if (_.isError(chunk)) {
        return callback({error: chunk.message})
      }
      callback(chunk)
    })
  })

  req.write(postData)
  req.end()
}

exports.fetch_transactions_by_address = fetchTransactionsByAddress
exports.get_address = getAddress
exports.broadcast_transaction = broadcastTransaction
