"use strict";

var async = require('async');
var unfluff = require('unfluff');

module.exports = function textExtracter(page, next) {
  if(page.html) {
    page.text = unfluff(page.html).text;
  }
  next(null, page);
};
