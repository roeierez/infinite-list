(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["listExample"] = factory();
	else
		root["listExample"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var InfiniteList = __webpack_require__(5),
	    list = new InfiniteList({
	        itemHeightGetter: function(){ return 50;},

	        itemRenderer: function(index, domElement){
	            domElement.innerHTML = 'Item ' + index;
	        },

	        initialPage: {
	            itemsCount: 200
	        }

	    }).attach(document.getElementById('main'));


/***/ },
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var TouchScroller = __webpack_require__(7),
	    VerticalScroller = __webpack_require__(8),
	    ScrollbarRenderer = __webpack_require__(9),
	    AnimationFrameHelper = __webpack_require__(10),
	    ListItemsRenderer = __webpack_require__(11),
	    StyleHelpers = __webpack_require__(12);
	    DEFAULT_ITEM_HEIGHT = 40;

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
	        scrollbarRenderer = null,
	        itemsRenderer = null,
	        scroller = null,
	        offsetDelta = 5000,
	        accumulatedRowHeights = [],
	        adjustedItems = {},
	        topOffset = 0,
	        scrollToIndex = 0,
	        topItemOffset = 0,
	        needsRender = true;

	    for (key in listConfig){
	        if (listConfig.hasOwnProperty(key)){
	            config[key] = listConfig[key];
	        }
	    }

	    var initialPageConfig = listConfig.initialPage;
	    if (initialPageConfig){
	        config.itemsCount = initialPageConfig.itemsCount || 0;
	        config.hasMore = initialPageConfig.hasMore || false;
	    }

	    function attach(domElement, touchProvider){
	        parentElement = domElement;
	        initializeRootElement(domElement);
	        scrollbarRenderer = new ScrollbarRenderer(rootElement);
	        itemsRenderer = new ListItemsRenderer(domElement, scrollElement, config, loadMoreCallback);
	        scroller = new VerticalScroller(
	            parentElement,
	            function (top) {
	                topOffset = (top || 0);
	                needsRender = true;
	            },
	            touchProvider
	        );

	        window.addEventListener('resize', refresh.bind(this));
	        runAnimationLoop();
	        refresh();
	        return this;
	    }

	    function detach() {
	        AnimationFrameHelper.stopAnimationLoop();
	        parentElement.removeChild(rootElement);
	        window.removeEventListener('resize', refresh.bind(this));
	    }

	    function runAnimationLoop(){
	        AnimationFrameHelper.startAnimationLoop(function(){
	            if (needsRender) {
	                render();
	            }
	        });
	    }

	    function calculateHeights() {
	        accumulatedRowHeights = [offsetDelta];
	        for (var i = 1; i <= config.itemsCount || 0; ++i) {
	            var currentRowHeight = config.itemHeightGetter ? config.itemHeightGetter(i - 1) : DEFAULT_ITEM_HEIGHT;
	            accumulatedRowHeights[i] = accumulatedRowHeights[i - 1] + currentRowHeight;
	        }
	        adjustedItems = {};
	    }

	    function initializeRootElement(parentElement) {
	        scrollElement = document.createElement('div');
	        StyleHelpers.applyElementStyle(scrollElement, {
	            position: 'absolute',
	            top: 0,
	            bottom: 0
	        });

	        rootElement = document.createElement('div');
	        StyleHelpers.applyElementStyle(rootElement, {
	            position: 'relative',
	            height: parentElement.clientHeight + 'px',
	            width: parentElement.clientWidth + 'px',
	            overflow: 'hidden'
	        });
	        rootElement.appendChild(scrollElement);
	        parentElement.appendChild(
	            rootElement);
	    };

	    function updateScrollerDimentions(parentElement, shiftScroller){

	        scroller.setDimensions(
	            offsetDelta,
	            getListHeight(),
	            parentElement.clientHeight,
	            shiftScroller
	        );
	    }

	    function refresh(){
	        var topListItem = itemsRenderer.getRenderedItems()[0],
	            topListItemIndex = topListItem && topListItem.getItemIndex() || 0,
	            topItemStartsAt = getStartOffsetForIndex(topListItemIndex) || 0,
	            differenceFromTop = topOffset - topItemStartsAt;

	        StyleHelpers.applyElementStyle(rootElement, {
	            height: parentElement.clientHeight + 'px',
	            width: parentElement.clientWidth + 'px'
	        });
	        itemsRenderer.refresh();
	        calculateHeights();
	        updateScrollerDimentions(parentElement);
	        scrollbarRenderer.refresh();
	        scrollToItem(topListItemIndex, differenceFromTop);
	    }

	    function getListHeight(){
	        return getStartOffsetForIndex(accumulatedRowHeights.length - 1) + (!config.hasMore ? 0 : DEFAULT_ITEM_HEIGHT);
	    }

	    function render() {
	        var topItem = null,
	            shiftTop = 0,
	            bottomItem = null,
	            shiftBottom = 0,
	            scrollerNeedUpdate = false,
	            renderedItems = [];

	        StyleHelpers.applyTransformStyle(scrollElement, 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + (-topOffset) + ', 0, 1)');
	        scrollbarRenderer.render(topOffset, getListHeight());
	        needsRender = itemsRenderer.render(topOffset, scrollToIndex, topItemOffset);
	        renderedItems = itemsRenderer.getRenderedItems();


	        if (renderedItems.length > 0) {
	            topItem = renderedItems[0];
	            bottomItem = renderedItems[renderedItems.length - 1];

	            shiftTop = topItem.getItemOffset() - accumulatedRowHeights[topItem.getItemIndex()];
	            if (shiftTop != 0) {
	                scrollerNeedUpdate = true;
	                for (var i = topItem.getItemIndex(); i >= 0; --i) {
	                    accumulatedRowHeights[i] += shiftTop;
	                }
	            }

	            if (accumulatedRowHeights.length > bottomItem.getItemIndex() + 1) {
	                shiftBottom = bottomItem.getItemOffset() + bottomItem.getItemHeight() - accumulatedRowHeights[bottomItem.getItemIndex() + 1];
	                if (shiftBottom != 0) {
	                    scrollerNeedUpdate = true;
	                    for (var i = bottomItem.getItemIndex() + 1; i < accumulatedRowHeights.length; ++i) {
	                        accumulatedRowHeights[i] += shiftBottom;
	                    }
	                }
	            }
	        }

	        for (var i = 1; i < renderedItems.length - 1; ++i) {
	            accumulatedRowHeights[renderedItems[i].getItemIndex()] = renderedItems[i].getItemOffset();
	        }

	        var deltaToAdd = 0;
	        if (accumulatedRowHeights[0] < 0) {
	            deltaToAdd = Math.abs(accumulatedRowHeights[0]) + 5000;
	            for (var i = 0; i< accumulatedRowHeights.length; ++i){
	                accumulatedRowHeights[i] += deltaToAdd;
	                offsetDelta + deltaToAdd;
	            }

	            renderedItems.forEach(function(item){
	                item.setItemOffset(item.getItemOffset() + deltaToAdd);
	            });
	        }

	        offsetDelta = accumulatedRowHeights[0];
	        if (scrollerNeedUpdate) {
	            updateScrollerDimentions(parentElement, deltaToAdd);
	        }

	        scrollToIndex = null;
	        topItemOffset = null;
	    }

	    function loadMoreCallback(){
	        config.pageFetcher(config.itemsCount, function(pageItemsCount, hasMore){
	            config.hasMore = hasMore;
	            config.itemsCount += pageItemsCount;
	            refresh();
	        });
	    }

	    function scrollToItem(index, relativeOffset, animate) {
	        topItemOffset = relativeOffset || 0;
	        scrollToIndex = index;
	        scroller.scrollTo(getStartOffsetForIndex(index), animate);
	    }

	    function itemHeightChangedAtIndex(index, optionalNewHeight){
	        var renderedItems = itemsRenderer.getRenderedItems(),
	            firstItem = renderedItems.length > 0 && renderedItems[0],
	            newHeight = optionalNewHeight || config.itemHeightGetter(index),
	            oldHeight = getStartOffsetForIndex(index + 1) - getStartOffsetForIndex(index),
	            delta = newHeight -  oldHeight;

	        //for (var i = index + 1; i<accumulatedRowHeights.length; ++i) {
	        //    accumulatedRowHeights[i] += delta;
	        //}

	        for (var i= index; i >= 0; --i) {
	            accumulatedRowHeights[i]-= delta;
	        }

	        updateScrollerDimentions(parentElement);

	        needsRender = true;
	        if (firstItem && index <= firstItem.getItemIndex() ) {
	            scroller.changeScrollPosition(topOffset + delta);
	        }
	    }

	    function getStartOffsetForIndex (index) {
	        return accumulatedRowHeights[index];
	    }

	    return {
	        attach: attach,
	        detach: detach,
	        scrollToItem: scrollToItem,
	        refresh: refresh,
	        itemHeightChangedAtIndex: itemHeightChangedAtIndex
	    }

	};

	module.exports = InfiniteList;

