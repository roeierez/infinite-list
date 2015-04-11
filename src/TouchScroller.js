var Scroller = require('../vendor/zynga-scroller/Scroller');

var TouchScroller = function(parentElement, callback, givenTouchProvider){

    var scroller = new Scroller(callback),
        touchProvider = givenTouchProvider || parentElement;

    var doTouchStart = function (e) {
            scroller.doTouchStart(e.touches, e.timeStamp);
            e.preventDefault();
        },
        doTouchMove =  function (e) {
            scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
        },
        doTouchEnd = function (e) {
            scroller.doTouchEnd(e.timeStamp);
        },
        doTouchCancel = function (e) {
            e.preventDefault();
        };

    connectTouch();
    function connectTouch(){

        touchProvider.addEventListener('touchstart', doTouchStart);
        touchProvider.addEventListener('touchmove', doTouchMove);
        touchProvider.addEventListener('touchend', doTouchEnd);
        touchProvider.addEventListener('touchcancel', doTouchCancel);

        var mousedown = false;

        touchProvider.addEventListener("mousedown", function(e) {

            if (e.target.tagName.match(/input|textarea|select/i)) {
                return;
            }

            scroller.doTouchStart([{
                pageX: e.pageX,
                pageY: e.pageY
            }], e.timeStamp);

            mousedown = true;
            e.preventDefault();

        }, false);

        touchProvider.addEventListener("mousemove", function(e) {

            if (!mousedown) {
                return;
            }

            scroller.doTouchMove([{
                pageX: e.pageX,
                pageY: e.pageY
            }], e.timeStamp);

            mousedown = true;

        }, false);

        touchProvider.addEventListener("mouseup", function(e) {

            if (!mousedown) {
                return;
            }

            scroller.doTouchEnd(e.timeStamp);
            mousedown = false;

        }, false);

    }

    function disconnect(){
        touchProvider.removeEventListener('touchstart', doTouchStart);
        touchProvider.removeEventListener('touchmove', doTouchMove);
        touchProvider.removeEventListener('touchend', doTouchEnd);
        touchProvider.removeEventListener('touchcancel', doTouchCancel);
    }

    function setDimensions () {
        scroller.setDimensions.apply(scroller, arguments);
    }

    function scrollTo () {
        scroller.scrollTo.apply(scroller, arguments);
    }

    return {
        disconnect: disconnect,
        setDimensions: setDimensions,
        scrollTo: scrollTo
    }
}

module.exports = TouchScroller;