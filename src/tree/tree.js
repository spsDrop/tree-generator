import {
    MeshLambertMaterial,
    DoubleSide,
    Mesh,
    BufferGeometry,
    Vector3,
    Object3D,
    Float32BufferAttribute,
} from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Leaves } from "./leaves";
import { applyNoiseOffset, Noise } from "./utils/noise";
import { RNG } from "./utils/rng";
import { cloneVerticesWithTransform } from "./utils/clone-vertices-with-transform";

// Converts from degrees to radians.
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
};


export class Tree{
    constructor(settings) {
        this.settings = settings;

        this.rng = new RNG(settings.seed);
        this.noise = new Noise(this.settings.seed);
        
        this.generateTree();
    }

    generateTree(){
        const start = Date.now();
        var material = new MeshLambertMaterial( {
            color: 0x85745a,
            wireframe: false,
        } );

        material.side = DoubleSide;
        //this.leaves = new Leaves();

        const treeMesh = new Mesh( this.generateGeometry(), material );
        treeMesh.castShadow = true;
        treeMesh.receiveShadow = true;

        this.obj = new Object3D();
        this.obj.add(treeMesh);

        if (this.settings.doLeaves) {
            this.leaves.calculateNormals();
            this.obj.add(this.leaves.mesh);
        }
        console.log('Time to generate tree', Date.now() - start);
    }

    generateGeometry(){
        const bufferGeometry = new BufferGeometry();
        const geometry = {
            vertices: [],
            faces: []
        }
    
        const {
            branchDepth,
            segmentLength,
            sectionsPerSegment,
            initialRadius,
        } = this.settings;

        this.generateBranch(
            geometry,
            branchDepth,
            segmentLength,
            sectionsPerSegment,
            initialRadius
        );

        if (this.settings.noise) {
            this.generateVertexNoise(geometry);
        }


        //bufferGeometry.mergeVertices();
        //bufferGeometry.computeFaceNormals();
        bufferGeometry.setAttribute('position', new Float32BufferAttribute( geometry.vertices, 3 ));
        bufferGeometry.setIndex(geometry.faces);
        bufferGeometry.computeVertexNormals();
        bufferGeometry.uvsNeedUpdate = true;

        return bufferGeometry;
    }

    generateVertexNoise(geometry) {
        const vertCount = geometry.vertices.length / 3;
        const {noiseScale, noiseFactor} = this.settings;

        for(let i = 0; i < vertCount; i += 1){
            const index = i * 3;
            const vert = new Vector3(
                geometry.vertices[index],
                geometry.vertices[index+1],
                geometry.vertices[index+2],
            );
            applyNoiseOffset(vert, this.noise, noiseScale, noiseFactor);
            geometry.vertices[index] = vert.x;
            geometry.vertices[index+1] = vert.y;
            geometry.vertices[index+2] = vert.z;
        }
    }

    generateBranch(geometry, currentBranchDepth, initialSegmentLength, sectionsPerSegment, initialRadius, ring, isRight = false) {
        let leftRing;
        let rightRing;

        const {
            trunkLengthDecay,
            branchLengthDecay,
            trunkRadiusDecay,
            branchRadiusDecay,
            leafBranchDepth,
            leafScaleFactor,
            leafRelativeScaleFactor,
            segmentsPerBranch,
            branchDepth
        } = this.settings;

        let radius = initialRadius;
        let branchCount = currentBranchDepth;
        let segmentLength = initialSegmentLength;

        if(!ring){
            this.maxRadius = radius;
            ring = this.generateRing(radius, sectionsPerSegment);
            
            geometry.vertices.push(0,0,0);
            cloneVerticesWithTransform(ring, geometry);
            this.fillHole(geometry, sectionsPerSegment, 1, 0);
        } else {
            cloneVerticesWithTransform(ring, geometry);
        }
        
        const leftVariance = this.getRotationVariance();

        for(let i = 0; i < segmentsPerBranch; i++) {

            ring.translateOnAxis(ring.worldToLocal(new Vector3(0,1,0)), segmentLength);
            ring.scale.x = ring.scale.y = ring.scale.z = radius / this.maxRadius;
            if (branchCount !== branchDepth) {
                this.rotateRing(ring, leftVariance, isRight);
            }

            cloneVerticesWithTransform(ring, geometry);

            radius -= radius * 0.05;

            this.generateSegment(geometry, sectionsPerSegment, 1);
        }

        branchCount--;

        if(branchCount > 0){
            leftRing = ring.clone();
            segmentLength -= segmentLength * branchLengthDecay;
            radius -= radius * branchRadiusDecay;


            this.rotateRing(leftRing, leftVariance);
            leftRing.scale.x = leftRing.scale.y = leftRing.scale.z = radius / this.maxRadius;
            leftRing.translateY(segmentLength);

            cloneVerticesWithTransform(leftRing, geometry);

            this.generateSegment(geometry, sectionsPerSegment, 1);


            rightRing = ring.clone();
            segmentLength -= segmentLength * trunkLengthDecay;
            radius -= radius * trunkRadiusDecay;

            const rightVariance = this.getRotationVariance();

            this.rotateRing(rightRing, rightVariance, true);
            rightRing.scale.x = rightRing.scale.y = rightRing.scale.z = radius / this.maxRadius;
            rightRing.translateY(segmentLength);

            cloneVerticesWithTransform(rightRing, geometry);

            this.generateSegment(geometry, sectionsPerSegment, 2);

            this.generateBranch(geometry, branchCount, segmentLength, sectionsPerSegment, radius, leftRing);
            this.generateBranch(geometry, branchCount, segmentLength, sectionsPerSegment, radius, rightRing, true);
            

            if (this.settings.doLeaves && leafBranchDepth >= branchCount) {
                const factor = (branchCount + leafRelativeScaleFactor * (leafBranchDepth - branchCount)) / leafBranchDepth;
                const leafScale = factor * leafScaleFactor
                this.addLeaf(leftRing.matrix, leafScale);
                if (branchCount === 1) {
                    this.addLeaf(rightRing.matrix, leafScale)
                }
            }
        } else {
            geometry.vertices.push(...ring.position.clone().toArray());
            const vertCount = geometry.vertices.length / 3;
            this.fillHole(geometry, sectionsPerSegment, vertCount - 1 - sectionsPerSegment, vertCount - 1);
        }

    }

