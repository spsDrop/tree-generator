var T = require('../../lib/three.js');

// Converts from degrees to radians.
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
};


var TreeApp = function(){
    this.renderer = new T.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( 0xffffff );

    this.setupScene();

    this.generateTree();
};

TreeApp.prototype = {
    setupScene: function setupScene(){
        this.scene = new T.Scene();

        var light = new T.PointLight( 0xffffff, 1, 100 );
        light.position.set( 5, 7, 10 );
        this.scene.add( light );

        var camera =
            this.camera =
            new T.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.set( 15, 20, 15);
        camera.lookAt( new T.Vector3( 0, 7.5, 0 ) );
    },

    generateTree: function generateTree(){
        var material = new T.MeshLambertMaterial( {
                        color: 0x00ff00,
                        shading: T.SmoothShading,
                        wireframe: false
                    } );

        material.side = T.DoubleSide;

        if(this.tree){
            this.scene.remove(this.tree);
            this.tree.geometry.dispose();
            this.tree.material.dispose();
            this.tree = null;
        }

        var tree =
                this.tree =
                new T.Mesh( this.generateGeometry(), material );

        tree.flipSided = true;
        tree.position.y = -10;
        this.scene.add( tree );
    },

    generateGeometry: function generateGeometry(){

        var geometry = new T.Geometry();

        this.generateBranch(
            geometry,
            9,
            5,
            2,
            12,
            1
        );

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        return geometry;
    },

    generateBranch: function(geometry, branchDepth, segmentsPerBranch, segmentLength, sections, radius, ring){
        var leftRing, rightRing;

        if(!ring){
            this.maxRadius = radius;
            ring = this.generateRing(radius, sections);
        }
        this.cloneVerticesWithTransform(ring.children[0].geometry, geometry, ring.matrix);

        for(var i = 0; i < segmentsPerBranch; i++) {

            ring.translateOnAxis(ring.worldToLocal(new T.Vector3(0,1,0)), segmentLength);
            ring.scale.x = ring.scale.y = ring.scale.z = radius / this.maxRadius;
            ring.updateMatrix();

            radius -= radius * 0.05;

            this.cloneVerticesWithTransform(ring.children[0].geometry, geometry, ring.matrix);

            this.generateSegment(geometry, sections, 1);
        }

        var randSeed = Math.random() - 0.5;
        branchDepth--;

        if(branchDepth > 0){
            leftRing = ring.clone();
            segmentLength -= segmentLength * 0.2;
            radius -= radius * 0.25;

            leftRing.rotation.x += Math.radians(15);
            leftRing.rotation.y += Math.radians(45 * randSeed);
            leftRing.rotation.z += Math.radians(25 * randSeed);
            leftRing.updateMatrix();

            leftRing.scale.x = leftRing.scale.y = leftRing.scale.z = radius / this.maxRadius;
            leftRing.translateY(segmentLength);
            leftRing.updateMatrix();

            this.cloneVerticesWithTransform(leftRing.children[0].geometry, geometry, leftRing.matrix);

            this.generateSegment(geometry, sections, 1);


            rightRing = ring.clone();
            segmentLength -= segmentLength * 0.2;
            radius -= radius * 0.05;

            rightRing.rotation.x -= Math.radians(40);
            rightRing.rotation.y += Math.radians(45 * -randSeed);
            rightRing.rotation.z += Math.radians(60 * -randSeed);
            rightRing.updateMatrix();

            rightRing.scale.x = rightRing.scale.y = rightRing.scale.z = radius / this.maxRadius;
            rightRing.translateY(segmentLength);
            rightRing.updateMatrix();

            this.cloneVerticesWithTransform(rightRing.children[0].geometry, geometry, rightRing.matrix);

            this.generateSegment(geometry, sections, 2);

            this.generateBranch(geometry, branchDepth, segmentsPerBranch, segmentLength, sections, radius, leftRing);
            this.generateBranch(geometry, branchDepth, segmentsPerBranch, segmentLength, sections, radius, rightRing);
        }
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
    },

    render: function render() {
        this.tree.rotation.y += 0.01;

        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
};

module.exports = TreeApp;