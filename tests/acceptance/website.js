/* global describe, it, beforeEach, afterEach */

let reRequire = function (module) {
  delete require.cache[require.resolve(module)]
  return require(module)
}
let request = reRequire('supertest')
let should = reRequire('chai').should() // actually call the function
let path = require('path')

describe('acceptance - loading express', function () {
  this.timeout(5000)
  let server

  beforeEach(function () {
    server = reRequire('../../cashier-btc')
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

  it('responds to /generate_qr/ and qr image is actually generated', function (done) {
    reRequire('fs').accessSync(path.join(__dirname, '/../../qr'), reRequire('fs').W_OK, function (err) {
      should.not.exist(err)
    })

    let filename = +new Date()
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

  it('404 everything else', function (done) {
    request(server)
            .get('/foo/bar')
            .expect(404, done)
  })

  it('404 everything else', function (done) {
    request(server)
            .get('/foobar')
            .expect(404, done)
  })
})
