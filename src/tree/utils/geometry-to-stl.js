/**
 * Amalgamation of exporter techniques from:
 * 
 * https://github.com/Doodle3D/ThreeJS-export-STL/blob/master/src/index.js
 * Full credit to
 *  casperlamboo Casper Lamboo
 * @peteruithoven peteruithoven Peter Uithoven
 * 
 * AND
 * 
 * http://bhavita.space/docs/file/scripts/exporters/STLExporter.js.html
 * @author kovacsv / http://kovacsv.hu/
 * @author mrdoob / http://mrdoob.com/
 * @author mudcube / http://mudcu.be/
 * @author Mugen87 / https://github.com/Mugen87
 * 
 */
  
function writeVector(dataView, { x, y, z }) {
    writeFloat(dataView, x);
    writeFloat(dataView, y);
    writeFloat(dataView, z);
}
  
function writeFloat(dataView, float) {
    dataView.data.setFloat32(dataView.offset, float, true);
    dataView.offset += 4;
}

const HeaderOffset = 80;
  
export function geometryToStl(geometries) {
  let dataView;
  
  const triangles = geometries.reduce((count, geometry) => count + geometry.faces.length, 0);
  const bufferSize = triangles * 2 + triangles * 3 * 4 * 4 + HeaderOffset + 4;
  const buffer = new ArrayBuffer(bufferSize);
  dataView = {
    data: new DataView(buffer),
    offset: HeaderOffset
  };

  dataView.data.setUint32(HeaderOffset, triangles, true);
  dataView.offset += 4;

  geometries.forEach((geometry) => {

    const faces = geometry.faces;
    const vertices = geometry.vertices;
  
    for (let i = 0; i < faces.length; i ++) {
      writeVector(dataView, faces[i].normal, true);
  
      writeVector(dataView, vertices[faces[i].a], false);
      writeVector(dataView, vertices[faces[i].b], false);
      writeVector(dataView, vertices[faces[i].c], false);
  
      dataView.data.setUint16( dataView.offset, 0, true );
      dataView.offset += 2;
    }

  });

  return dataView.data.buffer;
}