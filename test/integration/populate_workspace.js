/**
* Copyright (C) 2015-2018 Starbreeze AB All Rights Reserved.
*/

'use strict';

// Print stack trace for debugging
global.debug = true;

const should = require('should');
const Test_util = require('../util/test_util');

const bilrost = require('../util/server');

let client, test_util;

describe('Run Workspace related functional tests for the API', function() {
    /* faking bilrost-client
       we define a bilrost_client that simply calls the callback with
       the predefined parameters.
       These parameters are only declared here, and they are set in
       a before clause according to what we want to test.
     */
    let err, req, res, obj;
    const bilrost_client = {
        get: (url, callback) => callback(err, req, res, obj)
    };

    before("Starting a Content Browser server", async () => {
        client = await bilrost.start({
            bilrost_client,
            protocol: 'ssh'
        });
        test_util = new Test_util('populate_workspace', 'good_repo', client);
    });

    before('Creating fixtures', function(done) {
        this.timeout(5*this.timeout()); // = 5 * default = 5 * 2000 = 10000
        test_util.create_eloise_fixtures()
            .then(() => done())
            .catch(err => {
                done(err);
            });
    });

    describe('Populate eloise workspaces', function() {

        before('Set bilrost_client answer', function() {
            err = false;
            req = null;
            res = null;
            obj = test_util.get_example_project();
        });

        it('Populate a workspace', function(done) {
            this.timeout(8*this.timeout());
            test_util.client
                .post('/assetmanager/workspaces/populate')
                .send({
                    file_uri: test_util.get_eloise_file_uri(),
                    name: test_util.get_example_project().name,
                    description: test_util.get_example_project().description.comment
                })
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        return done({ error: err.toString(), status: res.status, body: res.body });
                    }
                    let obj = test_util.get_favorite().search(test_util.get_carol_file_uri());

                    obj.should.be.an.Object;
                    should.equal(test_util.does_workspace_exist('good_repo'), true);
                    should.equal(test_util.does_workspace_internals_valid('good_repo'), true);
                    done();
                });
        });
        it('Delete well the populated workspace', function(done){
            test_util.client
                .delete(`/assetmanager/workspaces/${test_util.get_example_project().name}`)
                .send()
                .set("Accept", 'application/json')
                .set("Content-Type", "application/json")
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        return done({ error: err.toString(), status: res.status, body: res.body });
                    }
                    test_util.get_favorite().search(test_util.get_eloise_file_uri()).should.equal(false);
                    should.equal(test_util.does_workspace_exist('good_repo'), false);
                    done();
                });
        });
    });

});