/***/ },
/* 6 */,
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var Scroller = __webpack_require__(15);

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

	    function changeScrollPosition (newPos){
	        scroller.__scrollTop = newPos;
	    }

	    return {
	        disconnect: disconnect,
	        setDimensions: setDimensions,
	        changeScrollPosition: changeScrollPosition,
	        scrollTo: scrollTo
	    }
	}

	module.exports = TouchScroller;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var SCROLLING_TIME_CONSTANT = 250;

	var VerticalScroller = function (parentElement, callback) {

	    var timestamp = 0,
	        scrollerHeight = 0,
	        startOffset = 0,
	        scrollerViewHeight = 0,
	        frame = 0,
	        velocity = 0,
	        amplitude = 0,
	        pressed = 0,
	        ticker = 0,
	        reference = 0,
	        offset = 0,
	        target = 0;

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

	    function scroll (y){
	        offset = Math.max(startOffset, Math.min(scrollerHeight - scrollerViewHeight, y));// Math.max(0, Math.min(scrollerHeight - scrollerViewHeight, y));
	        callback(offset);
	    }

	    function autoScroll () {
	        var elapsed, delta;

	        if (amplitude) {
	            elapsed = Date.now() - timestamp;
	            delta = amplitude * Math.exp(-elapsed / SCROLLING_TIME_CONSTANT);
	            if (delta > 10 || delta < -10) {
	                scroll(target - delta);
	                requestAnimationFrame(autoScroll);
	            } else {
	                scroll(target);
	            }
	        }
	    }

	    function tap (e) {
	        pressed = true;
	        reference = ypos(e);

	        velocity = amplitude = 0;
	        frame = offset;
	        timestamp = Date.now();
	        clearInterval(ticker);
	        ticker = setInterval(track, 10);

	        e.preventDefault();
	        e.stopPropagation();
	    }

	    function drag (e) {
	        var y, delta;
	        if (pressed) {
	            y = ypos(e);
	            delta = reference - y;
	            if (delta > 2 || delta < -2) {
	                reference = y;
	                scroll(offset + delta);
	            }
	        }
	        e.preventDefault();
	        e.stopPropagation();
	    }
	    function release (e) {
	        pressed = false;

	        clearInterval(ticker);

	        if (velocity > 10 || velocity < -10) {
	            amplitude = 0.8 * velocity;
	            target = Math.round(offset + amplitude);
	            timestamp = Date.now();
	            requestAnimationFrame(autoScroll);
	        }

	        e.preventDefault();
	        e.stopPropagation();
	    }

	    function scrollTo(y){
	        amplitude = 0;
	        scroll(y);
	    }

	    function changeScrollPosition (y) {
	        scroll(y);
	    }

	    function setDimensions(initialOffset, height, viewHeight, addScrollOffset){
	        target += (addScrollOffset || 0);
	        offset += (addScrollOffset || 0);
	        startOffset = initialOffset;
	        scrollerHeight = height;
	        scrollerViewHeight = viewHeight;
	    }

	    return {
	        setDimensions: setDimensions,
	        scrollTo: scrollTo,
	        changeScrollPosition: changeScrollPosition
	    }
	};

	module.exports = VerticalScroller;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var StyleHelpers = __webpack_require__(12);

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



