/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

let bitcore = require('bitcore-lib')

function createTransaction (utxos, toAddress, amount, fixedFee, WIF) {
  amount = parseInt(amount * 100000000)
  fixedFee = parseInt(fixedFee * 100000000)

  let pk = new bitcore.PrivateKey.fromWIF(WIF) // eslint-disable-line new-cap
  let fromAddress = (pk.toPublicKey()).toAddress(bitcore.Networks.livenet)

  let transaction = new bitcore.Transaction()

  for (const utxo of utxos) {
    transaction.from({
      'address': fromAddress,
      'txid': utxo.txid,
      'vout': utxo.vout,
      'scriptPubKey': utxo.scriptPubKey,
      'satoshis': utxo.amount * 100000000
    })
  }

  transaction
    .to(toAddress, amount - fixedFee)
    .fee(fixedFee)
    .change(fromAddress)
    .sign(pk)

  return transaction.uncheckedSerialize()
}

/*
function generateNewAddress () {
  // TODO

  return {
    'address': 1,
    'WIF': 2,
    'private_key': 3,
    'public_key': 4
  }
}

function URI () {
  // TODO
}

function WIF2address () {
  // TODO
} */

exports.createTransaction = createTransaction
