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
    , Chain = require('chain-node')
    , config = require('./config')
    , chain = new Chain(config.chain);

// street magic
process.on('uncaughtException', function(err){
    console.log('Exception: ' + err);
	process.exit(1); // restarting just for any case
});


var iteration = function(){ // тело воркера
	async.waterfall([
		function( callback ){  console.log('.');get_job(callback); },
		function( json, callback ){ prepare_job(json, callback); },
		function( json, callback ){ process_job(json, callback); },
		function( json, callback ){ save_job_results(json, callback); }
	], function(err){
		if (++iteration.num_times_executed >= 10000) {
			setTimeout(function(){
                console.log(err);
				console.log("Grace restart");
				process.exit(0); 
			}, 10*1000); // grace period for all processes to end, and then terminate
		} else {
			semaphore=false;   // сбрасываем семафор чтобы воркер работал бесконечно
		}
	});
};

iteration.num_times_executed = 0;



// костыльный способ сделать воркер.
// в отличии от while(1){} не отъест CPU камня в потолок
var semaphore = false; // используем для организации воркера
setInterval(function(){
    if (!semaphore){
        semaphore = true;
        return iteration();
    }
}, 10 * 1000);



















function get_job(callback){
	storage.get_paid_adresses_younger_than(Math.floor(Date.now() / 1000)-config.process_paid_for_period, function(json){ return callback(null, json); });
}



function prepare_job(json, callback){
	json = JSON.parse(json);
	if (typeof json.rows[0] == 'undefined') {
		return callback(null, false);
	}  // no jobs, пробрасываем чтоб waterfall доходил до логического конца

	json = json.rows[0].doc;
	return callback(null, json);
}


function process_job(job, callback){
	if (job === false) {
		return callback(null, false);
	}  // пробрасываем чтоб waterfall доходил до логического конца

	chain.getAddress(job.address, function(err, resp) { // getting address balance
		if (!resp[0]){
			job.processed = 'bad_paid_address';
			return callback(null, job);
		} else {
			console.log('address: ' + job.address + " expect: " + job.btc_to_ask + ' confirmed: '+ (resp[0].confirmed.balance/100/1000/1000) + ' unconfirmed: '+ (resp[0].total.balance/100/1000/1000));

			if (resp[0].confirmed.balance == resp[0].total.balance){ // balance is ok, need to transfer it
				storage.get_seller(job.seller, function(seller){ // get seller's address
					console.log("transferring from " + job.address + " to seller's address "  + seller.address);
					console.log(seller);
					if (seller === false || !seller.address) {
                        return callback(null, false);
                    }
					try {
					chain.transact(
					  {
						inputs: [
						  {
							address: job.address,
							private_key: job.private_key
						  }
						],
						outputs: [
						  {
							address: seller.address,
							"amount": resp[0].confirmed.balance  -    10000 /* fee */ // satoshis
						  }
						],
						miner_fee_rate : 10000
					  }, function(err, resp) {
							if (err) {
								console.log("err: " + err);
								return callback(null, false);
							} else {
								console.log(resp);
								job.processed = 'paid_and_sweeped';
								return callback(null, job);
							}
					  }); // end chain.transact()
					  } catch (err) {
						console.log('Transaction error!', err);
						return callback(null, false);
					  }
				});
			} else { // balance is not ok, probably it is still unconfirmed
				return callback(null, false);
			}
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