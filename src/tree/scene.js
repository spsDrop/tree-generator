import { 
    WebGLRenderer, 
    PerspectiveCamera, 
    PCFSoftShadowMap, 
    Scene, 
    SpotLight, 
    CircleGeometry, 
    MeshPhongMaterial,
    DoubleSide,
    Mesh,
    Vector3,
} from 'three';
import { onNextFrameThrottle } from "../ui/utils/on-next-frame-throttle";
import { Tree } from './tree.js';
import { geometryToStl } from "./utils/geometry-to-stl";


export class TreeScene{

    constructor(){
        this.renderer = new WebGLRenderer({
            antialias: true
        });
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setClearColor( 0xffffff );
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        this.rotate = true;

        this.setupScene();
        window.addEventListener('resize', onNextFrameThrottle(() => this.updateSceneSize()));
    }


    setupScene() {
        this.scene = new Scene();

        this.camera =
                new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(...this.cameraPosition);
        this.camera.lookAt(this.cameraTarget);

        var light = new SpotLight(0xffffff, 0.8);
        light.position.set(60, 62, 20);
        light.target.position.set(0, 0, 0)
        light.castShadow = true;
        // light.shadowCameraNear = 200;
        // light.shadowCameraFar = this.camera.far;
        light.shadowCameraFov = 90;  // in degrees
        light.shadowBias = -0.01;
        light.shadowDarkness = 0.5;
        light.shadowMapWidth = 2048;
        light.shadowMapHeight = 2048;
        this.scene.add(light);

        const planeGeo = new CircleGeometry(150, 150);
        const planeMat = new MeshPhongMaterial({
          side: DoubleSide,
          color: 0x8c9788
        });
        const mesh = new Mesh(planeGeo, planeMat);
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -.5;
        mesh.position.y = -10;
        this.scene.add(mesh);
        
        this.light = light;
    };

    updateSceneSize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    cameraPosition = [20, 22, 20];
    cameraTarget = new Vector3(0, 10, 0);

    interval = null;

    startCounter(cb) {
        this.interval = setInterval(() => {
            this.fps = this.frameCount;
            this.frameCount = 0;
            cb && cb(this.fps);
        }, 1000);
    }

    stopCounter() {
        clearInterval(this.interval);
    }

    generateTree(settings){
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
    }

    getTreeStlBuffer() {
        return geometryToStl(this.tree.obj.children.map(child => child.geometry));
    }

    toggleRotation(state) {
        this.rotate = state;
    }

    disposeObjectTree(obj){
        obj.children.forEach((child)=>{
            if(child.children){
                this.disposeObjectTree(child);
            }
            child?.geometry?.dispose();
            child?.material?.dispose();
        });
    }

    getFaceCount() {
        return this.renderer.info.render.faces;
    }

    lastFrame = Date.now();

    manualRotation = false;

    getRotation() {
        return this.tree.obj.rotation.y
    }

    setRotation(val) {
        this.tree.obj.rotation.y = val;
    }

    scale = 1;
    
    setScale(scale) {
        this.scale = Math.min(3,Math.max(0.5, scale));
        this.camera.position.set(...this.cameraPosition);
        this.camera.position.multiplyScalar(this.scale);
        this.camera.lookAt(this.cameraTarget);
    }

    toggleWireFrame(value) {
        this.tree.material.wireframe = value;
    }

    frameCount = 0
    fps = 0;

    render() {
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