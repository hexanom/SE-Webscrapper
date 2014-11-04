"use strict";

var async = require('async');
var unfluff = require('unfluff');

module.exports = function textExtracter(html) {
  if(!html) {
    return null;
  }
  return unfluff(html).text;
};
