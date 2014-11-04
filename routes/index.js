"use strict";

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
    function extractTextEach(htmls, cb) {
      var texts = {};
      async.each(Object.keys(htmls), function mapHtmls(uri, cbE) {
        var text = textExtracter(htmls[uri]);
        if(text) {
          texts[uri] = text;
        }
        cbE();
      }, function(err) {
        cb(err, texts);
      });
    },
    function rdfEach(texts, cb) {
      var graphs = {};
      async.each(Object.keys(texts), function mapTexts(uri, cbE) {
        rdfExtracter(uri, texts[uri], function(err, graph) {
          if(err && !graph) {
            return cbE(err);
          }
          graphs[uri] = graph;
          cbE();
        });
      }, function(err) {
        cb(err, graphs);
      });
    },
    // ???,
    function renderResults(results, cb) {
      res.render('index', { query: req.query.q, results: results });
    }
  ], next);
});

module.exports = router;
