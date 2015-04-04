
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory();
    } else {
        root.InfiniteList = factory(root.React);
    }
}(this, function () {
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

    var Layer = function (listConfig) {
        var listItemElement = null,
            identifier = "",
            itemIndex = -1;

        function attach(index, topOffset, parentElement, layerWidth) {
            itemIndex = index;
            if (listItemElement == null) {
                listItemElement = createListItemWrapperElement();
                parentElement.appendChild(listItemElement);
            }

            Helpers.applyElementStyle(listItemElement, {
                width: layerWidth + 'px',
                height: (listConfig.itemHeightGetter && listConfig.itemHeightGetter(itemIndex) || DEFAULT_ITEM_HEIGHT) + 'px',
                webkitTransform: 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + topOffset + ', 0, 1)'
            });

            listConfig.itemRenderer(itemIndex, listItemElement);
            if (listConfig.itemIdentifierGetter) {
                identifier = listConfig.itemIdentifierGetter(itemIndex);
            }

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

        function addLayer(layer) {
            var layerIdentifier = layer.getIdentifier();
            if (layersByIdentifier[layerIdentifier] == null) {
                layersByIdentifier[layerIdentifier] = [];
            }
            layersByIdentifier[layerIdentifier].push(layer);
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

    var InfiniteList = function () {

        var config = {
                itemHeightGetter: null,
                itemRenderer: null,
                itemIdentifierGetter: null,
                pageFetcher: null,
                loadMoreHTML: 'Load More...',
                rowsCount: 0
            },
            rootElement = null,
            scrollElement = null,
            scrollbar = null,
            scroller = null,
            visibleHeight = 0,
            renderedListItems = [],
            accumulatedRowHeights = [],
            layersPool = new LayersPool(),
            touchConnector = null,
            topOffset = 0;

        function setConfig(listConfig) {
            config = listConfig;
            return this;
        }

        function attach(domElement, touchProvider) {
            calculateHeights();
            initializeRootElement(domElement);
            initializeScroller(domElement, touchProvider);
            window.addEventListener('resize', refresh.bind(this));
            return this;
        }

        function detach() {
            if (touchConnector){
                touchConnector.disconnect();
            }
            window.removeEventListener('resize', refresh.bind(this));
        }

        function calculateHeights() {
            accumulatedRowHeights = [0];
            for (var i = 1; i < config.rowsCount || 0; ++i) {
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
        function initializeRootElement(domElement) {
            scrollElement = document.createElement('div');
            Helpers.applyElementStyle(scrollElement, {
                position: 'absolute',
                top: 0,
                bottom: 0
            });

            rootElement = document.createElement('div');
            Helpers.applyElementStyle(rootElement, {
                position: 'relative',
                height: domElement.clientHeight + 'px',
                width: domElement.clientWidth + 'px',
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
            domElement.appendChild(
                rootElement);
        };

        /*
         Initialize the scroller
         The scroller is fed with touch input and is responsible for caculating momentum and eventually invoke a
         callback with the scrolling position when changed.
         I have used ZyngaScroller for that: https://github.com/zynga/scroller
         */
        function initializeScroller(domElement, touchProvider) {

            scroller = new Scroller(function (left, top) {
                topOffset = top || 0;
                render();
            });

            visibleHeight = domElement.clientHeight;
            scroller.setDimensions(
                domElement.clientWidth,
                domElement.clientHeight,
                domElement.clientWidth,
                accumulatedRowHeights[accumulatedRowHeights.length - 1] + (config.itemHeightGetter ? config.itemHeightGetter([accumulatedRowHeights.length - 1]) : DEFAULT_ITEM_HEIGHT )
            );

            touchConnector = new TouchToScrollerConnector(touchProvider || domElement, scroller);
            touchConnector.connect();
        }

        function refresh(){
            renderedListItems.forEach(function(layer){
                layersPool.addLayer(layer)
            });
            renderedListItems = [];
            requestAnimationFrame(function(){
                render();
            });
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
            for (var i = renderedListItems[renderedListItems.length - 1].getItemIndex() + 1; i <= bottomVisibleIndex; ++i) {
                pushLayerAtIndex(i, renderedListItems);
            }

            updateScrollbar();
            Helpers.applyElementStyle(scrollElement, {webkitTransform: 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + (-topOffset) + ', 0, 1)'});
        }

        /*
         Update the scrollbar size and position.
         */
        function updateScrollbar() {
            var listHeight = accumulatedRowHeights[accumulatedRowHeights.length - 1] + (config.itemHeightGetter ? config.itemHeightGetter([accumulatedRowHeights.length - 1]) : DEFAULT_ITEM_HEIGHT ),
                attachedElement = rootElement.parentElement,
                scrollbarHeight = Math.max(10, Math.floor(attachedElement.clientHeight / listHeight * attachedElement.clientHeight)),
                scrollbarPos = Math.floor(topOffset / (listHeight - attachedElement.clientHeight) * (attachedElement.clientHeight - scrollbarHeight)),
                heightInPx = scrollbarHeight + 'px';

            Helpers.applyElementStyle(scrollbar, {
                height: heightInPx,
                webkitTransform: 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + ( scrollbarPos) + ', 0, 1)'
            });
        }

        /*
         Borrow a layer from the LayersPool and attach it to a certain item at index.
         */
        function pushLayerAtIndex(index, listItems) {
            var layerIdentifier = config.itemIdentifierGetter ? config.itemIdentifierGetter(index) : '';
            var layer = layersPool.borrowLayerWithIdentifier(layerIdentifier);
            if (layer == null) {
                layer = new Layer(config);
            }
            layer.attach(index, accumulatedRowHeights[index], scrollElement, rootElement.clientWidth - 9);
            listItems.push(layer);
        }

        function getFirstVisibleItemAtHeight(top) {
            var i = 0;
            while (i < accumulatedRowHeights.length && accumulatedRowHeights[i + 1] < top) {
                i++;
            }
            return i;
        }

        function scrollToItem(index, animate) {
            scroller.scrollTo(0, accumulatedRowHeights[index], animate);
        }

        function scrollToOffset(offset, animate) {
            scroller.scrollTo(0, offset, animate);
        }

        return {
            attach: attach,
            setConfig: setConfig,
            scrollToItem: scrollToItem,
            scrollToOffset: scrollToOffset,
            refresh: refresh
        }

    };

    return InfiniteList;
}));

