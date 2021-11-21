export function throttle(fn, delay) {
    let timer;
    let lastTrigger;

    return function(...args) {
        const now = Date.now();
        const triggerAndRest = () => {
            fn(...args);
            lastTrigger = Date.now();
            timer = undefined;
        };
        if (lastTrigger && now - lastTrigger < delay && !timer) {
            timer = setTimeout(triggerAndRest, delay - (now - lastTrigger));
        }
        if (!lastTrigger || now - lastTrigger > delay) {
            triggerAndRest();
        }

    }
}