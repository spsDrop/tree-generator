import { TreeScene } from "./tree/scene";
import TreeUI from "./ui/ui.jsx";
var ReactDOM = require('react-dom');
var React = require('react');

window.addEventListener("DOMContentLoaded", function(){
    var treeScene = new TreeScene();

    document.querySelector(".renderWindow").appendChild( treeScene.renderer.domElement );

    ReactDOM.render(<TreeUI treeScene={treeScene}/>, document.querySelector(".controls"));
});