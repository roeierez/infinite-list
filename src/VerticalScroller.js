var SCROLLING_TIME_CONSTANT = 325;

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
        target = 0,
        touchPositions = [];

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
        offset = y;//Math.min( Math.max(y, minOffset), maxOffset);
        callback(y);
    }

    function autoScroll () {
        var elapsed, delta, newOffset;

        if (amplitude) {
            elapsed = Date.now() - timestamp;
            delta = amplitude * Math.exp(-elapsed / SCROLLING_TIME_CONSTANT);
            newOffset = target - delta;

            if (newOffset < minOffset) {
                if (target - delta >= minOffset-2){
                    scroll(minOffset);
                    return;
                }

                bounce(true);

            } else if (newOffset > maxOffset) {
                if (target - delta <= maxOffset + 2){
                    scroll(maxOffset);
                    return;
                }
                bounce(false);

            } else if (delta > 2 || delta < -2) {
                scroll(target - delta);
                requestAnimationFrame(autoScroll);
            } else {
                scroll(target);
            }
        }
    }

    function bounce (top){
        if (amplitude == 0){
            return;
        }
        //console.error('amplitude = ' + amplitude + ' maxoffset = ' + maxOffset + ' target = ' + target + ' offset=' + offset);
        var elapsed = Date.now() - timestamp;
        var delta = amplitude * Math.exp(-elapsed / SCROLLING_TIME_CONSTANT);
        if ( (top && amplitude > 0 || !top && amplitude < 0) && Math.abs(delta) < 2) {
            scroll(top ? minOffset : maxOffset);
            return;
        }

        scroll(target - delta);

        if (amplitude > 0 && top) {
            target = minOffset;
            amplitude = (target - offset);

        } else if (amplitude < 0 && !top) {
            target = maxOffset;
            amplitude = (target - offset);

        }
        else {
            if (top) {
                target = minOffset - (minOffset - target) * 0.9;
            } else {
                target = maxOffset - (maxOffset - target) * 0.9;
            }
            amplitude = target - offset;
            timestamp = new Date();
        }

        requestAnimationFrame(function(){
            bounce(top);
        });
        return;
    }

    function tap (e) {
        pressed = true;
        reference = ypos(e);

        velocity = amplitude = 0;
        frame = offset;
        timestamp = Date.now();
        recordTouches(e);
        // clearInterval(ticker);
        // ticker = setInterval(track, 10);

        e.preventDefault();
        e.stopPropagation();
    }

    function drag (e) {
        var y, delta;
        if (pressed) {
            recordTouches(e);
            y = ypos(e);
            delta = reference - y;
            if (delta > 2 || delta < -2) {
                reference = y;
                scroll(offset + delta * 0.5);
            }
        }
        e.preventDefault();
        e.stopPropagation();
    }

    function recordTouches(e) {
        var touches = e.touches,
            timestamp = e.timeStamp,
            currentTouchTop = touches[0].pageY;

        if (touches.length === 2) {
            currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
        }

        touchPositions.push({offset: currentTouchTop, timestamp: timestamp});
        if (touchPositions.length > 60) {
            touchPositions.splice(0, 30);
        }
    }

    function release (e) {
        pressed = false;

        var endPos = touchPositions.length - 1;
        var startPos = endPos - 1;

        // Move pointer to position measured 100ms ago
        for (var i = endPos - 1; i > 0 && touchPositions[i].timestamp > (touchPositions[endPos].timestamp - 100); i -= 1) {
            startPos = i;
        }

        var elapsed = touchPositions[endPos].timestamp - touchPositions[startPos].timestamp;
        var delta = touchPositions[endPos].offset - touchPositions[startPos].offset;

        var v = -1000 * delta / (1 + elapsed);
        velocity = 0.8 * v + 0.2 * velocity;

        clearInterval(ticker);

        amplitude = 0.8 * velocity;
        target = Math.round(offset + amplitude);
        timestamp = Date.now();
        requestAnimationFrame(autoScroll);

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
        scrollTo: scrollTo
    }
};

module.exports = VerticalScroller;
