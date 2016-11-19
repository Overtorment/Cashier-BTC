/* global describe, it, beforeEach, afterEach */

var reRequire = function (module) {
  delete require.cache[require.resolve(module)]
  return require(module)
}
var request = reRequire('supertest')
var should = reRequire('chai').should() // actually call the function
var expect = reRequire('chai').expect
var path = require('path')

describe('acceptance - loading express', function () {
  this.timeout(60000)

  var createdPayment = false
  var server

  beforeEach(function () {
    server = reRequire('../../cashier-btc', { bustCache: true })
  })

  afterEach(function (done) {
    server.close(done)
  })

  it('responds to /', function (done) {
    request(server)
            .get('/')
            .expect('Cashier-BTC reporting for duty')
            .expect(200, done)
  })

  it('responds to /request_payment/:expect/:currency/:message/:seller/:customer/:callback_url', function (done) {
    request(server)
            .get('/request_payment/0.666/BTC/testmessage/testseller/testcustomer/http%3A%2F%2Ffuckoff.com%2F')
            .expect(function (res) {
              var json = JSON.parse(res.text)
              createdPayment = json
              should.exist(json)
              json.should.be.an('object')
              should.exist(json.address)
              should.exist(json.link)
              should.exist(json.qr)
              should.exist(json.qr_simple)
            })
            .expect(200, done)
  })

  it('responds to /generate_qr/ and qr image is actually generated', function (done) {
    reRequire('fs').accessSync(path.join(__dirname, '/../../qr'), reRequire('fs').W_OK, function (err) {
      should.not.exist(err)
    })

    var filename = +new Date()
    request(server)
            .get('/generate_qr/' + filename)
            .expect(function (res) {
              should.exist(res.headers.location)
              reRequire('fs').accessSync(path.join(__dirname, '/../..'), reRequire('fs').W_OK, function (err) {
                should.not.exist(err)
              })
            })
            .expect(301, done)
  })

  it('responds to /check_payment/:address', function (done) {
    request(server)
            .get('/check_payment/' + createdPayment.address)
            .expect(function (res) {
              var json = JSON.parse(res.text)
              if (!json) throw new Error('bad json')
              should.exist(json)
              json.should.be.an('object')
              should.exist(json.btc_expected)
              should.exist(json.btc_actual)
              should.exist(json.btc_unconfirmed)
              json.btc_expected.should.equal(0.666)
              json.btc_actual.should.equal(0)
              json.btc_unconfirmed.should.equal(0)
            })
            .expect(200, done)
  })

  it('responds to /payout/:seller/:amount/:currency/:address', function testSlash (done) {
    request(server)
        .get('/payout/testseller/0.66/BTC/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa') // satoshi's address from block#0
        .expect(function (res) {
          var json = JSON.parse(res.text)
          should.exist(json.error) // not enough balance
          expect(json.error.length > 0)
        })
        .expect(200, done)
  })

  it('responds to /get_seller_balance/testseller', function (done) {
    request(server)
            .get('/get_seller_balance/testseller')
            .expect(function (res) {
              var json = JSON.parse(res.text)
              should.exist(json)
              json.should.be.an('object')
              should.exist(json.btc_actual)
              should.exist(json.btc_unconfirmed)
              json.btc_actual.should.equal(0)
              json.btc_unconfirmed.should.equal(0)
            })
            .expect(200, done)
  })

  it('responds to /get_address_confirmed_balance/:address', function (done) {
    request(server)
            .get('/get_address_confirmed_balance/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
            .expect(function (res) {
              expect(res.text > 16).to.equal(true)
            })
            .expect(200, done)
  })

  it('404 everything else', function (done) {
    request(server)
            .get('/foo/bar')
            .expect(404, done)
  })
})
