var Layer = require('./Layer'),
    LayersPool = require('./LayerPool'),
    StyleHelpers = require('./StyleHelpers'),
    AnimationFrameHelper = require('./AnimationFrameHelper'),
    MIN_FPS = 30,
    MAX_TIME_PER_FRAME = 1000 / MIN_FPS;

var ListItemsRenderer = function(attachedElement, scrollElement, listConfig, pageCallback, onRefreshStarted, onRefreshCompleted){

    var visibleHeight = attachedElement.clientHeight,
        itemWidth = attachedElement.clientWidth,
        renderedListItems = [],
        layersPool = new LayersPool(),
        pullToRefreshItem = null,
        refreshing = false,
        prepareToRefresh = false;

    listConfig.pullToRefresh && renderPullToRefresh();

    function render(topOffset, atIndex, offsetFromTop, isDragging){
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

        while (topRenderedItem && topRenderedItem.getItemOffset() > topOffset && topRenderedItem.getItemIndex() > 0){
            topRenderedItem = renderBefore(topRenderedItem);
            if (new Date().getTime() - startRenderTime > MAX_TIME_PER_FRAME) {
                return true;
            }
        }

        if (topRenderedItem.getItemIndex() == 0) {
            renderPullToRefresh(topOffset, topRenderedItem.getItemOffset(), isDragging);
            //pullToRefreshItem.setItemOffset(topRenderedItem.getItemOffset() - 50);
        }


        if (bottomRenderedItem.getItemIndex() < listConfig.itemsCount && bottomRenderedItem.getIdentifier() == "$LoadMore") {
            var bottomIndex = bottomRenderedItem.getItemIndex();
            layersPool.addLayer(renderedListItems.pop());
            if (renderedListItems.length > 0) {
                bottomRenderedItem = renderedListItems[renderedListItems.length - 1];
            } else {
                return render(topOffset, bottomIndex);
            }
        }
        while (bottomRenderedItem && bottomRenderedItem.getItemOffset() + bottomRenderedItem.getItemHeight() < topOffset + visibleHeight && bottomRenderedItem.getItemIndex() < listConfig.itemsCount) {
            bottomRenderedItem = renderAfter(bottomRenderedItem);
            if (new Date().getTime() - startRenderTime > MAX_TIME_PER_FRAME) {
                return true;
            }
        }

        while (renderedListItems.length > 1 && topRenderedItem && topRenderedItem.getItemOffset() + topRenderedItem.getItemHeight() < topOffset) {
            layersPool.addLayer(renderedListItems.shift());
            topRenderedItem = renderedListItems[0];
        }

        while (renderedListItems.length > 1 && bottomRenderedItem && bottomRenderedItem.getItemOffset() > topOffset + visibleHeight) {
            layersPool.addLayer(renderedListItems.pop());
            bottomRenderedItem = renderedListItems[renderedListItems.length - 1];
        }

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
            height = listConfig.itemHeightGetter && listConfig.itemHeightGetter(index),
            layer = borrowLayerForIndex(index, itemIdentifier, height);
        listConfig.itemRenderer(index, layer.getDomElement());
        return layer;
    }

    function renderPullToRefresh(topOffset, topItemStart, isDragging) {

        if (listConfig.pullToRefresh && listConfig.pullToRefresh.height) {
            var pullToRefresh = listConfig.pullToRefresh,
                height = pullToRefresh.height,
                idleRenderer = pullToRefresh.idleRenderer,
                busyRenderer = pullToRefresh.busyRenderer,
                beginRefreshAtOffset = pullToRefresh.beginRefreshAtOffset,
                onRefresh = pullToRefresh.onRefresh;

            if (topOffset < topItemStart) {
                if (!pullToRefreshItem) {
                    var pullToRefreshIdenitifier = "$pullToRefresh$";
                    pullToRefreshItem = borrowLayerForIndex(-1, pullToRefreshIdenitifier, height);
                    idleRenderer(pullToRefreshItem.getDomElement());
                }

                var diff = topItemStart - topOffset;

                if (diff >= (beginRefreshAtOffset || height) && (isDragging || prepareToRefresh) || refreshing) {
                    busyRenderer(pullToRefreshItem.getDomElement());
                } else {
                    idleRenderer(pullToRefreshItem.getDomElement());
                }

                if (!refreshing && diff >= (beginRefreshAtOffset || height) && !isDragging && prepareToRefresh) {
                    refreshing = true;
                    // busyRenderer(pullToRefreshItem.getDomElement());
                    onRefreshStarted(height);
                    onRefresh(function(){
                        refreshing = false;
                        //idleRenderer(pullToRefreshItem.getDomElement());
                        onRefreshCompleted();
                    });
                }

                prepareToRefresh = isDragging;
                pullToRefreshItem.setItemOffset(topItemStart - height);
            }
        }
    }

    // function startRefresh(height) {
    //     refreshing = true;
    //     if (listConfig.pullToRefresh.stayInView) {
    //         StyleHelpers.applyElementStyle(scrollElement, {
    //             top: height + "px",
    //             transition: "top 1s"
    //         });
    //     }
    // }
    //
    // function endRefresh() {
    //     refreshing = false;
    //     StyleHelpers.applyElementStyle(scrollElement, {
    //         transition: "top 1s",
    //         top: 0
    //     });
    // }

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
            layersPool.addLayer(layer, true)
        });
        renderedListItems = [];
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
