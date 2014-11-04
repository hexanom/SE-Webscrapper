"use strict";

var async = require('async');
var mlspotlight = require('dbpedia-spotlight');
var request = require('supertest');

module.exports = function rdfExtracter(page, next) {
  var jenaPort = process.env.JENA_PORT || 3030;
  if(!page.text) {
    return next(null, page);
  }

  async.waterfall([
    function annotate(cb) {
      mlspotlight.annotate(page.text, function(output) {
        cb(null, output);
      });
    },
    function extractUris(output, cb) {
      if(output.response) {
        cb(null, output.response.Resources.map(function (uri) {
          return uri['@URI'];
        }));
      } else {
        cb(null, []);
      }
    },
    function getTriples(uris, cb) {

      function uri2triplets(uri, cb) {
        var query = "SELECT * WHERE { ?s ?p ?o. FILTER(?s in (<%1>)) }".replace("%1", uri);
        var url = "/sparql?default-graph-uri=http://dbpedia.org&query=%1&format=turtle&timeout=30000".replace("%1", query);

        request("http://dbpedia.org")
          .get(url)
          .expect(200)
          .end(cb);
      }

      async.map(uris, uri2triplets, function(err, results) {
        cb(null, results);
      });
    },
    function responses2Triples(res, cb) {
      var triples = res.map(function (response) {
        return response.text;
      });
      cb(null, triples);
    },
    function consolidateTriples(triples, cb) {
      var allTriples = triples.join('\n').replace(/[\u200D-\u2070]/g, '�');

      cb(null, allTriples);
    },
    function sendToJena(allTriples, cb) {
      request("http://localhost:" + jenaPort)
          .put("/sem/data")
          .query({ graph: page.url })
          .set('Content-Type', 'text/turtle')
          .send(allTriples)
          .expect(204)
          .end(cb);
    },
    function askJenaForGraph(res, cb) {
      request("http://localhost:" + jenaPort)
          .get("/sem/data")
          .query({ graph: page.url })
          .set('Accept', 'application/json')
          .expect(200)
          .end(cb);
    },
    function processBody(res, cb) {
      if(res.body) {
        page.graph = res.body;
      }
      cb(null, page);
    }
  ], next);
};
