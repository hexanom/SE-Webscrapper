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
      var pages = [];
      $('.links_main a.large').each(function(i, e) {
        pages.push({
          url: $(this).attr('href'),
          name: $(this).text()
        });
      });
      cb(null, pages);
    },
    function mapToRequests(pages, cb) {
      async.map(pages, function mapURLS(page, cbMap) {
        request("")
          .get(page.url)
          .end(function(err, res) {
            if(res && /html/.test(res.headers['content-type'])) {
              page.html = res.text;
            }
            cbMap(null, page);
          });
      }, cb);
    }
  ], next);
};
