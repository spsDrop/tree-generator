import React, { useCallback } from "react";

const mimetype = 'model/x.stl-binary';
const filename = 'tree.stl';

function saveFile(buffer) {
    const a = window.document.createElement('a');

    const blob = new Blob([new Uint8Array(buffer)], {type: mimetype});
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();
}

export function Download({treeScene}) {
    function save() {
        const treeBuffer = treeScene.getTreeStlBuffer();

        saveFile(treeBuffer)
    }

    return <button onClick={save}>Download STL</button>
}