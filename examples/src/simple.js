var InfiniteList = require('../../src/InfiniteList'),
    list = new InfiniteList({
        itemHeightGetter: function(){ return 50;},

        itemRenderer: function(index, domElement){
            domElement.innerHTML = 'Item ' + index;
        },

        initialPage: {
            itemsCount: 200
        }

    }).attach(document.getElementById('main'));
