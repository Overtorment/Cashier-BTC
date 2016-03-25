/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */


/*
	этот воркер обходит все оплаченые адреса, выводит с них 
	бабло и помечает как paid_and_sweeped
*/

var async = require('async')
    , storage = require('./models/storage')
    , config = require('./config')
    , blockchain = require('./models/blockchain');


var iteration = function(next){ // тело воркера
	async.waterfall([
        get_job,
        process_job,
        save_job_results,
		function( json, callback ){ console.log('.');setTimeout(callback, 1000); }
	], function(err){
		if (++iteration.num_times_executed >= 100) {
            console.log("Grace restart");
			setTimeout(function(){
				process.exit(0); 
			}, 10*1000); // grace period for all processes to end, and then terminate
		} else {
			next();
		}
	});
};

iteration.num_times_executed = 0;


async.forever(
    iteration
);











function get_job(callback){
	storage.get_paid_adresses_younger_than(Math.floor(Date.now() / 1000)-config.process_paid_for_period, function(json){ return callback(null, json); });
}


function process_job(json, callback){
	json = JSON.parse(json);
	if (typeof json.rows[0] == 'undefined') {
		return callback(null, false);
	}  // no jobs, пробрасываем чтоб waterfall доходил до логического конца

	var job = json.rows[0].doc;

	if (job === false) {
		return callback(null, false);
	}  // пробрасываем чтоб waterfall доходил до логического конца

	blockchain.get_address(job.address, function(resp) { // getting address balance

        console.log('address: ' + job.address + " expect: " + job.btc_to_ask + ' confirmed: '+ (resp.btc_actual) + ' unconfirmed: '+ (resp.btc_unconfirmed));

        if (resp.btc_actual == resp.btc_unconfirmed){ // balance is ok, need to transfer it
            storage.get_seller(job.seller, function(seller){ // get seller's address
                console.log("transferring " + resp.btc_actual + " BTC (minus fee) from " + job.address + " to seller's address "  + seller.address);
                if (seller === false || !seller.address) {
                    console.log('seller problem, skip');
                    return callback(null, false);
                }

                blockchain.create_transaction(seller.address, resp.btc_actual-0.0001, 0.0001, job.WIF, function(transaction){
                    blockchain.broadcast_transaction(transaction, function(result) {
                        if (!result.error)
                            job.processed = 'paid_and_sweeped';
                        else
                            job.processed = 'paid';

                        job.blockchain_responses = job.blockchain_responses || {};
                        job.blockchain_responses[+new Date()] = result;
                        return callback(null, job);
                    });
                });
            });
        } else { // balance is not ok, probably it is still unconfirmed
            console.log('balance is not ok, skip');
            return callback(null, false);
        }
	});
}


function save_job_results(json, callback){
	if (json === false) {
        return callback(null, false);
    } // пробрасываем чтоб waterfall доходил до логического конца
    storage.save_job_results(json, 		function (error, response) {
			if (!error && response.statusCode == 201) {
				return callback(null);
			} else {
				console.log('err:' + JSON.stringify(response));
				return callback(null, false);
			}
    });
}