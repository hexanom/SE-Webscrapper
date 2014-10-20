"use strict";
var async = require('async');
var request = require('supertest');

module.exports = function ddgScrapper(searchQuery, next) {
  async.waterfall([
    function queryDdg(cb) {
      request("https://api.duckduckgo.com/")
        .get('/search.json')
        .query({q: searchQuery})
        .expect(200)
        .end(cb);
    },
    function mapResults(dataList, cb) {
      async.map(dataList, function mapURLS(element, cb) {
        cb(element.url);
      }, cb);
    },
    function mapToRequests(URLs, cb) {
      async.map(dataList, function mapURLS(element, cb) {
        request
      }, cb);
    },
  ], next);
};
