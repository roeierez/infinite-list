var InfiniteList = require('../../src/InfiniteList'),
    template = require('./template.jsx'),
    listData = [],
    ITEMS_COUNT = 10000;

for (var i=0; i<ITEMS_COUNT; ++i){
    listData.push({
        header: 'Tweet number ' + (i + 1),
        minutesAgo: i % 20 + 1,
        tweetText: 'In computer displays, filmmaking, television production, and other kinetic displays, scrolling is sliding text, images or video across a monitor or display, vertically or horizontally. "Scrolling", as such, does not change the layout of the text or pictures, but moves (pans or tilts) the user\'s view across what is apparently a larger image that is not wholly seen'
    });
}

var pageNum = 0,
    heights = {};

var list = new InfiniteList({

    itemHeightGetter: function(index){
        return (heights[index]) || 300;
       // return 300;
    },

    itemRenderer: function(index, domElement){
        var el = React.render(React.createElement(template, listData[index]), domElement);
      //  heights[index] = el.getDOMNode().clientHeight;
       // list.itemHeightChangedAtIndex(index);
    },

    pageFetcher: function(fromIndex, callback){
        if (fromIndex == ITEMS_COUNT){
            callback(0, false);
            return;
        }

        setTimeout(function(){
            callback(10, true);
        }, 2000);
    },

    initialPage: {
        hasMore: true,
        itemsCount: 10
    }

});
list.attach(document.getElementById('main'));
//setTimeout(function(){
//    heights[1] = 500;
//    list.refreshItemHeight(1);
//    //list.scrollToItem(4);
//    //setTimeout(function(){
//    //    var pos = list.getPosition();
//    //    list.scrollTo(pos - 309 * 2 );
//    //}, 2000);
//    //list.refresh();
//},3000);

