(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
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

	module.exports = __webpack_require__(12);


/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var VerticalScroller = __webpack_require__(3),
	    NativeScroller = __webpack_require__(4)
	    ScrollbarRenderer = __webpack_require__(6),
	    AnimationFrameHelper = __webpack_require__(7),
	    ListItemsRenderer = __webpack_require__(8),
	    StyleHelpers = __webpack_require__(5);
	    DEFAULT_ITEM_HEIGHT = 2,
	    RESIZE_CHECK_INTERVAL = 500;

	var InfiniteList = function (listConfig) {

	    var config = {
	            itemHeightGetter: null,
	            recalculateItemHeights: false,
	            itemRenderer: null,
	            itemTypeGetter: null,
	            pageFetcher: null,
	            loadMoreRenderer: function(index, domElement){
	                domElement.innerHTML = '<div style="margin-left:14px;height:50px">Loading...</div>';
	            },
	            hasMore: false,
	            useNativeScroller: false,
	            itemsCount: 0
	        },
	        parentElement = null,
	        parentElementHeight,
	        rootElement = null,
	        scrollElement = null,
	        scrollbarRenderer = null,
	        itemsRenderer = null,
	        scroller = null,
	        listItemsHeights = [],
	        topOffset = 0,
	        scrollToIndex = 0,
	        topItemOffset = 0,
	        numberOfRenderedItemsAhead = 2,
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
	        numberOfRenderedItemsAhead = initialPageConfig.itemsCount || 1;
	    }

	    function attach(domElement, touchProvider){
	        parentElement = domElement;
	        initializeRootElement(domElement);
	        itemsRenderer = new ListItemsRenderer(domElement, scrollElement, config, loadMoreCallback);
	        if (config.useNativeScroller) {
	            scroller = new NativeScroller(
	                rootElement,
	                function (top) {
	                    topOffset = (top || 0);
	                    needsRender = true;
	                }
	            );
	        } else {
	            scrollbarRenderer = new ScrollbarRenderer(rootElement);
	            scroller = new VerticalScroller(
	                parentElement,
	                function (top) {
	                    topOffset = (top || 0);
	                    needsRender = true;
	                },
	                touchProvider
	            );

	            scroller.setDimensions(
	                Number.MIN_SAFE_INTEGER,
	                Number.MAX_SAFE_INTEGER
	            );
	        }

	        runAnimationLoop();
	        refresh();
	        return this;
	    }

	    function detach() {
	        AnimationFrameHelper.stopAnimationLoop();
	        parentElement.removeChild(rootElement);
	    }

	    function runAnimationLoop(){
	        AnimationFrameHelper.startAnimationLoop(function(){
	           if (needsRender) {
	                render();
	            }
	        });
	    }

	    function calculateHeights(fromIndex) {
	        for (var i = fromIndex || 0; i < config.itemsCount || 0; ++i) {
	            listItemsHeights[i] = config.itemHeightGetter && config.itemHeightGetter(i) || listItemsHeights[i];
	        }
	        if (config.hasMore) {
	            listItemsHeights[config.itemsCount] = 200;
	        }
	    }

	    function initializeRootElement(parentElement) {
	        scrollElement = document.createElement('div');
	        StyleHelpers.applyElementStyle(scrollElement, {
	            position: config.useNativeScroller ? 'relative' : 'absolute',
	            width: '100%'
	        });

	        rootElement = document.createElement('div');
	        StyleHelpers.applyElementStyle(rootElement, {
	            position: 'relative',
	            height: '100%',
	            width: '100%',
	            overflowY : config.useNativeScroller ? 'scroll' : 'hidden'
	        });
	        rootElement.appendChild(scrollElement);
	        parentElement.appendChild(
	            rootElement);
	    };

	    function refresh(initialPage){
	        var topListItem = itemsRenderer.getRenderedItems()[0],
	            topListItemIndex = topListItem && topListItem.getItemIndex() || 0,
	            topItemStartsAt = topListItem && topListItem.getItemOffset() || 0,
	            differenceFromTop = topOffset - topItemStartsAt;

	        if (initialPage) {
	            if (initialPage.itemsCount) {
	                if (config.itemsCount > initialPage.itemsCount) {
	                    topListItemIndex = 0;
	                    rootElement.scrollTop = 0;
	                    differenceFromTop = 0;
	                } else if (config.itemsCount < initialPage.itemsCount) {
	                    numberOfRenderedItemsAhead = initialPage.itemsCount - config.itemsCount;
	                }

	                config.itemsCount = initialPage.itemsCount;
	                listItemsHeights = listItemsHeights.slice(0, initialPage.itemsCount);
	            }

	            if (initialPage.hasMore != null) {
	                config.hasMore = initialPage.hasMore;
	            }
	        }

	        parentElementHeight = parentElement.clientHeight;

	        itemsRenderer.refresh();
	        calculateHeights();
	        if (scrollbarRenderer) {
	            scrollbarRenderer.refresh();
	        }

	        if (initialPage) {
	            scrollToItem(topListItemIndex, false, differenceFromTop);
	        }

	        needsRender=true;
	    }

	    function updateScroller() {
	        var maxIndexToRender = config.itemsCount - 1 + (config.hasMore ? 1 : 0),
	            renderedItems = itemsRenderer.getRenderedItems(),
	            lastRenderedItem = renderedItems[renderedItems.length - 1],
	            minScrollerOffset =  Number.MIN_SAFE_INTEGER,
	            maxScrollerOffset = Number.MAX_SAFE_INTEGER;

	        if (renderedItems.length > 0 && renderedItems[0].getItemIndex() == 0) {
	                minScrollerOffset = renderedItems[0].getItemOffset();
	        }

	        if (lastRenderedItem && lastRenderedItem.getItemIndex() == maxIndexToRender) {
	                maxScrollerOffset =  lastRenderedItem.getItemOffset() + lastRenderedItem.getItemHeight() - parentElementHeight;
	        }

	        if (config.useNativeScroller) {
	            var totalHeight = 0;
	            listItemsHeights.forEach(function(h){
	                totalHeight += h;
	            });
	            StyleHelpers.applyElementStyle(scrollElement, {
	                height: totalHeight + 'px'
	            });
	        } else {
	            scroller.setDimensions(minScrollerOffset, maxScrollerOffset);
	        }
	    }

	    function render() {
	        var renderedItems;

	        updateScroller();
	        if (!config.useNativeScroller) {
	            StyleHelpers.applyTransformStyle(scrollElement, 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + (-topOffset) + ', 0, 1)');
	        }
	        needsRender = itemsRenderer.render(topOffset, scrollToIndex, topItemOffset, numberOfRenderedItemsAhead);
	        renderedItems = itemsRenderer.getRenderedItems();

	        scrollToIndex = null;
	        topItemOffset = null;



	        var scrollerDiff = 0;
	        renderedItems.forEach(function(item){
	            if (item.getItemOffset() < topOffset) {
	                scrollerDiff += (listItemsHeights[item.getItemIndex()] - item.getItemHeight());
	            }
	            listItemsHeights[item.getItemIndex()] = item.getItemHeight();
	        });

	        if (config.useNativeScroller && (scrollerDiff != 0)) {
	            rootElement.scrollTop -= scrollerDiff;
	            renderedItems.forEach(function(item){
	                item.setItemOffset(item.getItemOffset() - scrollerDiff);
	            });
	        }

	        var avarageItemHeight = 0,
	            itemsCount = 0;
	        for (var i=0; i<listItemsHeights.length; ++i) {
	            if (typeof listItemsHeights[i] == 'number') {

	                avarageItemHeight += listItemsHeights[i];
	                itemsCount++;
	            }
	        }
	        avarageItemHeight = avarageItemHeight / itemsCount;
	        if (scrollbarRenderer) {
	            scrollbarRenderer.render(avarageItemHeight * renderedItems[0].getItemIndex() + topOffset - renderedItems[0].getItemOffset(), avarageItemHeight * config.itemsCount);
	        }
	    }

	    function loadMoreCallback(){
	        config.pageFetcher(config.itemsCount, function(pageItemsCount, hasMore){
	            config.hasMore = hasMore;
	            config.itemsCount += pageItemsCount;
	            if (config.useNativeScroller) {
	                numberOfRenderedItemsAhead = pageItemsCount;
	            }
	            calculateHeights(config.itemsCount - pageItemsCount);
	            scroller.scrollTo(itemsRenderer.getRenderedItems()[itemsRenderer.getRenderedItems().length - 1].getItemOffset() - parentElementHeight);
	            //scroller.scrollTo(itemsRenderer.getRenderedItems()[itemsRenderer.getRenderedItems()[0].getItemOffset()]);
	            if (config.useNativeScroller) {

	            }
	        });
	    }

	    function scrollToItem(index, animate, relativeOffset) {
	        var targetPosition = 0;
	        if (config.itemHeightGetter) {
	            for (var i=0; i<index; ++i){
	                targetPosition += config.itemHeightGetter(i);
	            }
	        } else {
	            scrollToIndex = index;
	        }
	        topItemOffset = relativeOffset || 0;
	        scroller.scrollTo( targetPosition, config.itemHeightGetter && animate);
	    }

	    function refreshItemHeight(index){

	        var renderedItems = itemsRenderer.getRenderedItems();
	        var renderedListItem = renderedItems.filter(function(rItem){
	            return rItem.getItemIndex() == index;
	        })[0];

	        //we only need to do something if the index points to a rendered item.
	        if (renderedListItem) {
	            var newHeight = config.itemHeightGetter && config.itemHeightGetter(index);

	            if (!newHeight) {
	                newHeight = renderedListItem.getDomElement().clientHeight;
	                listItemsHeights[index] = newHeight;
	            }

	            renderedListItem.setItemHeight(newHeight);

	            var itemRenderIndex = renderedListItem.getItemIndex() - renderedItems[0].getItemIndex();
	            var nextItem = renderedItems[itemRenderIndex + 1];
	            if (renderedListItem.getItemOffset() < topOffset) {
	                while (nextItem && renderedListItem){
	                    renderedListItem.setItemOffset(nextItem.getItemOffset() - renderedListItem.getItemHeight());
	                    nextItem = renderedListItem;
	                    renderedListItem = renderedItems[--itemRenderIndex];
	                }
	            } else {
	                while (nextItem && renderedListItem){
	                    nextItem.setItemOffset(renderedListItem.getItemOffset() + renderedListItem.getItemHeight());
	                    renderedListItem = nextItem;
	                    nextItem = renderedItems[++itemRenderIndex + 1];
	                }
	            }
	        }
	    }

	    return {
	        attach: attach,
	        detach: detach,
	        scrollToItem: scrollToItem,
	        refresh: refresh,
	        refreshItemHeight: refreshItemHeight
	    }

	};

	module.exports = InfiniteList;

