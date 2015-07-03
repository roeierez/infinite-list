var Layer = require('./Layer'),
    LayersPool = require('./layerPool'),
    AnimationFrameHelper = require('./AnimationFrameHelper'),
    MIN_FPS = 30,
    MAX_TIME_PER_FRAME = 1000 / MIN_FPS;

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

        while (topRenderedItem && topRenderedItem.getItemOffset() > topOffset && topRenderedItem.getItemIndex() > 0){
            topRenderedItem = renderBefore(topRenderedItem);
            if (new Date().getTime() - startRenderTime > MAX_TIME_PER_FRAME) {
                return true;
            }
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
