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

    it('should return valid tx hex for segwit transactions', function (done) {
      let signer = require('../../models/signer')
      let utxos = [{ txid: '1e1a8cced5580eecd0ac15845fc3adfafbb0f5944a54950e4a16b8f6d1e9b715', vout: 1, address: '3Bsssbs4ANCGNETvGLJ3Fvri6SiVnH1fbi', account: '3Bsssbs4ANCGNETvGLJ3Fvri6SiVnH1fbi', scriptPubKey: 'a9146fbf1cee74734503297e46a0db3e3fbb06f2e9d387', amount: 0.001, confirmations: 108, spendable: false, solvable: false, safe: true }]
      let tx = signer.createSegwitTransaction(utxos, '1Pb81K1xJnMjUfFgKUbva6gr1HCHXxHVnr', 0.001, 0.0001, 'KyWpryAKPiXXbipxWhtprZjSLVjp22sxbVnJssq2TCNQxs1SuMeD')
      assert.equal(tx, '0100000000010115b7e9d1f6b8164a0e95544a94f5b0fbfaadc35f8415acd0ec0e58d5ce8c1a1e0100000017160014f90e5bca5635b84bd828064586bd7eb117fee9a9ffffffff01905f0100000000001976a914f7c6c1f9f6142107ed293c8fbf85fbc49eb5f1b988ac02473044022023eef496f43936550e08898d10b254ee910dfd19268341edb2f61b873ccba25502204b722787fabc37c2c9e9575832331b0ba0c3f7cd0c18a6fb90027f4327bd8d850121039425479ea581ebc7f55959da8c2e1a1063491768860386335dd4630b5eeacfc500000000')
      done()
    })

    it('should return valid tx hex for segwit transactions with multiple inputs', function (done) {
      let signer = require('../../models/signer')
      let utxos = [ { 'txid': '4e2a536aaf6b0b8a4f439d0343436cd321b8bac9840a24d13b8eed484a257b0b', 'vout': 0, 'address': '3NBtBset4qPD8DZeLw4QbFi6SNjNL8hg7x', 'account': '3NBtBset4qPD8DZeLw4QbFi6SNjNL8hg7x', 'scriptPubKey': 'a914e0d81f03546ab8f29392b488ec62ab355ee7c57387', 'amount': 0.00090000, 'confirmations': 67, 'spendable': false, 'solvable': false, 'safe': true }, { 'txid': '09e1b78d4ecd95dd4c7dbc840a2619da6d02caa345a63b2733f3972666462fbd', 'vout': 0, 'address': '3NBtBset4qPD8DZeLw4QbFi6SNjNL8hg7x', 'account': '3NBtBset4qPD8DZeLw4QbFi6SNjNL8hg7x', 'scriptPubKey': 'a914e0d81f03546ab8f29392b488ec62ab355ee7c57387', 'amount': 0.00190000, 'confirmations': 142, 'spendable': false, 'solvable': false, 'safe': true } ]
      let tx = signer.createSegwitTransaction(utxos, '1Pb81K1xJnMjUfFgKUbva6gr1HCHXxHVnr', 0.0028, 0.0002, 'L4iRvejJG9gRhKVc3rZm5haoyd4EuCi77G91DnXRrvNDqiXktkXh')
      assert.equal(tx, '010000000001020b7b254a48ed8e3bd1240a84c9bab821d36c4343039d434f8a0b6baf6a532a4e00000000171600141e16a923b1a9e8d0c2a044030608a6aa13f97e9affffffffbd2f46662697f333273ba645a3ca026dda19260a84bc7d4cdd95cd4e8db7e10900000000171600141e16a923b1a9e8d0c2a044030608a6aa13f97e9affffffff01a0f70300000000001976a914f7c6c1f9f6142107ed293c8fbf85fbc49eb5f1b988ac02483045022100b3e001b880a7a18294640165cc40c777669534803cee7206c8d3f03531bb315502204642a4569576a2e9e77342c7a9aaa508a21248b7720fe0f9e6d76713951c133001210314389c888e9669ae05739819fc7c43d7a50fdeabd2a8951f9607c8cad394fd4b02473044022078bd4f47178ce13c4fbf77c5ce78c80ac10251aa053c68c8febb21ce228f844e02207b02bdd754fbc2df9f62ea98e7dbd6c43e760b8f78c7c00b43512a06b498adb501210314389c888e9669ae05739819fc7c43d7a50fdeabd2a8951f9607c8cad394fd4b00000000')
      done()
    })

    it('should return valid tx hex for segwit transactions with change address', function (done) {
      let signer = require('../../models/signer')
      let utxos = [ { 'txid': '160559030484800a77f9b38717bb0217e87bfeb47b92e2e5bad6316ad9d8d360', 'vout': 1, 'address': '3NBtBset4qPD8DZeLw4QbFi6SNjNL8hg7x', 'account': '3NBtBset4qPD8DZeLw4QbFi6SNjNL8hg7x', 'scriptPubKey': 'a914e0d81f03546ab8f29392b488ec62ab355ee7c57387', 'amount': 0.00400000, 'confirmations': 271, 'spendable': false, 'solvable': false, 'safe': true } ]
      let tx = signer.createSegwitTransaction(utxos, '1Pb81K1xJnMjUfFgKUbva6gr1HCHXxHVnr', 0.002, 0.0001, 'L4iRvejJG9gRhKVc3rZm5haoyd4EuCi77G91DnXRrvNDqiXktkXh')
      assert.equal(tx, '0100000000010160d3d8d96a31d6bae5e2927bb4fe7be81702bb1787b3f9770a8084040359051601000000171600141e16a923b1a9e8d0c2a044030608a6aa13f97e9affffffff0230e60200000000001976a914f7c6c1f9f6142107ed293c8fbf85fbc49eb5f1b988ac400d03000000000017a914e0d81f03546ab8f29392b488ec62ab355ee7c573870247304402202c962e14ae6abd45dc9613d2f088ad487e805670548e244deb25d762b310a60002204f12c7f9b8da3567b39906ff6c46b27ce087e7ae91bbe34fb1cdee1b994b9d3001210314389c888e9669ae05739819fc7c43d7a50fdeabd2a8951f9607c8cad394fd4b00000000')
      done()
    })
  })

  describe('WIF2address()', function () {
    it('should convert WIF to segwit P2SH address', function (done) {
      let signer = require('../../models/signer')
      let address = signer.WIF2segwitAddress('L55uHs7pyz7rP18K38kB7kqDVNJaeYFzJtZyC3ZjD2c684dzXQWs')
      assert.equal('3FSL9x8P8cQ74iW2HLP6JPGPRgc4K2FnsU', address)
      done()
    })
  })

  describe('generateNewAddress()', function () {
    it('should generate new address', function (done) {
      let signer = require('../../models/signer')
      let address = signer.generateNewSegwitAddress()
      assert.ok(address.WIF)
      assert.ok(address.address)
      assert.equal(address.address, signer.WIF2segwitAddress(address.WIF))
      done()
    })
  })

  describe('URI()', function () {
    it('should form correct payment url', function (done) {
      let signer = require('../../models/signer')
      let url = signer.URI({
        address: '3Bsssbs4ANCGNETvGLJ3Fvri6SiVnH1fbi',
        message: 'For goods & services',
        label: 'nolabel',
        amount: 1000000
      })
      assert.equal(url, 'bitcoin:3Bsssbs4ANCGNETvGLJ3Fvri6SiVnH1fbi?amount=0.01&message=For%20goods%20%26%20services&label=nolabel')

      url = signer.URI({
        address: '1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv',
        message: 'wheres the money lebowski',
        amount: 400000
      })
      assert.equal(url, 'bitcoin:1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv?amount=0.004&message=wheres%20the%20money%20lebowski')
      done()
    })
  })
})
