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

function nameFromURI(uri) {
  return decodeURIComponent(uri.substring(uri.lastIndexOf("/") + 1).replace(/_/g, " "));
}

var Application = React.createClass({
  getInitialState: function() {
    return {graph: {paths: [], nodes: []}, query: ""};
  },
  querySpotlight: function(query, type, uri) {
    var please = {name: "please"};
    var wait = {name: "wait"};
    this.setState({graph: {nodes: [please, wait], paths: [{source: please, target: wait}]}, query: query});
    if(type && uri) {
      if(type === "actor") {
        return this.queryActor(uri);
      } else if(type === "author") {
        return this.queryBook(uri, true);
      } else if(type === "developer") {
        return this.queryGame(uri, true);
      } else if(type === "musician") {
        return this.queryMusic(uri, true);
      } else if(type === "director") {
        return this.queryMovie(uri, true);
      } else if(type === "music") {
        return this.queryMusic(uri);
      } else if(type === "movie") {
        return this.queryMovie(uri);
      } else if(type === "book") {
        return this.queryBook(uri);
      } else if(type === "game") {
        return this.queryGame(uri);
      }
    }
    request
      .get("http://spotlight.dbpedia.org/rest/annotate")
      .query({ text: query })
      .set('Accept', 'application/json')
      .end(function(res) {
        if(res.ok && res.body.Resources[0]) {
          var elmt = res.body.Resources[0];
          var uri = decodeURIComponent(elmt["@URI"]);
          var types = elmt["@types"];
          if(/book\/author/.test(types)) {
            this.queryBook(uri, true);
          } else if(/developer/.test(types)) {
            this.queryGame(uri, true);
          } else if(/director/.test(types)) {
            this.queryMovie(uri, true);
          } else if(/music\/artist/.test(types)) {
            this.queryMusic(uri, true);
          } else if (/actor/.test(types)) {
            this.queryActor(uri);
          } else if(/music/.test(types)) {
            this.queryMusic(uri);
          } else if(/movie/.test(types) || /tv/.test  (types) || /film/.test(types)) {
            this.queryMovie(uri);
          } else if(/book/.test(types)) {
            this.queryBook(uri);
          } else if(/game/.test(types)) {
            this.queryGame(uri);
          }
        }
      }.bind(this));
  },
  queryMusic: function(uri, isArtist) {

    var nodes = [];
    var paths = [];

    var rootNode = {name: nameFromURI(uri), uri:uri, type:"music"};
    nodes.push(rootNode);

    async.waterfall([
      function getArtists(cb) {

        if(isArtist) { cb(null, uri); return }

        sparqlQuery("select distinct ?Artist where { " +
                    "<"+uri+"> <http://dbpedia.org/property/artist> ?Artist. " +
                    "?Album <http://dbpedia.org/property/artist> ?Artist. " +
                    "} LIMIT 100", function(res) {
          cb(null, res);
        });
      },
      function extractArtists(res, cb) {
        if(isArtist) { cb(null, [res]); return }

        var artists = res.results.bindings.filter(function(elem) {
          return elem.Artist.type === "uri";
        }).map(function(elem) {
          return elem.Artist.value;
        });

        cb(null, artists);
      },
      function artistsAlbumsAndAssociatedArtists(artists, cb) {

        async.each(artists, function(artistURI) {

          if(!isArtist) {
            var artistNode = {name: nameFromURI(artistURI), uri:artistURI, type:"music"};
            nodes.push(artistNode);
            paths.push({source: rootNode, target: artistNode});
          }
          else {
            var artistNode = rootNode;
          }

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
                  var album = {name: nameFromURI(albumURI), color:"red", uri:albumURI, type:"music"};

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
                  var associatedArtist = {name: nameFromURI(associatedArtistURI), color:"green", uri:associatedArtistURI, type:"musician"};
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
    }.bind(this));
  },
  queryActor: function(uri, isDirector) {

    var nodes = [];
    var paths = [];

    var rootNode = {name: nameFromURI(uri), uri:uri, type:"actor"};
    nodes.push(rootNode);

    async.waterfall([
      function getFilms(cb) {
        sparqlQuery("select distinct ?Film where { " +
                    "?Film <http://dbpedia.org/ontology/starring> <"+uri+">. " +
                     "} LIMIT 100", function(res) {
          cb(null, res)
        });
      },
      function extractFilms(res, cb) {

        var films = res.results.bindings.filter(function(elem) {
          return elem.Film.type === "uri";
        }).map(function(elem) {
          return elem.Film.value;
        });

        films.forEach(function(filmURI) {
          var filmNode = {name: nameFromURI(filmURI), color:"red", uri:filmURI, type:"movie"};
          nodes.push(filmNode);
          paths.push({source: rootNode, target: filmNode});
        });

        cb(null, films);
      }
    ], function (err) {
      if(err)
        console.error(err);
      else 
        this.setState({graph: {nodes: nodes, paths: paths}, query: this.state.query});
    }.bind(this));
  },
  queryMovie: function(uri, isDirector) {

    var nodes = [];
    var paths = [];

    var rootNode = {name: nameFromURI(uri), uri:uri, type:"movie"};
    nodes.push(rootNode);

    async.waterfall([
      function getDirectors(cb) {

        if(isDirector) { cb(null, uri); return }

        sparqlQuery("select distinct ?Director where { " +
                "<"+uri+"> <http://dbpedia.org/ontology/director> ?Director. " +
                "} LIMIT 100", function(res) {
          cb(null, res);
        });
      },
      function extractDirectors(res, cb) {

        if(isDirector) { cb(null, [uri]); return }

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
                var actorNode = {name: nameFromURI(actorURI), color:"green", uri:actorURI, type:"actor"};
                nodes.push(actorNode);
                paths.push({source: rootNode, target: actorNode});
              });

              cb(null);
            });
          },
          function getOtherFilms() {
            async.each(directors, function(directorURI, cb) {

              if(!isDirector) {
                var directorNode = {name: nameFromURI(directorURI),  color:"red", uri:directorURI, type:"director"};
                nodes.push(directorNode);
                paths.push({source: rootNode, target: directorNode});
              }
              else {
                var directorNode = rootNode;
              }

              sparqlQuery("select distinct ?OtherFilms where { " +
                        "?OtherFilms <http://dbpedia.org/ontology/director> <"+directorURI+">. " +
                        "} LIMIT 100", function(res) {

                var otherFilms = res.results.bindings.filter(function(elem) {
                  return elem.OtherFilms.type === "uri";
                }).map(function(elem) {
                  return elem.OtherFilms.value;
                });

                otherFilms.forEach(function(otherFilmURI) {
                  var otherFilmNode = {name: nameFromURI(otherFilmURI), color:"blue", uri:otherFilmURI, type:"movie"};
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
        this.setState({graph: {nodes: nodes, paths: paths}, query: this.state.query});
    }.bind(this));
  },
  queryBook: function(uri, isAuthor) {

    var nodes = [];
    var paths = [];

    var rootNode = {name: nameFromURI(uri), uri:uri, type:"book"};
    nodes.push(rootNode);

    async.waterfall([
      function getAuthors(cb) {
        if(isAuthor) { cb(null, uri); return; }
        sparqlQuery("select distinct ?Author where { " +
                "<"+uri+"> <http://dbpedia.org/ontology/author> ?Author. " +
                "} LIMIT 100", function(res) {
          cb(null, res);
        });
      },
      function extractAuthors(res, cb) {
        if(isAuthor) { cb(null, [res]); return; }
        var authors = res.results.bindings.filter(function(elem) {
          return elem.Author.type === "uri";
        }).map(function(elem) {
             return elem.Author.value;
        });
        cb(null, authors);
      },
      function getOtherBooks(authors, cb) {
        async.each(authors, function(authorURI, cb) {

          if(!isAuthor) {
            var authorNode = {name: nameFromURI(authorURI), color:"red", uri:authorURI, type:"author"};
            nodes.push(authorNode);
            paths.push({source: rootNode, target: authorNode});
          }
          else {
            var authorNode = rootNode;
          }

          sparqlQuery("select distinct ?OtherBooks where { " +
                "?OtherBooks <http://dbpedia.org/ontology/author> <"+ authorURI +">. " +
                "} LIMIT 100", function(res) {

            var otherBooks = res.results.bindings.filter(function(elem) {
              return elem.OtherBooks.type === "uri";
            }).map(function(elem) {
              return elem.OtherBooks.value;
            });

            otherBooks.forEach(function(otherBookURI) {
              var otherBookNode = {name: nameFromURI(otherBookURI), color:"green", uri:otherBookURI, type:"book"};
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
        this.setState({graph: {nodes: nodes, paths: paths}, query: this.state.query});
    }.bind(this));

  },
  queryGame: function(uri, isDeveloper) {

    var nodes = [];
    var paths = [];

    var rootNode = {name: nameFromURI(uri), uri:uri, type:"game"};
    nodes.push(rootNode);

    async.waterfall([
      function getDevelopers(cb) {
        if(isDeveloper) { cb(null, uri); return }
        sparqlQuery("select distinct ?Developer where { " +
                "<"+uri+"> <http://dbpedia.org/ontology/developer> ?Developer. " +
                "} LIMIT 100", function(res) {
          cb(null, res);
        });
      },
      function extractDevelopers(res, cb) {
        if(isDeveloper) { cb(null, [res]); return }
        var devs = res.results.bindings.filter(function(elem) {
          return elem.Developer.type === "uri";
        }).map(function(elem) {
             return elem.Developer.value;
        });
        cb(null, devs);
      },
      function getOtherGames(developers, cb) {
        async.each(developers, function(developerURI, cb) {

          if(!isDeveloper) {
            var devNode = {name: nameFromURI(developerURI), color:"green", uri:developerURI, type:"developer"};
            nodes.push(devNode);
            paths.push({source: rootNode, target: devNode});
          }
          else {
            var devNode = rootNode;
          }

          sparqlQuery("select distinct ?OtherGame where { " +
                      "?OtherGame <http://dbpedia.org/ontology/developer> <"+developerURI+">. " +
                      "} LIMIT 1000", function(res) {

            var otherGames = res.results.bindings.filter(function(elem) {
              return elem.OtherGame.type === "uri";
            }).map(function(elem) {
              return elem.OtherGame.value;
            });

            otherGames.forEach(function(otherGameURI) {
              var otherGameNode = {name: nameFromURI(otherGameURI), color:"red", uri:otherGameURI, type:"game"};
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
        this.setState({graph: {nodes: nodes, paths: paths}, query: this.state.query});
    }.bind(this));
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