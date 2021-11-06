module.exports = {
    cloneVerticesWithTransform:function( source, target, transformationMatrix ){
        source.vertices.forEach(function(vert){
            target.vertices.push( vert.clone().applyMatrix4( transformationMatrix) );
        });
    }
};