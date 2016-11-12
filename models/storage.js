/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

var request = require('request')
var bitcore = require('bitcore-lib')
var config = require('../config')

exports.get_document = function (docid, callback) {
  return exports.get_address(docid, callback) // since atm it does exactly the same
}

exports.save_document = function (body, callback) {
  request.post(config.couchdb, { json: body }, function (error, response, body) {
    if (error) {
      return callback(false, body)
    }
    return callback(response.body)
  })
}

exports.get_address = function (address, callback) {
  request.get(config.couchdb + '/' + address, function (error, response, body) {
    if (error) {
      return callback(false, error)
    }

    callback(JSON.parse(body))
  })
}

exports.get_seller = function (sellerId, callback) {
  request.get(config.couchdb + '/' + sellerId, function (error, response, body) {
    if (error) {
      return callback(false, error)
    }

    return callback(JSON.parse(body))
  })
}

exports.save_address = function (body, callback) {
  var privateKey = new bitcore.PrivateKey()
  var address = new bitcore.Address(privateKey.toPublicKey())
  body.WIF = privateKey.toWIF()
  body.address = address.toString()
  body.private_key = privateKey.toString()
  body.public_key = privateKey.toPublicKey().toString()
  body.timestamp = Math.floor(Date.now() / 1000)
  body.doctype = 'address'
  body._id = body.address
  request.post(config.couchdb, { json: body }, function (error, response, body) {
    if (error) {
      return callback(false, body)
    }
    return callback(response.body)
  })
}

exports.save_payout = function (body, callback) {
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

exports.save_seller = function (sellerId, callback) {
  var privateKey = new bitcore.PrivateKey()
  var address = new bitcore.Address(privateKey.toPublicKey())
  var data = {
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
    return callback(response.body)
  })
}

exports.get_unprocessed_adresses_younger_than = function (timestamp, callback) {
  // запрашиваем view кауча, по которому получаем необработанные задания
  request.get(config.couchdb + '/_design/address/_view/unprocessed_by_timestamp?startkey=' + timestamp + '&inclusive_end=true&limit=1&reduce=false&include_docs=true', function (error, response, body) {
    if (error) {
      return callback(false, error)
    }
    return callback(body)
  })
}

exports.get_unpaid_adresses_younger_than = function (timestamp, callback) {
  // запрашиваем view кауча, по которому получаем необработанные задания
  request.get(config.couchdb + '/_design/address/_view/unpaid_by_timestamp?startkey=' + timestamp + '&inclusive_end=true&limit=1&reduce=false&include_docs=true', function (error, response, body) {
    if (error) {
      return callback(false, error)
    }
    return callback(body)
  })
}

exports.get_paid_adresses_younger_than = function (timestamp, callback) {
  // запрашиваем view кауча, по которому получаем необработанные задания
  request.get(config.couchdb + '/_design/address/_view/paid_by_timestamp?startkey=' + timestamp + '&inclusive_end=true&limit=1&reduce=false&include_docs=true', function (error, response, body) {
    if (error) {
      return callback(false, error)
    }
    return callback(body)
  })
}

exports.take_job = function (json, callback) {
  // помечаем и сохраняем обратно в БД
  json.processed = 'processing'
  request.put(config.couchdb + '/' + json._id,
    { 'json': json },
        callback
  )
}

exports.save_job_results = function (json, callback) {
  request.put(config.couchdb + '/' + json._id,
    { 'json': json },
      callback
  )
}

