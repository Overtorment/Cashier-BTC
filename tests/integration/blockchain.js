/* global describe, it */

let assert = require('assert')

describe('integration - storage', function () {
  describe('getblockchaininfo RPC call', function () {
    it('should return info', function (done) {
      let blockchain = require('./../../models/blockchain')
      blockchain.getblockchaininfo().then((info) => {
        assert.ok(info.result.chain === 'main')
        assert.ok(info.result.blocks > 0)
        done()
      })
    })
  })
})
