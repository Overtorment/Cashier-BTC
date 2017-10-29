/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * https://github.com/Overtorment/Cashier-BTC
 *
 **/

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
let express = require('express')
let morgan = require('morgan')
let uuid = require('node-uuid')

morgan.token('id', function getId (req) {
  return req.id
})

let app = express()

app.use(function (req, res, next) {
  req.id = uuid.v4()
  next()
})
app.use(morgan(':id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))

app.set('trust proxy', 'loopback')

let bodyParser = require('body-parser')
let config = require('./config')
let fs = require('fs')
let https = require('https')

app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json(null)) // parse application/json

global.btcUsd = 6000 // initial
global.btcEur = 5000

app.use('/qr', express.static('qr'))
app.use(require('./controllers/api'))
app.use(require('./controllers/website'))

let updateExchangeRate = function (pair) {
  https.get('https://www.bitstamp.net/api/v2/ticker/' + pair, function (ret) {
    let json = ''
    ret.on('data', function (d) { json += d })
    ret.on('end', function () {
      json = JSON.parse(json)
      let rate
      if (json.ask) {
        rate = json.ask
      } else {
        console.log(json)
      }
      switch (pair) {
        case 'btceur': global.btcEur = rate; break
        case 'btcusd': global.btcUsd = rate; break
      }
    })
  })
}

updateExchangeRate('btcusd')
updateExchangeRate('btceur')
setInterval(function () { updateExchangeRate('btcusd') }, 5 * 60 * 1000)
setInterval(function () { updateExchangeRate('btceur') }, 5 * 60 * 1000)

require('./deploy-design-docs') // checking design docs in Couchdb

let server = app.listen(config.port, function () {
  console.log('Listening on port %d', config.port)
})

module.exports = server
