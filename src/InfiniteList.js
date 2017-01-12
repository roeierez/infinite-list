var VerticalScroller = require('./VerticalScroller'),
    ScrollbarRenderer = require('./ScrollbarRenderer'),
    AnimationFrameHelper = require('./AnimationFrameHelper'),
    ListItemsRenderer = require('./ListItemsRenderer'),
    StyleHelpers = require('./StyleHelpers'),
    DEFAULT_ITEM_HEIGHT = 2;

var InfiniteList = function (listConfig) {

    var config = {
            itemHeightGetter: null,
            itemRenderer: null,
            itemTypeGetter: null,
            pageFetcher: null,
            loadMoreRenderer: function(index, domElement){
                domElement.innerHTML = '<div style="margin-left:14px;height:50px">Loading...</div>';
            },
            hasMore: false,
            pullToRefresh: {
                height: null,
                idleRenderer: null,
                busyRenderer: null,
                beginRefreshAtOffset: null,
                onRefresh: null
            },
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
        needsRender = true,
        refreshing = false;

    for (var key in listConfig){
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
        itemsRenderer = new ListItemsRenderer(domElement, scrollElement, config, loadMoreCallback, function(){
            refreshing = true;
        }, function(){
            console.error('done refreshing');
            refreshing = false;

            updateScroller(true);
        });
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
        if (config.itemHeightGetter) {
            for (var i = fromIndex || 0; i <= config.itemsCount || 0; ++i) {
                listItemsHeights[i] = config.itemHeightGetter(i);
            }
        }
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
        scrollToItem(topListItemIndex, false, differenceFromTop);
    }

    function updateScroller(align) {
        var maxIndexToRender = config.itemsCount - 1 + (config.hasMore ? 1 : 0),
            renderedItems = itemsRenderer.getRenderedItems(),
            lastRenderedItem = renderedItems[renderedItems.length - 1],
            minScrollerOffset =  Number.MIN_SAFE_INTEGER,
            maxScrollerOffset = Number.MAX_SAFE_INTEGER,
            pullToRefreshHeight = config.pullToRefresh.height;

        if (renderedItems.length > 0 && renderedItems[0].getItemIndex() == 0) {
                minScrollerOffset = renderedItems[0].getItemOffset();
        }

        if (lastRenderedItem && lastRenderedItem.getItemIndex() == maxIndexToRender) {
                maxScrollerOffset =  lastRenderedItem.getItemOffset() + lastRenderedItem.getItemHeight() - parentElementHeight;
        }

        minScrollerOffset = refreshing ? minScrollerOffset - pullToRefreshHeight : minScrollerOffset;
        scroller.setDimensions(minScrollerOffset, maxScrollerOffset);
        if (align && minScrollerOffset > topOffset) {
            scroller.scrollTo(minScrollerOffset, true);
        }
    }

    function render() {
        var renderedItems;
        updateScroller();
        StyleHelpers.applyTransformStyle(scrollElement, 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + (-topOffset) + ', 0, 1)');
        needsRender = itemsRenderer.render(topOffset, scrollToIndex, topItemOffset, scroller.isPressed && scroller.isPressed());
        renderedItems = itemsRenderer.getRenderedItems();

        scrollToIndex = null;
        topItemOffset = null;


        renderedItems.forEach(function(item){
            listItemsHeights[item.getItemIndex()] = item.getItemHeight();
        });

        var avarageItemHeight = 0,
            itemsCount = 0;
        for (var i=0; i<listItemsHeights.length; ++i) {
            if (typeof listItemsHeights[i] == 'number') {

                avarageItemHeight += listItemsHeights[i];
                itemsCount++;
            }
        }
        avarageItemHeight = avarageItemHeight / itemsCount;
        scrollbarRenderer.render(avarageItemHeight * renderedItems[0].getItemIndex() + topOffset - renderedItems[0].getItemOffset(), avarageItemHeight * config.itemsCount);
    }

    function loadMoreCallback(){
        config.pageFetcher(config.itemsCount, function(pageItemsCount, hasMore){
            config.hasMore = hasMore;
            config.itemsCount += pageItemsCount;
            calculateHeights(config.itemsCount - pageItemsCount);
            scroller.scrollTo(itemsRenderer.getRenderedItems()[itemsRenderer.getRenderedItems().length - 1].getItemOffset() - parentElementHeight);
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
            var newHeight = config.itemHeightGetter && config.itemHeightGetter(index),
                startOffset = renderedListItem.getItemOffset();

            if (!newHeight) {
                newHeight = renderedListItem.getDomElement().clientHeight
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
