# InfiniteList

A 60fps infinite scrollable list for mobile devices.
There are some implementation of infinite scrolling out there.
The best of them renders only what the user sees on the DOM and use GPU accelration for translating items.
This implementation uses these techniques too, but sometimes, for example when the list items are complicated or when the user scrolls realy fast, or event when the device is old and slow these techniques are not enough for 60fps.
In addition this list impements the following:
1. Recycling of Dom elements in a similar way that iOS and Android doesat UITableView and RecyclingView.
2. Detect when the system is busy or the frame rate frequency is about to get lower and skip unnecessary work to enable smooth scrolling
3. Enable the user to use whatever rendering technique he likes. This gives the ability to use React, for example, to render recycled items and benefit high performance rendering of list items.

## Quick Start

```bash
var rootNode = ...

var infiniteList = new harmonie.InfiniteList(
  {
    domElement: rootNode,
    itemsCount: 100000,
    itemRenderer: function(domElement, index){
      domElement.innerHTML = "Item " + index;
    },
    itemHeightGetter: function(index){
      return 50;
    }
  }
)
```

The itemRenderer gets a domElement as paramter. The first time this element is rendered it is an empty DIV.
When this item becomes invisible because of scrolling the DIV is not destroyed but cached and recycled for later use.
The next time the item of this type is rendered the domElement might be a DIV with data of other item. This enable the user to update only the DOM elements that are changed instead of recreating the entire HTML content.

## Installation

### In the Browser
The relevant script files are infinite-list.js and TouchScroller.js

### In NPM
```bash
npm install infinite-list
```
### bower
```bash
bower install infinite-list
```

## API

### constructor (config)

Create an InfinteList. 
config has the following properties:

#### domElement [Node]
The dom element where to attach the list.

#### itemsCount [Number]
The number of items in the list

#### Function itemRenderer(domElement, index) 
The renderer method to invoke when an item needs to be rendered. This method needs to populate the domElement with the rendered HTML content.

#### Function itemHeightGetter(index)
This method returns the height of an item by index

#### Function itemIdentifierGetter(index) 
This method that returns the identifier of an item by its index. This identifier is used as the key for recycling elements which means that items with the same identifiers might share the same domElement (if they are not visible together at the same time).

#### Function Bool pageLoader(fromIndex, callback)
This method will be invoked when the list is scrolled to the end.
If the method returns false, nothing happens. If it returns true then the list will render "Load More...' component and wait for the call back to return.
The parameter to the callback should be the number of items returned.

### scrollToOffset(offset)

A function that receive the offset to scroll and scroll the list to that position

### scrollToItemAtIndex(index)

A function that receive the index of item and scroll the list to that item position

### setItemsCount(number)

Set the number of items.

### refresh()

A function that tells the list to render again the items that are visible to the user.
This is usually used when the user has changed the data of the list and wants to refresh the UI.
