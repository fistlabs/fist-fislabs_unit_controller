'use strict';

module.exports = function (filename, options, done) {
    var render = require(filename);
    done(null, render(options));
};
