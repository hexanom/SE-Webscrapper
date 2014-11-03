"use strict";

var async = require('async');
var request = require('supertest');
var cheerio = require('cheerio');

module.exports = function ddgScrapper(searchQuery, next) {
  async.waterfall([
    function queryDdg(cb) {
      request("https://duckduckgo.com")
        .post('/html')
        .type('form')
        .send({q: searchQuery})
        .expect(200)
        .end(cb);
    },
    function mapUrls(res, cb) {
      var $ = cheerio.load(res.text);
      var tags = $('.links_main a.large').get();
      cb(null, tags.map(function(tag) { return tag.attribs.href; }));
    },
    function mapToRequests(URLs, cb) {
      async.map(URLs, function mapURLS(url, cb) {
        request("")
          .get(url)
          .end(function(err, res) {
            if(res && /text\/html/.test(res.headers['content-type'])) {
              cb(null, res.text);
            } else {
              cb(null, null);
            }
          });
      }, cb);
    }
  ], next);
};
