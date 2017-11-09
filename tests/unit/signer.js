/* global describe, it */

let assert = require('assert')

describe('unit - signer', function () {
  describe('createTransaction()', function () {
    it('should return valid tx hex', function (done) {
      let signer = require('../../models/signer')
      let utxos = [{'txid': '04a3b9166ce84a2f0cc8a84f5da29d33e92e79deeb223adb96444aa29a58f279', 'vout': 0, 'address': '17ubvATfy1Qoqm7k9ASQT8amjK7e5HdxST', 'account': '17ubvATfy1Qoqm7k9ASQT8amjK7e5HdxST', 'scriptPubKey': '76a9144bc38818e587a752422886197fc5020564002e8488ac', 'amount': 0.001, 'confirmations': 0, 'spendable': false, 'solvable': false, 'safe': false}]
      let tx = signer.createTransaction(utxos, '1A3vaPYFSBiQM6JJnaGAX6mm9tgwacSBXc', 0.001, 0.0002, 'KyYzeME3gwyLeCXW57KMiPPi5pYxCNvfMbiWpHeGsNpdhvV3VmTj')
      assert.equal(tx, '010000000179f2589aa24a4496db3a22ebde792ee9339da25d4fa8c80c2f4ae86c16b9a304000000006a47304402206ac632bd031a5b7fb3cc053bad19297b5bb988e0c17b89ebdb4877b7e0898ff102206b4d30e48bfa794ef5980a75baab4b6a789689e59989a3133e9c9c3110a8dbdd0121020687de036f0be4b2b5972e72d2a7ef6e3d57f20cccb6378fb425098686e35c7cffffffff0180380100000000001976a9146346afcaf9f64dba9502f00d835960a951b2a50588ac00000000')
      done()
    })
  })
})
