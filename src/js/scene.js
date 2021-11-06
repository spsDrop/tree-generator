var T = window.THREE;
var Tree = require('./tree');
var Leaf = require('./leaf');

var TreeScene = function(){
    this.renderer = new T.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( 0xffffff );

    this.setupScene();
};


TreeScene.prototype = {

    setupScene: function setupScene() {
        this.scene = new T.Scene();

        var light = new T.PointLight(0xffffff, 1, 100);
        light.position.set(5, 7, 10);
        this.scene.add(light);

        var camera =
            this.camera =
                new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(20, 22, 20);
        camera.lookAt(new T.Vector3(0, 10, 0));
    },

    generateTree: function(settings){
        if(this.tree){
            this.scene.remove(this.tree);
            this.disposeObject(this.tree);
            this.tree = null;
        }

        this.tree = new Tree(settings);

        this.tree.position.y = -10;
        this.scene.add( this.tree );
    },

    disposeObject: function(obj){
        obj.children.forEach((child)=>{
            if(child.children){
                this.disposeObject(child);
            }else{
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    },

    render: function render() {
        if(this.tree) {
            this.tree.rotation.y += 0.01;
        }

        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
};

module.exports = TreeScene;