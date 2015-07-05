var SCROLLING_TIME_CONSTANT = 250;

var VerticalScroller = function (parentElement, callback) {

    var timestamp = 0,
        minOffset = 0,
        maxOffset = 0,
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

    function scroll (y) {
        offset = Math.min( Math.max(y, minOffset), maxOffset);
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

    function scrollTo(y, animate){
        var maxAnimateDelta = 4000;
        if (animate) {
            if (y - offset > maxAnimateDelta) {
                offset = y - maxAnimateDelta;
            } else if (offset - y > maxAnimateDelta) {
                offset = y + maxAnimateDelta;
            }

            amplitude = y - offset;
            target = y;
            timestamp = Date.now();
            requestAnimationFrame(autoScroll);
        } else {
            amplitude = 0;
            scroll(y);
        }
    }

    function changeScrollPosition (y) {
        scroll(y);
    }

    function setDimensions(min, max){
        minOffset = min;
        maxOffset = max;
    }

    return {
        setDimensions: setDimensions,
        scrollTo: scrollTo,
        changeScrollPosition: changeScrollPosition
    }
};

module.exports = VerticalScroller;
