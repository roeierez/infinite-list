var InfiniteList = require('../../src/InfiniteList'),
    wrapInDiv = function(html){
            return '<div>' + html + '</div>';
        };

var list = new InfiniteList({

    itemHeightGetter: function(index){
        return index % 2 == 0 ? 40 : 60;
    },

    itemTypeGetter: function(index){
        return index % 2;
    },

    itemRenderer: function(index, domElement){
        var itemType = index % 2,
            header = 'Header of item #' + index,
            description = 'Description of item #' + index;

        if (!domElement.hasChildNodes()){  //we are constructing a new item
            var headerHTML = wrapInDiv(header),
                descriptionHTML = (itemType == 0) ? '' :  wrapInDiv(description);

            domElement.innerHTML = headerHTML + descriptionHTML;

        } else { //we are recycling
            domElement.childNodes[0].innerText = header;
            if (itemType == 1){
                domElement.childNodes[1].innerText = description;
            }
        }
    },

    initialPage: {
        itemsCount: 100
    }

}).attach(document.getElementById('main'));

