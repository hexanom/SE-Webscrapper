/** @jsx React.DOM */
"use strict";
var Graph = React.createClass({
  getInitialState: function() {
    return {nodes: [], paths: [], force: null};
  },
  componentWillReceiveProps: function(props) {
    if(this.force) {
      this.force.stop();
    }
    var nodes = [];
    nodes.concat(props.nodes);
    this.force = d3.layout.force()
      .size([this.props.width, this.props.height])
      .gravity(0.1)
      .charge(-1000)
      .linkDistance(100)
      .on("tick", this.handleTick);
    props.nodes.forEach(function(node) {
      this.force.nodes().push(node);
    }.bind(this));
    props.paths.forEach(function(path) {
      this.force.links().push(path);
    }.bind(this));
    this.force.start();
  },
  handleTick: function() {
    this.setState({nodes: this.force.nodes(), paths: this.force.links()});
  },
  handleNodeClick: function(node) {
    console.log(node);
  },
  render: function() {
    var self = this;
    var paths = this.state.paths.map(function(path) {
      var dx = path.target.x - path.source.x,
          dy = path.target.y - path.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      var d = "M" +
        path.source.x + "," +
        path.source.y + "A" +
        dr + "," + dr + " 0 0,1 " +
        path.target.x + "," +
        path.target.y;
      return (
        <path d={d} className="link" fill="none" stroke="grey"></path>
      );
    });
    var nodes = this.state.nodes.map(function(node) {
      var transform = "translate(" + node.x + "," + node.y + ")";
      var textStyle = {fill: "white"};
      return (
        <g transform={transform} className="node" data-name={node.name}>
          <circle r="10px" fill="white" onClick={self.handleNodeClick} data-name={node.name}></circle>
          <text x="15" dy=".35em" style={textStyle}>{node.name}</text>
        </g>
      );
    });
    return (
      <svg className="absolute center" width={this.props.width} height={this.props.height}>
        <g>
          {paths}
        </g>
        {nodes}
      </svg>
    );
  }
});