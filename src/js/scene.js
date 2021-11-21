import * as T from "../../lib/three";
import { Tree } from './tree.js';


export function TreeScene(){
    this.renderer = new T.WebGLRenderer({
        antialias: true
    });
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( 0xffffff );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.rotate = true;

    this.setupScene();
};


TreeScene.prototype = {

    setupScene: function setupScene() {
        this.scene = new T.Scene();

        this.camera =
                new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(20, 22, 20);
        this.camera.lookAt(new T.Vector3(0, 10, 0));
    

        var light = new T.SpotLight(0xffffff, 0.65);
        light.position.set(60, 62, 20);
        light.target.position.set(0, 0, 0)
        light.castShadow = true;
        // light.shadowCameraNear = 200;
        // light.shadowCameraFar = this.camera.far;
        light.shadowCameraFov = 50;  // in degrees
        light.shadowBias = -0.01;
        light.shadowDarkness = 0.5;
        light.shadowMapWidth = 2048;
        light.shadowMapHeight = 2048;
        this.scene.add(light);

        const planeGeo = new T.CircleGeometry(150, 150);
        const planeMat = new T.MeshPhongMaterial({
          side: T.DoubleSide,
          color: 0x8c9788
        });
        const mesh = new T.Mesh(planeGeo, planeMat);
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -.5;
        mesh.position.y = -10;
        this.scene.add(mesh);
        
        this.light = light;
    },

    interval: null,

    startCounter(cb) {
        this.interval = setInterval(() => {
            this.fps = this.frameCount;
            this.frameCount = 0;
            cb && cb(this.fps);
        }, 1000);
    },

    stopCounter() {
        clearInterval(this.interval);
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
        this.scene.add( this.light.target );
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

    getFaceCount() {
        return this.renderer.info.render.faces;
    },

    lastFrame: Date.now(),

    manualRotation: false,

    getRotation() {
        return this.tree.obj.rotation.y
    },

    setRotation(val) {
        this.tree.obj.rotation.y = val;
    },

    frameCount: 0,
    fps: 0,

    render: function render() {
        const now = Date.now();
        if(this.tree && this.rotate || this.manualRotation) {
            if (!this.manualRotation) {
                this.tree.obj.rotation.y += (now - this.lastFrame) * 0.0005;
            }
            this.light.target.updateMatrixWorld();
            this.light.shadow.camera.updateMatrixWorld();
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
        this.lastFrame = now;
        this.frameCount++;
    }
};