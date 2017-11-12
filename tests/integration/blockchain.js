/* global describe, it */

let assert = require('assert')

describe('integration - blockchain', function () {
  this.timeout(6000)

  describe('getblockchaininfo() RPC call', function () {
    it('should return info', async function () {
      let blockchain = require('./../../models/blockchain')
      let info = await blockchain.getblockchaininfo()
      assert.equal(info.result.chain, 'main')
    })
  })
})
