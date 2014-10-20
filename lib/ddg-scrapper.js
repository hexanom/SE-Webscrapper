"use strict";
var async = require('async');
var request = require('supertest');

module.exports = function ddgScrapper(searchQuery, next) {
  async.waterfall([
    function queryDdg(cb) {
      request("https://api.duckduckgo.com/")
        .get('/search.json')
        .query({q: searchQuery, format:"json", pretty:1})
        .expect(200)
        .end(cb);
    },
    function mapResults(dataList, cb) {
      async.map(dataList, function mapURLS(element, cb) {
        cb(element.FirstURL);
      }, cb);
    },
    function mapToRequests(URLs, cb) {
      async.map(URLs, function mapURLS(element, cb) {
        request(url)
		.get('/result.html')
		.expect(200)
		.end(cb)
      }, cb);
    },
	function mapToHtmlContent(ContentList, cb) {
		async.map(ContentList, function mapHtmlContent(element, cb) {
		  cb(element.body.innerHtml);
		}, cb);
	}
  ], next);
};
