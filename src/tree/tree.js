import {
    MeshLambertMaterial,
    DoubleSide,
    Mesh,
    BufferGeometry,
    Vector3,
    Object3D,
    Float32BufferAttribute,
    Raycaster,
    FrontSide,
    BackSide,
    ArrowHelper,
    VertexColors,
    Color,
    SphereGeometry,
    MeshBasicMaterial
} from 'three';
import { Leaves } from "./leaves";
import { applyNoiseOffset, Noise } from "./utils/noise";
import { RNG } from "./utils/rng";
import { cloneVerticesWithTransform } from "./utils/clone-vertices-with-transform";
import { CSG } from './utils/csg';

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
        this.obj = new Object3D();
        this.material = new MeshLambertMaterial( {
            color: 0x85745a,
            wireframe: this.settings.wireframe
        } );

        this.material.side = DoubleSide;
        //this.leaves = new Leaves();

        const treeMesh = new Mesh( this.generateGeometry(), this.material );
        treeMesh.castShadow = true;
        treeMesh.receiveShadow = true;

        this.obj.add(treeMesh);

        // if (this.settings.doLeaves) {
        //     this.leaves.calculateNormals();
        //     this.obj.add(this.leaves.mesh);
        // }
        console.log('Time to generate tree', Date.now() - start);
    }

    generateGeometry(){
        const bufferGeometry = new BufferGeometry();
    
        const {
            branchDepth,
            segmentLength,
            sectionsPerSegment,
            initialRadius,
        } = this.settings;

        const geometry = this.generateBranch(
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

    generateBranch(currentBranchDepth, initialSegmentLength, sectionsPerSegment, initialRadius, ring, isRight = false) {
        const {
            trunkLengthDecay,
            branchLengthDecay,
            trunkRadiusDecay,
            branchRadiusDecay,
            leafBranchDepth,
            leafScaleFactor,
            leafRelativeScaleFactor,
            branchDepth
        } = this.settings;

        let radius = initialRadius;
        let branchCount = currentBranchDepth;
        let segmentLength = initialSegmentLength;

        const geometry = {
            vertices: [],
            faces: [],
        }

        if(!ring){
            this.maxRadius = radius;
            ring = this.generateRing(radius, sectionsPerSegment);
            
            geometry.vertices.push(0,0,0);
            cloneVerticesWithTransform(ring, geometry);
            this.fillHole(geometry, sectionsPerSegment, 1, 0);
        }

        this.mergeGeometry(
            geometry,
            this.generateSection(ring, radius, segmentLength, branchCount, isRight)
        );

        branchCount--;

        if(branchCount > 0){
            const [ leftBranch ] = this.buildBranch(ring, radius, segmentLength, branchCount, branchLengthDecay, branchRadiusDecay);

            const [rightBranch] = this.buildBranch(ring, radius, segmentLength, branchCount, trunkLengthDecay, trunkRadiusDecay, true);

            // const branchesGeometry = this.unionBranches(leftBranch, rightBranch);

            // this.mergeGeometry(geometry, branchesGeometry);

            this.mergeGeometry(geometry, leftBranch);

            const rightBranchMesh = new BufferGeometry();
            rightBranchMesh.setAttribute('position', new Float32BufferAttribute(geometry.vertices, 3));
            rightBranchMesh.setIndex(geometry.faces);
            rightBranchMesh.computeVertexNormals();

            
            const projectionRing = ring.clone();
            this.rotateRing(projectionRing, this.getRotationVariance(), true, true);

            const intersections = this.projectRing(rightBranchMesh, projectionRing);

            console.log('intersections', intersections);

            intersections.forEach(({point}) => {
                const geometry = new SphereGeometry( 0.25, 10, 5 );
                const material = new MeshBasicMaterial( { color: 0xffff00 } );
                const sphere = new Mesh( geometry, material );
                sphere.position.x = point.x;
                sphere.position.y = point.y;
                sphere.position.z = point.z;
                this.obj.add( sphere );
            })

            console.log('geometry', geometry);


            return geometry;


            //this.generateBranch(geometry, branchCount, segmentLength, sectionsPerSegment, radius, leftRing);
            //this.generateBranch(geometry, branchCount, segmentLength, sectionsPerSegment, radius, rightRing, true);
            

            if (this.settings.doLeaves && leafBranchDepth >= branchCount) {
                const factor = (branchCount + leafRelativeScaleFactor * (leafBranchDepth - branchCount)) / leafBranchDepth;
                const leafScale = factor * leafScaleFactor
                this.addLeaf(leftRing.matrix, leafScale);
                if (branchCount === 1) {
                    this.addLeaf(rightRing.matrix, leafScale)
                }
            }
        } else {
            // geometry.vertices.push(...ring.position.clone().toArray());
            // const vertCount = geometry.vertices.length / 3;
            // this.fillHole(geometry, sectionsPerSegment, vertCount - 1 - sectionsPerSegment, vertCount - 1);
        }

    }

    buildBranch(ring, radius, segmentLength, branchCount, lengthDecay, radiusDecay, isRight = false) {
        const { sectionsPerSegment } = this.settings;

        const ringClone = ring.clone();
        const branchSegmentLength = segmentLength - segmentLength * lengthDecay;
        const branchRadius = radius - radius * radiusDecay;
        const variance = this.getRotationVariance();

        this.rotateRing(ringClone, variance, isRight);
        ringClone.scale.x = ringClone.scale.y = ringClone.scale.z = radius / this.maxRadius;
        ringClone.translateY(branchSegmentLength);

        const branchGeometry = {
            vertices: [],
            faces: []
        };

        branchGeometry.vertices.push(...ring.position.toArray());
        cloneVerticesWithTransform(ring, branchGeometry);
        this.fillHole(branchGeometry, sectionsPerSegment, 1, 0);

        this.generateSection(
            ringClone, 
            branchRadius, 
            branchSegmentLength, 
            branchCount, 
            isRight, 
            variance,
            branchGeometry
        );

        branchGeometry.vertices.push(...ringClone.position.toArray());
        const vertCount = branchGeometry.vertices.length / 3;
        this.fillHole(branchGeometry, sectionsPerSegment, vertCount - 1 - sectionsPerSegment, vertCount - 1);

        return [branchGeometry, branchRadius, branchSegmentLength]
    }

    unionBranches(leftBranch, rightBranch) {
        const leftBranchMesh = new BufferGeometry();
        leftBranchMesh.setAttribute('position', new Float32BufferAttribute(leftBranch.vertices, 3));
        leftBranchMesh.setIndex(leftBranch.faces);
        leftBranchMesh.computeVertexNormals();

        const leftBsp = CSG.fromGeometry(leftBranchMesh);

        const rightBranchMesh = new BufferGeometry();
        rightBranchMesh.setAttribute('position', new Float32BufferAttribute(rightBranch.vertices, 3));
        rightBranchMesh.setIndex(rightBranch.faces);
        rightBranchMesh.computeVertexNormals();


        const rightBsp = CSG.fromGeometry(rightBranchMesh)


        return this.bspToGeom(rightBsp.inverse().union(leftBsp.inverse()));
    }

    projectRing(targetGeometry, ring) {
        const ringCopy = ring.clone();
        const sourceGeom = {vertices: []};
        ringCopy.scale.multiplyScalar(0.9);
        cloneVerticesWithTransform(ringCopy, sourceGeom);

        ringCopy.translateY(1);
        const targetGeom = {vertices: []};
        cloneVerticesWithTransform(ringCopy, targetGeom);

        console.log('vectors', {
            sourceGeom,
            targetGeom
        })

        const mat = new MeshLambertMaterial( {
            side: FrontSide
        } );
        console.log('sided', mat.side);
        const targetMesh = new Mesh(targetGeometry, mat);

        const intersections = []

        for (let i = 0; i < sourceGeom.vertices.length; i+=3) {
            const sourceVerts = sourceGeom.vertices;
            const targetVerts = targetGeom.vertices;
            const origin = new Vector3(sourceVerts[i], sourceVerts[i+1], sourceVerts[i+2]);
            const target = new Vector3(targetVerts[i], targetVerts[i+1], targetVerts[i+2])
            const rayCaster = new Raycaster(
                origin, 
                new Vector3().subVectors(target, origin).normalize(), 
            )

            this.obj.add(new ArrowHelper(
                rayCaster.ray.direction, 
                rayCaster.ray.origin, 
                20,
                Math.random() * 0xffffff,
                1,
                0.5
            ));

            intersections.push(rayCaster.intersectObject(targetMesh));
        }

        return intersections.
            filter(intersect => intersect.length).
            map(intersect => intersect[0]);
    }

    bspToGeom(bsp) {
        const vertices = [];
        const faces = [];
        let vertCount = 0;
        
        const polyGroupLength = bsp.polygons.length;
        for (let polyIndex = 0; polyIndex < polyGroupLength; polyIndex++) {
            const polyVertices = bsp.polygons[polyIndex].vertices;
            const vertLength = polyVertices.length;
            for (let i = 0; i < vertLength; i++) {
                const vertPos = polyVertices[i].pos;
                vertices.push(vertPos.x, vertPos.y, vertPos.z);
                if (i > 1) {
                    faces.push(vertCount + 0, vertCount + i-1, vertCount + i);
                }
            }
            vertCount = vertices.length/3;
        }

        return {
            vertices,
            faces
        };
    }

    mergeGeometry(targetGeom, sourceGeom) {
        const vertCount = targetGeom.vertices.length / 3;
        targetGeom.vertices.push(...sourceGeom.vertices);
        targetGeom.faces.push(...sourceGeom.faces.map(index => index + vertCount));
        return targetGeom
    }

    generateSection(ring, radius, segmentLength, branchCount, isRight, variance = 1,  geometry = {
        vertices: [],
        faces: [],
    }) {
        const { 
            branchDepth,
            sectionsPerSegment,
            segmentsPerBranch
        } = this.settings;

        for(let i = 0; i < segmentsPerBranch; i++) {
            ring.translateOnAxis(ring.worldToLocal(new Vector3(0,1,0)), segmentLength);
            ring.scale.x = ring.scale.y = ring.scale.z = radius / this.maxRadius;
            if (branchCount !== branchDepth) {
                this.rotateRing(ring, variance, isRight);
            }

            cloneVerticesWithTransform(ring, geometry);

            this.generateSegment(geometry, sectionsPerSegment, 1);
        }

        return geometry;
    }

    rotateRing(ring, variance, right = false, fullRotation = false) {
        const {
            trunkRotationX,
            trunkRotationY,
            trunkRotationZ,
            branchRotationX,
            branchRotationY,
            branchRotationZ,
            segmentsPerBranch,
        } = this.settings;
        const rotationPerSegment = fullRotation ? 1 : 1 / segmentsPerBranch;
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