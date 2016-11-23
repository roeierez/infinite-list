var InfiniteList = require('../../src/InfiniteList'),
    refreshing = false,
    list = new InfiniteList({
        itemHeightGetter: function () {
            return 50;
        },

        itemRenderer: function (index, domElement) {
            domElement.innerHTML = 'Item ' + index;
        },

        pullToRefresh: {
            height: 30,
            stayInView: true, //whether to stay in view like iOS style or move away like Android style.
            beginRefreshAtOffset: 50, //indicates when to switch to busy view, the default is "height" argument
            idleRenderer: function (domElement) {
                domElement.innerHTML = '<div style="border: 1px solid black; height: 1px; padding-top: 10px; text-align: center">Pull To Refresh</div>';
            },
            busyRenderer: function (domElement) {
                domElement.innerHTML = '<div style="height: 1px; padding-top: 10px; text-align: center">Refreshing...</div>';
            },
            onRefresh: function(endRefreshCallback){
                setTimeout(endRefreshCallback, 2000);
            }
        },

        initialPage: {
            itemsCount: 200
        }

    }).attach(document.getElementById('main'));