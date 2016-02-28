/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

var bitcore = require('bitcore-lib');
var config = require('../config');
var querystring = require('querystring');
var https = require("https");



exports.get_address = function(address, callback){

    var options = {
        host: 'api.blockcypher.com',
        port: 443,
        path: '/v1/btc/main/addrs/'+address+"/balance",
        method: 'GET'
    };

    var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            var resp = JSON.parse(chunk);
            var ret = {};
            ret.btc_actual = resp.balance/100/1000/1000;
            ret.btc_unconfirmed = (resp.balance+resp.unconfirmed_balance)/100/1000/1000;
            callback(ret);
        });
    });

    req.end();
};




exports.create_transaction = function(to_address, btc_amount, miner_fee, WIF, callback){
    if (miner_fee === false) miner_fee = 0.0001;
    var pk = new bitcore.PrivateKey.fromWIF(WIF);
    var from_address = (pk.toPublicKey()).toAddress(bitcore.Networks.livenet);

    var transaction = new bitcore.Transaction()
        .fee(miner_fee * 100000000)
        .to(to_address, parseInt(btc_amount*100000000))
        .change(from_address);

    fetch_transactions_by_address(from_address, function(txs){

        for (var i=0, l=txs.length; i<l; i++) { // iterating all transactions on that address
            var out;

            for (var ii=0, ll=txs[i].out.length; ii<ll; ii++) { // iterating all outs on transaction to find then one we own (from_address)
                if (txs[i].out[ii].addr == from_address && typeof txs[i].out[ii].spent_by === 'undefined') {
                    out = txs[i].out[ii];
                }
            } // end for

            out && transaction.from({ "address":from_address
                ,"txid" : txs[i].hash
                ,"vout" : out.n
                ,"scriptPubKey": out.script
                ,"satoshis" : out.value
            });

        } // end for

        transaction.sign(pk);

        callback(transaction);

    }); // end fetch transactions

};//  end create_transaction



function fetch_transactions_by_address(address, callback){

    https.get("https://api.blockcypher.com/v1/btc/main/addrs/"+address+"/full", function(ret){
        var json = '';
        ret.on('data', function(d) { json += d; });
        ret.on('end', function() {
            json = JSON.parse(json);

            // transforming in format expected by others
            for (var i=0, l=json.txs.length; i<l; i++) {
                for (var ii=0, ll=json.txs[i].outputs.length; ii<ll; ii++) {
                    json.txs[i].outputs[ii].addr = json.txs[i].outputs[ii].addresses[0];
                    json.txs[i].outputs[ii].n = ii;
                }
                json.txs[i].out = json.txs[i].outputs;
            }



            return callback(json.txs);
        });
    });

};


exports.broadcast_transaction = function(txhex, callback){
    var data = '{"tx":"'+txhex+'"}';

    var options = {
        host: 'api.blockcypher.com',
        port: 443,
        path: '/v1/btc/main/txs/push',
        method: 'POST',
        headers: {
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log("response: " + chunk);
            chunk = JSON.parse(chunk);
            callback(chunk);
        });
    });

    req.write(data);
    req.end();


};




exports.fetch_transactions_by_address = fetch_transactions_by_address;