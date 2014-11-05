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
    .set('Accept', 'application/json')
    .end(function(res) {
      if(res.ok && res.body) {
        cb(res.body);
      }
    });
}

var Application = React.createClass({
  getInitialState: function() {
    return {graph: {paths: [], nodes: []}};
  },
  querySpotlight: function(query) {
    var please = {name: "please"};
    var wait = {name: "wait"};
    this.setState({graph: {nodes: [please, wait], paths: [{source: please, target: wait}]}});
    request
      .get("http://spotlight.dbpedia.org/rest/annotate")
      .query({ text: query })
      .set('Accept', 'application/json')
      .end(function(res) {
        if(res.ok && res.body.Resources[0]) {
          var elmt = res.body.Resources[0];
          var uri = elmt["@URI"];
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
    sparqlQuery("select distinct ?Artist where {" +
                "<"+uri+"> <http://dbpedia.org/property/artist> ?Artist." +
                "?Album <http://dbpedia.org/property/artist> ?Artist." +
                "} LIMIT 100", function(res) {


      sparqlQuery("select distinct ?OtherAlbums where {" +
                  "?OtherAlbums <http://dbpedia.org/property/artist> <"+artistURI+">." +
                  "?OtherAlbums a <http://dbpedia.org/ontology/Album>." +
                  "} LIMIT 100", function(res) {




        sparqlQuery("select distinct ?AssociatedArtist where {" +
                    "<"+artistURI+"> <http://dbpedia.org/ontology/associatedBand> ?AssociatedArtist" +
                    "} LIMIT 100", function(res) {



          this.setState({graph: res});
        }.bind(this));
      }.bind(this));
    }.bind(this));
  },
  queryMovie: function(uri) {
    sparqlQuery("select distinct ?Director where {" +
                "<"+uri+"> <http://dbpedia.org/ontology/director> ?Director" +
                "} LIMIT 100", function(res) {

      sparqlQuery("select distinct ?Actors where {" +
                "<"+uri+"> <http://dbpedia.org/ontology/starring> ?Actors" +
                "} LIMIT 100", function(res) {

        sparqlQuery("select distinct ?OtherFilms where {" +
                    "?OtherFilms <http://dbpedia.org/ontology/director> <"+directorURI+">" +
                    "} LIMIT 100", function(res) {

        }.bind(this));

      }.bind(this));

    }.bind(this));
  },
  queryBook: function(uri) {
    sparqlQuery("select distinct ?Author where {" +
                "<"+uri+"> <http://dbpedia.org/ontology/author> ?Author" +
                "} LIMIT 100", function(res) {

      sparqlQuery("select distinct ?OtherBooks where {" +
                "?OtherBooks <http://dbpedia.org/ontology/author> <"+ authorURI +">" +
                "} LIMIT 100", function(res) {

      }.bind(this));

    }.bind(this));
  },
  queryGame: function(uri) {

  },
  render: function() {
    return (
      <div className="Application">
        <SearchBox onSearchSubmit={this.querySpotlight}/>
        <Graph paths={this.state.graph.paths} nodes={this.state.graph.nodes} width="500" height="400"/>
      </div>
    );
  }
})

React.render(
  <Application/>,
  document.getElementById('app')
);