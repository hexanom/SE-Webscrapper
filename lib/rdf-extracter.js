"use script";

var async = require('async');
var mlspotlight = require('dbpedia-spotlight');
var n3 = require('n3');
var request = require('supertest');

module.exports = function textExtracter(text, next) {
  async.waterfall([
    function annotate(cb) {
      mlspotlight.annotate(text, function(output) {
      	cb(null, output);
      })
    },
    function extractUris(output, cb) {
      var uris = output.response.Resources.map(function(uri) {
        return uri['@URI'];
      });
      cb(null, uris);
    },
    function getAssociatedTriplets(uris, cb) {

      function uri2triplets(uri, cb) {
        var query = "SELECT * WHERE { ?s ?p ?o. FILTER(?s in (<%1>)) }".replace("%1", uri);
        var url = "/sparql?default-graph-uri=http://dbpedia.org&query=%1&format=json&timeout=30000".replace("%1", query);

        request("http://dbpedia.org")
          .get(url)
          .expect(200)
          .end(cb);
      }

      async.map(uris, uri2triplets, function(err, results) {
        cb(null, results);
      });
    },
    function getJsonResponses(res, cb) {
      var jsonRes = res.map(function (resp) {
        return resp.text;
      });
      cb(null, jsonRes);
    },
    function processResponses(res, cb) {
      debugger;
      //???
    }
  ], next);
};
