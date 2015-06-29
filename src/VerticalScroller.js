var SCROLLING_TIME_CONSTANT = 250;

var VerticalScroller = function (parentElement, callback) {

    var timestamp = 0,
        scrollerHeight = 0,
        minimumOffseat = 0,
        scrollerViewHeight = 0,
        frame = 0,
        velocity = 0,
        amplitude = 0,
        pressed = 0,
        ticker = 0,
        reference = 0,
        offset = 0,
        target = 0;

    parentElement.addEventListener('touchstart', tap);
    parentElement.addEventListener('touchmove', drag);
    parentElement.addEventListener('touchend', release);
    parentElement.addEventListener('mousedown', tap);
    parentElement.addEventListener('mousemove', drag);
    parentElement.addEventListener('mouseup', release);

    function ypos (e) {
        // touch event
        if (e.targetTouches && (e.targetTouches.length >= 1)) {
            return e.targetTouches[0].clientY;
        }

        // mouse event
        return e.clientY;
    }

    function track () {
        var now, elapsed, delta, v;

        now = Date.now();
        elapsed = now - timestamp;
        timestamp = now;
        delta = offset - frame;
        frame = offset;

        v = 1000 * delta / (1 + elapsed);
        velocity = 0.8 * v + 0.2 * velocity;
    }

    function scroll (y){
        offset = y;//Math.max(minimumOffseat, Math.min(scrollerHeight - scrollerViewHeight, y));
        //offset = Math.max(startOffset, Math.min(scrollerHeight - scrollerViewHeight, y));// Math.max(0, Math.min(scrollerHeight - scrollerViewHeight, y));
        callback(offset);
    }

    function autoScroll () {
        var elapsed, delta;

        if (amplitude) {
            elapsed = Date.now() - timestamp;
            delta = amplitude * Math.exp(-elapsed / SCROLLING_TIME_CONSTANT);
            if (delta > 10 || delta < -10) {
                scroll(target - delta);
                requestAnimationFrame(autoScroll);
            } else {
                scroll(target);
            }
        }
    }

    function tap (e) {
        pressed = true;
        reference = ypos(e);

        velocity = amplitude = 0;
        frame = offset;
        timestamp = Date.now();
        clearInterval(ticker);
        ticker = setInterval(track, 10);

        e.preventDefault();
        e.stopPropagation();
    }

    function drag (e) {
        var y, delta;
        if (pressed) {
            y = ypos(e);
            delta = reference - y;
            if (delta > 2 || delta < -2) {
                reference = y;
                scroll(offset + delta);
            }
        }
        e.preventDefault();
        e.stopPropagation();
    }
    function release (e) {
        pressed = false;

        clearInterval(ticker);

        if (velocity > 10 || velocity < -10) {
            amplitude = 0.8 * velocity;
            target = Math.round(offset + amplitude);
            timestamp = Date.now();
            requestAnimationFrame(autoScroll);
        }

        e.preventDefault();
        e.stopPropagation();
    }

    function scrollTo(y){
        amplitude = 0;
        scroll(y);
    }

    function changeScrollPosition (y) {
        scroll(y);
    }

    function setDimensions(minOffset, height, viewHeight, addScrollOffset){
        target += (addScrollOffset || 0);
        offset += (addScrollOffset || 0);
        minimumOffseat = minOffset;
        scrollerHeight = height;
        scrollerViewHeight = viewHeight;
    }

    return {
        setDimensions: setDimensions,
        scrollTo: scrollTo,
        changeScrollPosition: changeScrollPosition
    }
};

module.exports = VerticalScroller;
