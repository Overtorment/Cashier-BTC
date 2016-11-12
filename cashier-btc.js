/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
var express = require('express')
var morgan = require('morgan')
var uuid = require('node-uuid')

morgan.token('id', function getId (req) {
  return req.id
})

var app = express()

app.use(function (req, res, next) {
  req.id = uuid.v4()
  next()
})
app.use(morgan(':id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))

app.set('trust proxy', 'loopback')

var bodyParser = require('body-parser')
var config = require('./config')
var fs = require('fs')
var storage = require('./models/storage')
var https = require('https')

app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json(null)) // parse application/json

global.btcUsd = 650 // initial
global.btcEur = 700
global.sellers = {} // cache of existing sellers' wallets

app.use('/qr', express.static('qr'))

app.use(require('./controllers/api'))
app.use(require('./controllers/website'))

var updateExchangeRate = function (pair) {
  https.get('https://btc-e.com/api/3/ticker/' + pair, function (ret) {
    var json = ''
    ret.on('data', function (d) { json += d })
    ret.on('end', function () {
      json = JSON.parse(json)
      var rate
      if (json[pair].buy) {
        rate = json[pair].buy
      } else {
        console.log(json)
      }
      switch (pair) {
        case 'btc_eur': global.btcEur = rate; break
        case 'btc_usd': global.btcUsd = rate; break
      }
    })
  })
}

updateExchangeRate('btc_usd')
updateExchangeRate('btc_eur')
setInterval(function () { updateExchangeRate('btc_usd') }, 60 * 1000)
setInterval(function () { updateExchangeRate('btc_eur') }, 60 * 1000)

// checking design docs in Couchdb
fs.readdir('./_design_docs', function (err, designDocs) {
  if (err) {
    console.log('Cant read design documents list')
    process.exit()
  }

  var readFileCallback = function (err, data) {
    var json = JSON.parse(data)
    if (err) {
      return console.log(err)
    }
    storage.get_document(json._id, function (doc) {
      if (!doc || doc.error === 'not_found') {
        console.log(json._id + ' design doc needs to be created')
        storage.save_document(json, function (response, err) {
          console.log('Creating design document resulted in:', JSON.stringify(response || err))
        })
      }
    })
  }

  for (var i = 0; i < designDocs.length; i++) {
    fs.readFile('./_design_docs' + '/' + designDocs[i], 'utf8', readFileCallback)
  }
}) // done with design docs

// street magic
process.on('uncaughtException', function (err) {
  console.log('Exception: ', err)
  console.log('\nStacktrace:')
  console.log('====================')
  console.log(err.stack)
})

var server = app.listen(config.port, function () {
  console.log('Listening on port %d', config.port)
})

module.exports = server
