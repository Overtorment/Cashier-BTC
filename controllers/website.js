/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

var express = require('express')
var router = express.Router()
var qr = require('qr-image')
var crypto = require('crypto')
var fs = require('fs')

router.get('/generate_qr/:text', function (req, res) {
  var filename
  var qrSvg
  filename = 'qr/' + crypto.createHash('sha1').update(decodeURIComponent(req.params.text)).digest('hex') + '.png'
  qrSvg = qr.image(decodeURIComponent(req.params.text), { type: 'png' })
  qrSvg.pipe(fs.createWriteStream(filename))
  qrSvg.on('end', function () {
    res.redirect(301, '/' + filename)
    res.end()
  })
  qrSvg.on('error', function () {
    res.send('QR file error')
    res.end()
  })
})

router.get('/', function (req, res) {
  return res.status(200).send('Cashier-BTC reporting for duty')
})

router.use(function (req, res) {
  res.status(404).send('404')
})

module.exports = router
