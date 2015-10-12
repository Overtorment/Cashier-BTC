/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */



/**
 *
 * Handles all bitcoin payment gateway API calls
 * I.e. all calls responsible for invoicing and paying in BTC only
 *
 */

/* global btc_usd */
/* global btc_eur */
/* global sellers:true */

var express = require('express')
    , router = express.Router()
    , bitcore = require('bitcore')
    , qr = require('qr-image')
    , config = require('../config')
    , Chain = require('chain-node')
    , chain = new Chain(config.chain)
    , storage = require('../models/storage');


router.get('/get_address_confirmed_balance/:id', function (req, res) {
    chain.getAddress(req.params.id, function(err, resp) {
        if (!resp[0]) {
            res.send("error");
        }
        else {
            res.send(''+resp[0].confirmed.balance/100/1000/1000);
        }
    });
});


router.get('/request_payment/:expect/:currency/:message/:seller/:customer/:callback_url', function (req, res) {
    var exchange_rate, btc_to_ask;

    switch (req.params.currency ){
        case 'USD': exchange_rate = btc_usd;
            break;
        case 'EUR': exchange_rate = btc_eur;
            break;
        case 'BTC': exchange_rate = 1;
            break;
        default:
            return res.send("bad currency");
    }

    btc_to_ask = Math.floor((req.params.expect / exchange_rate) * 100000000)/100000000;

    var data = {
        "timestamp" : Math.floor(Date.now() / 1000),
        "expect" : req.params.expect,
        "currency" : req.params.currency,
        "exchange_rate" : exchange_rate,
        "btc_to_ask" : btc_to_ask,
        "message" : req.params.message,
        "seller" : req.params.seller,
        "customer" : req.params.customer,
        "callback_url" : decodeURIComponent(req.params.callback_url)
    };

    storage.save_address(data, function(response_body){
        if (response_body.ok === true) {
            console.log(JSON.stringify(data));

            var paymentInfo = {
                address: data.address,
                message: req.params.message,
                label: req.params.message,
                amount: Math.floor(btc_to_ask * 100000000) //satoshis
            };

            var answer = {
                "link" : new bitcore.URI(paymentInfo).toString(),
                "qr" : config.base_url_qr + "/generate_qr/" + encodeURIComponent(new bitcore.URI(paymentInfo).toString()),
                "qr_simple" : config.base_url_qr + "/generate_qr/" + data.address,
                "address" : data.address
            };

            if (typeof sellers[req.params.seller] == "undefined"){ // seller is not in local cache
                storage.get_seller(req.params.seller, function(response_body){ // checking if seller's data in database
                    console.log('checking seller existance...');
                    if (typeof response_body.error != 'undefined'){ // seller doesnt exist
                        storage.save_seller(req.params.seller, function(response_body){ // creating seller
                            console.log('seller doesnt exist. creating...');
                            if (response_body.ok === true){ // seller create success
                                console.log('seller create success');
                                sellers[req.params.seller] = 1;
                                res.send(JSON.stringify(answer));
                            } else { // seller create fail
                                console.log('seller create fail');
                                res.send(JSON.stringify({"error" : "Could not save seller"}));
                            }
                        });
                    } else { // seller exists, so we just mark local cache that this one exists
                        console.log('seller already exists');
                        sellers[req.params.seller] = 1;
                        res.send(JSON.stringify(answer));
                    }
                });
            } else { // seller is in local cache, no need to create it
                res.send(JSON.stringify(answer));
            }
        } else { // save_address() failed
            res.send(response_body.error+': '+response_body.reason);
        }
    });

});


router.get('/check_payment/:address', function (req, res) {
    chain.getAddress(req.params.address, function(err, resp) {
        if (!resp[0]) {
            res.send(JSON.stringify({"error":"bad bitcoin address"}));
        }
        else {
            storage.get_address(req.params.address, function(json){
                if (json !== false && json.btc_to_ask){
                    var answer = {
                        'btc_expected' : json.btc_to_ask,
                        'btc_actual' : resp[0].confirmed.balance/100/1000/1000 ,
                        'btc_unconfirmed' : resp[0].total.balance/100/1000/1000
                    };
                    res.send(JSON.stringify(answer));
                } else {
                    console.log("storage error " + JSON.stringify(json));
                    res.send(JSON.stringify(json));
                }
            });
        }
    });
});


router.get('/payout/:seller/:amount/:currency/:address', function (req, res) {
    var exchange_rate;
    switch (req.params.currency ){
        case 'USD': exchange_rate = btc_usd;
            break;
        case 'EUR': exchange_rate = btc_eur;
            break;
        case 'BTC': exchange_rate = 1;
            break;
        default:
            return res.send("bad currency");
    }

    var btc_to_pay = Math.floor((req.params.amount / exchange_rate) * 100000000)/100000000;

    storage.get_seller(req.params.seller, function(seller){ // checking if such seller exists
        if (seller === false || typeof seller.error != 'undefined') {
            return res.send(JSON.stringify({"error" : "no such seller"}));
        }
        chain.transact(
            {
                inputs: [
                    {
                        address: seller.address,
                        private_key: seller.private_key
                    }
                ],
                outputs: [
                    {
                        address: req.params.address,
                        "amount": btc_to_pay * 100*1000*1000  -  10000 /* fee */ // satoshis
                    }
                ],
                miner_fee_rate : 10000
            }, function(err, resp) {
                if (err) {
                    console.log(err.resp.body.message);
                    return res.send(err.resp.body.message);
                } else {
                    console.log('');
                    console.log("sent "+btc_to_pay+" from "+req.params.seller+' ('+seller.address+')'+' to '+req.params.address);
                    console.log(JSON.stringify(resp));
                    console.log('');
                    var data = {
                        "seller" : req.params.seller,
                        "btc" : btc_to_pay,
                        "to_address" : req.params.address
                    };
                    storage.save_payout(data, function(){ res.send(JSON.stringify(resp));  });
                }
            });
    });
});


router.get('/get_seller_balance/:seller', function (req, res) {
    storage.get_seller(req.params.seller, function(seller){ // checking if such seller exists
        if (seller === false || typeof seller.error != 'undefined') {
            return res.send(JSON.stringify({"error" : "no such seller"}));
        }
        chain.getAddress(seller.address, function(err, resp) {
            if (err) {
                return res.send(JSON.stringify(err));
            }
            var answer = {
                'btc_actual' : resp[0].confirmed.balance/100/1000/1000 ,
                'btc_unconfirmed' : resp[0].total.balance/100/1000/1000
            };
            res.send(JSON.stringify(answer));
        });
    });
});


router.get('/get_btc_usd_exchange_rate', function (req, res) {
    return res.status(200).send(btc_usd + "");
});



module.exports = router;