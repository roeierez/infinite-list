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