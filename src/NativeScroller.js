var StyleHelpers = require('./StyleHelpers');

var NativeScroller = function (scrollElement, callback) {

    scrollElement.addEventListener('scroll', function(){
        callback(scrollElement.scrollTop);
    });

    return {
        setDimensions: function(min, max){
            StyleHelpers.applyElementStyle(scrollElement, {
                height: (max - min) + 'px'
            });
        },
        scrollTo: function(){
            callback(scrollElement.scrollTop);
        }
    }
}

module.exports = NativeScroller;