/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	
	var measuredFPS = 60,
	    runAnimation = false;

	function startAnimationLoop(step){
	    var lastStepTime = new Date().getTime(),
	        frames = 0;
	    runAnimation = true;
	    var animationStep = function(){
	        var currentTime = new Date().getTime();
	        frames++;
	        if (currentTime - lastStepTime > 200) {
	            measuredFPS = Math.min(60, 1000 * frames / (currentTime - lastStepTime));
	            lastStepTime = currentTime;
	            frames = 0;
	        }
	        step();
	        if (runAnimation) {
	            requestAnimationFrame(animationStep);
	        }
	    }
	    requestAnimationFrame(animationStep);
	}

	function stopAnimationLoop(){
	    runAnimation = false;
	}

	function getFPS(){
	    return measuredFPS;
	}

	module.exports = {
	    startAnimationLoop: startAnimationLoop,
	    stopAnimationLoop: stopAnimationLoop,
	    getFPS: getFPS
	}


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var Layer = __webpack_require__(13),
	    LayersPool = __webpack_require__(14),
	    AnimationFrameHelper = __webpack_require__(10),
	    MIN_FPS = 30,
	    MAX_TIME_PER_FRAME = 1000 % MIN_FPS + 8000,
	    DEFAULT_ITEM_HEIGHT = 40;

	var ListItemsRenderer = function(attachedElement, scrollElement, listConfig, pageCallback){

	    var visibleHeight = attachedElement.clientHeight,
	        itemWidth = attachedElement.clientWidth,
	        renderedListItems = [],
	        layersPool = new LayersPool();

	    function render(topOffset, atIndex, offsetFromTop){
	        var startRenderTime = new Date().getTime();

	        if ( typeof atIndex == 'number' &&  atIndex >= 0){
	            while (renderedListItems.length > 0) {
	                layersPool.addLayer(renderedListItems.pop());
	            }

	            var onlyRenderedItem = renderListItem(atIndex);
	            onlyRenderedItem.setItemOffset(topOffset - (offsetFromTop || 0));
	            renderedListItems.push(onlyRenderedItem);
	        }


	        var topRenderedItem = renderedListItems[0],
	            bottomRenderedItem = renderedListItems[renderedListItems.length - 1];

	        while (topRenderedItem.getItemOffset() > topOffset && topRenderedItem.getItemIndex() > 0){
	            topRenderedItem = renderBefore(topRenderedItem);
	            if (new Date().getTime() - startRenderTime > MAX_TIME_PER_FRAME) {
	                return true;
	            }
	        }

	        while (bottomRenderedItem.getItemOffset() + bottomRenderedItem.getItemHeight() < topOffset + visibleHeight && bottomRenderedItem.getIdentifier() != '$LoadMore') {
	            bottomRenderedItem = renderAfter(bottomRenderedItem);
	            if (new Date().getTime() - startRenderTime > MAX_TIME_PER_FRAME) {
	                return true;
	            }
	        }

	        while (topRenderedItem.getItemOffset() + topRenderedItem.getItemHeight() < topOffset) {
	            layersPool.addLayer(renderedListItems.shift());
	            topRenderedItem = renderedListItems[0];
	        }

	        while (bottomRenderedItem.getItemOffset() > topOffset + visibleHeight) {
	            layersPool.addLayer(renderedListItems.pop());
	            bottomRenderedItem = renderedListItems[renderedListItems.length - 1];
	        }

	        return false;
	    }

	    function renderBefore(listItem){
	        var newItem = renderListItem(listItem.getItemIndex() - 1);
	        newItem.setItemOffset(listItem.getItemOffset() - newItem.getItemHeight());
	        renderedListItems.unshift(newItem);
	        return newItem;
	    }

	    function renderAfter(listItem){
	        var newItem = renderListItem(listItem.getItemIndex() + 1);
	        newItem.setItemOffset(listItem.getItemOffset() + listItem.getItemHeight());
	        renderedListItems.push(newItem);
	        return newItem;
	    }

	    function renderListItem (index) {
	        if (index == listConfig.itemsCount) {
	            return renderLoadMore();
	        }

	        var itemIdentifier = (listConfig.itemTypeGetter ? listConfig.itemTypeGetter(index) : ''),
	            height = listConfig.itemHeightGetter && listConfig.itemHeightGetter(index),
	            layer = borrowLayerForIndex(index, itemIdentifier, height);
	        listConfig.itemRenderer(index, layer.getDomElement());
	        return layer;
	    }

	    /*
	     Borrow a layer from the LayersPool and attach it to a certain item at index.
	     */
	    function borrowLayerForIndex(index, identifier, height) {
	        var layerIdentifier = identifier || (listConfig.itemTypeGetter ? listConfig.itemTypeGetter(index) : '');
	        var layer = layersPool.borrowLayerWithIdentifier(layerIdentifier);
	        if (layer == null) {
	            layer = new Layer(scrollElement);
	        }
	        //index, topOffset, renderer, width, height, itemIdentifier
	        var itemHeight = height || listConfig.itemHeightGetter && listConfig.itemHeightGetter(index);
	        layer.attach(index, itemWidth - 9, itemHeight, layerIdentifier);
	        //listItems.push(layer);
	        return layer;
	    }

	    function renderLoadMore(){
	        if (renderedListItems[renderedListItems.length - 1].getIdentifier() != '$LoadMore') {
	            var loadMoreLayer = borrowLayerForIndex(listConfig.itemsCount, '$LoadMore', -1);
	            listConfig.loadMoreRenderer(listConfig.itemsCount, loadMoreLayer.getDomElement());
	            pageCallback();
	            return loadMoreLayer;
	        }

	        return renderedListItems[renderedListItems.length - 1];
	    }

	    function refresh(){
	        visibleHeight = attachedElement.clientHeight;
	        itemWidth = attachedElement.clientWidth;
	        renderedListItems.forEach(function(layer){
	            layersPool.addLayer(layer, true)
	        });
	        renderedListItems = [];
	    }

	    function isBusy(){
	        return AnimationFrameHelper.getFPS() < MIN_FPS;
	    }

	   function getRenderedItems(){
	       return renderedListItems;
	   }

	    return {
	        render: render,
	        refresh: refresh,
	        getRenderedItems: getRenderedItems
	    };
	};

	module.exports = ListItemsRenderer;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	
	var applyElementStyle = function (element, styleObj) {
	        Object.keys(styleObj).forEach(function (key) {
	            if (element.style[key] != styleObj[key]) {
	                element.style[key] = styleObj[key];
	            }
	        })
	    },

	    applyTransformStyle = function(element, transformValue){
	        var styleObject = {};
	        ['webkit', 'Moz', 'O', 'ms'].forEach(function(prefix){
	                styleObject[prefix + 'Transform'] = transformValue;
	            }
	        );
	        applyElementStyle(element, styleObject);
	};

	module.exports = {
	    applyElementStyle: applyElementStyle,
	    applyTransformStyle: applyTransformStyle
	};


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var StyleHelpers = __webpack_require__(12);

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
	        console.error("setItemOffset");
	        StyleHelpers.applyTransformStyle(listItemElement, 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + offset + ', 0, 1)');
	        currentOffset = offset;
	    }

	    function getItemHeight() {
	        return itemHeight || (itemHeight = getDomElement().clientHeight);
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
	        getIdentifier: getIdentifier
	    }
	};

	module.exports = Layer;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var StyleHelpers = __webpack_require__(12),
	    LayersPool = function () {
	        var layersByIdentifier = {};

	        function addLayer(layer, hide) {
	            var layerIdentifier = layer.getIdentifier();
	            if (layersByIdentifier[layerIdentifier] == null) {
	                layersByIdentifier[layerIdentifier] = [];
	            }
	            layersByIdentifier[layerIdentifier].push(layer);
	           // layer.setItemOffset(-10000);
	            if (hide){
	                StyleHelpers.applyElementStyle(layer.getDomElement(), {display: 'none'})
	            }
	        }

	        function borrowLayerWithIdentifier(identifier) {
	            if (layersByIdentifier[identifier] == null) {
	                return null;
	            }
	            var layer = layersByIdentifier[identifier].pop();
	            if (layer != null) {
	                StyleHelpers.applyElementStyle(layer.getDomElement(), {display: 'block'})
	            }
	            return layer;
	        }

	        return {
	            addLayer: addLayer,
	            borrowLayerWithIdentifier: borrowLayerWithIdentifier
	        }
	    }

	module.exports = LayersPool;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Scroller
	 * http://github.com/zynga/scroller
	 *
	 * Copyright 2011, Zynga Inc.
	 * Licensed under the MIT License.
	 * https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt
	 *
	 * Based on the work of: Unify Project (unify-project.org)
	 * http://unify-project.org
	 * Copyright 2011, Deutsche Telekom AG
	 * License: MIT + Apache (V2)
	 */

	var Scroller;
	var core = __webpack_require__(16);

	(function() {
		
		/**
		 * A pure logic 'component' for 'virtual' scrolling/zooming.
		 */
		Scroller = function(callback, options) {

			this.__callback = callback;

			this.options = {
				
				/** Enable scrolling on x-axis */
				scrollingX: true,

				/** Enable scrolling on y-axis */
				scrollingY: true,

				/** Enable animations for deceleration, snap back, zooming and scrolling */
				animating: true,

				/** duration for animations triggered by scrollTo/zoomTo */
				animationDuration: 250,

				/** Enable bouncing (content can be slowly moved outside and jumps back after releasing) */
				bouncing: true,

				/** Enable locking to the main axis if user moves only slightly on one of them at start */
				locking: true,

				/** Enable pagination mode (switching between full page content panes) */
				paging: false,

				/** Enable snapping of content to a configured pixel grid */
				snapping: false,

				/** Enable zooming of content via API, fingers and mouse wheel */
				zooming: false,

				/** Minimum zoom level */
				minZoom: 0.5,

				/** Maximum zoom level */
				maxZoom: 3
				
			};

			for (var key in options) {
				this.options[key] = options[key];
			}

		};
		
		
		// Easing Equations (c) 2003 Robert Penner, all rights reserved.
		// Open source under the BSD License.
		
		/**
		 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
		**/
		var easeOutCubic = function(pos) {
			return (Math.pow((pos - 1), 3) + 1);
		};

		/**
		 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
		**/
		var easeInOutCubic = function(pos) {
			if ((pos /= 0.5) < 1) {
				return 0.5 * Math.pow(pos, 3);
			}

			return 0.5 * (Math.pow((pos - 2), 3) + 2);
		};
		
		
		var members = {

			/*
			---------------------------------------------------------------------------
				INTERNAL FIELDS :: STATUS
			---------------------------------------------------------------------------
			*/

			/** {Boolean} Whether only a single finger is used in touch handling */
			__isSingleTouch: false,

			/** {Boolean} Whether a touch event sequence is in progress */
			__isTracking: false,

			/**
			 * {Boolean} Whether a gesture zoom/rotate event is in progress. Activates when
			 * a gesturestart event happens. This has higher priority than dragging.
			 */
			__isGesturing: false,

			/**
			 * {Boolean} Whether the user has moved by such a distance that we have enabled
			 * dragging mode. Hint: It's only enabled after some pixels of movement to
			 * not interrupt with clicks etc.
			 */
			__isDragging: false,

			/**
			 * {Boolean} Not touching and dragging anymore, and smoothly animating the
			 * touch sequence using deceleration.
			 */
			__isDecelerating: false,

			/**
			 * {Boolean} Smoothly animating the currently configured change
			 */
			__isAnimating: false,



			/*
			---------------------------------------------------------------------------
				INTERNAL FIELDS :: DIMENSIONS
			---------------------------------------------------------------------------
			*/

			/** {Integer} Available outer left position (from document perspective) */
			__clientLeft: 0,

			/** {Integer} Available outer top position (from document perspective) */
			__clientTop: 0,

			/** {Integer} Available outer width */
			__clientWidth: 0,

			/** {Integer} Available outer height */
			__clientHeight: 0,

			/** {Integer} Outer width of content */
			__contentWidth: 0,

			/** {Integer} Outer height of content */
			__contentHeight: 0,

			/** {Integer} Snapping width for content */
			__snapWidth: 100,

			/** {Integer} Snapping height for content */
			__snapHeight: 100,

			/** {Integer} Height to assign to refresh area */
			__refreshHeight: null,
			
			/** {Boolean} Whether the refresh process is enabled when the event is released now */
			__refreshActive: false,
			
			/** {Function} Callback to execute on activation. This is for signalling the user about a refresh is about to happen when he release */
			__refreshActivate: null,

			/** {Function} Callback to execute on deactivation. This is for signalling the user about the refresh being cancelled */
			__refreshDeactivate: null,
			
			/** {Function} Callback to execute to start the actual refresh. Call {@link #refreshFinish} when done */
			__refreshStart: null,

			/** {Number} Zoom level */
			__zoomLevel: 1,

			/** {Number} Scroll position on x-axis */
			__scrollLeft: 0,

			/** {Number} Scroll position on y-axis */
			__scrollTop: 0,

			/** {Integer} Maximum allowed scroll position on x-axis */
			__maxScrollLeft: 0,

			/** {Integer} Maximum allowed scroll position on y-axis */
			__maxScrollTop: 0,

			/* {Number} Scheduled left position (final position when animating) */
			__scheduledLeft: 0,

			/* {Number} Scheduled top position (final position when animating) */
			__scheduledTop: 0,

			/* {Number} Scheduled zoom level (final scale when animating) */
			__scheduledZoom: 0,



			/*
			---------------------------------------------------------------------------
				INTERNAL FIELDS :: LAST POSITIONS
			---------------------------------------------------------------------------
			*/

			/** {Number} Left position of finger at start */
			__lastTouchLeft: null,

			/** {Number} Top position of finger at start */
			__lastTouchTop: null,

			/** {Date} Timestamp of last move of finger. Used to limit tracking range for deceleration speed. */
			__lastTouchMove: null,
			
			/** {Array} List of positions, uses three indexes for each state: left, top, timestamp */
			__positions: null,



			/*
			---------------------------------------------------------------------------
				INTERNAL FIELDS :: DECELERATION SUPPORT
			---------------------------------------------------------------------------
			*/

			/** {Integer} Minimum left scroll position during deceleration */
			__minDecelerationScrollLeft: null,

			/** {Integer} Minimum top scroll position during deceleration */
			__minDecelerationScrollTop: null,

			/** {Integer} Maximum left scroll position during deceleration */
			__maxDecelerationScrollLeft: null,

			/** {Integer} Maximum top scroll position during deceleration */
			__maxDecelerationScrollTop: null,

			/** {Number} Current factor to modify horizontal scroll position with on every step */
			__decelerationVelocityX: null,

			/** {Number} Current factor to modify vertical scroll position with on every step */
			__decelerationVelocityY: null,



			/*
			---------------------------------------------------------------------------
				PUBLIC API
			---------------------------------------------------------------------------
			*/

			/**
			 * Configures the dimensions of the client (outer) and content (inner) elements.
			 * Requires the available space for the outer element and the outer size of the inner element.
			 * All values which are falsy (null or zero etc.) are ignored and the old value is kept.
			 *
			 * @param clientWidth {Integer ? null} Inner width of outer element
			 * @param clientHeight {Integer ? null} Inner height of outer element
			 * @param contentWidth {Integer ? null} Outer width of inner element
			 * @param contentHeight {Integer ? null} Outer height of inner element
			 */
			setDimensions: function(clientWidth, clientHeight, contentWidth, contentHeight) {

				var self = this;

				// Only update values which are defined
				if (clientWidth) {
					self.__clientWidth = clientWidth;
				}

				if (clientHeight) {
					self.__clientHeight = clientHeight;
				}

				if (contentWidth) {
					self.__contentWidth = contentWidth;
				}

				if (contentHeight) {
					self.__contentHeight = contentHeight;
				}

				// Refresh maximums
				self.__computeScrollMax();

				// Refresh scroll position
				//self.scrollTo(self.__scrollLeft, self.__scrollTop, true);
				
			},


			/**
			 * Sets the client coordinates in relation to the document.
			 *
			 * @param left {Integer ? 0} Left position of outer element
			 * @param top {Integer ? 0} Top position of outer element
			 */
			setPosition: function(left, top) {

				var self = this;

				self.__clientLeft = left || 0;
				self.__clientTop = top || 0;

			},


			/**
			 * Configures the snapping (when snapping is active)
			 *
			 * @param width {Integer} Snapping width
			 * @param height {Integer} Snapping height
			 */
			setSnapSize: function(width, height) {

				var self = this;

				self.__snapWidth = width;
				self.__snapHeight = height;

			},


			/**
			 * Activates pull-to-refresh. A special zone on the top of the list to start a list refresh whenever
			 * the user event is released during visibility of this zone. This was introduced by some apps on iOS like
			 * the official Twitter client.
			 *
			 * @param height {Integer} Height of pull-to-refresh zone on top of rendered list
			 * @param activateCallback {Function} Callback to execute on activation. This is for signalling the user about a refresh is about to happen when he release.
			 * @param deactivateCallback {Function} Callback to execute on deactivation. This is for signalling the user about the refresh being cancelled.
			 * @param startCallback {Function} Callback to execute to start the real async refresh action. Call {@link #finishPullToRefresh} after finish of refresh.
			 */
			activatePullToRefresh: function(height, activateCallback, deactivateCallback, startCallback) {

				var self = this;

				self.__refreshHeight = height;
				self.__refreshActivate = activateCallback;
				self.__refreshDeactivate = deactivateCallback;
				self.__refreshStart = startCallback;

			},
			
			
			/**
			 * Signalizes that pull-to-refresh is finished. 
			 */
			finishPullToRefresh: function() {
				
				var self = this;
				
				self.__refreshActive = false;
				if (self.__refreshDeactivate) {
					self.__refreshDeactivate();
				}
				
				self.scrollTo(self.__scrollLeft, self.__scrollTop, true);
				
			},


			/**
			 * Returns the scroll position and zooming values
			 *
			 * @return {Map} `left` and `top` scroll position and `zoom` level
			 */
			getValues: function() {

				var self = this;

				return {
					left: self.__scrollLeft,
					top: self.__scrollTop,
					zoom: self.__zoomLevel
				};

			},
			
			
			/**
			 * Returns the maximum scroll values
			 *
			 * @return {Map} `left` and `top` maximum scroll values
			 */
			getScrollMax: function() {
				
				var self = this;
				
				return {
					left: self.__maxScrollLeft,
					top: self.__maxScrollTop
				};
				
			},


			/**
			 * Zooms to the given level. Supports optional animation. Zooms
			 * the center when no coordinates are given.
			 *
			 * @param level {Number} Level to zoom to
			 * @param animate {Boolean ? false} Whether to use animation
			 * @param originLeft {Number ? null} Zoom in at given left coordinate
			 * @param originTop {Number ? null} Zoom in at given top coordinate
			 */
			zoomTo: function(level, animate, originLeft, originTop) {

				var self = this;

				if (!self.options.zooming) {
					throw new Error("Zooming is not enabled!");
				}

				// Stop deceleration
				if (self.__isDecelerating) {
					core.effect.Animate.stop(self.__isDecelerating);
					self.__isDecelerating = false;
				}

				var oldLevel = self.__zoomLevel;

				// Normalize input origin to center of viewport if not defined
				if (originLeft == null) {
					originLeft = self.__clientWidth / 2;
				}

				if (originTop == null) {
					originTop = self.__clientHeight / 2;
				}

				// Limit level according to configuration
				level = Math.max(Math.min(level, self.options.maxZoom), self.options.minZoom);

				// Recompute maximum values while temporary tweaking maximum scroll ranges
				self.__computeScrollMax(level);

				// Recompute left and top coordinates based on new zoom level
				var left = ((originLeft + self.__scrollLeft) * level / oldLevel) - originLeft;
				var top = ((originTop + self.__scrollTop) * level / oldLevel) - originTop;

				// Limit x-axis
				if (left > self.__maxScrollLeft) {
					left = self.__maxScrollLeft;
				} else if (left < 0) {
					left = 0;
				}

				// Limit y-axis
				if (top > self.__maxScrollTop) {
					top = self.__maxScrollTop;
				} else if (top < 0) {
					top = 0;
				}

				// Push values out
				self.__publish(left, top, level, animate);

			},


			/**
			 * Zooms the content by the given factor.
			 *
			 * @param factor {Number} Zoom by given factor
			 * @param animate {Boolean ? false} Whether to use animation
			 * @param originLeft {Number ? 0} Zoom in at given left coordinate
			 * @param originTop {Number ? 0} Zoom in at given top coordinate
			 */
			zoomBy: function(factor, animate, originLeft, originTop) {

				var self = this;

				self.zoomTo(self.__zoomLevel * factor, animate, originLeft, originTop);

			},


			/**
			 * Scrolls to the given position. Respect limitations and snapping automatically.
			 *
			 * @param left {Number?null} Horizontal scroll position, keeps current if value is <code>null</code>
			 * @param top {Number?null} Vertical scroll position, keeps current if value is <code>null</code>
			 * @param animate {Boolean?false} Whether the scrolling should happen using an animation
			 * @param zoom {Number?null} Zoom level to go to
			 */
			scrollTo: function(left, top, animate, zoom) {

				var self = this;
				
				// Stop deceleration
				if (self.__isDecelerating) {
					core.effect.Animate.stop(self.__isDecelerating);
					self.__isDecelerating = false;
				}
				
				// Correct coordinates based on new zoom level
				if (zoom != null && zoom !== self.__zoomLevel) {
					
					if (!self.options.zooming) {
						throw new Error("Zooming is not enabled!");
					}
					
					left *= zoom;
					top *= zoom;
					
					// Recompute maximum values while temporary tweaking maximum scroll ranges
					self.__computeScrollMax(zoom);
					
				} else {
					
					// Keep zoom when not defined
					zoom = self.__zoomLevel;
					
				}

				if (!self.options.scrollingX) {

					left = self.__scrollLeft;

				} else {

					if (self.options.paging) {
						left = Math.round(left / self.__clientWidth) * self.__clientWidth;
					} else if (self.options.snapping) {
						left = Math.round(left / self.__snapWidth) * self.__snapWidth;
					}

				}

				if (!self.options.scrollingY) {

					top = self.__scrollTop;

				} else {

					if (self.options.paging) {
						top = Math.round(top / self.__clientHeight) * self.__clientHeight;
					} else if (self.options.snapping) {
						top = Math.round(top / self.__snapHeight) * self.__snapHeight;
					}

				}

				// Limit for allowed ranges
				left = Math.max(Math.min(self.__maxScrollLeft, left), 0);
				top = Math.max(Math.min(self.__maxScrollTop, top), 0);

				// Don't animate when no change detected, still call publish to make sure
				// that rendered position is really in-sync with internal data
				if (left === self.__scrollLeft && top === self.__scrollTop) {
					animate = false;
				}
				
				// Publish new values
				self.__publish(left, top, zoom, animate);

			},


			/**
			 * Scroll by the given offset
			 *
			 * @param left {Number ? 0} Scroll x-axis by given offset
			 * @param top {Number ? 0} Scroll x-axis by given offset
			 * @param animate {Boolean ? false} Whether to animate the given change
			 */
			scrollBy: function(left, top, animate) {

				var self = this;

				var startLeft = self.__isAnimating ? self.__scheduledLeft : self.__scrollLeft;
				var startTop = self.__isAnimating ? self.__scheduledTop : self.__scrollTop;

				self.scrollTo(startLeft + (left || 0), startTop + (top || 0), animate);

			},



			/*
			---------------------------------------------------------------------------
				EVENT CALLBACKS
			---------------------------------------------------------------------------
			*/

			/**
			 * Mouse wheel handler for zooming support
			 */
			doMouseZoom: function(wheelDelta, timeStamp, pageX, pageY) {

				var self = this;
				var change = wheelDelta > 0 ? 0.97 : 1.03;

				return self.zoomTo(self.__zoomLevel * change, false, pageX - self.__clientLeft, pageY - self.__clientTop);

			},


			/**
			 * Touch start handler for scrolling support
			 */
			doTouchStart: function(touches, timeStamp) {

				// Array-like check is enough here
				if (touches.length == null) {
					throw new Error("Invalid touch list: " + touches);
				}

				if (timeStamp instanceof Date) {
					timeStamp = timeStamp.valueOf();
				}
				if (typeof timeStamp !== "number") {
					throw new Error("Invalid timestamp value: " + timeStamp);
				}
				
				var self = this;

				// Stop deceleration
				if (self.__isDecelerating) {
					core.effect.Animate.stop(self.__isDecelerating);
					self.__isDecelerating = false;
				}

				// Stop animation
				if (self.__isAnimating) {
					core.effect.Animate.stop(self.__isAnimating);
					self.__isAnimating = false;
				}

				// Use center point when dealing with two fingers
				var currentTouchLeft, currentTouchTop;
				var isSingleTouch = touches.length === 1;
				if (isSingleTouch) {
					currentTouchLeft = touches[0].pageX;
					currentTouchTop = touches[0].pageY;
				} else {
					currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
					currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
				}

				// Store initial positions
				self.__initialTouchLeft = currentTouchLeft;
				self.__initialTouchTop = currentTouchTop;

				// Store current zoom level
				self.__zoomLevelStart = self.__zoomLevel;

				// Store initial touch positions
				self.__lastTouchLeft = currentTouchLeft;
				self.__lastTouchTop = currentTouchTop;

				// Store initial move time stamp
				self.__lastTouchMove = timeStamp;

				// Reset initial scale
				self.__lastScale = 1;

				// Reset locking flags
				self.__enableScrollX = !isSingleTouch && self.options.scrollingX;
				self.__enableScrollY = !isSingleTouch && self.options.scrollingY;

				// Reset tracking flag
				self.__isTracking = true;

				// Dragging starts directly with two fingers, otherwise lazy with an offset
				self.__isDragging = !isSingleTouch;

				// Some features are disabled in multi touch scenarios
				self.__isSingleTouch = isSingleTouch;

				// Clearing data structure
				self.__positions = [];

			},


			/**
			 * Touch move handler for scrolling support
			 */
			doTouchMove: function(touches, timeStamp, scale) {

				// Array-like check is enough here
				if (touches.length == null) {
					throw new Error("Invalid touch list: " + touches);
				}

				if (timeStamp instanceof Date) {
					timeStamp = timeStamp.valueOf();
				}
				if (typeof timeStamp !== "number") {
					throw new Error("Invalid timestamp value: " + timeStamp);
				}
				
				var self = this;

				// Ignore event when tracking is not enabled (event might be outside of element)
				if (!self.__isTracking) {
					return;
				}
				
				
				var currentTouchLeft, currentTouchTop;

				// Compute move based around of center of fingers
				if (touches.length === 2) {
					currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
					currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
				} else {
					currentTouchLeft = touches[0].pageX;
					currentTouchTop = touches[0].pageY;
				}

				var positions = self.__positions;

				// Are we already is dragging mode?
				if (self.__isDragging) {

					// Compute move distance
					var moveX = currentTouchLeft - self.__lastTouchLeft;
					var moveY = currentTouchTop - self.__lastTouchTop;

					// Read previous scroll position and zooming
					var scrollLeft = self.__scrollLeft;
					var scrollTop = self.__scrollTop;
					var level = self.__zoomLevel;

					// Work with scaling
					if (scale != null && self.options.zooming) {

						var oldLevel = level;

						// Recompute level based on previous scale and new scale
						level = level / self.__lastScale * scale;

						// Limit level according to configuration
						level = Math.max(Math.min(level, self.options.maxZoom), self.options.minZoom);

						// Only do further compution when change happened
						if (oldLevel !== level) {

							// Compute relative event position to container
							var currentTouchLeftRel = currentTouchLeft - self.__clientLeft;
							var currentTouchTopRel = currentTouchTop - self.__clientTop;
							
							// Recompute left and top coordinates based on new zoom level
							scrollLeft = ((currentTouchLeftRel + scrollLeft) * level / oldLevel) - currentTouchLeftRel;
							scrollTop = ((currentTouchTopRel + scrollTop) * level / oldLevel) - currentTouchTopRel;

							// Recompute max scroll values
							self.__computeScrollMax(level);

						}
					}

					if (self.__enableScrollX) {

						scrollLeft -= moveX;
						var maxScrollLeft = self.__maxScrollLeft;

						if (scrollLeft > maxScrollLeft || scrollLeft < 0) {

							// Slow down on the edges
							if (self.options.bouncing) {

								scrollLeft += (moveX / 2);

							} else if (scrollLeft > maxScrollLeft) {

								scrollLeft = maxScrollLeft;

							} else {

								scrollLeft = 0;

							}
						}
					}

					// Compute new vertical scroll position
					if (self.__enableScrollY) {

						scrollTop -= moveY;
						var maxScrollTop = self.__maxScrollTop;

						if (scrollTop > maxScrollTop || scrollTop < 0) {

							// Slow down on the edges
							if (self.options.bouncing) {

								scrollTop += (moveY / 2);
								
								// Support pull-to-refresh (only when only y is scrollable)
								if (!self.__enableScrollX && self.__refreshHeight != null) {

									if (!self.__refreshActive && scrollTop <= -self.__refreshHeight) {

										self.__refreshActive = true;
										if (self.__refreshActivate) {
											self.__refreshActivate();
										}

									} else if (self.__refreshActive && scrollTop > -self.__refreshHeight) {

										self.__refreshActive = false;
										if (self.__refreshDeactivate) {
											self.__refreshDeactivate();
										}

									}
								}

							} else if (scrollTop > maxScrollTop) {

								scrollTop = maxScrollTop;

							} else {

								scrollTop = 0;

							}
						}
					}
					
					// Keep list from growing infinitely (holding min 10, max 20 measure points)
					if (positions.length > 60) {
						positions.splice(0, 30);
					}
					
					// Track scroll movement for decleration
					positions.push(scrollLeft, scrollTop, timeStamp);

					// Sync scroll position
					self.__publish(scrollLeft, scrollTop, level);

				// Otherwise figure out whether we are switching into dragging mode now.
				} else {

					var minimumTrackingForScroll = self.options.locking ? 3 : 0;
					var minimumTrackingForDrag = 5;

					var distanceX = Math.abs(currentTouchLeft - self.__initialTouchLeft);
					var distanceY = Math.abs(currentTouchTop - self.__initialTouchTop);

					self.__enableScrollX = self.options.scrollingX && distanceX >= minimumTrackingForScroll;
					self.__enableScrollY = self.options.scrollingY && distanceY >= minimumTrackingForScroll;
					
					positions.push(self.__scrollLeft, self.__scrollTop, timeStamp);

					self.__isDragging = (self.__enableScrollX || self.__enableScrollY) && (distanceX >= minimumTrackingForDrag || distanceY >= minimumTrackingForDrag);

				}

				// Update last touch positions and time stamp for next event
				self.__lastTouchLeft = currentTouchLeft;
				self.__lastTouchTop = currentTouchTop;
				self.__lastTouchMove = timeStamp;
				self.__lastScale = scale;

			},


			/**
			 * Touch end handler for scrolling support
			 */
			doTouchEnd: function(timeStamp) {
				
				if (timeStamp instanceof Date) {
					timeStamp = timeStamp.valueOf();
				}
				if (typeof timeStamp !== "number") {
					throw new Error("Invalid timestamp value: " + timeStamp);
				}
				
				var self = this;

				// Ignore event when tracking is not enabled (no touchstart event on element)
				// This is required as this listener ('touchmove') sits on the document and not on the element itself.
				if (!self.__isTracking) {
					return;
				}
				
				// Not touching anymore (when two finger hit the screen there are two touch end events)
				self.__isTracking = false;

				// Be sure to reset the dragging flag now. Here we also detect whether
				// the finger has moved fast enough to switch into a deceleration animation.
				if (self.__isDragging) {

					// Reset dragging flag
					self.__isDragging = false;

					// Start deceleration
					// Verify that the last move detected was in some relevant time frame
					if (self.__isSingleTouch && self.options.animating && (timeStamp - self.__lastTouchMove) <= 100) {

						// Then figure out what the scroll position was about 100ms ago
						var positions = self.__positions;
						var endPos = positions.length - 1;
						var startPos = endPos;
						
						// Move pointer to position measured 100ms ago
						for (var i = endPos; i > 0 && positions[i] > (self.__lastTouchMove - 100); i -= 3) {
							startPos = i;
						}
						
						// If start and stop position is identical in a 100ms timeframe, 
						// we cannot compute any useful deceleration.
						if (startPos !== endPos) {
							
							// Compute relative movement between these two points
							var timeOffset = positions[endPos] - positions[startPos];
							var movedLeft = self.__scrollLeft - positions[startPos - 2];
							var movedTop = self.__scrollTop - positions[startPos - 1];
							
							// Based on 50ms compute the movement to apply for each render step
							self.__decelerationVelocityX = movedLeft / timeOffset * (1000 / 60);
							self.__decelerationVelocityY = movedTop / timeOffset * (1000 / 60) * 2;

							// How much velocity is required to start the deceleration
							var minVelocityToStartDeceleration = self.options.paging || self.options.snapping ? 4 : 1;

							// Verify that we have enough velocity to start deceleration
							if (Math.abs(self.__decelerationVelocityX) > minVelocityToStartDeceleration || Math.abs(self.__decelerationVelocityY) > minVelocityToStartDeceleration) {
								
								// Deactivate pull-to-refresh when decelerating
								if (!self.__refreshActive) {

									self.__startDeceleration(timeStamp);

								}
							}
						}
					}
				}

				// If this was a slower move it is per default non decelerated, but this
				// still means that we want snap back to the bounds which is done here.
				// This is placed outside the condition above to improve edge case stability
				// e.g. touchend fired without enabled dragging. This should normally do not
				// have modified the scroll positions or even showed the scrollbars though.
				if (!self.__isDecelerating) {

					if (self.__refreshActive && self.__refreshStart) {
						
						// Use publish instead of scrollTo to allow scrolling to out of boundary position
						// We don't need to normalize scrollLeft, zoomLevel, etc. here because we only y-scrolling when pull-to-refresh is enabled
						self.__publish(self.__scrollLeft, -self.__refreshHeight, self.__zoomLevel, true);
						
						if (self.__refreshStart) {
							self.__refreshStart();
						}
						
					} else {
						
						self.scrollTo(self.__scrollLeft, self.__scrollTop, true, self.__zoomLevel);
						
						// Directly signalize deactivation (nothing todo on refresh?)
						if (self.__refreshActive) {
							
							self.__refreshActive = false;
							if (self.__refreshDeactivate) {
								self.__refreshDeactivate();
							}
							
						}
					}
				}
				
				// Fully cleanup list
				self.__positions.length = 0;

			},



			/*
			---------------------------------------------------------------------------
				PRIVATE API
			---------------------------------------------------------------------------
			*/

			/**
			 * Applies the scroll position to the content element
			 *
			 * @param left {Number} Left scroll position
			 * @param top {Number} Top scroll position
			 * @param animate {Boolean?false} Whether animation should be used to move to the new coordinates
			 */
			__publish: function(left, top, zoom, animate) {

				var self = this;
				
				// Remember whether we had an animation, then we try to continue based on the current "drive" of the animation
				var wasAnimating = self.__isAnimating;
				if (wasAnimating) {
					core.effect.Animate.stop(wasAnimating);
					self.__isAnimating = false;
				}

				if (animate && self.options.animating) {

					// Keep scheduled positions for scrollBy/zoomBy functionality
					self.__scheduledLeft = left;
					self.__scheduledTop = top;
					self.__scheduledZoom = zoom;

					var oldLeft = self.__scrollLeft;
					var oldTop = self.__scrollTop;
					var oldZoom = self.__zoomLevel;

					var diffLeft = left - oldLeft;
					var diffTop = top - oldTop;
					var diffZoom = zoom - oldZoom;

					var step = function(percent, now, render) {

						if (render) {

							self.__scrollLeft = oldLeft + (diffLeft * percent);
							self.__scrollTop = oldTop + (diffTop * percent);
							self.__zoomLevel = oldZoom + (diffZoom * percent);

							// Push values out
							if (self.__callback) {
								self.__callback(self.__scrollLeft, self.__scrollTop, self.__zoomLevel);
							}

						}
					};

					var verify = function(id) {
						return self.__isAnimating === id;
					};

					var completed = function(renderedFramesPerSecond, animationId, wasFinished) {
						if (animationId === self.__isAnimating) {
							self.__isAnimating = false;
						}
						
						if (self.options.zooming) {
							self.__computeScrollMax();
						}
					};
					
					// When continuing based on previous animation we choose an ease-out animation instead of ease-in-out
					self.__isAnimating = core.effect.Animate.start(step, verify, completed, self.options.animationDuration, wasAnimating ? easeOutCubic : easeInOutCubic);

				} else {

					self.__scheduledLeft = self.__scrollLeft = left;
					self.__scheduledTop = self.__scrollTop = top;
					self.__scheduledZoom = self.__zoomLevel = zoom;

					// Push values out
					if (self.__callback) {
						self.__callback(left, top, zoom);
					}

					// Fix max scroll ranges
					if (self.options.zooming) {
						self.__computeScrollMax();
					}
				}
			},


			/**
			 * Recomputes scroll minimum values based on client dimensions and content dimensions.
			 */
			__computeScrollMax: function(zoomLevel) {

				var self = this;
				
				if (zoomLevel == null) {
					zoomLevel = self.__zoomLevel;
				}

				self.__maxScrollLeft = Math.max((self.__contentWidth * zoomLevel) - self.__clientWidth, 0);
				self.__maxScrollTop = Math.max((self.__contentHeight * zoomLevel) - self.__clientHeight, 0);
				
			},



			/*
			---------------------------------------------------------------------------
				ANIMATION (DECELERATION) SUPPORT
			---------------------------------------------------------------------------
			*/

			/**
			 * Called when a touch sequence end and the speed of the finger was high enough
			 * to switch into deceleration mode.
			 */
			__startDeceleration: function(timeStamp) {

				var self = this;

				if (self.options.paging) {

					var scrollLeft = Math.max(Math.min(self.__scrollLeft, self.__maxScrollLeft), 0);
					var scrollTop = Math.max(Math.min(self.__scrollTop, self.__maxScrollTop), 0);
					var clientWidth = self.__clientWidth;
					var clientHeight = self.__clientHeight;

					// We limit deceleration not to the min/max values of the allowed range, but to the size of the visible client area.
					// Each page should have exactly the size of the client area.
					self.__minDecelerationScrollLeft = Math.floor(scrollLeft / clientWidth) * clientWidth;
					self.__minDecelerationScrollTop = Math.floor(scrollTop / clientHeight) * clientHeight;
					self.__maxDecelerationScrollLeft = Math.ceil(scrollLeft / clientWidth) * clientWidth;
					self.__maxDecelerationScrollTop = Math.ceil(scrollTop / clientHeight) * clientHeight;

				} else {

					self.__minDecelerationScrollLeft = 0;
					self.__minDecelerationScrollTop = 0;
					self.__maxDecelerationScrollLeft = self.__maxScrollLeft;
					self.__maxDecelerationScrollTop = self.__maxScrollTop;

				}

				// Wrap class method
				var step = function(percent, now, render) {
					self.__stepThroughDeceleration(render);
				};

				// How much velocity is required to keep the deceleration running
				var minVelocityToKeepDecelerating = self.options.snapping ? 4 : 0.1;

				// Detect whether it's still worth to continue animating steps
				// If we are already slow enough to not being user perceivable anymore, we stop the whole process here.
				var verify = function() {
					return Math.abs(self.__decelerationVelocityX) >= minVelocityToKeepDecelerating || Math.abs(self.__decelerationVelocityY) >= minVelocityToKeepDecelerating;
				};

				var completed = function(renderedFramesPerSecond, animationId, wasFinished) {
					self.__isDecelerating = false;

					// Animate to grid when snapping is active, otherwise just fix out-of-boundary positions
					self.scrollTo(self.__scrollLeft, self.__scrollTop, self.options.snapping);
				};

				// Start animation and switch on flag
				self.__isDecelerating = core.effect.Animate.start(step, verify, completed);

			},


			/**
			 * Called on every step of the animation
			 *
			 * @param inMemory {Boolean?false} Whether to not render the current step, but keep it in memory only. Used internally only!
			 */
			__stepThroughDeceleration: function(render) {

				var self = this;


				//
				// COMPUTE NEXT SCROLL POSITION
				//

				// Add deceleration to scroll position
				var scrollLeft = self.__scrollLeft + self.__decelerationVelocityX;
				var scrollTop = self.__scrollTop + self.__decelerationVelocityY;


				//
				// HARD LIMIT SCROLL POSITION FOR NON BOUNCING MODE
				//

				if (!self.options.bouncing) {

					var scrollLeftFixed = Math.max(Math.min(self.__maxDecelerationScrollLeft, scrollLeft), self.__minDecelerationScrollLeft);
					if (scrollLeftFixed !== scrollLeft) {
						scrollLeft = scrollLeftFixed;
						self.__decelerationVelocityX = 0;
					}

					var scrollTopFixed = Math.max(Math.min(self.__maxDecelerationScrollTop, scrollTop), self.__minDecelerationScrollTop);
					if (scrollTopFixed !== scrollTop) {
						scrollTop = scrollTopFixed;
						self.__decelerationVelocityY = 0;
					}

				}


				//
				// UPDATE SCROLL POSITION
				//

				if (render) {

					self.__publish(scrollLeft, scrollTop, self.__zoomLevel);

				} else {

					self.__scrollLeft = scrollLeft;
					self.__scrollTop = scrollTop;

				}


				//
				// SLOW DOWN
				//

				// Slow down velocity on every iteration
				if (!self.options.paging) {

					// This is the factor applied to every iteration of the animation
					// to slow down the process. This should emulate natural behavior where
					// objects slow down when the initiator of the movement is removed
					var frictionFactor = 0.95;

					self.__decelerationVelocityX *= frictionFactor;
					self.__decelerationVelocityY *= frictionFactor;

				}


				//
				// BOUNCING SUPPORT
				//

				if (self.options.bouncing) {

					var scrollOutsideX = 0;
					var scrollOutsideY = 0;

					// This configures the amount of change applied to deceleration/acceleration when reaching boundaries
					var penetrationDeceleration = 0.03;
					var penetrationAcceleration = 0.08;

					// Check limits
					if (scrollLeft < self.__minDecelerationScrollLeft) {
						scrollOutsideX = self.__minDecelerationScrollLeft - scrollLeft;
					} else if (scrollLeft > self.__maxDecelerationScrollLeft) {
						scrollOutsideX = self.__maxDecelerationScrollLeft - scrollLeft;
					}

					if (scrollTop < self.__minDecelerationScrollTop) {
						scrollOutsideY = self.__minDecelerationScrollTop - scrollTop;
					} else if (scrollTop > self.__maxDecelerationScrollTop) {
						scrollOutsideY = self.__maxDecelerationScrollTop - scrollTop;
					}

					// Slow down until slow enough, then flip back to snap position
					if (scrollOutsideX !== 0) {
						if (scrollOutsideX * self.__decelerationVelocityX <= 0) {
							self.__decelerationVelocityX += scrollOutsideX * penetrationDeceleration;
						} else {
							self.__decelerationVelocityX = scrollOutsideX * penetrationAcceleration;
						}
					}

					if (scrollOutsideY !== 0) {
						if (scrollOutsideY * self.__decelerationVelocityY <= 0) {
							self.__decelerationVelocityY += scrollOutsideY * penetrationDeceleration;
						} else {
							self.__decelerationVelocityY = scrollOutsideY * penetrationAcceleration;
						}
					}
				}
			}
		};
		
		// Copy over members to prototype
		for (var key in members) {
			Scroller.prototype[key] = members[key];
		}

		module.exports = Scroller;
			
	})();


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Scroller
	 * http://github.com/zynga/scroller
	 *
	 * Copyright 2011, Zynga Inc.
	 * Licensed under the MIT License.
	 * https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt
	 *
	 * Based on the work of: Unify Project (unify-project.org)
	 * http://unify-project.org
	 * Copyright 2011, Deutsche Telekom AG
	 * License: MIT + Apache (V2)
	 */

	/**
	 * Generic animation class with support for dropped frames both optional easing and duration.
	 *
	 * Optional duration is useful when the lifetime is defined by another condition than time
	 * e.g. speed of an animating object, etc.
	 *
	 * Dropped frame logic allows to keep using the same updater logic independent from the actual
	 * rendering. This eases a lot of cases where it might be pretty complex to break down a state
	 * based on the pure time difference.
	 */
	(function(global) {
		var time = Date.now || function() {
			return +new Date();
		};
		var desiredFrames = 60;
		var millisecondsPerSecond = 1000;
		var running = {};
		var counter = 1;

		// Create namespaces
		var core = module.exports = { effect : {} };
		core.effect.Animate = {

			/**
			 * A requestAnimationFrame wrapper / polyfill.
			 *
			 * @param callback {Function} The callback to be invoked before the next repaint.
			 * @param root {HTMLElement} The root element for the repaint
			 */
			requestAnimationFrame: (function() {

				// Check for request animation Frame support
				var requestFrame = global.requestAnimationFrame || global.webkitRequestAnimationFrame || global.mozRequestAnimationFrame || global.oRequestAnimationFrame;
				var isNative = !!requestFrame;

				if (requestFrame && !/requestAnimationFrame\(\)\s*\{\s*\[native code\]\s*\}/i.test(requestFrame.toString())) {
					isNative = false;
				}

				if (isNative) {
					return function(callback, root) {
						requestFrame(callback, root)
					};
				}

				var TARGET_FPS = 60;
				var requests = {};
				var requestCount = 0;
				var rafHandle = 1;
				var intervalHandle = null;
				var lastActive = +new Date();

				return function(callback, root) {
					var callbackHandle = rafHandle++;

					// Store callback
					requests[callbackHandle] = callback;
					requestCount++;

					// Create timeout at first request
					if (intervalHandle === null) {

						intervalHandle = setInterval(function() {

							var time = +new Date();
							var currentRequests = requests;

							// Reset data structure before executing callbacks
							requests = {};
							requestCount = 0;

							for(var key in currentRequests) {
								if (currentRequests.hasOwnProperty(key)) {
									currentRequests[key](time);
									lastActive = time;
								}
							}

							// Disable the timeout when nothing happens for a certain
							// period of time
							if (time - lastActive > 2500) {
								clearInterval(intervalHandle);
								intervalHandle = null;
							}

						}, 1000 / TARGET_FPS);
					}

					return callbackHandle;
				};

			})(),


			/**
			 * Stops the given animation.
			 *
			 * @param id {Integer} Unique animation ID
			 * @return {Boolean} Whether the animation was stopped (aka, was running before)
			 */
			stop: function(id) {
				var cleared = running[id] != null;
				if (cleared) {
					running[id] = null;
				}

				return cleared;
			},


			/**
			 * Whether the given animation is still running.
			 *
			 * @param id {Integer} Unique animation ID
			 * @return {Boolean} Whether the animation is still running
			 */
			isRunning: function(id) {
				return running[id] != null;
			},


			/**
			 * Start the animation.
			 *
			 * @param stepCallback {Function} Pointer to function which is executed on every step.
			 *   Signature of the method should be `function(percent, now, virtual) { return continueWithAnimation; }`
			 * @param verifyCallback {Function} Executed before every animation step.
			 *   Signature of the method should be `function() { return continueWithAnimation; }`
			 * @param completedCallback {Function}
			 *   Signature of the method should be `function(droppedFrames, finishedAnimation) {}`
			 * @param duration {Integer} Milliseconds to run the animation
			 * @param easingMethod {Function} Pointer to easing function
			 *   Signature of the method should be `function(percent) { return modifiedValue; }`
			 * @param root {Element ? document.body} Render root, when available. Used for internal
			 *   usage of requestAnimationFrame.
			 * @return {Integer} Identifier of animation. Can be used to stop it any time.
			 */
			start: function(stepCallback, verifyCallback, completedCallback, duration, easingMethod, root) {

				var start = time();
				var lastFrame = start;
				var percent = 0;
				var dropCounter = 0;
				var id = counter++;

				if (!root) {
					root = document.body;
				}

				// Compacting running db automatically every few new animations
				if (id % 20 === 0) {
					var newRunning = {};
					for (var usedId in running) {
						newRunning[usedId] = true;
					}
					running = newRunning;
				}

				// This is the internal step method which is called every few milliseconds
				var step = function(virtual) {

					// Normalize virtual value
					var render = virtual !== true;

					// Get current time
					var now = time();

					// Verification is executed before next animation step
					if (!running[id] || (verifyCallback && !verifyCallback(id))) {

						running[id] = null;
						completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, false);
						return;

					}

					// For the current rendering to apply let's update omitted steps in memory.
					// This is important to bring internal state variables up-to-date with progress in time.
					if (render) {

						var droppedFrames = Math.round((now - lastFrame) / (millisecondsPerSecond / desiredFrames)) - 1;
						for (var j = 0; j < Math.min(droppedFrames, 4); j++) {
							step(true);
							dropCounter++;
						}

					}

					// Compute percent value
					if (duration) {
						percent = (now - start) / duration;
						if (percent > 1) {
							percent = 1;
						}
					}

					// Execute step callback, then...
					var value = easingMethod ? easingMethod(percent) : percent;
					if ((stepCallback(value, now, render) === false || percent === 1) && render) {
						running[id] = null;
						completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, percent === 1 || duration == null);
					} else if (render) {
						lastFrame = now;
						core.effect.Animate.requestAnimationFrame(step, root);
					}
				};

				// Mark as running
				running[id] = true;

				// Init first step
				core.effect.Animate.requestAnimationFrame(step, root);

				// Return unique animation ID
				return id;
			}
		};
	})(this);



/***/ }
/******/ ])
});
;