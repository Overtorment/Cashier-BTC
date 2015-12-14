var assert = require('assert');
var request = require('supertest');
var require = require('really-need');
var should = require('chai').should(); //actually call the function


describe('loading express', function () {

    var created_payment =false;
    var server;

    beforeEach(function () {
        server = require('../../cashier-btc', { bustCache: true });
    });

    afterEach(function (done) {
        server.close(done);
    });


    it('responds to /', function testSlash(done) {
        request(server)
            .get('/')
            .expect('Cashier-BTC reporting for duty')
            .expect(200, done);
    });


    it('responds to /request_payment/:expect/:currency/:message/:seller/:customer/:callback_url', function testSlash(done) {
        request(server)
            .get('/request_payment/0.666/BTC/testmessage/testseller/testcustomer/http%3A%2F%2Ffuckoff.com%2F')
            .expect(function(res){
                var json = JSON.parse(res.text);
                created_payment = json;
                should.exist(json);
                json.should.be.an("object");
                should.exist(json.address);
                should.exist(json.link);
                should.exist(json.qr);
                should.exist(json.qr_simple);

            })
            .expect(200, done);
    });


    it('responds to /check_payment/:address', function testSlash(done) {
        request(server)
            .get('/check_payment/'+created_payment.address)
            .expect(function(res){
                var json = JSON.parse(res.text);
                if (!json) throw new Error("bad json");
                should.exist(json);
                json.should.be.an("object");
                should.exist(json.btc_expected);
                should.exist(json.btc_actual);
                should.exist(json.btc_unconfirmed);
                json.btc_expected.should.equal(0.666);
                json.btc_actual.should.equal(0);
                json.btc_unconfirmed.should.equal(0);
            })
            .expect(200, done);
    });


    it('responds to /payout/:seller/:amount/:currency/:address', function testSlash(done) {
        request(server)
            .get('/payout/testseller/0.66/BTC/1HLoD9E4SDFFPDiYfNYnkBLQ85Y51J3Zb1')
            .expect(function(res){
                var json = JSON.parse(res.text);
                should.exist(json.error);
            })
            .expect(200, done);
    });


    it('responds to /get_seller_balance/testseller', function testSlash(done) {
        request(server)
            .get('/get_seller_balance/testseller')
            .expect(function(res){
                var json = JSON.parse(res.text);
                if (!json) throw new Error("bad json");
                if (!('btc_actual' in json)) throw new Error("missing key");
                if (json.btc_actual != 0) throw new Error("unexpected value");
                if (!('btc_unconfirmed' in json)) throw new Error("missing key");
                if (json.btc_unconfirmed != 0) throw new Error("unexpected value");
            })
            .expect(200, done);
    });



    it('404 everything else', function testPath(done) {
        request(server)
            .get('/foo/bar')
            .expect(404, done);
    });

});