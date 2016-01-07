var InfiniteList = require('../../src/InfiniteList'),
    template = require('./flickrTemlpate.jsx');

var socialGetter = (function() {
    
    function injectScript(url) {
        var script = document.createElement('script');
        script.async = true;
        script.src = url;
        document.body.appendChild(script);
    }

    return {
        getFlickrPage: function(pageNum, callbackName) {
            injectScript('https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&per_page=100&api_key=3b7455f86113e9b01fc8ec08b413c40a&format=json&page=' + pageNum + '&jsoncallback=' + callbackName);
        }
    };
})();


var listCallback = null,
    aggregatedResults = [];

window.flickrCallback = function(results){
    aggregatedResults = aggregatedResults.concat(results.photos.photo);
    for (var i=0; i<aggregatedResults.length; ++i) {
        aggregatedResults[i].index = i;
    }
    listCallback(results.photos.photo.length, true);
}

var list = new InfiniteList({

    itemRenderer: function(index, domElement){
        aggregatedResults[index].onImageLoaded = function(){
            list.refreshItemHeight(index);
        };
        ReactDOM.render(React.createElement(template, aggregatedResults[index]), domElement);
    },

    loadMoreRenderer: function(index, domElement){
        domElement.innerHTML = '<div style="margin-left:14px;height:50px; background-image:url(../resources/loading.gif); background-repeat: no-repeat"><span style="margin-left: 40px">Loading...</span></div>';
    },

    pageFetcher: function(fromIndex, callback){
        listCallback = callback;
        socialGetter.getFlickrPage(fromIndex / 100 + 1, 'flickrCallback');

    },

    initialPage: {
        hasMore: true,
        itemsCount: 0
    }

});
list.attach(document.getElementById('main'));