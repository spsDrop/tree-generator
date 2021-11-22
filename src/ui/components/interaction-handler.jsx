/** @jsx jsx */
import { jsx } from '@emotion/react';
import { css } from '@emotion/react';
import React from "react";
import { Gestures } from 'react-gesture-handler';
import { throttle } from '../utils/throttle';

function getNormalizedClientX(e) {
    if (!isNaN(e.clientX)) {
        return e.clientX
    } else if (e.touches && e.touches.length === 1) {
        return e.touches[0].clientX;
    }
}



const eventArea = css`
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    touch-action: none;
`

export function InteractionHander({treeScene}) {

    let spinHome = null;
    let rotation = 0;

    const onSpinStart = (e) => {
        const clientX = getNormalizedClientX(e);
        if (clientX) {
            spinHome = { x: clientX };
            treeScene.manualRotation = true;
            rotation = treeScene.getRotation();
        }
    }

    const onSpinMove = throttle((e) => {
        if (spinHome) {
            const clientX = getNormalizedClientX(e);
            if (clientX) {
                const offsetPercent = (clientX - spinHome.x) / window.innerWidth;
                treeScene.setRotation(rotation + offsetPercent * 2 * Math.PI);
            }
        }
    }, 1000/60);

    const onSpinEnd = () => {
        spinHome = null;
        treeScene.manualRotation = false;
    }

    let startScale = 1;

    const onScaleStart = () => {
        startScale = treeScene.scale;
    };

    const onScaleMove = throttle((e) => {
        if (!isNaN(e.scale)) {
            treeScene.setScale((1 / e.scale) * startScale);
        }
    }, 1000/60);

    const onScaleStep = (e) => {
        if (!isNaN(e.deltaY)) {
            const offsetPercent = e.deltaY / window.innerHeight;
            treeScene.setScale(treeScene.scale + offsetPercent);
        }
    }

    return (
        <Gestures
            recognizers={{
                Pinch: {
                    events: {
                        pinchstart: onScaleStart,
                        pinchmove: onScaleMove,
                    }
                }
            }}
        >
            <div css={eventArea} 
                onTouchStart={onSpinStart}
                onTouchMove={onSpinMove}
                onTouchEnd={onSpinEnd}
                onTouchCancel={onSpinEnd}
                onMouseDown={onSpinStart}
                onMouseMove={onSpinMove}
                onMouseUp={onSpinEnd}
                onMouseLeave={onSpinEnd}
                onWheel={onScaleStep}
            />
        </Gestures>
    )
}