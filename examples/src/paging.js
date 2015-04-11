var InfiniteList = require('../../src/InfiniteList'),
    list = new InfiniteList({

        itemHeightGetter: function(){
            return 50;
        },

        itemRenderer: function(index, domElement){
            domElement.innerHTML = 'Item ' + index;
        },

        loadMoreRenderer: function(index, domElement){
            domElement.innerHTML = 'I am loading from #' + index;
        },

        pageFetcher: function(fromIndex, pageCallback){
            setTimeout(function(){ //simulate network fetch
                pageCallback(10, true);
            }, 2000)
        },

        initialPage: {
            hasMore: true,
            itemsCount: 10
        }

    }).attach(document.getElementById('main'));
