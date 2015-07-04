var TouchScroller = require('./TouchScroller'),
    VerticalScroller = require('./VerticalScroller'),
    ScrollbarRenderer = require('./ScrollbarRenderer'),
    AnimationFrameHelper = require('./AnimationFrameHelper'),
    ListItemsRenderer = require('./ListItemsRenderer'),
    StyleHelpers = require('./StyleHelpers');
    DEFAULT_ITEM_HEIGHT = 2;

var InfiniteList = function (listConfig) {

    var config = {
            itemHeightGetter: null,
            itemRenderer: null,
            itemTypeGetter: null,
            pageFetcher: null,
            loadMoreRenderer: function(index, domElement){
                domElement.innerHTML = '<div style="margin-left:14px;height:50px>Loading...</div>';
            },
            hasMore: false,
            itemsCount: 0
        },
        parentElement = null,
        parentElementHeight,
        rootElement = null,
        scrollElement = null,
        scrollbarRenderer = null,
        itemsRenderer = null,
        scroller = null,
        offsetDelta = 5000,
        listItemsOffsets = [],
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

        scroller.setDimensions(
            Number.MIN_SAFE_INTEGER,
            Number.MAX_SAFE_INTEGER
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

    function calculateHeights(fromIndex) {
        if (!fromIndex) {
            listItemsOffsets = [offsetDelta];
            fromIndex = 1;
        }

        for (var i = fromIndex; i <= config.itemsCount || 0; ++i) {
            var currentRowHeight = config.itemHeightGetter ? config.itemHeightGetter(i - 1) : DEFAULT_ITEM_HEIGHT;
            listItemsOffsets[i] = listItemsOffsets[i - 1] + currentRowHeight;
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

    function refresh(){
        var topListItem = itemsRenderer.getRenderedItems()[0],
            topListItemIndex = topListItem && topListItem.getItemIndex() || 0,
            topItemStartsAt = topListItem && topListItem.getItemOffset() || 0,
            differenceFromTop = topOffset - topItemStartsAt;

        parentElementHeight = parentElement.clientHeight;
        StyleHelpers.applyElementStyle(rootElement, {
            height: parentElement.clientHeight + 'px',
            width: parentElement.clientWidth + 'px'
        });
        itemsRenderer.refresh();
        calculateHeights();
        scrollbarRenderer.refresh();
        scrollToItem(topListItemIndex, differenceFromTop);
    }

    function getListHeight(){
        var renderedItems = itemsRenderer.getRenderedItems(),
            maxRenderedItem = renderedItems && renderedItems[renderedItems.length - 1],
            currentHeight = maxRenderedItem && (maxRenderedItem.getItemOffset() + maxRenderedItem.getItemHeight()) ||  Number.MIN_SAFE_INTEGER;

        return Math.max(currentHeight, listItemsOffsets[listItemsOffsets.length - 1] + (!config.hasMore ? 0 : DEFAULT_ITEM_HEIGHT));
    }

    function render() {
        var topItem = null,
            maxIndexToRender = config.itemsCount - 1 + (config.hasMore ? 1 : 0),
            bottomItem = null,
            renderedItems = itemsRenderer.getRenderedItems();

        if (renderedItems.length > 0) {
            if (renderedItems[0].getItemIndex() == 0 && topOffset < renderedItems[0].getItemOffset()) {
                topOffset = renderedItems[0].getItemOffset();
                scroller.scrollTo(topOffset);
                return;
            }
        }
        StyleHelpers.applyTransformStyle(scrollElement, 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + (-topOffset) + ', 0, 1)');
        scrollbarRenderer.render(topOffset, getListHeight());
        needsRender = itemsRenderer.render(topOffset, scrollToIndex, topItemOffset);
        renderedItems = itemsRenderer.getRenderedItems();


        if (renderedItems.length > 0) {
            topItem = renderedItems[0];
            bottomItem = renderedItems[renderedItems.length - 1];

            shiftItemOffsetIfNeeded(topItem.getItemIndex(), topItem.getItemOffset());
            shiftItemOffsetIfNeeded(bottomItem.getItemIndex() + 1, bottomItem.getItemOffset() + bottomItem.getItemHeight());
        }

        for (var i = 1; i < renderedItems.length - 1; ++i) {
            listItemsOffsets[renderedItems[i].getItemIndex()] = renderedItems[i].getItemOffset();
        }

        scrollToIndex = null;
        topItemOffset = null;

        if (renderedItems.length > 0 && renderedItems[renderedItems.length - 1].getItemIndex() == maxIndexToRender) {
            var lastItem = renderedItems[renderedItems.length - 1],
                maxScrollPos = lastItem.getItemOffset() + lastItem.getItemHeight();

            if (topOffset > maxScrollPos - parentElementHeight) {
                scroller.scrollTo(maxScrollPos - parentElementHeight);
            }
        }
    }

    function loadMoreCallback(){
        config.pageFetcher(config.itemsCount, function(pageItemsCount, hasMore){
            config.hasMore = hasMore;
            config.itemsCount += pageItemsCount;
            calculateHeights(config.itemsCount - pageItemsCount);
            render();
        });
    }

    function scrollToItem(index, relativeOffset, animate) {
        topItemOffset = relativeOffset || 0;
        scrollToIndex = index;
        scroller.scrollTo(0, animate);
    }

    function refreshItemHeight(index){

        var renderedListItem = itemsRenderer.getRenderedItems().filter(function(rItem){
            return rItem.getItemIndex() == index;
        })[0];

        //we only need to do something if the index points to a rendered item.
        if (renderedListItem) {
            var newHeight = config.itemHeightGetter && config.itemHeightGetter(index),
                startOffset = renderedListItem.getItemOffset();

            if (!newHeight) {
                newHeight = renderedListItem.getDomElement().clientHeight
            }

            renderedListItem.setItemHeight(newHeight);

            if (renderedListItem.getItemOffset() < topOffset) {
                shiftTopOffsets(index, listItemsOffsets[index + 1] - newHeight);
            } else {
                shiftBottomOffsets(index + 1, startOffset + newHeight);
            }
        }
    }

    function shiftItemOffsetIfNeeded(itemIndex, itemOffset) {
        var renderedListItems = itemsRenderer.getRenderedItems(),
            listItem = renderedListItems.filter(function(rItem){
                return rItem.getItemIndex() == itemIndex;
            })[0];

        var topShift = renderedListItems.length == 0 || renderedListItems[0].getItemIndex() > itemIndex || (listItem && listItem.getItemOffset() < topOffset);
        (topShift ? shiftTopOffsets : shiftBottomOffsets)(itemIndex, itemOffset);
    }

    function shiftTopOffsets(itemIndex, itemOffset) {
        var shiftTop = itemOffset - listItemsOffsets[itemIndex];
        if (shiftTop != 0) {
            for (var i = itemIndex; i >= 0; --i) {
                updateItemOffset(i, listItemsOffsets[i] + shiftTop);
            }
        }
    }

    function shiftBottomOffsets(itemIndex, itemOffset) {
        if (itemIndex < listItemsOffsets.length) {
            var shiftBottom = itemOffset - listItemsOffsets[itemIndex];
            if (shiftBottom != 0) {
                for (var i = itemIndex; i < listItemsOffsets.length; ++i) {
                    updateItemOffset(i, listItemsOffsets[i] + shiftBottom);
                }
            }
        }
    }

    function updateItemOffset(itemIndex, newOffset) {
        var renderedItems = itemsRenderer.getRenderedItems(),
            firstRenderedItem = itemsRenderer.getRenderedItems()[0],
            firstRenderedIndex = firstRenderedItem && firstRenderedItem.getItemIndex() || 0;

        listItemsOffsets[itemIndex]  = newOffset;
        if (renderedItems[itemIndex - firstRenderedIndex]) {
            renderedItems[itemIndex - firstRenderedIndex].setItemOffset(newOffset);
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