/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

let request = require('request')
let bitcore = require('bitcore-lib')
let config = require('../config')
let rp = require('request-promise')

exports.getDocumentPromise = function (docid) {
  return exports.getAddressPromise(docid) // since atm it does exactly the same
}

exports.saveDocument = function (body, callback) {
  request.post(config.couchdb, { json: body }, function (error, response, body) {
    if (error) {
      return callback(false, body)
    }
    return callback(response.body)
  })
}

exports.getAddress = function (address, callback) {
  request.get(config.couchdb + '/' + address, function (error, response, body) {
    if (error) {
      return callback(false, error)
    }

    callback(JSON.parse(body))
  })
}

exports.getAddressPromise = function (address) {
  return new Promise(function (resolve, reject) {
    request.get(config.couchdb + '/' + address, function (error, response, body) {
      if (error) {
        return reject(error)
      }

      resolve(JSON.parse(body))
    })
  })
}

exports.getSellerPromise = function (sellerId) {
  return new Promise(function (resolve, reject) {
    request.get(config.couchdb + '/' + sellerId, function (error, response, body) {
      if (error) {
        return reject(error)
      }

      return resolve(JSON.parse(body))
    })
  })
}

exports.saveAddressPromise = function (body) {
  return new Promise(function (resolve, reject) {
    request.post(config.couchdb, { json: body }, function (error, response, body) {
      if (error) {
        return reject(body)
      }
      return resolve(response.body)
    })
  })
}

exports.savePayout = function (body, callback) {
  body.processed = 'payout_done'
  body.timestamp = Math.floor(Date.now() / 1000)
  body.doctype = 'payout'
  request.post(config.couchdb, { json: body }, function (error, response, body) {
    if (callback) {
      if (error) {
        return callback(false, body)
      } else {
        return callback(response.body)
      }
    } else {
      return false
    }
  })
}

exports.saveSellerPromise = function (sellerId, data) {
  return new Promise(function (resolve, reject) {
    request.post(config.couchdb, { json: data }, function (error, response, body) {
      if (error) {
        return reject(body)
      }
      response.body.address = data.address
      return resolve(response.body)
    })
  })
}

exports.getUnprocessedAdressesYoungerThan = function (timestamp, callback) {
  request.get(config.couchdb + '/_design/address/_view/unprocessed_by_timestamp?startkey=' + timestamp + '&inclusive_end=true&limit=10000&reduce=false&include_docs=true', function (error, response, body) {
    if (error) {
      return callback(false, error)
    }
    return callback(body)
  })
}

exports.getPaidAdressesYoungerThan = function (timestamp, callback) {
  request.get(config.couchdb + '/_design/address/_view/paid_by_timestamp?startkey=' + timestamp + '&inclusive_end=true&limit=1&reduce=false&include_docs=true', function (error, response, body) {
    if (error) {
      return callback(false, error)
    }
    return callback(body)
  })
}

exports.saveJobResultsPromise = function (json) {
  return rp.put(config.couchdb + '/' + json._id, { 'json': json })
}

