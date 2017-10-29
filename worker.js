/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

/*
  worker iterates through all addresses, marks paid and fires callbacks
*/
let request = require('request')
let async = require('async')
let storage = require('./models/storage')
let blockchain = require('./models/blockchain')
let config = require('./config')

let iteration = function (next) { // тело воркера
  async.waterfall([
    getJob,
    prepareJob,
    processJob,
    saveJobResults
  ], function () {
    if (++iteration.num_times_executed >= 10000) {
      process.exit(0)
    } else {
      next()
    }
  })
}

iteration.num_times_executed = 0

async.forever(
  iteration
)

function getJob (callback) {
  storage.getUnprocessedAdressesYoungerThan(Math.floor(Date.now() / 1000) - config.process_unpaid_for_period, function (json) {
    return callback(null, json)
  })
}

function prepareJob (json, callback) {
  json = JSON.parse(json)
  if (!json || typeof json.rows === 'undefined' || typeof json.rows[0] === 'undefined') { // no jobs, inverting mode
    console.log('no jobs, inverting mode')
    if (mode === 'unprocessed') {
      mode = 'unpaid'
    } else {
      mode = 'unprocessed'
    }
    return callback(null, false)  // пробрасываем чтоб waterfall доходил до логического конца
  }
  if (typeof json.rows[0] === 'undefined') {
    return callback(null, false)
  }  // пробрасываем чтоб waterfall доходил до логического конца

  json = json.rows[0].doc

  // атомарная операция - меняем статус на 'processing'
  // если другой воркер пытается сделать то же самое в это же время -
  // получится только у одного, остальные воркеры задачу пропустят
  storage.takeJob(json, function (error, response) {
    if (!error && (response.statusCode === 201 || response.statusCode === 202)) {
      json._rev = response.body.rev
            // получилось, задача наша, поехали дальше
      return callback(null, json)
    } else {
            // не получилось, пропустим задачу и всю итерацию
      console.log('takeJob error: ', error, response)
      return callback(null, false)
    }
  })
}

function processJob (job, callback) {
  if (job === false) {
    return callback(null, false)
  }  // пробрасываем чтоб waterfall доходил до логического конца

  blockchain.getAddress(job.address, function (resp) {
      // check for actually paid bitcoins here
      // and fire url callback
    console.log('address: ' + job.address + ' expect: ' + job.btc_to_ask + ' confirmed: ' + (resp.btc_actual) + ' unconfirmed: ' + (resp.btc_unconfirmed))

    let paid = false
    if (job.btc_to_ask >= config.small_amount_threshhold) { // thats a lot, so we better check confirmed balance
      if ((resp.btc_actual) / job.btc_to_ask >= 0.95) {
        paid = true
      }
    } else { // not a huge amount, so we can check unconfirmed balace
      if ((resp.btc_unconfirmed) / job.btc_to_ask >= 0.95) {
        paid = true
      }
    }

    if (paid) {
      job.processed = 'paid'
      console.log('firing callback: ' + job.callback_url)
      request({ uri: job.callback_url, timeout: 10 * 1000 }, function (error) {
        if (error) {
          console.log(error)
        }
        return callback(null, job)
      })
    } else if (!paid) {
      if (mode === 'unprocessed') {
        job.processed = 'unpaid'
      }
      if (mode === 'unpaid') {
        job.processed = 'unprocessed'
      }
      return callback(null, job)
    }
  })
}

function saveJobResults (json, callback) {
  if (json === false) {
    return callback(null, false)
  } // пробрасываем чтоб waterfall доходил до логического конца
  storage.saveJobResults(json, function (error, response) {
    if (!error && (response.statusCode === 201 || response.statusCode === 202)) {
      return callback(null)
    } else {
      console.log('saveJobResults error:' + JSON.stringify(response) + ' ' + JSON.stringify(error))
      return callback(null, false)
    }
  })
}
