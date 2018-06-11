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
let rp = require('request-promise')

app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json(null)) // parse application/json

global.exchanges = {}

app.use('/qr', express.static('qr'))
app.use(require('./controllers/api'))
app.use(require('./controllers/website'))

let updateExchangeRate = async function () {
  let json
  try {
    for (let i = 0; i < config.currencies.length; i++) { // foreach currency defined in config.js
      let currency = config.currencies[i]
      json = await rp.get({url: 'https://api.coinbase.com/v2/prices/BTC-' + currency + '/spot', json: true}) // get spot price, excluding coinbase sell/buy fees
      global.exchanges[currency] = json.data.amount
    }
  } catch (err) {
    return console.log(err.message)
  }
}

updateExchangeRate()
setInterval(() => updateExchangeRate(), config.exchange_update_interval)

require('./smoke-test')
require('./deploy-design-docs') // checking design docs in Couchdb

let server = app.listen(config.port, function () {
  console.log('Listening on port %d', config.port)
})

module.exports = server
