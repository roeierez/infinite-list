var InfiniteList = require('../../src/InfiniteList'),
    template = require('./flickrTemlpate.jsx');

var socialGetter = (function() {
    /* just a utility to do the script injection */
    function injectScript(url) {
        var script = document.createElement('script');
        script.async = true;
        script.src = url;
        document.body.appendChild(script);
    }

    return {
        getFacebookCount: function(url, callbackName) {
            injectScript('https://graph.facebook.com/?id=' + url + '&callback=' + callbackName);
        },
        getFlickrPage: function(pageNum, callbackName) {
            injectScript('https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&per_page=100&api_key=3b7455f86113e9b01fc8ec08b413c40a&format=json&page=' + pageNum + '&jsoncallback=' + callbackName);
        }
    };
})();


var listCallback = null,
    aggregatedResults = [];

window.flickrCallback = function(results){
    aggregatedResults = aggregatedResults.concat(results.photos.photo);
    listCallback(results.photos.photo.length, true);
}
var list = new InfiniteList({

    itemRenderer: function(index, domElement){
        aggregatedResults[index].onImageLoaded = function(){
            list.refreshItemHeight(index);
        };
        var el = React.render(React.createElement(template, aggregatedResults[index]), domElement);
        //  heights[index] = el.getDOMNode().clientHeight;
        // list.itemHeightChangedAtIndex(index);
    },

    pageFetcher: function(fromIndex, callback){
        listCallback = callback;
        socialGetter.getFlickrPage(fromIndex / 100 + 1, 'flickrCallback')
    },

    initialPage: {
        hasMore: true,
        itemsCount: 0
    }

});
list.attach(document.getElementById('main'));