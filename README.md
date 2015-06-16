# InfiniteList

<p>See <a href="http://roeierez.github.io/infinite-list/examples/react/index.html" target="_blank">Live demo</a> from your mobile device.</p>

A 60fps infinite scrollable list for mobile devices.
There are some implementation of infinite scrolling out there.
The best of them renders to the DOM only what the user sees on screen at a give time and use GPU acceleration for translating items.
These techniques are used in this implementation too, but in order to achieve smooth scrolling in a list with complex items with complex DOM, or when the user scrolls fast even on old devices they are not enough.

In addition this list implements the following:
1. Recycling of Dom elements in a similar way that iOS and Android does at UITableView and RecyclerView.
2. Detect when the system is busy or the frame rate frequency is about to get lower and skip unnecessary work to enable smooth scrolling
3. Enable the user to use whatever rendering technique he likes. This gives the ability to use React, for example, to render recycled items and benefit high performance rendering of list items.

## Quick Start

```bash
var parentElement = ...

var infiniteList = new InfiniteList(
  {
    initialPage: {
      itemsCount: 100000
    },
    itemRenderer: function(domElement, index){
      domElement.innerHTML = "Item " + index;
    },
    itemHeightGetter: function(index){
      return 50;
    }
  }
).attach(parentElement)
```

The first argument to the itemRenderer is a domElement. The first time this element is rendered it is an empty DIV.
Later on when this item becomes invisible because of scrolling action, for example, the DIV is not destroyed but cached and recycled for later use.
The next time the item of this type is rendered the domElement might be a DIV with data of other item. This enable the user to update only the DOM elements that are changed instead of recreating the entire HTML content.

## Installation
infinite-list uses a Universal Module Definition so you can use it with both CommonJS and RequireJS.

### CommonJS
```
require('infinite-list')
```

### RequireJS
```
define(['[path to list project]/dist/InfiniteList.js'], function(list){
  //your code goes here
});
```

### In the Browser
If you need it as a standalone script that is referenced from your html file then just include dist/InfiniteList.js and you have it on the global scope. 

### In NPM
npm install infinite-list

### bower
bower install infinite-list

## Examples
to build the exapmles:
```
  npm update
  cd examples
  webpack
```
and you have the example files under "build" directory.

## API

### constructor (config)

Create an InfinteList. 
config has the following properties:

#### initialPage
the initial page configuration, has two properties:

    1. itemsCount [Number] - The number of items in the list.
    2. hasMore [Boolean] - True if we have more items to load (paging)

#### Function itemRenderer(domElement, index) 
The renderer method to invoke when an item needs to be rendered. This method should populate the domElement with the HTML markup.

#### Function loadMoreRenderer(domElement, index)
The renderer method to invoke a new page is about to be fetched and loadMore component should be rendered. This method should populate the domElement with the HTML markup.

#### Function itemHeightGetter(index)
Returns the height of an item by index

#### Function itemTypeGetter(index) 
Returns the type of an item by its index. This type is used as the key for recycling elements which means that items with the same type might share the same domElement (if they are not visible together at the same time).

#### Function pageFetcher(fromIndex, callback)
This method will be invoked when the list is scrolled to the end and 'hasMore' value is true.
The list will render "Loading...' component and wait for the call back to return.
The user should feed the callback with two parameters:
* pageItemsCount - the number of items loaded in this page
* hasMore - Are there more items to be loaded or this is the last page of the list.

### scrollToItem(index, animate)

A function that receive the index of item and scroll the list to that item position with/without animation

### refresh()

A function that tells the list to render again the items that are visible to the user.
This is usually used when the user has changed the data of the list and wants to refresh the UI.

## Roadmap

* Support Auto-detect height of list items. This means that passing 'itemHeightGetter' will be optional and the list will detect the height after the items is rendered. It requires a bit refactoring and changing the scroller but I expect it to be in a couple of weeks from now.
