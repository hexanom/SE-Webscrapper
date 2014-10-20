var express = require('express');
var router = express.Router();
var async = require('async');


var ddgScrapper = require('../lib/ddg-scrapper.js');

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
    // textExtracter,
    // rdfExtracter,
    // ???,
    function renderResults(results, cb) {
      console.log(results);
      res.render('index', { query: req.query.q, results: results });
    }
  ], next);
});

module.exports = router;
