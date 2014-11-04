/** @jsx React.DOM */
"use strict";
var Application = React.createClass({
  render: function() {
    return (
      <div>
        <SearchBox/>
        <Graph/>
      </div>
    );
  }
})

React.render(
  <Application/>,
  document.getElementById('content')
);