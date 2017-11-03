/* global describe, it */

let assert = require('assert')

describe('integration - storage', function () {
  this.timeout(60000)

  describe('getDocumentPromise()', function () {
    it.only('should return any db document', async function () {
      let storage = require('./../../models/storage')
      let data = await storage.getDocumentPromise('_design/address')
      assert.ok(data)
      assert.equal(data._id, '_design/address')
      assert.equal(data.language, 'javascript')
      assert.ok(data.views.all_by_customer_and_timestamp, 'all_by_customer_and_timestamp')
      assert.ok(data.views.unprocessed_by_timestamp, 'unprocessed_by_timestamp')
      assert.ok(data.views.paid_by_timestamp, 'paid_by_timestamp')
      assert.ok(data.views.paid_and_sweeped_by_timestamp, 'paid_and_sweeped_by_timestamp')
      assert.ok(data.views.total_by_seller, 'total_by_seller')
    })
  })

  describe('saveAddressPromise() && getAddressPromise()', function () {
    it('should save document with address data, and get it back', function (done) {
      let storage = require('./../../models/storage')
      let bitcore = require('bitcore-lib')
      let privateKey = new bitcore.PrivateKey()
      let address = (new bitcore.Address(privateKey.toPublicKey())).toString()
      let data = {
        'expect': 1,
        'currency': 'BTC',
        'exchange_rate': 1,
        'btc_to_ask': 1,
        'message': 'message',
        'seller': 'testseller',
        'customer': 'testuser',
        'callback_url': 'http://fu.bar',
        'WIF': 'wif',
        'address': address,
        'private_key': 'private',
        'public_key': 'public',
        'doctype': 'address',
        '_id': address
      }

      storage.saveAddressPromise(data).then(function (response) {
        assert.ok(response.ok)
        assert.ok(response.id)

                // now fetching this document back
        storage.getAddressPromise(response.id).then(function (data2) {
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
        }).catch((err) => console.log(err))
      }).catch((err) => console.log(err))
    })
  })

  describe('savePayout()', function () {
    it('saves document with details on the payout', function (done) {
      let storage = require('./../../models/storage')
      let data = {}

      storage.savePayout(data, function (response) {
        assert.ok(response.ok)
        assert.ok(response.id)

        // now fetching this document back
        storage.getDocumentPromise(response.id).then(function (data2) {
          if (!data2) throw new Error()
          assert.equal(data2.processed, 'payout_done')
          assert.equal(data2.doctype, 'payout')
          done()
        })
      })
    })
  })

  describe('saveSellerPromise()', function () {
    it('saves document with details on the seller', function (done) {
      let storage = require('./../../models/storage')
      let sellerId = require('crypto').createHash('md5').update(Math.random().toString()).digest('hex')

      let bitcore = require('bitcore-lib')
      let privateKey = new bitcore.PrivateKey()
      let address = new bitcore.Address(privateKey.toPublicKey())
      let data = {
        'WIF': privateKey.toWIF(),
        'address': address.toString(),
        'private_key': privateKey.toString(),
        'public_key': privateKey.toPublicKey().toString(),
        'timestamp': Math.floor(Date.now() / 1000),
        'seller': sellerId,
        '_id': sellerId,
        'doctype': 'seller'
      }

      storage.saveSellerPromise(sellerId, data).then(function (response) {
        // now fetching this document back
        storage.getDocumentPromise(response.id).then(function (data2) {
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

  describe('saveAddressPromise() && getUnprocessedAdressesYoungerThan()', function () {
    it('saves unprocessed address to database and fetches it back', function (done) {
      let bitcore = require('bitcore-lib')
      let privateKey = new bitcore.PrivateKey()
      let address = (new bitcore.Address(privateKey.toPublicKey())).toString()
      let storage = require('./../../models/storage')
      let data = {
        'timestamp': Math.floor(Date.now() / 1000),
        'expect': 1,
        'currency': 'BTC',
        'exchange_rate': 1,
        'btc_to_ask': 1,
        'message': 'message',
        'seller': 'testseller',
        'customer': 'testuser',
        'callback_url': 'http://fu.bar',
        'doctype': 'address',
        'address': address,
        '_id': address
      }

      storage.saveAddressPromise(data).then(function (response) {
        assert.ok(response.ok)
        assert.ok(response.id)

        // now fetching this document back
        storage.getAddressPromise(response.id).then(function (data2) {
          if (!data2) throw new Error()
          assert.equal(data2._id, response.id)
          assert.ok(data2.timestamp)
          assert.equal(data2.doctype, 'address')

          // now, testing if getUnprocessedAdressesYoungerThan() works
          storage.getUnprocessedAdressesYoungerThan(data2.timestamp, function (data3) {
            if (!data3) throw new Error()
            data3 = JSON.parse(data3)
            data3 = data3['rows'][0]['doc']
            assert.equal(data3._id, response.id) // its the same document we saved
            done()
          })
        })
      })
    })
  })
})
