var Scene = require('./scene');
var TreeUI = require('./ui.jsx').default;
var ReactDOM = require('react-dom');
var React = require('react');

window.addEventListener("DOMContentLoaded", function(){
    var treeScene = new Scene();

    document.querySelector(".renderWindow").appendChild( treeScene.renderer.domElement );

    ReactDOM.render(<TreeUI treeScene={treeScene}/>, document.querySelector(".controls"));
});