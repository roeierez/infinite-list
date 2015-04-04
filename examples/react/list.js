
var reactComponents = {
        0: React.createClass({displayName: "Header",
            render: function() {
                return React.createElement("div", null, this.props.header);
            }
        }),
        1: React.createClass({displayName: "HeaderAndDescription",
            render: function() {
                return React.createElement("div", null, React.createElement("div", null, this.props.header), React.createElement("div", null, this.props.description));
            }
        })
    };

var list = new InfiniteList({

    itemHeightGetter: function(index){
        return index % 2 == 0 ? 40 : 60;
    },

    itemTypeGetter: function(index){
        return index % 2;
    },

    itemRenderer: function(index, domElement){
        var itemType = index %2;
        var data = {
            header: 'Header of item #' + index,
            description: 'Description of item #' + index
        }
        React.render(React.createElement(reactComponents[itemType], data), domElement);

    },

    pageFetcher: function(fromIndex, callback){
        setTimeout(function(){
            callback(100, true);
        }, 2000);
    },

    hasMore: true,

    itemsCount: 100

}).attach(document.getElementById('main'));

