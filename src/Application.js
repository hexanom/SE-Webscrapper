/** @jsx React.DOM */
"use strict";

var request = window.superagent;

function sparqlQuery(sparql, cb) {
  request
    .get("http://dbpedia.org/sparql")
    .query({
      "default-graph-uri": "http://dbpedia.org",
      query: String.replace(sparql, /%1/, this.state.uri),
      format: "json",
      timeout: 30000
    })
    .send(this.props.subject)
    .set('Accept', 'application/json')
    .end(function(res) {
      if(res.ok && res.body) {
        cb(res.body);
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
          var uri = elmt["@URI"];
          var types = elmt["@types"];
          if(/music/.test(types)) {
            this.queryMusic(uri);
          } else if(/movie/.test(types)) {
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
    sparqlQuery("BWAAAA", function(res) {
      sparqlQuery("BWAAAA", function(res) {
        sparqlQuery("BWAAAA", function(res) {
          this.setState({graph: res});
        }.bind(this));
      }.bind(this));
    }.bind(this));
  },
  queryMovie: function(uri) {

  },
  queryBook: function(uri) {

  },
  queryGame: function(uri) {

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
  document.getElementById('content')
);