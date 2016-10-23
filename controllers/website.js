/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

/* global btc_usd */

var express = require('express'),
  router = express.Router(),
  qr = require('qr-image'),
  crypto = require('crypto'),
  fs = require('fs')

router.get('/generate_qr/:text', function (req, res) {
  var filename, qr_svg
  filename = 'qr/' + crypto.createHash('sha1').update(decodeURIComponent(req.params.text)).digest('hex') + '.png'
  qr_svg = qr.image(decodeURIComponent(req.params.text), { type: 'png' })
  qr_svg.pipe(fs.createWriteStream(filename))
  qr_svg.on('end', function () {
    res.redirect(301, '/' + filename)
    res.end()
  })
  qr_svg.on('error', function () {
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
