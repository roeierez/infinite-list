var TouchScroller = require('./TouchScroller'),
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
        accumulatedRowHeights = [],
        topOffset = 0,
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
        scroller = new TouchScroller(
            parentElement,
            function (left, top) {
                topOffset = top || 0;
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
        accumulatedRowHeights = [0];
        for (var i = 1; i <= config.itemsCount || 0; ++i) {
            var currentRowHeight = config.itemHeightGetter ? config.itemHeightGetter(i - 1) : DEFAULT_ITEM_HEIGHT;
            accumulatedRowHeights[i] = accumulatedRowHeights[i - 1] + currentRowHeight;
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

    function updateScrollerDimentions(parentElement){

        scroller.setDimensions(
            parentElement.clientWidth,
            parentElement.clientHeight,
            parentElement.clientWidth,
            getListHeight()
        );
    }

    function refresh(){
        StyleHelpers.applyElementStyle(rootElement, {
            height: parentElement.clientHeight + 'px',
            width: parentElement.clientWidth + 'px'
        });
        itemsRenderer.refresh();
        calculateHeights();
        updateScrollerDimentions(parentElement);
        scrollbarRenderer.refresh();
        needsRender = true;
    }

    function getListHeight(){
        return accumulatedRowHeights[accumulatedRowHeights.length - 1] + (!config.hasMore ? 0 : DEFAULT_ITEM_HEIGHT);
    }

    function render() {
        StyleHelpers.applyTransformStyle(scrollElement, 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0' + ',' + (-topOffset) + ', 0, 1)');
        scrollbarRenderer.render(topOffset, getListHeight());
        needsRender = itemsRenderer.render(topOffset, accumulatedRowHeights);
    }

    function loadMoreCallback(){
        config.pageFetcher(config.itemsCount, function(pageItemsCount, hasMore){
            config.hasMore = hasMore;
            config.itemsCount += pageItemsCount;
            refresh();
        });
    }

    function scrollToItem(index, animate) {
        scroller.scrollTo(0, accumulatedRowHeights[index], animate);
    }

    function itemHeightChangedAtIndex(index){
        var renderedItems = itemsRenderer.getRenderedItems(),
            firstItem = renderedItems.length > 0 && renderedItems[0],
            newHeight = config.itemHeightGetter(index),
            oldHeight = accumulatedRowHeights[index + 1] - accumulatedRowHeights[index],
            delta = newHeight -  oldHeight;

        for (var i=index + 1; i<accumulatedRowHeights.length; ++i) {
            accumulatedRowHeights[i] += delta;
        }
        updateScrollerDimentions(parentElement);

        needsRender = true;
        if (firstItem && index <= firstItem.getItemIndex() ) {
            scroller.changeScrollPosition(topOffset + delta);
        }
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