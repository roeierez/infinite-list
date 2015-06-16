var Layer = require('./Layer'),
    LayersPool = require('./layerPool'),
    AnimationFrameHelper = require('./AnimationFrameHelper'),
    MIN_FPS = 20,
    DEFAULT_ITEM_HEIGHT = 40;

var ListItemsRenderer = function(attachedElement, scrollElement, listConfig, pageCallback){

    var visibleHeight = attachedElement.clientHeight,
        itemWidth = attachedElement.clientWidth,
        renderedListItems = [],
        itemsNeedRerender = [],
        layersPool = new LayersPool();

    function render(topOffset, accumulatedRowHeights){
        var topVisibleIndex = getFirstVisibleItemAtHeight(accumulatedRowHeights, topOffset),
            bottomVisibleIndex = getFirstVisibleItemAtHeight(accumulatedRowHeights, topOffset + visibleHeight);

        if (!listConfig.hasMore){
            bottomVisibleIndex = Math.min(bottomVisibleIndex, listConfig.itemsCount - 1);
        }

        //fix offset if needed
        for (var i=0; i<renderedListItems.length; ++i){
            if (renderedListItems[i].getItemOffset() != accumulatedRowHeights[renderedListItems[i].getItemIndex()]) {
                renderedListItems[i].setItemOffset(accumulatedRowHeights[renderedListItems[i].getItemIndex()]);
            }
        }

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

        var systemBusyRenderer = function(index, domElement){
                domElement.innerHTML = "Loading...";
            },
            itemRendered = false,
            renderListItem = function(listItem){
                var renderBusy =  isBusy();
                var renderer = !renderBusy ? listConfig.itemRenderer : systemBusyRenderer;
                renderer(listItem.getItemIndex(), listItem.getDomElement());
                if (renderBusy){
                    itemsNeedRerender[listItem.getItemIndex()] = listItem;
                }
            }

        //fill the gaps on top
        for (var i = topVisibleIndex; i < renderedStart; ++i) {
            renderListItem(pushLayerAtIndex(topItems, i, accumulatedRowHeights[i]));
            itemRendered = true;
        }
        renderedListItems = topItems.concat(renderedListItems);

        //fill the gaps on bottom
        for (var i = renderedListItems[renderedListItems.length - 1].getItemIndex() + 1; i <= Math.min(listConfig.itemsCount - 1, bottomVisibleIndex); ++i) {
            renderListItem(pushLayerAtIndex(renderedListItems, i, accumulatedRowHeights[i]));
            itemRendered = true;
        }

        var indicesForRerender = Object.keys(itemsNeedRerender);
        if (!itemRendered && !isBusy()){
            if (indicesForRerender.length > 0){
                var indexToRender = indicesForRerender.shift();
                listConfig.itemRenderer(itemsNeedRerender[indexToRender].getItemIndex(), itemsNeedRerender[indexToRender].getDomElement());
                delete itemsNeedRerender[indexToRender];
            }
        }

        if (bottomVisibleIndex > listConfig.itemsCount - 1){
            renderLoadMore(accumulatedRowHeights);
        }
        return (indicesForRerender.length > 0);
    }

    /*
     Borrow a layer from the LayersPool and attach it to a certain item at index.
     */
    function pushLayerAtIndex(listItems, index, offset, identifier, height) {
        var layerIdentifier = identifier || (listConfig.itemTypeGetter ? listConfig.itemTypeGetter(index) : '');
        var layer = layersPool.borrowLayerWithIdentifier(layerIdentifier);
        if (layer == null) {
            layer = new Layer(scrollElement);
        }
        //index, topOffset, renderer, width, height, itemIdentifier
        var itemHeight = height || listConfig.itemHeightGetter && listConfig.itemHeightGetter(index);
        layer.attach(index, offset, itemWidth - 9, itemHeight, layerIdentifier);
        listItems.push(layer);
        return layer;
    }

    function renderLoadMore(accumulatedRowHeights){
        if (renderedListItems[renderedListItems.length - 1].getIdentifier() != '$LoadMore') {
            var loadMoreLayer = pushLayerAtIndex(renderedListItems, listConfig.itemsCount, accumulatedRowHeights[listConfig.itemsCount], '$LoadMore', -1);
            listConfig.loadMoreRenderer(listConfig.itemsCount, loadMoreLayer.getDomElement());
            pageCallback();
        }
    }

    function getFirstVisibleItemAtHeight(accumulatedRowHeights, top) {
        var i = 0;

        while (i < listConfig.itemsCount && accumulatedRowHeights[i + 1] < top) {
            i++;
        }
        return i;
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
