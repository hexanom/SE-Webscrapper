/** @jsx React.DOM */
"use strict";

var request = window.superagent;

function sparqlQuery(sparql, cb) {
  request
    .get("http://dbpedia.org/sparql")
    .query({
      "default-graph-uri": "http://dbpedia.org",
      query: sparql,
      format: "json",
      timeout: 30000
    })
    .end(function(res) {
      if(res.ok && res.text) {
        cb(JSON.parse(res.text));
      }
      else {
        console.error("Error on request !");
      }
    });
}

var Application = React.createClass({
  getInitialState: function() {
    return {graph: []};
  },
  querySpotlight: function(query) {
    request
      .get("http://spotlight.dbpedia.org/rest/annotate")
      .query({ text: query })
      .set('Accept', 'application/json')
      .end(function(res) {
        if(res.ok && res.body.Resources[0]) {
          var elmt = res.body.Resources[0];
          var uri = decodeURIComponent(elmt["@URI"]);
          var types = elmt["@types"];
          if(/music/.test(types)) {
            this.queryMusic(uri);
          } else if(/movie/.test(types) || /tv/.test(types) || /film/.test(types)) {
            this.queryMovie(uri);
          } else if(/book/.test(types)) {
            this.queryBook(uri);
          } else if(/game/.test(types)) {
            this.queryGame(uri);
          }
        }
      }.bind(this));
  },
  queryMusic: function(uri) {
    sparqlQuery("select distinct ?Artist where { " +
                "<"+uri+"> <http://dbpedia.org/property/artist> ?Artist. " +
                "?Album <http://dbpedia.org/property/artist> ?Artist. " +
                "} LIMIT 100", function(res) {

      var artists = res.results.bindings.filter(function(elem) {
        return elem.Artist.type === "uri";
      }).map(function(elem) {
        return elem.Artist.value;
      });
      var artistURI = artists[0];

      for(var i = 0; i < artists.length; i++) {

        var artistURI = artists[i];

        sparqlQuery("select distinct ?OtherAlbums where { " +
                    "?OtherAlbums <http://dbpedia.org/property/artist> <"+artistURI+">. " +
                    "?OtherAlbums a <http://dbpedia.org/ontology/Album>. " +
                    "} LIMIT 100", function(res) {

          var otherAlbums = res.results.bindings.filter(function(elem) {
            return elem.OtherAlbums.type === "uri";
          }).map(function(elem) {
            return elem.OtherAlbums.value;
          });

          sparqlQuery("select distinct ?AssociatedArtist where { " +
                      "<"+artistURI+"> <http://dbpedia.org/ontology/associatedBand> ?AssociatedArtist. " +
                      "} LIMIT 100", function(res) {

            var associatedArtists = res.results.bindings.filter(function(elem) {
              return elem.AssociatedArtist.type === "uri";
            }).map(function(elem) {
              return elem.AssociatedArtist.value;
            });

          }.bind(this));
        }.bind(this));
      }
    }.bind(this));
  },
  queryMovie: function(uri) {
    sparqlQuery("select distinct ?Director where { " +
                "<"+uri+"> <http://dbpedia.org/ontology/director> ?Director. " +
                "} LIMIT 100", function(res) {

      var directors = res.results.bindings.filter(function(elem) {
        return elem.Director.type === "uri";
      }).map(function(elem) {
        return elem.Director.value;
      });

      sparqlQuery("select distinct ?Actors where { " +
                "<"+uri+"> <http://dbpedia.org/ontology/starring> ?Actors. " +
                "} LIMIT 100", function(res) {

        var actors = res.results.bindings.map(function(elem) {
          return elem.Actors.value;
        });

        for(var i = 0; i < directors.length; i++) {

          var directorURI = directors[i];

          sparqlQuery("select distinct ?OtherFilms where { " +
                    "?OtherFilms <http://dbpedia.org/ontology/director> <"+directorURI+">. " +
                    "} LIMIT 100", function(res) {

            var otherFilms = res.results.bindings.map(function(elem) {
              return elem.OtherFilms.value;
            });

          }.bind(this));

        }

      }.bind(this));

    }.bind(this));
  },
  queryBook: function(uri) {
    sparqlQuery("select distinct ?Author where { " +
                "<"+uri+"> <http://dbpedia.org/ontology/author> ?Author. " +
                "} LIMIT 100", function(res) {

      sparqlQuery("select distinct ?OtherBooks where { " +
                "?OtherBooks <http://dbpedia.org/ontology/author> <"+ authorURI +">. " +
                "} LIMIT 100", function(res) {

      }.bind(this));

    }.bind(this));
  },
  queryGame: function(uri) {
    sparqlQuery("select distinct ?Developers where { " +
                "<http://dbpedia.org/resource/BioShock> <http://dbpedia.org/ontology/developer> ?Developers. " +
                "} LIMIT 100", function(res) {

      sparqlQuery("select distinct ?OtherGames where { " +
                  "?OtherGames <http://dbpedia.org/ontology/developer> <"+developerURI+">. " +
                  "} LIMIT 100", function(res) {

      }.bind(this));
    }.bind(this));
  },
  render: function() {
    return (
      <div className="Application">
        <SearchBox onSearchSubmit={this.querySpotlight}/>
        <Graph data={this.state.graph}/>
      </div>
    );
  }
})

React.render(
  <Application/>,
  document.getElementById('app')
);