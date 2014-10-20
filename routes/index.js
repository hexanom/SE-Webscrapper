var express = require('express');
var router = express.Router();

var ddgScrapper = require('../lib/ddg-scrapper.js');

router.get('/', function(req, res) {
  res.render('index', { query: req.query.q });
});

module.exports = router;