    rotateRing(ring, variance, right = false) {
        const {
            trunkRotationX,
            trunkRotationY,
            trunkRotationZ,
            branchRotationX,
            branchRotationY,
            branchRotationZ,
            segmentsPerBranch,
        } = this.settings;
        const rotationPerSegment = 1 / segmentsPerBranch;
        const xRot = right ? branchRotationX * -1 : trunkRotationX;
        const yRot = right ? branchRotationY * -1 : trunkRotationY;
        const zRot = right ? branchRotationZ * -1 : trunkRotationZ;

        ring.rotation.x += Math.radians(xRot * rotationPerSegment * variance);
        ring.rotation.y += Math.radians(yRot * rotationPerSegment * variance);
        ring.rotation.z += Math.radians(zRot * rotationPerSegment * variance);
    }

    addLeaf(matrix, leafScale) {
        const {noise: doNoise, noiseScale, noiseFactor} = this.settings;
        this.leaves.addLeaf({
            matrix,
            doNoise,
            leafScale,
            noise: this.noise,
            noiseScale,
            noiseFactor
        });
    }

    getRotationVariance() {
        return this.rng.nextRange(700,1400)/1000;
    }

    fillHole(geometry, ringSize, start, pointIndex) {
        const end = start + ringSize;

        for(let i = start + 1; i < end; i++) {
            geometry.faces.push(i, i-1, pointIndex);
        }

        geometry.faces.push(start, start + ringSize -1, pointIndex);
    }

    generateSegment(geometry, sections, ringOffset) {
        const vertexCount = geometry.vertices.length / 3;

        let oldRingIndex
        let newRingIndex;

        for (var j = 0; j < sections; j++) {
            oldRingIndex = vertexCount - (sections * ringOffset) * 2 + j;
            newRingIndex = vertexCount - sections + j;

            if (newRingIndex + 1 >= vertexCount) {
                geometry.faces.push(
                    oldRingIndex, newRingIndex, oldRingIndex - sections + 1
                );
                geometry.faces.push(
                    newRingIndex, newRingIndex - sections + 1, oldRingIndex - sections + 1
                );
            } else {
                geometry.faces.push(
                    oldRingIndex, newRingIndex, oldRingIndex + 1
                );
                geometry.faces.push(
                    newRingIndex, newRingIndex + 1, oldRingIndex + 1
                );
            }
        }
    }

    /**
     * @param radius {int}
     * @param sections {int}
     */
    generateRing(radius, sections) {
        const thetaIncrement = (2 * Math.PI)/sections;
        const ringGeom = new BufferGeometry();
        const ringPoints = [];
        const ringMesh = new Mesh(ringGeom);
        

        for(var i=0; i < sections; i++) {
            const vert = new Vector3(
                Math.sin(thetaIncrement * i) * radius,
                0,
                Math.cos(thetaIncrement * i) * radius
            );

            ringPoints.push(vert);
        }

        ringGeom.setFromPoints(ringPoints);

        return ringMesh;
    }
};