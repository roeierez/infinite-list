var TouchScroller = require('./TouchScroller'),
    VerticalScroller = require('./VerticalScroller'),
    ScrollbarRenderer = require('./ScrollbarRenderer'),
    AnimationFrameHelper = require('./AnimationFrameHelper'),
    ListItemsRenderer = require('./ListItemsRenderer'),
    StyleHelpers = require('./StyleHelpers');
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