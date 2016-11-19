/* global describe, it */

var rewire = require('rewire')
var expect = require('chai').expect
var should = require('chai').should() // eslint-disable-line no-unused-vars

describe('unit - blockchain', function () {
  describe('createTransaction()', function () {
    it('should return valid TX hex', function (done) {
      var blockchain = rewire('./../../models/blockchain')
      blockchain.__set__('provider', { fetchTransactionsByAddress: require('../../tests/stubs').fetchTransactionsByAddress })
      var callback = function (tx) {
        tx.uncheckedSerialize().should.equal('01000000018ed13b4ab32a86768ea305d1e214b7b747bb9f82a7b65bcf5dabbc379413bb22000000006b4830450221008f53a81d9500b6f0a3c48b0383f64c79e872c2da89b2222658acb9004b52cfcf022029f374d813e159f4b7aa6483942ba55cedecf3071f82296867b7f742b72af0920121036f628cc7cb465379fe054b5854f6b88b56aa389b8e8f665d8eb2176a777dfd2cffffffff02e8030000000000001976a91462e907b15cbf27d5425399ebf6f0fb50ebb88f1888acb8161300000000001976a9145c08b6e48a3baeff48874f658c077e90c1bad97f88ac00000000')
        done()
      }
      blockchain.createTransaction('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' /* satoshi's address from block#0 */, 0.00001 /* amount */, 0 /* no fee */, 'KzK4GURRJAhzJud6i1widpzkWHTbZq2yV66FHFvqBCzPDaVMAjqD' /* used WIF */, callback)
    })

    it('should correctly consider all used inputs', function (done) {
      var blockchain = rewire('./../../models/blockchain')
      blockchain.__set__('provider', { fetchTransactionsByAddress: require('../../tests/stubs').fetchTransactionsByAddress2 })
      var callback = function (transaction) {
        expect(transaction.toObject().outputs.length).to.equal(2)
        expect(transaction.toObject().outputs[0].satoshis).to.equal(1000)
        expect(transaction.toObject().outputs[1].satoshis).to.equal(4666)
        done()
      }
      blockchain.createTransaction('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' /* satoshi's address from block#0 */, 0.00001 /* amount */, 0.00001 /* fee */, 'KzK4GURRJAhzJud6i1widpzkWHTbZq2yV66FHFvqBCzPDaVMAjqD' /* used WIF */, callback)
    })
  })
})
