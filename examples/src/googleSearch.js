var InfiniteList = require('../../src/InfiniteList'),
    searchComponent = React.createClass({displayName: "SearchResults",
        render: function() {
            return React.createElement("div", null,
                React.createElement("IMG", {src: this.props.url, style: {width: '50px', height: '50px', float: 'left'}}, null),
                React.createElement("div",{style: {marginLeft: '60px', overflow: 'ellipsis'}}, this.props.contentNoFormatting))
        }
    }),
    searchResults = [];

var list = new InfiniteList({

    itemHeightGetter: function(index){
        return 60;
    },

    itemRenderer: function(index, domElement){
        React.render(React.createElement(searchComponent, searchResults[index]), domElement);
    },

    pageFetcher: function(fromIndex, callback){
        googleSearchImage('icon', fromIndex, function(results){
            if (!results.responseData){
                callback([], false);
                return;
            }

            var newItems = results.responseData.results;
            searchResults = searchResults.concat(newItems);
            callback(newItems.length, true);
        });
    },

    initialPage: {
        hasMore: true,
        itemsCount: 0
    }

}).attach(document.getElementById('main'));


function googleSearchImage(imageStr, fromIndex, callback)
{
    var xmlhttp;
    if (window.XMLHttpRequest)
    {
        xmlhttp=new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            callback(JSON.parse(xmlhttp.responseText));
        }
    }
    xmlhttp.open("GET","https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=" + imageStr + "&rsz=8&imgsz=icon&start=" + fromIndex,true);
    xmlhttp.send();
}

