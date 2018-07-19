Cashier-BTC
===================

v2 refactored and improved
---------------------------

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) Tests: [![CircleCI](https://circleci.com/gh/Overtorment/Cashier-BTC.svg?style=svg)](https://circleci.com/gh/Overtorment/Cashier-BTC)

Self-hosted Node.js Bitcoin payment gateway. Provides REST API (microservice).
Process Bitcoin payments on your end, securely, with no comission.

Request payments (invoicing), check payments (whether invoice is paid), receive callbacks if payment is made.
Aggregate funds on final (aggregational) address.
Depends on Nodejs v8+, Bitcoin Core, Couchdb for storage.

* Simple
* No 3rd parties (works though Bitcoin Core node)
* Transactions are signed locally. No private keys leak
* Battle-tested in production
* SegWit compatible


Installation
------------

```
$ git clone https://github.com/Overtorment/Cashier-BTC && cd Cashier-BTC
$ npm install
$ cp config.js.dev config.js
```

* Install [Bitcoin Core](BITCOIN-CORE-INSTALL.md)
* Install Couchdb (or use [https://cloudant.com](https://cloudant.com))

Edit `config.js`:

* Point it to a new Couchdb database
* Point it to a Bitcoin Core RPC server

Tests
-----

```
$ npm test
```

Running
-------

```
$ nodejs cashier-btc.js
$ nodejs worker.js
$ nodejs worker2.js
```

Open [http://localhost:2222](http://localhost:2222) in browser, you should see 'Cashier-BTC reporting for duty'.
That's it, ready to use.
Use tools like `supervisord` or `foreverjs` to keep it running.

License
-------

[WTFPL](http://www.wtfpl.net/txt/copying/)

Author
------

Igor Korsakov


TODO
----

* [x] ~~Get rid of Chain and leave Bitcore only~~
* [x] ~~Add options to work through bitcoind and other bitcoin network endpoints~~
* [x] ~~Add tests~~
* [x] ~~Better abstractioning (add more abstraction layers)~~
* [x] ~~CI~~
* [ ] Better logging & error handling
* [ ] Stats
* [ ] Better tests
* [x] ~~Ditch bitcore-lib in favor of bitcoinjs-lib~~
* [x] ~~SegWit~~
* [ ] Flexible (user-defined?) fees
* [ ] BigNumber lib for all numbers handling


API
===

### GET /request_payment/:expect/:currency/:message/:seller/:customer/:callback_url


Create a request to pay, supported currencies: BTC, USD, EUR. Non-btc currency is converted to btc using current rate from bitstamp.com.
Returns a json document with QR code to be displayed to the payer, and a unique address for that particular payment (you can use it as invoice id).
Message will be displayed to the client (for example, you can write "Payment for goods"). Seller and customer - system field, here you can
write the application that created the request and the payer id. Keep Seller field private, it is also used for payouts.
Callback_url will be requested once the invoice is paid.

	Example

		http://localhost:2222/request_payment/0.005/BTC/wheres%20the%20money%20lebowski/treehorn/lebowski/http%3A%2F%2Fgoogle.com%2F

	Response

		{
			"link" : "bitcoin:1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv?amount=0.004&message=wheres%20the%20money%20lebowski",
			"qr" : "http://localhost:2222/generate_qr/bitcoin%3A1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv%3Famount%3D0.004%26message%3Dwheres%2520the%2520money%2520lebowski",
			"qr_simple" : "http://localhost:2222/generate_qr/1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv",
			"address" : "1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv"
		}

Link can be opened by the payer, there is a chance it will be handled by his bitcoin wallet.
QR shoud be shown to payer as well. Duplicate it with text, like, dear user, please pay the %expect% amount to %address%.

### GET /check_payment/:address


Check payment by a unique address received in the "request_payment" call.


	Example

		http://localhost:2222/check_payment/16FsTPe5JG8yj1P31AqXrMGzu7iAet7NTL

	Response

		{
			"btc_expected" : 0.0001009,
			"btc_actual" : 0.0001009,
			"btc_unconfirmed" : 0.0001009
		}

Using difference between "btc_expected" and "btc_actual" you can judge whether payment request (invoice) was paid.
You can use this call to implement some kind of frontend animation which shows 'waiting for funds', and 
polls periodically about the status of payment (i.e. unconfirmed incoming funds, paid in full/not in full).
In case you accept unconfirmed balances (see `config.small_amount_threshhold`), you might want to check payment again before shipping actual goods.




### GET /payout/:seller/:amount/:currency/:address


Transfer funds from aggregated seller's address to some other address.
Supported currencies: BTC.
There's no additional sequrity here, it is presumed that the %seller% identifier is kept secret.
You might want to disable this call for security reasons (or manually replace seller's address in 
database with the one you control).

	Example

		http://localhost:2222/payout/new_test_seller/0.01/BTC/1MahZCousgNv6EAofCfi7Wpp2RKUfHH8uD

	Response

		If successfull, json document with transaction details (txid etc)


### GET /get_seller_balance/:seller


Check the total balance of seller's aggregated address.

	Example

		http://localhost:2222/get_seller_balance/treehorn

	Response

		Json encoded available balance


Hardening for Production
------------------------

When the `seller` is created in `/request_payment/` call, database record also stores seller's `address` 
and associated `WIF` which allows to spend seller's aggregated funds.
You might want to manually replace this record with your own `address` (probably a cold storage), and not putting `WIF` in the record.
This breaks the `/payout/` call, but at least the funds from orders will be forwarded to a secure storage.

Small risk remains with hot wallets still having their `WIFs` in the database, but this is a reality any other Bitcoin processor
has to live in.

Alternatives
============

Opensource alternatives
----------------------

* https://github.com/btcpayserver/btcpayserver
* http://docs.electrum.org/en/latest/merchant.html
* Your project here

SaaS alternatives
-----------------

* https://coingate.com/accept-bitcoin
* https://www.coinpayments.net
* https://coinsbank.com/merchant
* https://www.blockonomics.co/merchants#/page1
* https://www.paybear.io
* https://globee.com/
* https://opennode.co/ (lightning)
* https://strike.acinq.co/ (lightning)
* ~~coinbase~~ crap
* ~~bitpay~~ crap
* ~~Coinify~~ crap
* ~~Gocoin~~ crap
