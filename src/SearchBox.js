/** @jsx React.DOM */
"use strict";
var SearchBox = React.createClass({
  handleSubmit: function() {
    this.props.onSearchSubmit(this.refs.query.getDOMNode().value.trim());
  },
  render: function() {
    return (
      <form className="searchForm" onSubmit={this.handleSubmit} action="#">
        <input type="search" clasName="form-control " placeholder="Artist, album, …" ref="query"/>
        <input type="submit" value="Search &rarr;" />
      </form>
    );
  }
});
