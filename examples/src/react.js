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
            callback(100, true);
        }, 2000);
    },

    initialPage: {
        hasMore: true,
        itemsCount: 100
    }

});
list.attach(document.getElementById('main'));

