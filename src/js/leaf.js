var T = window.THREE;
var Utils = require('./utils');

var Leaf = function(){
    var material, leaf, leafObj;

    material = this.material = new T.MeshLambertMaterial( { color: 0x00ff00 } );
    material.side = T.DoubleSide;

    leafObj = this.object = new T.Object3D();
    this.geometry = this.generateGeometry();
    leaf = new T.Mesh( this.geometry, material );
    leafObj.add(leaf);
};

Leaf.prototype = {
    generateGeometry: function(){
        var geometry = new T.Geometry();

        geometry.vertices.push(new T.Vector3(0,0,0));

        geometry.vertices.push(new T.Vector3(0.75,0.35,0.85));
        geometry.vertices.push(new T.Vector3(0.75,0.15,0));
        geometry.vertices.push(new T.Vector3(0.75,0.35,-0.85));

        geometry.vertices.push(new T.Vector3(1.5,0.15,0.75));
        geometry.vertices.push(new T.Vector3(1.5,0,0));
        geometry.vertices.push(new T.Vector3(1.5,0.15,-0.75));

        geometry.vertices.push(new T.Vector3(2.5,-0.25,0));

        return geometry;
    },

    generateFaces: function(firstVert, geometry){
        geometry.faces.push(new T.Face3(firstVert,firstVert+1,firstVert+2));
        geometry.faces.push(new T.Face3(firstVert,firstVert+2,firstVert+3));
        geometry.faces.push(new T.Face3(firstVert+4,firstVert+2,firstVert+1));
        geometry.faces.push(new T.Face3(firstVert+2,firstVert+4,firstVert+5));
        geometry.faces.push(new T.Face3(firstVert+5,firstVert+3,firstVert+2));
        geometry.faces.push(new T.Face3(firstVert+5,firstVert+6,firstVert+3));
        geometry.faces.push(new T.Face3(firstVert+5,firstVert+4,firstVert+7));
        geometry.faces.push(new T.Face3(firstVert+6,firstVert+5,firstVert+7));
    },

    dispose: function(){
        this.geometry.dispose();
        this.material.dispose();
        this.object.remove(this.object.children[0]);
        this.geometry = null;
        this.material = null;
        this.object = null;
    }
};

module.exports = Leaf;