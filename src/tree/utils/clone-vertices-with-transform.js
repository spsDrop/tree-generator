export function cloneVerticesWithTransform( sourceMesh, targetGeometry, matrix ){
    sourceMesh.updateMatrix();
    const clone = sourceMesh.geometry.clone();
    clone.applyMatrix(matrix || sourceMesh.matrix);
    targetGeometry.vertices.push(...clone.vertices);
}