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

exports.getDocument = function (docid, callback) {
  return exports.getAddress(docid, callback) // since atm it does exactly the same
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

exports.getSeller = function (sellerId, callback) {
  request.get(config.couchdb + '/' + sellerId, function (error, response, body) {
    if (error) {
      return callback(false, error)
    }

    return callback(JSON.parse(body))
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

exports.saveAddress = function (body, callback) {
  request.post(config.couchdb, { json: body }, function (error, response, body) {
    if (error) {
      return callback(false, body)
    }
    return callback(response.body)
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

exports.saveSeller = function (sellerId, callback) {
  let privateKey = new bitcore.PrivateKey()
  let address = new bitcore.Address(privateKey.toPublicKey())
  let data = {
    'WIF': privateKey.toWIF(),
    'address': address.toString(),
    'private_key': privateKey.toString(),
    'public_key': privateKey.toPublicKey().toString(),
    'timestamp': Math.floor(Date.now() / 1000),
    'seller': sellerId,
    '_id': sellerId,
    'doctype': 'seller'
  }

  request.post(config.couchdb, { json: data }, function (error, response, body) {
    if (error) {
      return callback(false, body)
    }
    response.body.address = data.address
    return callback(response.body)
  })
}

exports.saveSellerPromise = function (sellerId) {
  return new Promise(function (resolve, reject) {
    let privateKey = new bitcore.PrivateKey()
    let address = new bitcore.Address(privateKey.toPublicKey())
    let data = {
      'WIF': privateKey.toWIF(),
      'address': address.toString(),
      'private_key': privateKey.toString(),
      'public_key': privateKey.toPublicKey().toString(),
      'timestamp': Math.floor(Date.now() / 1000),
      'seller': sellerId,
      '_id': sellerId,
      'doctype': 'seller'
    }

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

