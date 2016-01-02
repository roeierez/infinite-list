var StyleHelpers = require('./StyleHelpers');

var Layer = function (parentElement) {
    var listItemElement = null,
        identifier = "",
        currentOffset = -1,
        itemIndex = -1,
        itemHeight = 0;

    listItemElement = createListItemWrapperElement();
    parentElement.appendChild(listItemElement);

    function attach(index, width, height, itemIdentifier) {
        itemIndex = index;
        itemHeight = height;
        StyleHelpers.applyElementStyle(listItemElement, {
            width: width + 'px',
            height: height + 'px',
            overflow: 'hidden'
        });
        itemHeight = height;
       // setItemOffset(topOffset);
        identifier = itemIdentifier;
        return this;
    }

    function getItemIndex() {
        return itemIndex;
    }

    function getDomElement() {
        return listItemElement;
    }

    function getIdentifier() {
        return identifier;
    }

    function getItemOffset(){
        return currentOffset;
    }

    function setItemOffset(offset){
        StyleHelpers.applyTransformStyle(listItemElement, 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + offset + ', 0, 1)');
        currentOffset = offset;
    }

    function getItemHeight() {
        return itemHeight || (itemHeight = getDomElement().clientHeight);
    }

    function setItemHeight(newHeight) {
        itemHeight = newHeight;
    }

    function createListItemWrapperElement() {
        var el = document.createElement('div');
        StyleHelpers.applyElementStyle(el, {
            position: 'absolute',
            top: 0,
            left: 0
        });
        return el;
    }

    return {
        attach: attach,
        getItemIndex: getItemIndex,
        getDomElement: getDomElement,
        getItemOffset: getItemOffset,
        setItemOffset: setItemOffset,
        getItemHeight: getItemHeight,
        setItemHeight: setItemHeight,
        getIdentifier: getIdentifier
    }
};

module.exports = Layer;
