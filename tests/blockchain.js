var assert = require('assert');
var should = require('chai').should(); //actually call the function


describe('blockchain', function() {

    describe('#create_transaction()', function () {

        it('should return valid TX', function (done) {
            var blockchain = require('./../models/blockchain');
            var callback = function(txhex){
                txhex.should.equal("0100000001e92c6788cd82f67ff2397e54e32c85820820a43bbe46884e340163ef3e6a7972000000006b483045022100bd0e50bc342d2473efa8f497afa3ab44485ad467f1d1ec90591a946a5a84a2fa02207aeeabc8bf2237efe250ab61257482d18458d15f999a0499737c47c4bfe21262012103feec0ddfb34f3ce433c5f35ce83424681530d92f2dfbc075f17ce7ccec799affffffffff02e8030000000000001976a914f7c6c1f9f6142107ed293c8fbf85fbc49eb5f1b988acb8820100000000001976a91493e7ac0f387105913d95ac49f9a904014e472e4188ac00000000");
                done();
            };
            blockchain.create_transaction('1Pb81K1xJnMjUfFgKUbva6gr1HCHXxHVnr', 0.00001, 0, 'L4XEDnQmWQA7CuLCMvXLy5W4HKTY2a1CG51ak5iAuawL7bEduHDH', callback);
        });

    });


    describe('#broadcast_transaction()', function () {

        it('should broadcast TX', function (done) {
            var blockchain = require('./../models/blockchain');
            var callback = function(response){
                should.exist(response.error); // because it was already broadcasted
                console.log(response);
                response.error.should.equal('Error sending transaction: transaction already in pool.');
                done();
            };
            blockchain.broadcast_transaction('0100000001e92c6788cd82f67ff2397e54e32c85820820a43bbe46884e340163ef3e6a7972000000006b483045022100bd0e50bc342d2473efa8f497afa3ab44485ad467f1d1ec90591a946a5a84a2fa02207aeeabc8bf2237efe250ab61257482d18458d15f999a0499737c47c4bfe21262012103feec0ddfb34f3ce433c5f35ce83424681530d92f2dfbc075f17ce7ccec799affffffffff02e8030000000000001976a914f7c6c1f9f6142107ed293c8fbf85fbc49eb5f1b988acb8820100000000001976a91493e7ac0f387105913d95ac49f9a904014e472e4188ac00000000', callback);
        });

    });


    describe('#fetch_transactions_by_address()', function() {

        it('should return TXs by address ', function (done) {
            var blockchain = require('./../models/blockchain');
            var callback = function(txs){
                var ind = txs.length-1;
                should.exist(txs[ind]);
                should.exist(txs[ind].hash);
                txs[ind].hash.should.equal("72796a3eef6301344e8846be3ba4200882852ce3547e39f27ff682cd88672ce9");
                should.exist(txs[ind].out);
                done();
            };
            blockchain.fetch_transactions_by_address('1EV3s4SRFWJhyQG13nX9vvS2KjBwomJbYx', callback);
        });

    });


});

