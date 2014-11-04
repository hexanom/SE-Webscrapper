/** @jsx React.DOM */
"use strict";
var Graph = React.createClass({
  render: function() {
    var arrows = this.props.data.map(function(arrow) {
      return (
        <li>{arrow}</li>
      )
    });
    return (
      <ul>
        {arrows}
      </ul>
    );
  }
})