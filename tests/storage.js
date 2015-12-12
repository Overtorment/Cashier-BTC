var assert = require('assert');

describe('storage', function() {

    describe('#get_document()', function () {
        it('should return any db document', function (done) {
            var storage = require('./../models/storage');
            storage.get_document('_design/address',function(data) {
                if (!data) throw "Error";
                assert.equal(data._id, '_design/address');
                assert.equal(data.language, 'javascript');
                assert.ok(data.views.all_by_customer_and_timestamp, "all_by_customer_and_timestamp" );
                assert.ok(data.views.unprocessed_by_timestamp, "unprocessed_by_timestamp" );
                assert.ok(data.views.unpaid_by_timestamp, "unpaid_by_timestamp" );
                assert.ok(data.views.paid_by_timestamp, "paid_by_timestamp" );
                assert.ok(data.views.paid_and_sweeped_by_timestamp, "paid_and_sweeped_by_timestamp" );
                assert.ok(data.views.processing_by_timestamp, "processing_by_timestamp" );
                assert.ok(data.views.total_by_seller, "total_by_seller" );
                done();
            })
        });
    });


});

