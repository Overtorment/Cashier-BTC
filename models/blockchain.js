/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

var https = require('https');
var http = require('http');
var request = require('request');
var bitcore = require('bitcore');
var config = require('../config');

var Chain = require('chain-node')
    , chain = new Chain(config.chain)



exports.getAddress = function(address, callback){
    return chain.getAddress(address, callback);
};


exports.transact = function(args, callback){
    return chain.transact(args, callback);
};