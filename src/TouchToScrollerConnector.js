var TouchToScrollerConnector = function(touchProvider, scroller){

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

    function connect(){
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

    return {
        connect: connect,
        disconnect: disconnect
    }
}

module.exports = TouchToScrollerConnector;