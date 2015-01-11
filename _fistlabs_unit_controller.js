'use strict';

var FistError = /** @type FistError */ require('fist/core/fist-error');

var _ = require('lodash-node');
var f = require('util').format;
var hasProperty = Object.prototype.hasOwnProperty;
var vow = require('vow');
var path = require('path');

var noEngine = {
    render: function (filename, options, done) {
        var msg = f('There is no engine found for view %j', filename);
        var err = new FistError('NO_ENGINE_FOUND', msg);
        done(err);
    }
};

module.exports = function (app) {

    /**
     * @class _fistlabs_unit_controller
     * @extends Unit
     * */
    app.unit({

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @property
         * */
        base: 0,

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @property
         * @type {String}
         * */
        name: '_fistlabs_unit_controller',

        /**
         * @private
         * @memberOf {_fistlabs_unit_controller}
         * @method
         * @constructs
         * */
        __constructor: function (settings) {
            this.__base(settings);

            /**
             * @private
             * @memberOf {_fistlabs_unit_controller}
             * @property
             * @type {Array}
             * */
            this.__enginesAvailable = [];

            /**
             * @private
             * @memberOf {_fistlabs_unit_controller}
             * @property
             * @type {Array}
             * */
            this.__engineLookupCache = {};

            _.forOwn(this.settings.engines, function (render, extname) {
                if (!_.isFunction(render)) {
                    render = require(render);
                }

                this.__enginesAvailable.push({
                    extname: extname,
                    render: render
                });
            }, this);

            if (this.rule) {
                app.route(this.rule, {
                    name: this.name,
                    unit: this.name
                });
            }
        },

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @property
         * @type {Number}
         * */
        maxAge: 0,

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @property
         * @type {Object}
         * */
        settings: {
            viewsDir: path.join(app.params.root, 'views')
        },

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @property
         * @type {String}
         * */
        defaultViewName: '',

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         *
         * @returns {String}
         * */
        lookupViewName: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return this.defaultViewName;
        },

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         *
         * @returns {Number}
         * */
        createResponseStatus: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return track.status();
        },

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         *
         * @returns {Object}
         * */
        createResponseHeader: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return {
                'Content-Type': 'text/html; charset="UTF-8"'
            };
        },

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         *
         * @returns {Object}
         * */
        createViewOpts: function (track, context) {
            return context;
        },

        /**
         * @public
         * @memberOf {_fistlabs_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         *
         * @returns {vow.Promise}
         * */
        main: function (track, context) {
            var viewName = this.lookupViewName(track, context);
            var viewOpts = this.createViewOpts(track, context);
            var defer = vow.defer();
            var self = this;

            viewName = path.resolve(this.settings.viewsDir, viewName);

            this._render(viewName, viewOpts, function (err, responseBody) {
                if (err) {
                    defer.reject(err);
                    return;
                }

                track.
                    status(self.createResponseStatus(track, context)).
                    header(self.createResponseHeader(track, context)).
                    send(responseBody);

                defer.resolve(responseBody);
            });

            return defer.promise();
        },

        /**
         * @protected
         * @memberOf {_fistlabs_unit_controller}
         * @method
         *
         * @param {String} filename
         * @param {Object} options
         * @param {Function} done
         * */
        _render: function (filename, options, done) {
            if (!hasProperty.call(this.__engineLookupCache, filename)) {
                this.__engineLookupCache[filename] = findEngine(this, filename);
            }

            this.__engineLookupCache[filename].render(filename, options, done);
        }
    });
};

function findEngine(self, filename) {
    var enginesAvailable = self.__enginesAvailable;
    var engine;
    var i;
    var l;
    var enginesFound = [[0, noEngine]];
    var matchLength;

    for (i = 0, l = enginesAvailable.length; i < l; i += 1) {
        engine = enginesAvailable[i];
        matchLength = getMatchLength(filename, engine.extname);

        if (matchLength) {
            enginesFound[enginesFound.length] = [matchLength, engine];
        }
    }

    enginesFound.sort(function (a, b) {
        a = a[0];
        b = b[0];

        if (a > b) {
            return -1;
        }

        return 1;
    });

    return enginesFound[0][1];
}

function getMatchLength(filename, extname) {
    //  do not use path.extname coz for files like that: "foo.bemhtml.js"
    //  path.extname will return ".js" but we want ".bemhtml.js"
    var i = filename.indexOf(extname);

    if (i === -1) {
        return 0;
    }

    if (i + extname.length === filename.length) {
        return extname.length;
    }

    return 0;
}
