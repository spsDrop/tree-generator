export function cloneVerticesWithTransform( sourceMesh, targetGeometry, matrix ){
    sourceMesh.updateMatrix();
    const clone = sourceMesh.geometry.clone();
    clone.applyMatrix4(matrix || sourceMesh.matrix);
    targetGeometry.vertices.push(...clone.getAttribute('position').array);
}