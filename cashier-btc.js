/**
 * Cashier-BTC
 * -----------
 * Self-hosted bitcoin payment gateway
 *
 * License: WTFPL
 * Author: Igor Korsakov
 * */

/* global btc_usd:true */
/* global btc_eur:true */
/* global sellers:true */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var express = require('express');
var app = express();
app.set('trust proxy', 'loopback');

var bodyParser = require('body-parser')
    , config = require('./config')
    , fs = require('fs')
    , storage = require('./models/storage')
    , https = require('https');

app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json(null)); // parse application/json

btc_usd = 250; // initial
btc_eur = 200;
sellers = {}; // cache of existing sellers' wallets

app.use('/qr', express.static('qr'));

app.use(require('./controllers/api'));
app.use(require('./controllers/website'));






var update_exchange_rate = function(pair){
    https.get('https://btc-e.com/api/3/ticker/' + pair, function(ret) {
		var json  = '';
		ret.on('data', function(d) { json += d; });
		ret.on('end', function() {
			json = JSON.parse(json);
            var rate;
            if (json[pair].buy) {
                rate = json[pair].buy;
            } else {
                console.log(json);
            }
            switch (pair){
                case 'btc_eur': btc_eur = rate; break;
                case 'btc_usd': btc_usd = rate; break;
            }
		});
    });
};


update_exchange_rate('btc_usd');
update_exchange_rate('btc_eur');
setInterval(function(){update_exchange_rate('btc_usd');}, 60*1000);
setInterval(function(){update_exchange_rate('btc_eur');}, 60*1000);






// checking design docs in Couchdb
fs.readdir('./_design_docs', function(err, design_docs){
    if(err) {
        console.log('Cant read design documents list');
        process.exit();
    }

    var read_file_callback = function (err,data) {
        var json = JSON.parse(data);
        if (err) {
            return console.log(err);
        }
        storage.get_document(json._id, function(doc){
            if (!doc || doc.error == 'not_found') {
                console.log(json._id + ' design doc needs to be created');
                storage.save_document(json, function(response){
                    console.log("Creating design document resulted in:", response);
                });
            }
        });
    };

    for (var i = 0; i < design_docs.length; i++){
        fs.readFile('./_design_docs' + '/' + design_docs[i], 'utf8', read_file_callback);
    }
}); // done with design docs




// street magic
process.on('uncaughtException', function(err){
    console.log('Exception: ' + err);
});


server = app.listen(config.port, function() {
    console.log('Listening on port %d', config.port);
});


module.exports = server;