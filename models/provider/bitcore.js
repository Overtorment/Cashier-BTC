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
var async = require("async");
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

            if (json.pagesTotal > 1) {
                var all_tx = [];
                var jobs = [];
                var jobs_c = [];
                for (var c=1; c <= json.pagesTotal; c++){
                    jobs_c.push(c);
                    jobs.push(function(callback){
                        var cc = jobs_c.pop();
                        http.get("http://"+config.bitcore.host+":"+config.bitcore.port+config.bitcore.base_path+"/txs/?address="+address+'&pageNum='+cc, function(ret2){
                            var json2 = '';
                            ret2.on('data', function(d2) { json2 += d2; });
                            ret2.on('end', function() {
                                json2 = JSON.parse(json2);
                                callback(null, json2);
                            });

                        });

                    });
                }

                async.parallel(jobs, function(err, results){
                    for (var i = 0; i < results.length; i++) {
                        all_tx = all_tx.concat(results[i].txs);
                    }
                    return callback(transform_txs(all_tx));
                });

            } else {
                return callback(transform_txs(json.txs));
            } // if

        });
    });

}


function transform_txs(txs){ // transforming in format expected by others
    for (var i=0, l=txs.length; i<l; i++) {
        txs[i].hash = txs[i].txid;
        for (var ii=0, ll=txs[i].vout.length; ii<ll; ii++) {
            if (typeof txs[i].vout[ii].scriptPubKey.addresses !== 'undefined') { // genesis?
                txs[i].vout[ii].addr = txs[i].vout[ii].scriptPubKey.addresses[0];
            }
            txs[i].vout[ii].value *= 100000000; // btc to satoshis
            if (txs[i].vout[ii].spentTxId) txs[i].vout[ii].spent_by = txs[i].vout[ii].spentTxId;
            txs[i].vout[ii].n = ii;
            txs[i].vout[ii].script = txs[i].vout[ii].scriptPubKey.hex;
        }
        txs[i].out = txs[i].vout;
    }
    return txs;
}


function broadcast_transaction(txhex, callback){
    if (typeof txhex == 'object') txhex = txhex.uncheckedSerialize();
    console.log('--', txhex, '--');
    //process.exit();
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