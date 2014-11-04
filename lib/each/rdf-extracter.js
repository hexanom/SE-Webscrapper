"use strict";

var async = require('async');
var mlspotlight = require('dbpedia-spotlight');
var request = require('supertest');

module.exports = function rdfExtracter(page, next) {
  var jenaPort = process.env.JENA_PORT || 3030;
  var dbpediaHost = process.env.DBPEDIA_HOST || "dbpedia.org";

  if(!page || !page.text) {
    return next(null, page);
  }

  async.waterfall([
    function annotate(cb) {
      try {
        mlspotlight.annotate(page.text, function(output) {
          cb(null, output);
        });
      } catch(e) {
        cb(null, null);
      }

    },
    function extractUris(output, cb) {
      if(output && output.response && output.response.Resources) {
        cb(null, output.response.Resources.map(function (uri) {
          return uri['@URI'];
        }));
      } else {
        cb(null, []);
      }
    },
    function getTriples(uris, cb) {
      function uri2triplets(uri, cb) {
        request("http://" + dbpediaHost)
          .get("/sparql")
          .query({
            "default-graph-uri": "http://dbpedia.org",
            query: "SELECT * WHERE { ?s ?p ?o. FILTER(?s in (<%1>)) }".replace("%1", uri),
            format: "turtle",
            timeout: 30000
          })
          .expect(200)
          .end(cb);
      }

      async.map(uris, uri2triplets, function(err, results) {
        cb(null, results);
      });
    },
    function responses2Triples(res, cb) {
      var triples = res.map(function (response) {
        if(response) {
          return response.text;
        }
        return "";
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
          .end(cb);
    },
    function askJenaForGraph(res, cb) {
      request("http://localhost:" + jenaPort)
          .get("/sem/sparql")
          .query({
            graph: page.url,
            query: "SELECT * WHERE { ?s ?p ?o. }",
            format: "json",
            timeout: 30000
          })
          .query({ graph: page.url })
          .set('Accept', 'application/json')
          .expect(200)
          .end(cb);
    },
    function processBody(res, cb) {
      if(res && res.text) {
        page.graph = JSON.parse(res.text);
      }
      cb(null, page);
    }
  ], next);
};
