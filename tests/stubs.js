exports.fetch_transactions_by_address = function (address, callback) {
  callback(
        [{
          'block_hash': '0000000000000000092d8faa07191b53d5933e7cdea02656d5143a18ceeb0d42',
          'block_height': 388220,
          'block_index': 227,
          'hash': 'df10e810877543c2174cf65e1ea33831fd58f228bb016671b3799616dd1ab703',
          'addresses': ['19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL', '1K9iz1m1D66USeYXjxcBuWjM4fgbA5ZKQi'],
          'total': 1242000,
          'fees': 10000,
          'size': 191,
          'preference': 'high',
          'relayed_by': '198.50.138.53:8333',
          'confirmed': '2015-12-13T19:33:40Z',
          'received': '2015-12-13T19:23:31.226Z',
          'ver': 1,
          'lock_time': 0,
          'double_spend': false,
          'vin_sz': 1,
          'vout_sz': 1,
          'confirmations': 11664,
          'confidence': 1,
          'inputs': [{
            'prev_hash': '22bb139437bcab5dcf5bb6a7829fbb47b7b714e2d105a38e76862ab34a3bd18e',
            'output_index': 0,
            'script': '4730440220551039d7fd8847f9e5a6693cfb25fcc8a5c68ec809bcd3508c21679b63e14e920220191d6ea4668cbd887b22e0dd5787637b64c67877f6ac9d780570322a941b978a0121036f628cc7cb465379fe054b5854f6b88b56aa389b8e8f665d8eb2176a777dfd2c',
            'output_value': 1252000,
            'sequence': 4294967295,
            'addresses': ['19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL'],
            'script_type': 'pay-to-pubkey-hash'
          }],
          'out': [{
            'value': 1242000,
            'script': '76a914c718a32ec8537ad54ee22c8a645b6ddc278c0e3c88ac',
            'addresses': ['1K9iz1m1D66USeYXjxcBuWjM4fgbA5ZKQi'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1K9iz1m1D66USeYXjxcBuWjM4fgbA5ZKQi',
            'n': 0
          }]
        }, {
          'block_hash': '000000000000000008f9beb763ccf1a3e459a5daaa36a5b3b21e12f8d24fb32d',
          'block_height': 388218,
          'block_index': 218,
          'hash': '22bb139437bcab5dcf5bb6a7829fbb47b7b714e2d105a38e76862ab34a3bd18e',
          'addresses': ['15a6jyABWNAhKSfqUYJd16K9FNqo91mTVK', '19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL', '1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati', '1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he'],
          'total': 1481476685,
          'fees': 15000,
          'size': 260,
          'preference': 'high',
          'relayed_by': '192.99.44.42:8333',
          'confirmed': '2015-12-13T19:16:22Z',
          'received': '2015-12-13T19:10:05.608Z',
          'ver': 1,
          'lock_time': 388206,
          'double_spend': false,
          'vin_sz': 1,
          'vout_sz': 3,
          'confirmations': 11666,
          'confidence': 1,
          'inputs': [{
            'prev_hash': '69051fdc0f7a7a1655d5fed3296de5b6111f73357a349b0ef0765d4f7f7da91c',
            'output_index': 2,
            'script': '4830450221008ab992b7a786b74e46b740979510fcd153ae23cf9e4dfe7fbe24bbbf7f4695cf02200bf8d1b197349192689abfcdfad35836e02e395ba1b7cd7380eb36d2d6f51c10012102620350e6a58a0ebadef60849aabbaf18ef28f0a853a7f87fa373aadc2d3446ee',
            'output_value': 1481491685,
            'sequence': 4294967294,
            'addresses': ['15a6jyABWNAhKSfqUYJd16K9FNqo91mTVK'],
            'script_type': 'pay-to-pubkey-hash'
          }],
          'outputs': [{
            'value': 1252000,
            'script': '76a9145c08b6e48a3baeff48874f658c077e90c1bad97f88ac',
            'addresses': ['19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL',
            'n': 0
          }, {
            'value': 1219484685,
            'script': '76a91408d7d7ff9bf80739ba6e833a8d799376cdbffd2e88ac',
            'addresses': ['1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he',
            'n': 1
          }, {
            'value': 260740000,
            'script': '76a9148527c4f69b45b6d635c848f97684eaaf5a7c9f7488ac',
            'addresses': ['1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati',
            'n': 2
          }],
          'out': [{
            'value': 1252000,
            'script': '76a9145c08b6e48a3baeff48874f658c077e90c1bad97f88ac',
            'addresses': ['19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL',
            'n': 0
          }, {
            'value': 1219484685,
            'script': '76a91408d7d7ff9bf80739ba6e833a8d799376cdbffd2e88ac',
            'addresses': ['1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he',
            'n': 1
          }, {
            'value': 260740000,
            'script': '76a9148527c4f69b45b6d635c848f97684eaaf5a7c9f7488ac',
            'addresses': ['1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati',
            'n': 2
          }]
        }]
    )
}

exports.fetch_transactions_by_address2 = function (address, callback) {
  callback(
        [{
          'block_hash': '0000000000000000092d8faa07191b53d5933e7cdea02656d5143a18ceeb0d42',
          'block_height': 388220,
          'block_index': 227,
          'hash': 'df10e810877543c2174cf65e1ea33831fd58f228bb016671b3799616dd1ab703',
          'addresses': ['19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL', '1K9iz1m1D66USeYXjxcBuWjM4fgbA5ZKQi'],
          'total': 1242000,
          'fees': 10000,
          'size': 191,
          'preference': 'high',
          'relayed_by': '198.50.138.53:8333',
          'confirmed': '2015-12-13T19:33:40Z',
          'received': '2015-12-13T19:23:31.226Z',
          'ver': 1,
          'lock_time': 0,
          'double_spend': false,
          'vin_sz': 1,
          'vout_sz': 1,
          'confirmations': 11664,
          'confidence': 1,
          'inputs': [{
            'prev_hash': '22bb139437bcab5dcf5bb6a7829fbb47b7b714e2d105a38e76862ab34a3bd18e',
            'output_index': 0,
            'script': '4730440220551039d7fd8847f9e5a6693cfb25fcc8a5c68ec809bcd3508c21679b63e14e920220191d6ea4668cbd887b22e0dd5787637b64c67877f6ac9d780570322a941b978a0121036f628cc7cb465379fe054b5854f6b88b56aa389b8e8f665d8eb2176a777dfd2c',
            'output_value': 1252000,
            'sequence': 4294967295,
            'addresses': ['19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL'],
            'script_type': 'pay-to-pubkey-hash'
          }],
          'out': [{
            'value': 1242000,
            'script': '76a914c718a32ec8537ad54ee22c8a645b6ddc278c0e3c88ac',
            'addresses': ['1K9iz1m1D66USeYXjxcBuWjM4fgbA5ZKQi'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1K9iz1m1D66USeYXjxcBuWjM4fgbA5ZKQi',
            'n': 0
          }]
        }, {
          'block_hash': '000000000000000008f9beb763ccf1a3e459a5daaa36a5b3b21e12f8d24fb32d',
          'block_height': 388218,
          'block_index': 218,
          'hash': '22bb139437bcab5dcf5bb6a7829fbb47b7b714e2d105a38e76862ab34a3bd18e',
          'addresses': ['15a6jyABWNAhKSfqUYJd16K9FNqo91mTVK', '19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL', '1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati', '1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he'],
          'total': 1481476685,
          'fees': 15000,
          'size': 260,
          'preference': 'high',
          'relayed_by': '192.99.44.42:8333',
          'confirmed': '2015-12-13T19:16:22Z',
          'received': '2015-12-13T19:10:05.608Z',
          'ver': 1,
          'lock_time': 388206,
          'double_spend': false,
          'vin_sz': 1,
          'vout_sz': 3,
          'confirmations': 11666,
          'confidence': 1,
          'inputs': [{
            'prev_hash': '69051fdc0f7a7a1655d5fed3296de5b6111f73357a349b0ef0765d4f7f7da91c',
            'output_index': 2,
            'script': '4830450221008ab992b7a786b74e46b740979510fcd153ae23cf9e4dfe7fbe24bbbf7f4695cf02200bf8d1b197349192689abfcdfad35836e02e395ba1b7cd7380eb36d2d6f51c10012102620350e6a58a0ebadef60849aabbaf18ef28f0a853a7f87fa373aadc2d3446ee',
            'output_value': 1481491685,
            'sequence': 4294967294,
            'addresses': ['15a6jyABWNAhKSfqUYJd16K9FNqo91mTVK'],
            'script_type': 'pay-to-pubkey-hash'
          }],
          'outputs': [{
            'value': 1252000,
            'script': '76a9145c08b6e48a3baeff48874f658c077e90c1bad97f88ac',
            'addresses': ['19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL'],
            'script_type': 'pay-to-pubkey-hash',
            'spent_by': 'd4a57cbecb2390c29b1d88a1fad962a2ae962a480142bfd084f16a039fb97026',
            'addr': '19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL',
            'n': 0
          }, {
            'value': 1219484685,
            'script': '76a91408d7d7ff9bf80739ba6e833a8d799376cdbffd2e88ac',
            'addresses': ['1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he'],
            'spent_by': 'd4a57cbecb2390c29b1d88a1fad962a2ae962a480142bfd084f16a039fb97026',
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he',
            'n': 1
          }, {
            'value': 260740000,
            'script': '76a9148527c4f69b45b6d635c848f97684eaaf5a7c9f7488ac',
            'addresses': ['1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati'],
            'spent_by': 'd4a57cbecb2390c29b1d88a1fad962a2ae962a480142bfd084f16a039fb97026',
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati',
            'n': 2
          }],
          'out': [{
            'value': 1252000,
            'script': '76a9145c08b6e48a3baeff48874f658c077e90c1bad97f88ac',
            'addresses': ['19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL'],
            'spent_by': 'd4a57cbecb2390c29b1d88a1fad962a2ae962a480142bfd084f16a039fb97026',
            'script_type': 'pay-to-pubkey-hash',
            'addr': '19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL',
            'n': 0
          }, {
            'value': 1219484685,
            'script': '76a91408d7d7ff9bf80739ba6e833a8d799376cdbffd2e88ac',
            'addresses': ['1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1okyd1hCTbLuYwtJ5yAU3o9GWPSxYd5he',
            'n': 1
          }, {
            'value': 260740000,
            'script': '76a9148527c4f69b45b6d635c848f97684eaaf5a7c9f7488ac',
            'addresses': ['1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '1D94Wjrs8v1XhtjkYdmN2wYrD8yypkqati',
            'n': 2
          }, { // fake
            'value': 6666,
            'script': '76a9145c08b6e48a3baeff48874f658c077e90c1bad97f88ac',
            'addresses': ['19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL'],
            'script_type': 'pay-to-pubkey-hash',
            'addr': '19Pdc8xh66RfTqMdQbs7gxTYqcAY48qRTL',
            'n': 3
          }]
        }]
    )
}

