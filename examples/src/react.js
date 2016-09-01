var InfiniteList = require('../../src/InfiniteList'),
    template = require('./template.jsx'),
    listData = [],
    ITEMS_COUNT = 10000;

for (var i=0; i<ITEMS_COUNT; ++i){
    listData.push(createItem(i));
}

function createItem(i){
    var item =  {
        onClick: function(){
            if (i != 0) {
                listData[0].tweetText = "Test";
            }

            item.tweetText = (item.tweetText + item.tweetText + item.tweetText);
            list.refresh();
        },
        header: 'Tweet number ' + (i + 1),
        minutesAgo: i % 20 + 1,
        tweetText: 'In computer displays, filmmaking, television production, and other kinetic displays, scrolling is sliding text, images or video across a monitor or display, vertically or horizontally. "Scrolling", as such, does not change the layout of the text or pictures, but moves (pans or tilts) the user\'s view across what is apparently a larger image that is not wholly seen'
    }
    return item;
}

var pageNum = 0;

var list = new InfiniteList({

    itemRenderer: function(index, domElement){
        ReactDOM.render(React.createElement(template, listData[index]), domElement);
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

    useNativeScroller: true,

    recalculateItemHeights: true,

    initialPage: {
        hasMore: true,
        itemsCount: 10
    }

});
list.attach(document.getElementById('main'));
//
// var index = 5;
// setInterval(function(){
//     var tweetText = 'In computer displays, filmmaking, television production, and other kinetic displays, scrolling is sliding text, images or video across a monitor or display, vertically or horizontally. "Scrolling", as such, does not change the layout of the text or pictures, but moves (pans or tilts) the user\'s view across what is apparently a larger image that is not wholly seen';
//
//     listData[index++] = {
//         header: 'Tweet number ' + (i + 1),
//         minutesAgo: i % 20 + 1,
//         tweetText: tweetText + tweetText + tweetText + tweetText
//     };
//
//     list.refresh();
// }, 2000);

