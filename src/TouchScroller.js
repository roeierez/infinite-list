var Scroller = require('../vendor/zynga-scroller/Scroller');

var TouchScroller = function(parentElement, callback, givenTouchProvider){

    var scroller = new Scroller(callback),
        touchProvider = givenTouchProvider || parentElement;

    connectTouch();

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

    function connectTouch(){
        touchProvider.addEventListener('touchstart',doTouchStart);
        touchProvider.addEventListener('touchmove', doTouchMove);
        touchProvider.addEventListener('touchend',doTouchEnd);
        touchProvider.addEventListener('touchcancel', doTouchCancel);
    }

    function disconnect(){
        touchProvider.removeEventListener('touchstart',doTouchStart);
        touchProvider.removeEventListener('touchmove', doTouchMove);
        touchProvider.removeEventListener('touchend',doTouchEnd);
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
        setDimensions: setDimensions
    }
}

module.exports = TouchScroller;