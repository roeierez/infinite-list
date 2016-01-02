var StyleHelpers = require('./StyleHelpers');

var ScrollbarRenderer = function(rootElement){
    var scrollbar = document.createElement('div'),
        clientHeight = rootElement.parentElement.clientHeight;

    StyleHelpers.applyElementStyle(scrollbar, {
        position: 'absolute',
        top: '0px',
        right: '0px',
        marginRight: '3px',
        opacity: 0.3,
        width: '5px',
        backgroundColor: "#333"
    });
    rootElement.appendChild(scrollbar);

    function render(topOffset, listHeight){
        var attachedElement = rootElement.parentElement,
            scrollbarHeight = Math.max(10, Math.floor(clientHeight / listHeight * clientHeight)),
            scrollbarPos = Math.floor(topOffset / (listHeight - clientHeight) * (clientHeight - scrollbarHeight)),
            heightInPx = scrollbarHeight + 'px';

        StyleHelpers.applyElementStyle(scrollbar, {
            height: heightInPx
        });
        StyleHelpers.applyTransformStyle(scrollbar, 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + ( scrollbarPos) + ', 0, 1)');
    }

    function refresh(){
        clientHeight = rootElement.parentElement.clientHeight;
    }

    return {
        render: render,
        refresh: refresh
    }
};

module.exports = ScrollbarRenderer;

