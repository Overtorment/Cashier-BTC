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

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf } = format

const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

const logger = createLogger({
  level: config.logging_level,
  format: combine(
    timestamp(),
    myFormat
  ), // winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    // or new transports.Console()
    new transports.File({ filename: './logs/error.log', level: 'error' }),
    new transports.File({ filename: './logs/combined.log' })
  ]
})

app.use('/qr', express.static('qr'))
app.use(require('./controllers/api'))
app.use(require('./controllers/website'))

let updateExchangeRate = async function () {
  let json
  try {
    for (let i = 0; i < config.currencies.length; i++) { // foreach currency defined in config.js
      let currency = config.currencies[i]
      if (currency === 'BTC') {
        global.exchanges[currency] = 1
        continue
      }
      json = await rp.get({url: 'https://api.coinbase.com/v2/prices/BTC-' + currency + '/spot', json: true}) // get spot price, excluding coinbase sell/buy fees
      global.exchanges[currency] = json.data.amount
    }
  } catch (err) {
    return logger.error(err.message)
  }
}

updateExchangeRate()
setInterval(() => updateExchangeRate(), config.exchange_update_interval)

require('./smoke-test')
require('./deploy-design-docs') // checking design docs in Couchdb

let server = app.listen(config.port, function () {
  logger.info('Listening on port ' + config.port)
})

module.exports = server
