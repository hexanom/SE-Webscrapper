"use strict";
var async = require('async');

module.exports = function ddgScrapper(searchQuery, next) {
  async.waterfall([
    function queryDdg(cb) {
      cb(null, []);
    },
    function mapResults(data, cb) {

    }
  ], next);
};
