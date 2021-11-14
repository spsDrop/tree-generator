import * as T from "../../lib/three";
import { Leaf } from "./leaf";
import { Noise } from "./noise";
import { RNG } from "./utils";

// Converts from degrees to radians.
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
};


export function Tree(settings){
    this.settings = settings;

    this.rng = new RNG(settings.seed);
    this.noise = new Noise(this.settings.seed);
    
    this.generateTree();
};

Tree.prototype = {

    generateTree: function generateTree(){
        var material = new T.MeshLambertMaterial( {
                        color: 0x85745a,
                        wireframe: false
                    } );

        material.side = T.DoubleSide;
        
        this.leaves = new T.Object3D();

        const treeMesh = new T.Mesh( this.generateGeometry(), material );
        treeMesh.flipSided = true;

        this.obj = new T.Object3D();
        this.obj.add(treeMesh);

        if (this.settings.doLeaves) {
            this.obj.add(this.leaves);
        }
        
    },

    generateGeometry: function generateGeometry(){
        const geometry = new T.Geometry();
    
        const {
            branchDepth,
            segmentsPerBranch,
            segmentLength,
            sectionsPerSegment,
            initialRadius,
        } = this.settings;

        this.generateBranch(
            geometry,
            branchDepth,
            segmentsPerBranch,
            segmentLength,
            sectionsPerSegment,
            initialRadius
        );

        geometry.mergeVertices();
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        if (this.settings.noise) {
            this.generateVertexNoise(geometry);
        }

        return geometry;
    },

    generateVertexNoise: function(geometry) {
        // const faceCount = geometry.faces.length;
        // const noise = new Noise(this.settings.seed);
        // const noiseScalingFactor = 1/1

        // for(let i = 0; i < faceCount; i += 1){
        //     const face = geometry.faces[i];
        //     const aVert = geometry.vertices[face.a];
        //     const noiseScalar = noise.perlin3(
        //         aVert.x * noiseScalingFactor,
        //         aVert.y * noiseScalingFactor,
        //         aVert.z * noiseScalingFactor,
        //     )
        //     face.normal.multiplyScalar(noiseScalar);
        //     console.log('scalar', noiseScalar);
        // }
        const vertCount = geometry.vertices.length;

        for(let i = 0; i < vertCount; i += 1){
            this.applyNoiseOffset(geometry.vertices[i]);
            
        }
    },

    applyNoiseOffset(vert) {
        const { noiseScale, noiseFactor } = this.settings;
        const noiseScalar = noiseFactor * this.noise.perlin3(
            vert.x * noiseScale,
            vert.y * noiseScale,
            vert.z * noiseScale,
        )
        vert.multiplyScalar(1+noiseScalar);
    },

    generateBranch: function(geometry, branchDepth, segmentsPerBranch, initialSegmentLength, sectionsPerSegment, initialRadius, ring){
        let leftRing, rightRing;

        const {
            trunkLengthDecay,
            branchLengthDecay,
            trunkRadiusDecay,
            branchRadiusDecay,
            trunkRotationX,
            trunkRotationY,
            trunkRotationZ,
            branchRotationX,
            branchRotationY,
            branchRotationZ,
            leafBranchDepth,
            leafScaleFactor,
            leafRelativeScaleFactor,
        } = this.settings;

        let radius = initialRadius;
        let branchCount = branchDepth;
        let segmentLength = initialSegmentLength;

        if(!ring){
            this.maxRadius = radius;
            ring = this.generateRing(radius, sectionsPerSegment);
        }
        this.cloneVerticesWithTransform(ring.children[0].geometry, geometry, ring.matrix);

        for(let i = 0; i < segmentsPerBranch; i++) {

            ring.translateOnAxis(ring.worldToLocal(new T.Vector3(0,1,0)), segmentLength);
            ring.scale.x = ring.scale.y = ring.scale.z = radius / this.maxRadius;
            ring.updateMatrix();

            radius -= radius * 0.05;

            this.cloneVerticesWithTransform(ring.children[0].geometry, geometry, ring.matrix);

            this.generateSegment(geometry, sectionsPerSegment, 1);
        }

        branchCount--;

        if(branchCount > 0){
            leftRing = ring.clone();
            segmentLength -= segmentLength * branchLengthDecay;
            radius -= radius * branchRadiusDecay;

            const leftVariance = 1;//this.getRotationVariance();

            leftRing.rotation.x += Math.radians(trunkRotationX * -1 );
            leftRing.rotation.y += Math.radians(trunkRotationY  * leftVariance * -1);
            leftRing.rotation.z += Math.radians(trunkRotationZ  * leftVariance * -1);
            leftRing.updateMatrix();

            leftRing.scale.x = leftRing.scale.y = leftRing.scale.z = radius / this.maxRadius;
            leftRing.translateY(segmentLength);
            leftRing.updateMatrix();

            this.cloneVerticesWithTransform(leftRing.children[0].geometry, geometry, leftRing.matrix);

            this.generateSegment(geometry, sectionsPerSegment, 1);


            rightRing = ring.clone();
            segmentLength -= segmentLength * trunkLengthDecay;
            radius -= radius * trunkRadiusDecay;

            const rightVariance = 1;//this.getRotationVariance();

            rightRing.rotation.x -= Math.radians(branchRotationX);
            rightRing.rotation.y += Math.radians(branchRotationY  * rightVariance);
            rightRing.rotation.z += Math.radians(branchRotationZ  * rightVariance);
            rightRing.updateMatrix();

            rightRing.scale.x = rightRing.scale.y = rightRing.scale.z = radius / this.maxRadius;
            rightRing.translateY(segmentLength);
            rightRing.updateMatrix();

            this.cloneVerticesWithTransform(rightRing.children[0].geometry, geometry, rightRing.matrix);

            this.generateSegment(geometry, sectionsPerSegment, 2);

            this.generateBranch(geometry, branchCount, segmentsPerBranch, segmentLength, sectionsPerSegment, radius, leftRing);
            this.generateBranch(geometry, branchCount, segmentsPerBranch, segmentLength, sectionsPerSegment, radius, rightRing);
            

            if (leafBranchDepth >= branchCount) {
                const factor = (branchCount + leafRelativeScaleFactor * (leafBranchDepth - branchCount)) / leafBranchDepth;
                const leafScale = factor * leafScaleFactor
                this.addLeaf(leftRing.matrix, leafScale);
                if (branchCount === 1) {
                    this.addLeaf(rightRing.matrix, leafScale)
                }
            }
        }

    },

    addLeaf(matrix, scale) {
        const leaf = new Leaf();
        leaf.obj.applyMatrix(matrix);
        if (this.settings.noise) {
            this.applyNoiseOffset(leaf.obj.position);
        }
        leaf.obj.scale.x = leaf.obj.scale.y = leaf.obj.scale.z = scale;
        this.leaves.add(leaf.obj);
    },

    getRotationVariance() {
        return this.rng.nextRange(700,1400)/1000;
    },

    generateSegment: function(geometry, sections, ringOffset){
        var vertexCount = geometry.vertices.length,
            oldRingIndex, newRingIndex;

        for (var j = 0; j < sections; j++) {
            oldRingIndex = vertexCount - (sections * ringOffset) * 2 + j;
            newRingIndex = vertexCount - sections + j;

            if (newRingIndex + 1 >= vertexCount) {
                geometry.faces.push(
                    new T.Face3(oldRingIndex, newRingIndex, oldRingIndex - sections + 1)
                );
                geometry.faces.push(
                    new T.Face3(newRingIndex, newRingIndex - sections + 1, oldRingIndex - sections + 1)
                );
            } else {
                geometry.faces.push(
                    new T.Face3(oldRingIndex, newRingIndex, oldRingIndex + 1)
                );
                geometry.faces.push(
                    new T.Face3(newRingIndex, newRingIndex + 1, oldRingIndex + 1)
                );
            }
        }
    },

    /**
     * @param radius {int}
     * @param sections {int}
     */
    generateRing: function(radius, sections){
        var thetaIncrement = (2 * Math.PI)/sections,
            ringObj = new T.Object3D(),
            ring = new T.Geometry(),
            vert;

        ringObj.add(new T.Mesh(ring));

        for(var i=0; i < sections; i++) {
            vert = new T.Vector3(
                Math.sin(thetaIncrement * i) * radius,
                0,
                Math.cos(thetaIncrement * i) * radius
            );

            ring.vertices.push(vert);
        }

        return ringObj;
    },

    cloneVerticesWithTransform:function( source, target, transformationMatrix ){
        source.vertices.forEach(function(vert){
            target.vertices.push( vert.clone().applyMatrix4( transformationMatrix) );
        });
    }
};