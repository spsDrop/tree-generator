import React from "react";
import { useEffect, useState } from "react";

export function FpsCounter({treeScene}){
    const [fps, setFps] = useState(0);

    useEffect(() => {
        treeScene.startCounter(setFps)
    }, [])

    return (
        <span>FPS: {fps}</span>
    )
}