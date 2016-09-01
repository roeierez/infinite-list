var Layer = require('./Layer'),
    LayersPool = require('./LayerPool'),
    AnimationFrameHelper = require('./AnimationFrameHelper'),
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
