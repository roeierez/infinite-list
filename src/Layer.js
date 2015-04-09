var StyleHelpers = require('./StyleHelpers');

var Layer = function (parentElement) {
    var listItemElement = null,
        identifier = "",
        itemIndex = -1;

    listItemElement = createListItemWrapperElement();
    parentElement.appendChild(listItemElement);

    function attach(index, topOffset, width, height, itemIdentifier) {
        itemIndex = index;

        StyleHelpers.applyElementStyle(listItemElement, {
            width: width + 'px',
            height: (height || DEFAULT_ITEM_HEIGHT) + 'px',
            webkitTransform: 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + topOffset + ', 0, 1)'
        });

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
        getIdentifier: getIdentifier
    }
};

module.exports = Layer;