/***/ },
/* 3 */
/***/ function(module, exports) {

	var SCROLLING_TIME_CONSTANT = 525;

	var VerticalScroller = function (parentElement, callback) {

	    var timestamp = 0,
	        minOffset = 0,
	        maxOffset = 0,
	        frame = 0,
	        velocity = 0,
	        amplitude = 0,
	        pressed = 0,        
	        reference = 0,
	        offset = 0,
	        target = 0,
	        touchPositions = [];

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

	    function scroll (y) {
	        offset = y;//Math.min( Math.max(y, minOffset), maxOffset);
	        callback(y);
	    }

	    function autoScroll () {
	        var elapsed, delta, newOffset;

	        if (amplitude) {
	            elapsed = Date.now() - timestamp;
	            delta = amplitude * Math.exp(-elapsed / SCROLLING_TIME_CONSTANT);
	            newOffset = target - delta;

	            if (newOffset < minOffset) {
	                if (target - delta >= minOffset-2){
	                    scroll(minOffset);
	                    return;
	                }

	                bounce(true);

	            } else if (newOffset > maxOffset) {
	                if (target - delta <= maxOffset + 2){
	                    scroll(maxOffset);
	                    return;
	                }
	                bounce(false);

	            } else if (delta > 2 || delta < -2) {
	                scroll(target - delta);
	                requestAnimationFrame(autoScroll);
	            } else {
	                scroll(target);
	            }
	        }
	    }

	    function bounce (top){

	        var finalDestination = top ? minOffset : maxOffset,
	            isBouncingBack = top && amplitude > 0 || !top && amplitude < 0;

	        if (amplitude == 0){
	            return;
	        }

	        var elapsed = Date.now() - timestamp;
	        var delta = amplitude * Math.exp(-elapsed / (target == finalDestination ? 125 : SCROLLING_TIME_CONSTANT) );

	        if ( isBouncingBack && Math.abs(delta) < 2 ) {
	            scroll(top ? minOffset : maxOffset);
	            return;
	        }

	        scroll(target - delta);        

	        if (isBouncingBack) {
	            if (target != finalDestination) {
	                target = finalDestination;
	                amplitude = target - offset;    
	                timestamp = new Date();
	            }

	        } else {
	            target = finalDestination - (finalDestination - target) * 0.1;
	            amplitude = target - offset;            
	            
	        }

	        requestAnimationFrame(function(){
	            bounce(top);
	        });
	        return;
	    }

	    function tap (e) {
	        pressed = true;
	        reference = ypos(e);

	        velocity = amplitude = 0;
	        frame = offset;
	        timestamp = Date.now();
	        recordTouches(e);
	        
	        e.stopPropagation();
	    }

	    function drag (e) {
	        var y, delta, scaleFactor = offset < minOffset || offset > maxOffset ? 0.5 : 1;
	        if (pressed) {
	            recordTouches(e);
	            y = ypos(e);
	            delta = reference - y;
	            if (delta > 2 || delta < -2) {
	                reference = y;                
	                scroll(offset + delta * scaleFactor);
	            }
	        }
	        e.preventDefault();
	        e.stopPropagation();
	    }

	    function recordTouches(e) {
	        var touches = e.touches || [{pageX: e.pageX, pageY: e.pageY}],
	            timestamp = e.timeStamp,
	            currentTouchTop = touches[0].pageY;

	        if (touches.length === 2) {
	            currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
	        }

	        touchPositions.push({offset: currentTouchTop, timestamp: timestamp});
	        if (touchPositions.length > 60) {
	            touchPositions.splice(0, 30);
	        }
	    }

	    function release (e) {
	        pressed = false;

	        var endPos = touchPositions.length - 1;
	        var startPos = endPos - 1;

	        // Move pointer to position measured 100ms ago
	        for (var i = endPos - 1; i > 0 && touchPositions[i].timestamp > (touchPositions[endPos].timestamp - 100); i -= 1) {
	            startPos = i;
	        }

	        var elapsed = touchPositions[endPos].timestamp - touchPositions[startPos].timestamp;
	        var delta = touchPositions[endPos].offset - touchPositions[startPos].offset;

	        var v = -1000 * delta / (1 + elapsed);
	        velocity = 0.8 * v + 0.2 * velocity;

	        amplitude = 1.0 * velocity;
	        target = Math.round(offset + amplitude);
	        timestamp = Date.now();
	        requestAnimationFrame(autoScroll);

	        e.stopPropagation();
	    }

	    function scrollTo(y, animate){
	        var maxAnimateDelta = 4000;
	        if (animate) {
	            if (y - offset > maxAnimateDelta) {
	                offset = y - maxAnimateDelta;
	            } else if (offset - y > maxAnimateDelta) {
	                offset = y + maxAnimateDelta;
	            }

	            amplitude = y - offset;
	            target = y;
	            timestamp = Date.now();
	            requestAnimationFrame(autoScroll);
	        } else {
	            amplitude = 0;
	            scroll(y);
	        }
	    }

	    function changeScrollPosition (y) {
	        scroll(y);
	    }

	    function setDimensions(min, max){
	        minOffset = min;
	        maxOffset = max;
	    }

	    return {
	        setDimensions: setDimensions,
	        scrollTo: scrollTo
	    }
	};

	module.exports = VerticalScroller;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var StyleHelpers = __webpack_require__(5);

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


/***/ },
/* 5 */
/***/ function(module, exports) {

	
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
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var StyleHelpers = __webpack_require__(5);

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
/* 7 */
/***/ function(module, exports) {

	
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
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var Layer = __webpack_require__(9),
	    LayersPool = __webpack_require__(10),
	    AnimationFrameHelper = __webpack_require__(7),
	    MIN_FPS = 30,
	    MAX_TIME_PER_FRAME = 1000 / MIN_FPS;

	var ListItemsRenderer = function(attachedElement, scrollElement, listConfig, pageCallback){

	    var visibleHeight = attachedElement.clientHeight,
	        itemWidth = attachedElement.clientWidth,
	        renderedListItems = [],
	        layersPool = new LayersPool();

	    function render(topOffset, atIndex, offsetFromTop, minNumberOfItemsAhead){
	        var startRenderTime = new Date().getTime();

	        if ( typeof atIndex == 'number' &&  atIndex >= 0){
	            atIndex = Math.max(0, Math.min(atIndex, listConfig.itemsCount-1));
	            while (renderedListItems.length > 0) {
	                layersPool.addLayer(renderedListItems.pop());
	            }

	            var onlyRenderedItem = renderListItem(atIndex);
	            onlyRenderedItem.setItemOffset(topOffset - (offsetFromTop || 0));
	            renderedListItems.push(onlyRenderedItem);
	        }

	        //clean top items
	        while (renderedListItems.length > 1 && renderedListItems[0] && renderedListItems[0].getItemOffset() < topOffset) {
	            layersPool.addLayer(renderedListItems.shift());
	        }

	        //fill up
	        var topRenderedItem = renderedListItems[0];
	        while (topRenderedItem && topRenderedItem.getItemIndex() > 0 && topRenderedItem.getItemOffset() > topOffset) {
	            topRenderedItem = renderBefore(topRenderedItem);
	            if (renderedListItems[renderedListItems.length - 1].getItemOffset() > topOffset + visibleHeight) {
	                layersPool.addLayer(renderedListItems.pop());
	            }

	            if (new Date().getTime() - startRenderTime > MAX_TIME_PER_FRAME) {
	                return true;
	            }
	        }

	        //fill down
	        var bottomRenderedItem = renderedListItems[renderedListItems.length - 1];
	        if (bottomRenderedItem.getItemIndex() < listConfig.itemsCount && bottomRenderedItem.getIdentifier() == "$LoadMore") {
	            bottomRenderedItem = renderedListItems[renderedListItems.length - 1];
	            layersPool.addLayer(renderedListItems.pop());
	            if (renderedListItems.length <= 0) {
	                return render(topOffset, bottomRenderedItem.getItemIndex(), undefined, minNumberOfItemsAhead);
	            } else {
	                bottomRenderedItem = renderedListItems[renderedListItems.length - 1];
	            }
	        }

	        while(bottomRenderedItem && bottomRenderedItem.getItemIndex() < listConfig.itemsCount && bottomRenderedItem.getItemOffset() + bottomRenderedItem.getItemHeight() < topOffset + visibleHeight) {
	            bottomRenderedItem = renderAfter(bottomRenderedItem);
	            if (renderedListItems[0].getItemOffset() + renderedListItems[0].getItemHeight() < topOffset) {
	                layersPool.addLayer(renderedListItems.shift());
	            }

	            if (new Date().getTime() - startRenderTime > MAX_TIME_PER_FRAME) {
	                return true;
	            }
	        }

	        //find bottom visible item
	        var bottomVisibleItem = renderedListItems[0];
	        for (var i=0; i < renderedListItems.length; ++i) {
	            if (renderedListItems[i].getItemOffset() + renderedListItems[i].getItemHeight() >= topOffset + visibleHeight) {
	                bottomVisibleItem = renderedListItems[i];
	                break;
	            }
	        }

	        //clean items pased bottom + minNumberOfItemsAhead
	        while ( bottomRenderedItem && bottomRenderedItem.getItemIndex() > bottomVisibleItem.getItemIndex() + minNumberOfItemsAhead ) {
	            layersPool.addLayer(renderedListItems.pop());
	            bottomRenderedItem = renderedListItems[renderedListItems.length - 1];
	        }

	        while (bottomRenderedItem && bottomRenderedItem.getItemIndex() < listConfig.itemsCount-1 && bottomRenderedItem.getItemIndex() < bottomVisibleItem.getItemIndex() + minNumberOfItemsAhead) {
	            bottomRenderedItem = renderAfter(bottomRenderedItem);
	            if (new Date().getTime() - startRenderTime > MAX_TIME_PER_FRAME) {
	                return true;
	            }
	        }

	        //fix offsets.
	        var itemOffset = renderedListItems[0] && renderedListItems[0].getItemOffset();
	        renderedListItems.forEach(function(layer){
	            if (layer.getItemOffset() != itemOffset) {
	                layer.setItemOffset(itemOffset);
	            }
	            itemOffset += layer.getItemHeight();
	        });

	        return false;
	    }

	    function renderBefore(listItem){
	        var newItem = renderListItem(listItem.getItemIndex() - 1);
	        if (newItem) {
	            newItem.setItemOffset(listItem.getItemOffset() - newItem.getItemHeight());
	            renderedListItems.unshift(newItem);
	        }
	        return newItem;
	    }

	    function renderAfter(listItem){
	        var newItem = renderListItem(listItem.getItemIndex() + 1);
	        if (newItem) {
	            newItem.setItemOffset(listItem.getItemOffset() + listItem.getItemHeight());
	            renderedListItems.push(newItem);
	        }
	        return newItem;
	    }

	    function renderListItem (index) {
	        if (index == listConfig.itemsCount) {
	            if (!listConfig.hasMore) {
	                return null;
	            }
	            return renderLoadMore();
	        }

	        var itemIdentifier = (listConfig.itemTypeGetter ? listConfig.itemTypeGetter(index) : ''),
	            layer = borrowLayerForIndex(index, itemIdentifier);
	        listConfig.itemRenderer(index, layer.getDomElement());
	        return layer;
	    }

	    /*
	     Borrow a layer from the LayersPool and attach it to a certain item at index.
	     */
	    function borrowLayerForIndex(index, identifier) {
	        var layerIdentifier = identifier || (listConfig.itemTypeGetter ? listConfig.itemTypeGetter(index) : '');
	        var layer = layersPool.borrowLayerWithIdentifier(layerIdentifier);
	        if (layer == null) {
	            layer = new Layer(scrollElement);
	        }
	        //index, topOffset, renderer, width, height, itemIdentifier
	        var itemHeight = !listConfig.recalculateItemHeights && listConfig.itemHeightGetter && listConfig.itemHeightGetter(index);
	        layer.attach(index, listConfig.useNativeScroller ? 0 : 13, itemHeight, layerIdentifier);
	        //listItems.push(layer);
	        return layer;
	    }

	    function renderLoadMore(){
	        if (renderedListItems.length == 0 || renderedListItems[renderedListItems.length - 1].getIdentifier() != '$LoadMore') {
	            var loadMoreLayer = borrowLayerForIndex(listConfig.itemsCount, '$LoadMore');
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
	             listConfig.itemRenderer(layer.getItemIndex(), layer.getDomElement());
	            layer.setItemHeight(0);
	        });
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
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var StyleHelpers = __webpack_require__(5);

	var Layer = function (parentElement) {
	    var listItemElement = null,
	        identifier = "",
	        currentOffset = -1,
	        itemIndex = -1,
	        itemHeight = 0;

	    listItemElement = createListItemWrapperElement();
	    parentElement.appendChild(listItemElement);

	    function attach(index, right, height, itemIdentifier) {
	        itemIndex = index;
	        StyleHelpers.applyElementStyle(listItemElement, {
	            right: right + 'px',
	            width: '100%',
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


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var StyleHelpers = __webpack_require__(5),
	    LayersPool = function () {
	        var layersByIdentifier = {};

	        function addLayer(layer, hide) {
	            var layerIdentifier = layer.getIdentifier();
	            if (layersByIdentifier[layerIdentifier] == null) {
	                layersByIdentifier[layerIdentifier] = [];
	            }
	            layersByIdentifier[layerIdentifier].push(layer);
	            layer.setItemOffset(-10000);
	            StyleHelpers.applyElementStyle(layer.getDomElement(), {display: 'none'});
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
/* 11 */,
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var InfiniteList = __webpack_require__(2),
	    list = new InfiniteList({

	        itemHeightGetter: function(){
	            return 50;
	        },

	        itemRenderer: function(index, domElement){
	            domElement.innerHTML = 'Item ' + index;
	        },

	        loadMoreRenderer: function(index, domElement){
	            domElement.innerHTML = 'I am loading from #' + index;
	        },

	        pageFetcher: function(fromIndex, pageCallback){
	            setTimeout(function(){ //simulate network fetch
	                pageCallback(10, true);
	            }, 2000)
	        },

	        initialPage: {
	            hasMore: true,
	            itemsCount: 10
	        }

	    }).attach(document.getElementById('main'));


/***/ }
/******/ ])
});
;