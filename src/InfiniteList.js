var VerticalScroller = require('./VerticalScroller'),
    NativeScroller = require('./NativeScroller'),
    ScrollbarRenderer = require('./ScrollbarRenderer'),
    AnimationFrameHelper = require('./AnimationFrameHelper'),
    ListItemsRenderer = require('./ListItemsRenderer'),
    StyleHelpers = require('./StyleHelpers'),
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

    for (var key in listConfig){
        if (listConfig.hasOwnProperty(key)){
            config[key] = listConfig[key];
        }
    }

    var initialPageConfig = listConfig.initialPage;
    if (initialPageConfig){
        config.itemsCount = initialPageConfig.itemsCount || 0;
        config.hasMore = initialPageConfig.hasMore || false;
        //numberOfRenderedItemsAhead = initialPageConfig.itemsCount || 1;
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
            listItemsHeights[i] = config.itemHeightGetter && config.itemHeightGetter(i) || listItemsHeights[i] || 200;
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
                    //numberOfRenderedItemsAhead = initialPage.itemsCount - config.itemsCount;
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

        if (initialPage && !config.useNativeScroller) {
            scrollToItem(topListItemIndex, false, differenceFromTop);
        }

        needsRender = true;
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

        renderedItems.forEach(function(item){
            listItemsHeights[item.getItemIndex()] = item.getItemHeight();
        });

        var topItem = renderedItems[0];
        if (topItem) {
            var topItemOffset = topItem.getItemOffset(),
                previousHeights = 0;
            for (var i=0; i < topItem.getItemIndex(); ++i) {
                previousHeights += listItemsHeights[i];
            }

            if (topItemOffset != previousHeights) {
                var scrollerDiff = topItemOffset - previousHeights;
                rootElement.scrollTop -= scrollerDiff;
                renderedItems.forEach(function(item){
                    item.setItemOffset(item.getItemOffset() - scrollerDiff);
                });
            }
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
                //numberOfRenderedItemsAhead = pageItemsCount;
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
