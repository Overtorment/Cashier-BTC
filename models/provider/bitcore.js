/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

var config = require('../../config');
var https = require("https");
var http = require("http");
var querystring = require('querystring');



function get_address(address, callback){

    http.get("http://"+config.bitcore.host+":"+config.bitcore.port+config.bitcore.base_path+"/addr/"+address+'?noTxList=1', function(res){
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            var resp = JSON.parse(chunk);
            var ret = {};
            ret.btc_actual = resp.balance;
            ret.btc_unconfirmed = resp.balance+resp.unconfirmedBalance;
            callback(ret);
        });
    });

}







function fetch_transactions_by_address(address, callback){

    http.get("http://"+config.bitcore.host+":"+config.bitcore.port+config.bitcore.base_path+"/txs/?address="+address, function(ret){
        var json = '';
        ret.on('data', function(d) { json += d; });
        ret.on('end', function() {
            json = JSON.parse(json);

            // transforming in format expected by others
            for (var i=0, l=json.txs.length; i<l; i++) {
                json.txs[i].hash = json.txs[i].txid;
                for (var ii=0, ll=json.txs[i].vout.length; ii<ll; ii++) {
                    json.txs[i].vout[ii].addr = json.txs[i].vout[ii].scriptPubKey.addresses[0];
                    json.txs[i].vout[ii].n = ii;
                    json.txs[i].vout[ii].script = json.txs[i].vout[ii].scriptPubKey.hex;
                }
                json.txs[i].out = json.txs[i].vout;
            }

            return callback(json.txs);
        });
    });

}


function broadcast_transaction(txhex, callback){
    var post_data = querystring.stringify({
        'rawtx' : txhex
    });

    var options = {
        host: config.bitcore.host,
        port: config.bitcore.port,
        path: config.bitcore.base_path + '/tx/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            if (chunk.indexOf('dust') !== false) return callback({error: chunk});
            chunk = JSON.parse(chunk);
            callback(chunk);
        });
    });

    req.write(post_data);
    req.end();
}




exports.fetch_transactions_by_address = fetch_transactions_by_address;
exports.get_address = get_address;
exports.broadcast_transaction = broadcast_transaction;