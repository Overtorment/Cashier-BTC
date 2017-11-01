/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

/**
 * worker iterates through all paid addresses,
 * and sweeps (forwards funds) to seller final (aggregational) wallet
 *
 */

let storage = require('./models/storage')
let config = require('./config')
let blockchain = require('./models/blockchain')
let signer = require('./models/signer')

;(async () => {
  while (1) {
    console.log('.')
    await getJob().then(processJob).then(() => new Promise((resolve) => setTimeout(resolve, 15000))).catch((err) => console.log(err))
  }
})()

function getJob () {
  return new Promise(function (resolve) {
    storage.getPaidAdressesYoungerThan(Math.floor(Date.now() / 1000) - config.process_paid_for_period, function (json) {
      return resolve(JSON.parse(json))
    })
  })
}

async function processJob (rows) {
  rows = rows || {}
  rows.rows = rows.rows || []

  for (const row of rows.rows) {
    let json = row.doc

    let received = await blockchain.getreceivedbyaddress(json.address)
    console.log('address:', json.address, 'expect:', json.btc_to_ask, 'confirmed:', received[1].result, 'unconfirmed:', received[0].result)

    if (1 || +received[1].result === +received[0].result) { // balance is ok, need to transfer it
      let seller = await storage.getSellerPromise(json.seller)
      console.log('transferring', received[0].result, 'BTC (minus fee) from', json.address, 'to seller\'s address', seller.address)
      let unspentOutputs = await blockchain.listunspent(json.address)

      let tx = signer.createTransaction(unspentOutputs.result, seller.address, received[0].result, 0.0002, json.WIF)
      let broadcastResult = await blockchain.broadcastTransaction(tx)

      json.processed = 'paid_and_sweeped'
      json.sweep_result = json.sweep_result || {}
      json.sweep_result[+new Date()] = {
        'tx': tx,
        'broadcast': broadcastResult
      }

      await storage.saveJobResultsPromise(json)
    } else {
      console.log('balance is not ok, skip')
    }
  }
}
