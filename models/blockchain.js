/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

var bitcore = require('bitcore-lib')

var provider = require('../models/provider/bitcore')

exports.createTransaction = function (toAddress, btcAmount, minerFee, WIF, callback) {
  if (minerFee === false) minerFee = 0.0001
  var pk = new bitcore.PrivateKey.fromWIF(WIF) // eslint-disable-line new-cap
  var fromAddress = (pk.toPublicKey()).toAddress(bitcore.Networks.livenet)
  var totalSatoshis = 0

  var transaction = new bitcore.Transaction()

  provider.fetchTransactionsByAddress(fromAddress, function (txs) {
    for (var i = 0, l = txs.length; i < l; i++) { // iterating all transactions on that address
      var out = false

      for (var ii = 0, ll = txs[i].out.length; ii < ll; ii++) { // iterating all outs on transaction to find then one we own (fromAddress)
        if (txs[i].out[ii].addr === fromAddress.toString() && typeof txs[i].out[ii].spent_by === 'undefined') {
          out = txs[i].out[ii]
        }
      } // end for

      if (!out) continue

      transaction.from({ 'address': fromAddress,
        'txid': txs[i].hash,
        'vout': out.n,
        'scriptPubKey': out.script,
        'satoshis': out.value
      })

      totalSatoshis += out.value

      if (totalSatoshis >= (parseInt(btcAmount * 100000000) + parseInt(minerFee * 100000000))) break // we have enough outs
    } // end for

    transaction
                .to(toAddress, parseInt(btcAmount * 100000000))
                .fee(parseInt(minerFee * 100000000))
                .change(fromAddress)
                .sign(pk)

    callback(transaction)
  }) // end fetch transactions
}//  end createTransaction

exports.getAddress = provider.getAddress
exports.fetchTransactionsByAddress = provider.fetchTransactionsByAddress
exports.broadcastTransaction = provider.broadcastTransaction
