(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["listExample"] = factory();
	else
		root["listExample"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	
	var template = __webpack_require__(2),
	    listData = [],
	    ITEMS_COUNT = 10000;

	for (var i=0; i<ITEMS_COUNT; ++i){
	    listData.push({
	        header: 'Tweet number ' + (i + 1),
	        minutesAgo: i % 20 + 1,
	        tweetText: 'In computer displays, filmmaking, television production, and other kinetic displays, scrolling is sliding text, images or video across a monitor or display, vertically or horizontally. "Scrolling", as such, does not change the layout of the text or pictures, but moves (pans or tilts) the user\'s view across what is apparently a larger image that is not wholly seen'
	    });
	}


	var list = new InfiniteList({

	    itemHeightGetter: function(index){
	        return 350;
	    },

	    itemRenderer: function(index, domElement){
	        React.render(React.createElement(template, listData[index]), domElement);

	    },

	    pageFetcher: function(fromIndex, callback){
	        if (fromIndex == ITEMS_COUNT){
	            callback(0, false);
	            return;
	        }

	        setTimeout(function(){
	            callback(100, true);
	        }, 2000);
	    },

	    hasMore: true,

	    itemsCount: 100

	}).attach(document.getElementById('main'));



/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var template = React.createClass({displayName: "template",
	    render: function(){
	        return React.createElement("article", null, 
	                React.createElement("div", {className: "title"}, 
	                    React.createElement("div", {className: "title-image"}, 
	                        React.createElement("img", {src: "resources/bird.jpg", className: "img"})
	                    ), 
	                    React.createElement("div", {className: "titleAndTime"}, 
	                        React.createElement("a", {href: "", className: "title-text"}, 
	                            this.props.header
	                        ), 
	                        React.createElement("span", {className: "title-time"}, 
	                            this.props.minutesAgo, " minutes ago"
	                        )
	                    )
	                ), 
	                React.createElement("p", {className: "message-body"}, 
	                    this.props.tweetText
	                ), 
	                React.createElement("div", null
	                ), 
	                React.createElement("footer", {className: "footer"}, 
	                    React.createElement("a", {href: "", className: "feedback", style: {position: 'relative'}}, 
	                        React.createElement("img", {src: "resources/like-gray.png", style: {width: '20px', height: '20px', position: 'absolute', top: '0px', left: '0px'}}), 
	                        React.createElement("span", {className: "myFeedback"}), 
	                        "Liked"
	                    ), 
	                    React.createElement("span", {className: "feedback-summary"}, 
	                        "1 like"
	                    ), 
	                    React.createElement("span", {className: "feedback-summary"}, 
	                        "2 comments"
	                    )
	                )
	            )
	    }
	});

	module.exports = template;

/***/ }
/******/ ])
});
;