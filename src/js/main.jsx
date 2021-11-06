var TreeApp = require('./tree');
var TreeUI = require('./ui');
var ReactDOM = require('react-dom');
var React = require('react');

window.addEventListener("DOMContentLoaded", function(){
    var treeApp = new TreeApp();

    document.querySelector(".renderWindow").appendChild( treeApp.renderer.domElement );

    treeApp.render();

    ReactDOM.render(<TreeUI treeApp={treeApp}/>, document.querySelector(".controls"));
});