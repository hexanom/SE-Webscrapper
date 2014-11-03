"use script";

var express = require('express');
var router = express.Router();
var async = require('async');


var ddgScrapper = require('../lib/ddg-scrapper.js');
var textExtracter = require('../lib/text-extracter.js');
var rdfExtracter = require('../lib/rdf-extracter.js');

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
    textExtracter,
    function rdfEach(texts, next) {
      async.map(texts, function mapTexts(text, cb) {
        rdfExtracter(text, cb);
      }, next);
    },
    // ???,
    function renderResults(results, cb) {
      res.render('index', { query: req.query.q, results: results });
    }
  ], next);
});

module.exports = router;
