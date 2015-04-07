var Scroller = require("../vendor/zynga-scroller/Scroller.js");

var DEFAULT_ITEM_HEIGHT = 40,
    Helpers = {
        applyElementStyle: function (element, styleObj) {
            Object.keys(styleObj).forEach(function (key) {
                if (element.style[key] != styleObj[key]) {
                    element.style[key] = styleObj[key];
                }
            })
        }
    }

var Layer = function (parentElement) {
    var listItemElement = null,
        identifier = "",
        itemIndex = -1;

    listItemElement = createListItemWrapperElement();
    parentElement.appendChild(listItemElement);

    function attach(index, topOffset, renderer, width, height, itemIdentifier) {
        itemIndex = index;

        Helpers.applyElementStyle(listItemElement, {
            width: width + 'px',
            height: (height || DEFAULT_ITEM_HEIGHT) + 'px',
            webkitTransform: 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + topOffset + ', 0, 1)'
        });

        renderer(itemIndex, listItemElement);
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
        Helpers.applyElementStyle(el, {
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

var LayersPool = function () {
    var layersByIdentifier = {};

    function addLayer(layer, hide) {
        var layerIdentifier = layer.getIdentifier();
        if (layersByIdentifier[layerIdentifier] == null) {
            layersByIdentifier[layerIdentifier] = [];
        }
        layersByIdentifier[layerIdentifier].push(layer);
        if (hide){
            Helpers.applyElementStyle(layer.getDomElement(), {display: 'none'})
        }
    }

    function borrowLayerWithIdentifier(identifier) {
        if (layersByIdentifier[identifier] == null) {
            return null;
        }
        var layer = layersByIdentifier[identifier].pop();
        if (layer != null) {
            Helpers.applyElementStyle(layer.getDomElement(), {display: 'block'})
        }
        return layer;
    }

    return {
        addLayer: addLayer,
        borrowLayerWithIdentifier: borrowLayerWithIdentifier
    }
}

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

var InfiniteList = function (listConfig) {

    var config = {
            itemHeightGetter: null,
            itemRenderer: null,
            itemTypeGetter: null,
            pageFetcher: null,
            loadMoreRenderer: function(index, domElement){
                domElement.innerHTML = 'Loading...';
            },
            hasMore: false,
            itemsCount: 0
        },
        parentElement = null,
        rootElement = null,
        scrollElement = null,
        scrollbar = null,
        scroller = null,
        visibleHeight = 0,
        renderedListItems = [],
        accumulatedRowHeights = [],
        layersPool = new LayersPool(),
        touchConnector = null,
        topOffset = 0,
        runAnimation = false,
        needsRender = true;

    for (key in listConfig){
        if (listConfig.hasOwnProperty(key)){
            config[key] = listConfig[key];
        }
    }

    function attach(domElement, touchProvider){
        parentElement = domElement;
        initializeRootElement(domElement);
        initializeScroller(domElement, touchProvider);
        window.addEventListener('resize', refresh.bind(this));
        runAnimationLoop();
        refresh();
        return this;
    }

    function detach() {
        runAnimation = false;
        if (touchConnector){
            touchConnector.disconnect();
        }
        parentElement.removeChild(rootElement);
        window.removeEventListener('resize', refresh.bind(this));
    }

    function runAnimationLoop(){
        runAnimation = true;
        var animationStep = function(){
            if (needsRender) {
                render();
                needsRender = false;
            }
            if (runAnimation) {
                requestAnimationFrame(animationStep);
            }
        }
        animationStep();
    }

    function calculateHeights() {
        accumulatedRowHeights = [0];
        for (var i = 1; i <= config.itemsCount || 0; ++i) {
            var currentRowHeight = config.itemHeightGetter ? config.itemHeightGetter(i - 1) : DEFAULT_ITEM_HEIGHT;
            accumulatedRowHeights[i] = accumulatedRowHeights[i - 1] + currentRowHeight;
        }
    }

    /*
     This method creates the list various elements:
     1. rootElement - the root element of the list which is the only one that has a relative position.
     all other elements are child of the root and has absolute position so the layout cycle will be minimal
     2. scrollElement - this one is the parent of all list items and is translated according to the top position given
     by the scroller
     3. scrollbar - the vertical scrollbar. The scrollbar is rendered because I don't use the native scroller here.
     */
    function initializeRootElement(parentElement) {
        scrollElement = document.createElement('div');
        Helpers.applyElementStyle(scrollElement, {
            position: 'absolute',
            top: 0,
            bottom: 0
        });

        rootElement = document.createElement('div');
        Helpers.applyElementStyle(rootElement, {
            position: 'relative',
            height: parentElement.clientHeight + 'px',
            width: parentElement.clientWidth + 'px',
            overflow: 'hidden'
        });
        rootElement.appendChild(scrollElement);

        scrollbar = document.createElement('div');
        Helpers.applyElementStyle(scrollbar, {
            position: 'absolute',
            top: '0px',
            right: '0px',
            marginRight: '3px',
            opacity: 0.3,
            width: '5px',
            backgroundColor: "#333"
        });
        rootElement.appendChild(scrollbar);
        parentElement.appendChild(
            rootElement);
    };

    /*
     Initialize the scroller
     The scroller is fed with touch input and is responsible for caculating momentum and eventually invoke a
     callback with the scrolling position when changed.
     I have used ZyngaScroller for that: https://github.com/zynga/scroller
     */
    function initializeScroller(parentElement, touchProvider) {

        scroller = new Scroller(function (left, top) {
            topOffset = top || 0;
            needsRender = true;
        });

        visibleHeight = parentElement.clientHeight;
        touchConnector = new TouchToScrollerConnector(touchProvider || parentElement, scroller);
        touchConnector.connect();
    }

    function updateScrollerDimentions(parentElement){

        scroller.setDimensions(
            parentElement.clientWidth,
            parentElement.clientHeight,
            parentElement.clientWidth,
            getListHeight()
        );
    }

    function refresh(){
        renderedListItems.forEach(function(layer){
            layersPool.addLayer(layer, true)
        });
        renderedListItems = [];
        calculateHeights();
        updateScrollerDimentions(parentElement);
        needsRender = true;
    }

    /*
     This method fix the list according to the top positoin:
     1. render the list items, recycle from the pool if needed and bring not needed items back to the pool.
     2. update the scrollbar
     3. translate the view according to the scrolling position
     */
    function render() {

        var topVisibleIndex = getFirstVisibleItemAtHeight(topOffset),
            bottomVisibleIndex = getFirstVisibleItemAtHeight(topOffset + visibleHeight);

        if (!config.hasMore){
            bottomVisibleIndex = Math.min(bottomVisibleIndex, config.itemsCount - 1);
        }
        //remove non-visible layers from top and push them to layerPool
        while (renderedListItems.length > 0 && renderedListItems[0].getItemIndex() < topVisibleIndex) {
            layersPool.addLayer(renderedListItems.shift());
        }

        //remove non-visible layers from bottom and push them to layerPool
        while (renderedListItems.length > 0 && renderedListItems[renderedListItems.length - 1].getItemIndex() > bottomVisibleIndex) {
            layersPool.addLayer(renderedListItems.pop());
        }

        var renderedStart = renderedListItems.length > 0 ? renderedListItems[0].getItemIndex() : (bottomVisibleIndex + 1),
            topItems = [];

        //fill the gaps on top
        for (var i = topVisibleIndex; i < renderedStart; ++i) {
            pushLayerAtIndex(i, topItems);
        }
        renderedListItems = topItems.concat(renderedListItems);

        //fill the gaps on bottom
        for (var i = renderedListItems[renderedListItems.length - 1].getItemIndex() + 1; i <= Math.min(config.itemsCount - 1, bottomVisibleIndex); ++i) {
            pushLayerAtIndex(i, renderedListItems);
        }

        if (bottomVisibleIndex > config.itemsCount - 1){
            renderLoadMore();
        }

        updateScrollbar();
        Helpers.applyElementStyle(scrollElement, {webkitTransform: 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + (-topOffset) + ', 0, 1)'});
    }

    /*
     Update the scrollbar size and position.
     */
    function updateScrollbar() {
        var listHeight = getListHeight(),
            attachedElement = rootElement.parentElement,
            scrollbarHeight = Math.max(10, Math.floor(attachedElement.clientHeight / listHeight * attachedElement.clientHeight)),
            scrollbarPos = Math.floor(topOffset / (listHeight - attachedElement.clientHeight) * (attachedElement.clientHeight - scrollbarHeight)),
            heightInPx = scrollbarHeight + 'px';

        Helpers.applyElementStyle(scrollbar, {
            height: heightInPx,
            webkitTransform: 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + ( scrollbarPos) + ', 0, 1)'
        });
    }

    function getListHeight(){
        return accumulatedRowHeights[accumulatedRowHeights.length - 1] + (!config.hasMore ? 0 : DEFAULT_ITEM_HEIGHT);
    }

    /*
     Borrow a layer from the LayersPool and attach it to a certain item at index.
     */
    function pushLayerAtIndex(index, listItems, identifier, height, renderer) {
        var layerIdentifier = identifier || (config.itemTypeGetter ? config.itemTypeGetter(index) : '');
        var layer = layersPool.borrowLayerWithIdentifier(layerIdentifier);
        if (layer == null) {
            layer = new Layer(scrollElement);
        }
        //index, topOffset, renderer, width, height, itemIdentifier
        var itemHeight = height || config.itemHeightGetter && config.itemHeightGetter(index);
        layer.attach(index, accumulatedRowHeights[index], renderer || config.itemRenderer, rootElement.clientWidth - 9, itemHeight, layerIdentifier);
        listItems.push(layer);
    }

    function renderLoadMore(){
        if (renderedListItems[renderedListItems.length - 1].getIdentifier() != '$LoadMore') {
            pushLayerAtIndex(config.itemsCount, renderedListItems, '$LoadMore', -1, config.loadMoreRenderer);
            config.pageFetcher(config.itemsCount, function(pageItemsCount, hasMore){
                config.hasMore = hasMore;
                config.itemsCount += pageItemsCount;
                refresh();
            });
        }
    }

    function getFirstVisibleItemAtHeight(top) {
        var i = 0;

        while (i < config.itemsCount && accumulatedRowHeights[i + 1] < top) {
            i++;
        }
        return i;
    }

    function scrollToItem(index, animate) {
        scroller.scrollTo(0, accumulatedRowHeights[index], animate);
    }

    return {
        attach: attach,
        detach: detach,
        scrollToItem: scrollToItem,
        refresh: refresh
    }

};

module.exports = InfiniteList;