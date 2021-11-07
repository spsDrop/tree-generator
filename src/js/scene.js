var T = require('../../lib/three.js');
var Tree = require('./tree');
var Leaf = require('./leaf');

var TreeScene = function(){
    this.renderer = new T.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( 0xffffff );
    this.rotate = true;

    this.setupScene();
};


TreeScene.prototype = {

    setupScene: function setupScene() {
        this.scene = new T.Scene();

        var light = new T.PointLight(0xffffff, 1, 100);
        light.position.set(5, 7, 10);
        this.scene.add(light);

        this.camera =
                new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(20, 22, 20);
        this.camera.lookAt(new T.Vector3(0, 10, 0));
    },

    generateTree: function(settings){
        let rotation = 0;
        if(this.tree){
            rotation = this.tree.obj.rotation.y;
            this.scene.remove(this.tree.obj);
            this.disposeObjectTree(this.tree.obj);
            this.tree = null;
        }

        this.tree = new Tree(settings);
        this.tree.obj.rotation.y = rotation;

        this.tree.obj.position.y = -10;
        this.scene.add( this.tree.obj );
    },

    toggleRotation(state) {
        this.rotate = state;
    },

    disposeObjectTree: function(obj){
        obj.children.forEach((child)=>{
            if(child.children){
                this.disposeObjectTree(child);
            }
            child?.geometry?.dispose();
            child?.material?.dispose();
        });
    },

    render: function render() {
        if(this.tree && this.rotate) {
            this.tree.obj.rotation.y += 0.01;
        }

        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
};

module.exports = TreeScene;