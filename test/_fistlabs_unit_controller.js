/*eslint max-nested-callbacks: 0*/
/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('assert');
var fist = require('fist');
var path = require('path');
var supertest = require('supertest');

describe('_fistlabs_unit_controller', function () {
    function getApp(params) {
        var core = fist(params);
        core.install(path.join(__dirname, '../_fistlabs_unit_controller'));
        core.alias('_fistlabs_unit_controller', '_contr');
        return core;
    }

    it('Should have settings.viewsDir by default', function (done) {
        var app = getApp();

        app.unit({
            name: 'foo',
            base: '_contr'
        });

        app.ready().done(function () {
            assert.strictEqual(app.getUnit('foo').settings.viewsDir,
                path.join(app.params.root, 'views'));
            done();
        });
    });

    it('Should install engines by config passed', function (done) {
        var app = getApp();
        var fooEngine = require('./fixtures/engines/foo');

        app.unit({
            name: 'foo',
            base: '_contr',
            settings: {
                engines: {
                    foo: fooEngine,
                    bar: path.join(__dirname, '../test/fixtures/engines/foo')
                }
            }
        });

        app.ready().done(function () {
            var unit = app.getUnit('foo');
            var engine;

            engine = _.find(unit.__enginesAvailable, {
                extname: 'foo'
            });

            assert.deepEqual(engine, {
                extname: 'foo',
                render: fooEngine
            });

            engine = _.find(unit.__enginesAvailable, {
                extname: 'bar'
            });

            assert.deepEqual(engine, {
                extname: 'bar',
                render: fooEngine
            });

            done();
        });
    });

    it('Should assign the unit with route', function (done) {
        var app = getApp();

        app.unit({
            base: '_contr',
            name: 'foo',
            rule: '/'
        });

        app.ready().done(function () {
            var route = app.router.getRule('foo');

            assert.ok(route);
            assert.strictEqual(route.data.name, 'foo');

            done();
        });
    });

    describe('unit._render()', function () {
        it('Should render template with engine', function (done) {
            var app = getApp({
                unitSettings: {
                    _contr: {
                        viewsDir: path.join(__dirname, '../test/fixtures/views'),
                        engines: {
                            '.js': function (f, o, cb) {
                                cb(new Error());
                            },
                            '.0.js': require('../test/fixtures/engines/0'),
                            '0.js': function (f, o, cb) {
                                cb(new Error());
                            },
                            '.0': function (f, o, cb) {
                                cb(new Error());
                            },
                            '.xyz': function (f, o, cb) {
                                cb(new Error());
                            }
                        }
                    }
                }
            });

            app.unit({
                name: 'index',
                base: '_contr',
                rule: '/',
                defaultViewName: 'index.0.js'
            });

            supertest(app.getHandler()).
                get('/').
                expect('0').
                end(done);
        });

        //  todo make asserts! just covered now
        it('Should not lookup template a twice', function (done) {
            var app = getApp({
                unitSettings: {
                    _contr: {
                        viewsDir: path.join(__dirname, '../test/fixtures/views'),
                        engines: {
                            '.0.js': require('../test/fixtures/engines/0')
                        }
                    }
                }
            });

            var handler = app.getHandler();

            app.unit({
                name: 'index',
                base: '_contr',
                rule: '/',
                defaultViewName: 'index.0.js'
            });

            supertest(handler).
                get('/').
                end(function () {
                    supertest(handler).
                        get('/').
                        end(done);
                });
        });

        it('Should send 500 if no engine found', function (done) {
            var app = getApp({
                unitSettings: {
                    _contr: {
                        viewsDir: path.join(__dirname, '../test/fixtures/views')
                    }
                }
            });

            app.unit({
                name: 'index',
                base: '_contr',
                rule: '/',
                defaultViewName: 'index.0.js'
            });

            supertest(app.getHandler()).
                get('/').
                expect(500).
                end(done);
        });

        it('Should send 500 if no view found', function (done) {
            var app = getApp({
                unitSettings: {
                    _contr: {
                        viewsDir: path.join(__dirname, '../test/fixtures/views'),
                        engines: {
                            '0.js': require('../test/fixtures/engines/0')
                        }
                    }
                }
            });

            app.unit({
                name: 'index',
                base: '_contr',
                rule: '/',
                defaultViewName: 'foo-bar-baz.0.js'
            });

            supertest(app.getHandler()).
                get('/').
                expect(500).
                end(done);
        });
    });

    describe('Content-Type', function () {
        it('Should set default content type as text/html', function (done) {
            var app = getApp({
                unitSettings: {
                    _contr: {
                        viewsDir: path.join(__dirname, '../test/fixtures/views'),
                        engines: {
                            '.0.js': require('../test/fixtures/engines/0')
                        }
                    }
                }
            });

            app.unit({
                name: 'index',
                base: '_contr',
                rule: '/',
                defaultViewName: 'index.0.js'
            });

            supertest(app.getHandler()).
                get('/').
                expect('Content-Type', /text\/html/).
                end(done);
        });

        it('Should not set default content type if already set', function (done) {
            var app = getApp({
                unitSettings: {
                    _contr: {
                        viewsDir: path.join(__dirname, '../test/fixtures/views'),
                        engines: {
                            '.0.js': require('../test/fixtures/engines/0')
                        }
                    }
                }
            });

            app.unit({
                name: 'index',
                base: '_contr',
                rule: '/',
                defaultViewName: 'index.0.js',
                main: function (track, context) {
                    track.header('Content-Type', 'foo/bar');
                    return this.__base(track, context);
                }
            });

            supertest(app.getHandler()).
                get('/').
                expect('Content-Type', 'foo/bar').
                end(done);
        });
    });
});
