var list = new InfiniteList().setConfig({
    itemHeightGetter: function(){ return 50;},
    itemRenderer: function(index, domElement){
        domElement.innerHTML = 'Item ' + index;
    },
    rowsCount: 100
}).attach(document.getElementById('main'));
