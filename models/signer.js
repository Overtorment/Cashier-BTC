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
exports.createTransaction = function (utxos, toAddress, amount, fixedFee, WIF, changeAddress) {
  amount = parseInt((amount * 100000000).toFixed(0))
  fixedFee = parseInt((fixedFee * 100000000).toFixed(0))

  let pk = new bitcore.PrivateKey.fromWIF(WIF) // eslint-disable-line new-cap
  let fromAddress = (pk.toPublicKey()).toAddress(bitcore.Networks.livenet)

  changeAddress = changeAddress || fromAddress

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
    .change(changeAddress)
    .sign(pk)

  return transaction.uncheckedSerialize()
}

exports.createSegwitTransaction = function (utxos, toAddress, amount, fixedFee, WIF, changeAddress) {
  changeAddress = changeAddress || exports.WIF2segwitAddress(WIF)

  let feeInSatoshis = parseInt((fixedFee * 100000000).toFixed(0))
  let keyPair = bitcoinjs.ECPair.fromWIF(WIF)
  let pubKey = keyPair.getPublicKeyBuffer()
  let pubKeyHash = bitcoinjs.crypto.hash160(pubKey)
  let redeemScript = bitcoinjs.script.witnessPubKeyHash.output.encode(pubKeyHash)

  let txb = new bitcoinjs.TransactionBuilder()
  let unspentAmount = 0
  for (const unspent of utxos) {
    if (unspent.confirmations < 2) { // using only confirmed outputs
      continue
    }
    txb.addInput(unspent.txid, unspent.vout)
    unspentAmount += parseInt(((unspent.amount) * 100000000).toFixed(0))
  }
  let amountToOutput = parseInt(((amount - fixedFee) * 100000000).toFixed(0))
  txb.addOutput(toAddress, amountToOutput)
  if (amountToOutput + feeInSatoshis < unspentAmount) {
    // sending less than we have, so the rest should go back
    txb.addOutput(changeAddress, unspentAmount - amountToOutput - feeInSatoshis)
  }

  for (let c = 0; c < utxos.length; c++) {
    txb.sign(c, keyPair, redeemScript, null, parseInt((utxos[c].amount * 100000000).toFixed(0)))
  }

  let tx = txb.build()
  return tx.toHex()
}

exports.generateNewSegwitAddress = function () {
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

exports.WIF2segwitAddress = function (WIF) {
  let keyPair = bitcoinjs.ECPair.fromWIF(WIF)
  let pubKey = keyPair.getPublicKeyBuffer()
  let witnessScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(pubKey))
  let scriptPubKey = bitcoinjs.script.scriptHash.output.encode(bitcoinjs.crypto.hash160(witnessScript))
  return bitcoinjs.address.fromOutputScript(scriptPubKey)
}
