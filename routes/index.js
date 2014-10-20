var express = require('express');
var router = express.Router();

var ddgScrapper = require('../lib/ddg-scrapper.js');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Form' });
});

/* POST home page */
router.get('/search', function(req, res) {
  res.render('index', { title: 'Results' });
});

module.exports = router;
