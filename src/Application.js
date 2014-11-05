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
    return {graph: {paths: [], nodes: []}, query: ""};
  },
  querySpotlight: function(query) {
    var please = {name: "please"};
    var wait = {name: "wait"};
    this.setState({graph: {nodes: [please, wait], paths: [{source: please, target: wait}]}, query: query});
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

    var nodes = [];
    var paths = [];

    var rootNode = {name: uri};
    nodes.push(rootNode);

    async.waterfall([
      function getArtists(cb) {
        sparqlQuery("select distinct ?Artist where { " +
                    "<"+uri+"> <http://dbpedia.org/property/artist> ?Artist. " +
                    "?Album <http://dbpedia.org/property/artist> ?Artist. " +
                    "} LIMIT 100", function(res) {
          cb(null, res);
        });
      },
      function extractArtists(res, cb) {
        var artists = res.results.bindings.filter(function(elem) {
          return elem.Artist.type === "uri";
        }).map(function(elem) {
          return elem.Artist.value;
        });

        cb(null, artists);
      },
      function artistsAlbumsAndAssociatedArtists(artists, cb) {

        async.each(artists, function(artistURI) {

          var artistNode = {name: artistURI};
          nodes.push(artistNode);
          paths.push({source: rootNode, target: artistNode});

          async.parallel([
            function artistsAlbums(cb){
              sparqlQuery("select distinct ?OtherAlbums where { " +
                          "?OtherAlbums <http://dbpedia.org/property/artist> <"+artistURI+">. " +
                          "?OtherAlbums a <http://dbpedia.org/ontology/Album>. " +
                          "} LIMIT 100", function(res) {

                var otherAlbums = res.results.bindings.filter(function(elem) {
                  return elem.OtherAlbums.type === "uri";
                }).map(function(elem) {
                  return elem.OtherAlbums.value;
                });

                otherAlbums.forEach(function(albumURI) {
                  var album = {name: albumURI};
                  nodes.push(album);
                  paths.push({source: artistNode, target: album});
                });

                cb(null);

              });
            },
            function associatedArtist(cb) {
              sparqlQuery("select distinct ?AssociatedArtist where { " +
                          "<"+artistURI+"> <http://dbpedia.org/ontology/associatedBand> ?AssociatedArtist. " +
                          "} LIMIT 100", function(res) {

                var associatedArtists = res.results.bindings.filter(function(elem) {
                  return elem.AssociatedArtist.type === "uri";
                }).map(function(elem) {
                  return elem.AssociatedArtist.value;
                });

                associatedArtists.forEach(function(associatedArtistURI) {
                  var associatedArtist = {name: associatedArtistURI};
                  nodes.push(associatedArtist);
                  paths.push({source: artistNode, target: associatedArtist});
                });
                
                cb(null);
              });
            }
          ], cb);
        }, cb);
      }
    ], function (err) {
      if(err)
        console.error(err);
      else 
        this.setState({graph: {nodes: nodes, paths: paths}, query: this.state.query});
    });
  },
  queryMovie: function(uri) {

    var nodes = [];
    var paths = [];

    var rootNode = {name: uri};
    nodes.push(rootNode);

    async.waterfall([
      function getDirectors(cb) {
        sparqlQuery("select distinct ?Director where { " +
                "<"+uri+"> <http://dbpedia.org/ontology/director> ?Director. " +
                "} LIMIT 100", function(res) {
          cb(null, res);
        });
      },
      function extractDirectors(res, cb) {
        var directors = res.results.bindings.filter(function(elem) {
          return elem.Director.type === "uri";
        }).map(function(elem) {
          return elem.Director.value;
        });

        cb(null, directors);
      },
      function getOtherFilmsOfDirectorsAndActors(directors, cb) {

        async.parallel([
          function actorsStarring(cb) {
            sparqlQuery("select distinct ?Actors where { " +
                        "<"+uri+"> <http://dbpedia.org/ontology/starring> ?Actors. " +
                        "} LIMIT 100", function(res) {

              var actors = res.results.bindings.map(function(elem) {
                return elem.Actors.value;
              });

              actors.forEach(function(actorURI) {
                var actorNode = {name: actorURI};
                nodes.push(actorNode);
                paths.push({source: rootNode, target: actorNode});
              });

              cb(null);
            });
          },
          function getOtherFilms() {
            async.each(directors, function(directorURI, cb) {

              var directorNode = {name: directorURI};
              nodes.push(directorNode);
              paths.push({source: rootNode, target: directorNode});

              sparqlQuery("select distinct ?OtherFilms where { " +
                        "?OtherFilms <http://dbpedia.org/ontology/director> <"+directorURI+">. " +
                        "} LIMIT 100", function(res) {

                var otherFilms = res.results.bindings.filter(function(elem) {
                  return elem.OtherFilms.type === "uri";
                }).map(function(elem) {
                  return elem.OtherFilms.value;
                });

                otherFilms.forEach(function(otherFilmURI) {
                  var otherFilmNode = {name: otherFilmURI};
                  nodes.push(otherFilmNode);
                  paths.push({source: directorNode, target: otherFilmNode});
                });

                cb(null);

              });

            }, cb);
          }
        ], cb);
      }
    ], function (err) {
      if(err)
        console.error(err);
      else 
        this.setState({graph: {nodes: nodes, paths: paths}}); 
    });
  },
  queryBook: function(uri) {

    var nodes = [];
    var paths = [];

    var rootNode = {name: uri};
    nodes.push(rootNode);

    async.waterfall([
      function getAuthors(cb) {
        sparqlQuery("select distinct ?Author where { " +
                "<"+uri+"> <http://dbpedia.org/ontology/author> ?Author. " +
                "} LIMIT 100", function(res) {
          cb(null, res);
        });
      },
      function extractAuthors(res, cb) {
        var authors = res.results.bindings.filter(function(elem) {
          return elem.Author.type === "uri";
        }).map(function(elem) {
             return elem.Author.value;
        });
        cb(null, authors);
      },
      function getOtherBooks(authors, cb) {
        async.each(authors, function(authorURI, cb) {

          var authorNode = {name: authorURI};
          nodes.push(authorNode);
          paths.push({source: rootNode, target: authorNode});

          sparqlQuery("select distinct ?OtherBooks where { " +
                "?OtherBooks <http://dbpedia.org/ontology/author> <"+ authorURI +">. " +
                "} LIMIT 100", function(res) {

            var otherBooks = res.results.bindings.filter(function(elem) {
              return elem.OtherBooks.type === "uri";
            }).map(function(elem) {
              return elem.OtherBooks.value;
            });

            otherBooks.forEach(function(otherBookURI) {
              var otherBookNode = {name: otherBookURI};
              nodes.push(otherBookNode);
              paths.push({source: authorNode, target: otherBookNode});
            });

            cb(null);

          });

        }, cb);

      }
    ], function (err) {
      if(err)
        console.error(err);
      else 
        this.setState({graph: {nodes: nodes, paths: paths}}); 
    });

  },
  queryGame: function(uri) {

    var nodes = [];
    var paths = [];

    var rootNode = {name: uri};
    nodes.push(rootNode);

    async.waterfall([
      function getDevelopers(cb) {
        sparqlQuery("select distinct ?Developer where { " +
                "<"+uri+"> <http://dbpedia.org/ontology/developer> ?Developer. " +
                "} LIMIT 100", function(res) {
          cb(null, res);
        });
      },
      function extractDevelopers(res, cb) {
        var devs = res.results.bindings.filter(function(elem) {
          return elem.Developer.type === "uri";
        }).map(function(elem) {
             return elem.Developer.value;
        });
        cb(null, devs);
      },
      function getOtherGames(developers, cb) {
        async.each(developers, function(developerURI, cb) {

          var devNode = {name: developerURI};
          nodes.push(devNode);
          paths.push({source: rootNode, target: devNode});

          sparqlQuery("select distinct ?OtherGame where { " +
                      "?OtherGame <http://dbpedia.org/ontology/developer> <"+developerURI+">. " +
                      "} LIMIT 100", function(res) {

            var otherGames = res.results.bindings.filter(function(elem) {
              return elem.OtherGame.type === "uri";
            }).map(function(elem) {
              return elem.OtherGame.value;
            });

            otherGames.forEach(function(otherGameURI) {
              var otherGameNode = {name: otherGameURI};
              nodes.push(otherGameNode);
              paths.push({source: devNode, target: otherGameNode});
            });

            cb(null);

          });

        }, cb);

      }
    ], function (err) {
      if(err)
        console.error(err);
      else 
        this.setState({graph: {nodes: nodes, paths: paths}}); 
    });
  },
  render: function() {
    return (
      <div className="Application">
        <SearchBox onSearchSubmit={this.querySpotlight} query={this.state.query}/>
        <Graph paths={this.state.graph.paths} nodes={this.state.graph.nodes} onNodeClick={this.querySpotlight} width="800" height="600"/>
      </div>
    );
  }
})

React.render(
  <Application/>,
  document.getElementById('app')
);