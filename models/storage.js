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
var bitcore = require('bitcore-lib');
var config = require('../config');


exports.get_document = function(docid, callback){
    return exports.get_address(docid, callback); // since atm it does exactly the same
};

exports.save_document = function(body, callback){
    request.post( config.couchdb, { json : body }, function (error, response, body) {
            if (error) { console.log(body); }
            return callback(response.body);
        }
    );
};

exports.get_address = function(address, callback){
		var protocol = config.couchdb.substr(0,5) == 'https' ? https : http;
		protocol.get(config.couchdb + "/" + address, function(ret) {
              var json = '';
			  ret.on('data', function(d) { json += d; });
			  ret.on('end', function() { return callback(JSON.parse(json)); });
		}).on('error', function(e){            
			console.log(e);
			return callback(false);
		});
};


exports.get_seller = function(seller_id, callback){
		var protocol = config.couchdb.substr(0,5) == 'https' ? https : http;
		protocol.get(config.couchdb + '/' + seller_id, function(ret) {
              var json = '';
			  ret.on('data', function(d) { json += d; });
			  ret.on('end', function() { return callback(JSON.parse(json)); });
		}).on('error', function(e){
			console.log(e);
            return callback(false);
		});
};




exports.save_address = function(body, callback){
	var private_key = new bitcore.PrivateKey();
	var address = new bitcore.Address(private_key.toPublicKey());
	body.WIF = private_key.toWIF();
	body.address = address.toString();
	body.private_key = private_key.toString();
	body.public_key = private_key.toPublicKey().toString();
	body.timestamp = Math.floor(Date.now() / 1000);
	body.doctype = 'address';
	body._id = body.address;
	request.post( config.couchdb, { json : body }, function (error, response, body) {
			if (error) { console.log(body); }
			return callback(response.body);
		}
	);
};



exports.save_payout = function(body, callback){
	body.processed = 'payout_done';
	body.timestamp = Math.floor(Date.now() / 1000);
	body.doctype = 'payout';
	request.post( config.couchdb, { json : body }, function (error, response, body) {
			if (error) {
                console.log(body);
            }
			if (callback) {
                return callback(response.body);
            } else {
                return false;
            }
		}
	);
};



exports.save_seller = function(seller_id, callback){
	var private_key = new bitcore.PrivateKey();
	var address = new bitcore.Address(private_key.toPublicKey());
	var data = {
				"WIF" : private_key.toWIF(),
				"address" : address.toString(),
				"private_key" : private_key.toString(),
				"public_key" : private_key.toPublicKey().toString(),
				"timestamp" : Math.floor(Date.now() / 1000),
				"seller" : seller_id,
				"_id" : seller_id,
				"doctype" : "seller"
			};

	request.post( config.couchdb, { json : data }, function (error, response, body) {
			if (error) {
                console.log(body);
            }
			return callback(response.body);
		}
	);
};



exports.get_unprocessed_adresses_younger_than = function(timestamp, callback){
	// запрашиваем view кауча, по которому получаем необработанные задания
	var protocol = config.couchdb.substr(0,5) == 'https' ? https : http;
    protocol.get(config.couchdb + '/_design/address/_view/unprocessed_by_timestamp?startkey='+timestamp+'&inclusive_end=true&limit=1&reduce=false&include_docs=true', function(ret) {
		  var json  = '';
		  ret.on('data', function(d) { json += d; });
		  ret.on('end', function() { return callback(json); });
    });
};


exports.get_unpaid_adresses_younger_than = function(timestamp, callback){
	// запрашиваем view кауча, по которому получаем необработанные задания
	var protocol = config.couchdb.substr(0,5) == 'https' ? https : http;
    protocol.get(config.couchdb + '/_design/address/_view/unpaid_by_timestamp?startkey='+timestamp+'&inclusive_end=true&limit=1&reduce=false&include_docs=true', function(ret) {
		  var json  = '';
		  ret.on('data', function(d) { json += d; });
		  ret.on('end', function() { return callback(json); });
    });
};


exports.get_paid_adresses_younger_than = function(timestamp, callback){
	// запрашиваем view кауча, по которому получаем необработанные задания
	var protocol = config.couchdb.substr(0,5) == 'https' ? https : http;
    protocol.get(config.couchdb + '/_design/address/_view/paid_by_timestamp?startkey='+timestamp+'&inclusive_end=true&limit=1&reduce=false&include_docs=true', function(ret) {
		  var json  = '';
		  ret.on('data', function(d) { json += d; });
		  ret.on('end', function() { return callback(json); });
    });
};




exports.take_job = function(json, callback){
	// помечаем и сохраняем обратно в БД
	json.processed = 'processing';
	request.put( config.couchdb + '/' + json._id,
		{ "json" : json },
        callback
	);
};



exports.save_job_results = function(json, callback){
	request.put( config.couchdb + '/' + json._id,
		{ "json" : json },
        callback
	);
};

