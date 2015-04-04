
var listData = [],
    wrapInDiv = function(html){
        return '<div>' + html + '</div>';
    };

for (var i=0; i<1000; ++i){
    var identifier = i % 2; //generating two differen item types

    if (identifier == 0){
        listData[i] = {height: 40, header: 'Header of item #' + i, identifier: identifier}
    } else {
        listData[i] = {height: 60, description: 'Text of item #' + i, header: 'Header of item #' + i, identifier: identifier}
    }
}

var list = new InfiniteList().setConfig({

    itemHeightGetter: function(index){
        return listData[index].height;
    },

    itemIdentifierGetter: function(index){
        return index % 2;
    },

    itemRenderer: function(index, domElement){
        var identifier = index %2;
        //we are constructing a new item
        if (!domElement.hasChildNodes()){
            var headerHTML = wrapInDiv(listData[index].header),
                descriptionHTML = (identifier == 0) ? '' :  wrapInDiv(listData[index].description);

            domElement.innerHTML = headerHTML + descriptionHTML;

        } else { //we are updating
            domElement.childNodes[0].innerText = listData[index].header;
            if (identifier == 1){
                domElement.childNodes[1].innerText = listData[index].description;
            }
        }
    },

    rowsCount: listData.length

}).attach(document.getElementById('main'));

