/* global describe, it */

var assert = require('assert')

describe('storage', function () {
  this.timeout(10000)

  describe('get_document()', function () {
    it('should return any db document', function (done) {
      var storage = require('./../../models/storage')
      storage.get_document('_design/address', function (data) {
        if (!data) throw new Error()
        assert.equal(data._id, '_design/address')
        assert.equal(data.language, 'javascript')
        assert.ok(data.views.all_by_customer_and_timestamp, 'all_by_customer_and_timestamp')
        assert.ok(data.views.unprocessed_by_timestamp, 'unprocessed_by_timestamp')
        assert.ok(data.views.unpaid_by_timestamp, 'unpaid_by_timestamp')
        assert.ok(data.views.paid_by_timestamp, 'paid_by_timestamp')
        assert.ok(data.views.paid_and_sweeped_by_timestamp, 'paid_and_sweeped_by_timestamp')
        assert.ok(data.views.processing_by_timestamp, 'processing_by_timestamp')
        assert.ok(data.views.total_by_seller, 'total_by_seller')
        done()
      })
    })
  })

  describe('save_address() && get_address()', function () {
    it('should save document with address data, and get it back', function (done) {
      var storage = require('./../../models/storage')
      var data = {
        'expect': 1,
        'currency': 'BTC',
        'exchange_rate': 1,
        'btc_to_ask': 1,
        'message': 'message',
        'seller': 'testseller',
        'customer': 'testuser',
        'callback_url': 'http://fu.bar'
      }

      storage.save_address(data, function (response) {
        assert.ok(response.ok)
        assert.ok(response.id)

                // now fetching this document back
        storage.get_address(response.id, function (data2) {
          if (!data2) throw new Error()
          assert.equal(data2._id, response.id)
          assert.ok(data2.private_key)
          assert.equal(data2.callback_url, data.callback_url)
          assert.equal(data2.customer, data.customer)
          assert.equal(data2.seller, data.seller)
          assert.equal(data2.message, data.message)
          assert.equal(data2.btc_to_ask, data.btc_to_ask)
          assert.equal(data2.exchange_rate, data.exchange_rate)
          assert.equal(data2.currency, data.currency)
          assert.equal(data2.expect, data.expect)
          assert.equal(data2.doctype, 'address')
          done()
        })
      })
    })
  })

  describe('save_payout()', function () {
    it('saves document with details on the payout', function (done) {
      var storage = require('./../../models/storage')
      var data = {}

      storage.save_payout(data, function (response) {
        assert.ok(response.ok)
        assert.ok(response.id)

        // now fetching this document back
        storage.get_document(response.id, function (data2) {
          if (!data2) throw new Error()
          assert.equal(data2.processed, 'payout_done')
          assert.equal(data2.doctype, 'payout')
          done()
        })
      })
    })
  })

  describe('save_seller()', function () {
    it('saves document with details on the seller', function (done) {
      var storage = require('./../../models/storage')
      var sellerId = require('crypto').createHash('md5').update(Math.random().toString()).digest('hex')

      storage.save_seller(sellerId, function (response) {

        // now fetching this document back
        storage.get_document(response.id, function (data2) {
          if (!data2) throw new Error()
          assert.ok(data2.WIF)
          assert.ok(data2.address)
          assert.ok(data2.public_key)
          assert.ok(data2.private_key)
          assert.ok(data2.seller)
          assert.equal(data2.seller, sellerId)
          assert.equal(data2.doctype, 'seller')
          done()
        })
      })
    })
  })
})
