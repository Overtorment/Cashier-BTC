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
let logger = require('./utils/logger')

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
let rp = require('request-promise')

app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json(null)) // parse application/json

global.btcUsd = 7000 // initial
global.btcEur = 6000

app.use('/qr', express.static('qr'))
app.use(require('./controllers/api'))
app.use(require('./controllers/website'))

let updateExchangeRate = async function (pair) {
  let json
  try {
    json = await rp.get({url: 'https://www.bitstamp.net/api/v2/ticker/' + pair, json: true})
  } catch (err) {
    logger.error('updateExchangeRate', err.message)
  }
  switch (pair) {
    case 'btceur': global.btcEur = json.ask; break
    case 'btcusd': global.btcUsd = json.ask; break
  }
}

updateExchangeRate('btcusd').then(updateExchangeRate('btceur'))
setInterval(() => updateExchangeRate('btcusd').then(updateExchangeRate('btceur')), 5 * 60 * 1000)

require('./smoke-test')
require('./deploy-design-docs') // checking design docs in Couchdb

let server = app.listen(config.port, function () {
  logger.log('BOOTING UP', ['Listening on port %d', config.port])
})

module.exports = server
