/** @jsx React.DOM */
"use strict";
var SearchBox = React.createClass({
  handleSubmit: function() {
    this.props.onSearchSubmit(this.refs.query.getDOMNode().value.trim());
  },
  componentWillReceiveProps: function(props) {
    this.refs.query.getDOMNode().value = props.query;
  },
  render: function() {
    return (
      <div className="navbar navbar-default">
        <div className="container">
          <span className="navbar-brand col-md-2">
            Culture View
          </span>
          <form className="navbar-left col-md-8" onSubmit={this.handleSubmit} action="#">
            <input type="text" size="100%" className="form-control" placeholder="Type an Artist, a Movie, ... and hit ENTER !" ref="query"/>
          </form>
        </div>
      </div>
    );
  }
});
