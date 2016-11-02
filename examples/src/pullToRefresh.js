var InfiniteList = require('../../src/InfiniteList'),
    list = new InfiniteList({
        itemHeightGetter: function () {
            return 50;
        },

        itemRenderer: function (index, domElement) {
            domElement.innerHTML = 'Item ' + index;
        },

        pullToRefresh: {
            height: 50,
            renderer: function (domElement, offsetFromTop) {
                if (offsetFromTop < 60) {
                    //still not loading
                    domElement.innerHTML = '<div style="height: 1px; padding-top: 20px; text-align: center">Pull To Refresh</div>';
                } else {
                    //now loading
                    domElement.innerHTML = '<div style="height: 1px; padding-top: 20px; text-align: center">Refreshing...</div>';
                }
            }
        },

        initialPage: {
            itemsCount: 200
        }

    }).attach(document.getElementById('main'));