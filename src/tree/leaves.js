import * as T from "../../lib/three";
import { cloneVerticesWithTransform } from "./utils/clone-vertices-with-transform";
import { applyNoiseOffset } from "./utils/noise";


export class Leaves { 
    constructor() {
        this.leaf = this.generateLeafGeometry();

        const material = new T.MeshLambertMaterial( { color: 0x28682D } );
        material.side = T.DoubleSide;
        const mesh = new T.Mesh(new T.Geometry(), material);
        mesh.castShadow = true;
        //mesh.receiveShadow = true;

        this.mesh = mesh;
    }

    addLeaf({
        matrix,
        doNoise,
        leafScale,
        noise,
        noiseScale,
        noiseFactor,
    }){
        const leafTransform = new T.Mesh(this.leaf);
        leafTransform.applyMatrix(matrix)
        if (doNoise) {
            applyNoiseOffset(leafTransform.position, noise, noiseScale, noiseFactor);
        }
        leafTransform.scale.x = leafTransform.scale.y = leafTransform.scale.z = leafScale;
        cloneVerticesWithTransform(leafTransform, this.mesh.geometry)
        this.createFaces(this.mesh.geometry.vertices.length - this.leaf.vertices.length);
    }

    calculateNormals() {
        this.mesh.geometry.computeFaceNormals();
        this.mesh.geometry.computeVertexNormals();
    }

    createFaces(firstVert) {
        const { geometry } = this.mesh;
        geometry.faces.push(new T.Face3(firstVert,firstVert+1,firstVert+2));
        geometry.faces.push(new T.Face3(firstVert,firstVert+2,firstVert+3));
        geometry.faces.push(new T.Face3(firstVert+4,firstVert+2,firstVert+1));
        geometry.faces.push(new T.Face3(firstVert+2,firstVert+4,firstVert+5));
        geometry.faces.push(new T.Face3(firstVert+5,firstVert+3,firstVert+2));
        geometry.faces.push(new T.Face3(firstVert+5,firstVert+6,firstVert+3));
        geometry.faces.push(new T.Face3(firstVert+5,firstVert+4,firstVert+7));
        geometry.faces.push(new T.Face3(firstVert+6,firstVert+5,firstVert+7));

        
        geometry.faces.push(new T.Face3(firstVert,firstVert+1,firstVert+8));
        geometry.faces.push(new T.Face3(firstVert,firstVert+8,firstVert+3));
        geometry.faces.push(new T.Face3(firstVert+4,firstVert+8,firstVert+1));
        geometry.faces.push(new T.Face3(firstVert+8,firstVert+4,firstVert+9));
        geometry.faces.push(new T.Face3(firstVert+9,firstVert+3,firstVert+8));
        geometry.faces.push(new T.Face3(firstVert+9,firstVert+6,firstVert+3));
        geometry.faces.push(new T.Face3(firstVert+9,firstVert+4,firstVert+7));
        geometry.faces.push(new T.Face3(firstVert+6,firstVert+9,firstVert+7));
    }

    generateLeafGeometry() {
        var geometry = new T.Geometry();
    
        geometry.vertices.push(new T.Vector3(0,0,0));
    
        geometry.vertices.push(new T.Vector3(0.75,0.35,0.85));
        geometry.vertices.push(new T.Vector3(0.75,0.15,0));
        geometry.vertices.push(new T.Vector3(0.75,0.35,-0.85));
    
        geometry.vertices.push(new T.Vector3(1.5,0.15,0.75));
        geometry.vertices.push(new T.Vector3(1.5,0,0));
        geometry.vertices.push(new T.Vector3(1.5,0.15,-0.75));
    
        geometry.vertices.push(new T.Vector3(2.5,-0.25,0));

        
        geometry.vertices.push(new T.Vector3(0.75,0.3,0));
        geometry.vertices.push(new T.Vector3(1.5,0.15,0));
    
        return geometry;
    }
}