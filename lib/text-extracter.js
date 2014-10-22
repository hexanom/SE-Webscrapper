"use script";

var async = require('async');
var unfluff = require('unfluff');

module.exports = function textExtracter(htmlResults, next) {
  async.map(htmlResults, function(html, cb) {
    if(html === null) {
      return cb(null, null);
    }
    cb(null, unfluff(html).text);
  }, next);
};
