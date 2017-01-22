/* global describe, it */

var assert = require('assert')
var expect = require('chai').expect
var should = require('chai').should() // actually call the function

describe('integration - blockchain', function () {
  this.timeout(60000)

  describe('broadcastTransaction()', function () {
    it('should broadcast TX', function (done) {
      var blockchain = require('./../../models/blockchain')
      var callback = function (response) {
        should.exist(response.error) // because it is a bad tx
        done()
      }
      blockchain.broadcastTransaction('0100000001e92c6788cd82f67ff2397e54e32c85820820a43bbe46884e340163ef3e6a7972000000006b483045022100bd0e50bc342d2473efa8f497afa3ab44485ad467f1d1ec90591a946a5a84a2fa02207aeeabc8bf2237efe250ab61257482d18458d15f999a0499737c47c4bfe21262012103feec0ddfb34f3ce433c5f35ce83424681530d92f2dfbc075f17ce7ccec799affffffffff02e8030000000000001976a914f7c6c1f9f6142107ed293c8fbf85fbc49eb5f1b988acb8820100000000001976a91493e7ac0f387105913d95ac49f9a904014e472e4188ac00000000', callback)
    })
  })

  describe('fetchTransactionsByAddress()', function () {
    it('should return TXs by address ', function (done) {
      var blockchain = require('./../../models/blockchain')
      var callback = function (txs, error) {
        var ind = txs.length - 1
        should.exist(txs[ind])
        should.exist(txs[ind].hash)
        txs[ind].hash.should.equal('72796a3eef6301344e8846be3ba4200882852ce3547e39f27ff682cd88672ce9')
        should.exist(txs[ind].out)
        should.exist(txs[ind].out[0])
        should.exist(txs[ind].out[0].addr)
        txs[ind].out[0].addr.should.equal('1EV3s4SRFWJhyQG13nX9vvS2KjBwomJbYx')
        should.exist(txs[ind].out[0].script)
        txs[ind].out[0].script.should.equal('76a91493e7ac0f387105913d95ac49f9a904014e472e4188ac')
        should.exist(txs[ind].out[0].n)
        txs[ind].out[0].n.should.equal(0)
        txs[ind].out[0].value.should.equal(100000)
        should.exist(txs[ind].out[0].spent_by)
        txs[ind].out[0].spent_by.should.equal('3e073bbc9b8d35001ee3f2b290651e10648291076c323ef77faa9d8011a809a5')
        done()
      }
      blockchain.fetchTransactionsByAddress('1EV3s4SRFWJhyQG13nX9vvS2KjBwomJbYx', callback)
    })

    it('should return all TXs', function (done) {
      var blockchain = require('./../../models/blockchain')
      var callback = function (txs, error) {
        assert.ok(!error, error)
        expect(txs.length).to.be.above(100)
        done()
      }
      blockchain.fetchTransactionsByAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', callback)
    })
  })

  describe('getAddress()', function () {
    it('should return balances associated with this address ', function (done) {
      var blockchain = require('./../../models/blockchain')
      var callback = function (json) {
        should.exist(json)
        should.exist(json.btc_actual)
        should.exist(json.btc_unconfirmed)
        assert.ok(json.btc_actual > 1)
        done()
      }
      blockchain.getAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', callback)
    })
  })
})

