/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

let bitcore = require('bitcore-lib')
let bitcoinjs = require('bitcoinjs-lib')

// this function and bitcore-lib are kept for backward compatibility
// TODO: rewrite on bitcoinjs or remove completely
exports.createTransaction = function (utxos, toAddress, amount, fixedFee, WIF) {
  amount = parseInt((amount * 100000000).toFixed(0))
  fixedFee = parseInt((fixedFee * 100000000).toFixed(0))

  let pk = new bitcore.PrivateKey.fromWIF(WIF) // eslint-disable-line new-cap
  let fromAddress = (pk.toPublicKey()).toAddress(bitcore.Networks.livenet)

  let transaction = new bitcore.Transaction()

  for (const utxo of utxos) {
    transaction.from({
      'address': fromAddress,
      'txid': utxo.txid,
      'vout': utxo.vout,
      'scriptPubKey': utxo.scriptPubKey,
      'satoshis': parseInt((utxo.amount * 100000000).toFixed(0))

    })
  }

  transaction
    .to(toAddress, amount - fixedFee)
    .fee(fixedFee)
    .change(fromAddress)
    .sign(pk)

  return transaction.uncheckedSerialize()
}

exports.createSegwitTransaction = function (utxos, toAddress, amount, fixedFee, WIF) {
  let keyPair = bitcoinjs.ECPair.fromWIF(WIF)
  let pubKey = keyPair.getPublicKeyBuffer()
  let pubKeyHash = bitcoinjs.crypto.hash160(pubKey)
  let redeemScript = bitcoinjs.script.witnessPubKeyHash.output.encode(pubKeyHash)

  let txb = new bitcoinjs.TransactionBuilder()

  for (const unspent of utxos) {
    txb.addInput(unspent.txid, unspent.vout)
    txb.addOutput(toAddress, parseInt(((amount - fixedFee) * 100000000).toFixed(0)))
    txb.sign(0, keyPair, redeemScript, null, parseInt(((unspent.amount) * 100000000).toFixed(0)))
  }

  let tx = txb.build()
  return tx.toHex()
}

exports.generateNewAddress = function () {
  let keyPair = bitcoinjs.ECPair.makeRandom()
  let pubKey = keyPair.getPublicKeyBuffer()

  let witnessScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey))
  let scriptPubKey = bitcoinjs.script.scriptHash.output.encode(bitcoinjs.crypto.hash160(witnessScript))
  let address = bitcoinjs.address.fromOutputScript(scriptPubKey)

  return {
    'address': address,
    'WIF': keyPair.toWIF()
  }
}

exports.URI = function (paymentInfo) {
  let uri = 'bitcoin:'
  uri += paymentInfo.address
  uri += '?amount='
  uri += parseFloat((paymentInfo.amount / 100000000))
  uri += '&message='
  uri += encodeURIComponent(paymentInfo.message)
  if (paymentInfo.label) {
    uri += '&label='
    uri += encodeURIComponent(paymentInfo.label)
  }

  return uri
}

exports.WIF2address = function (WIF) {
  let keyPair = bitcoinjs.ECPair.fromWIF(WIF)
  let pubKey = keyPair.getPublicKeyBuffer()
  let witnessScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey))
  let scriptPubKey = bitcoinjs.script.scriptHash.output.encode(bitcoinjs.crypto.hash160(witnessScript))
  return bitcoinjs.address.fromOutputScript(scriptPubKey)
}
