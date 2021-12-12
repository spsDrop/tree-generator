export function onNextFrameThrottle(cb) {
    let waitingForFrame = false;
    const onFrame = () => {
        waitingForFrame = false;
        cb();
    }
    return () => {
        if (!waitingForFrame) {
            waitingForFrame = true;
            window.requestAnimationFrame(onFrame)
        }
    }
}