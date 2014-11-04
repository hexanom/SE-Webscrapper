"use strict";

var express = require('express');
var router = express.Router();
var async = require('async');


var ddgScrapper = require('../lib/ddg-scrapper.js');
var textExtracter = require('../lib/each/text-extracter.js');
var rdfExtracter = require('../lib/each/rdf-extracter.js');

router.get('/', function(req, res, next) {
  if(!req.query.q) {
    res.render('index');
    return next();
  }
  async.waterfall([
    function getQuery(cb) {
      cb(null, req.query.q);
    },
    ddgScrapper,
    function(pages, cb) {
      async.map(pages, function mapPages(page, cbMap) {
        async.waterfall([
          function getPage(cbGet) {
            cbGet(null, page);
          },
          textExtracter,
          rdfExtracter
        ], cbMap);
      }, cb);
    },
    // ???,
    function renderResults(results, cb) {
      res.render('index', { query: req.query.q, results: results });
    }
  ], next);
});

module.exports = router;
