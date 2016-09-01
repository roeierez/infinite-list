var template = React.createClass({
    render: function(){
        return <article onClick={this.props.onClick}>
                <div className="title">
                    <div className="title-image">
                        <img src="../resources/bird.jpg" style={{width: '30px', height: '30px'}} className="img"/>
                    </div>
                    <div className="titleAndTime">
                        <a href="" className="title-text">
                            {this.props.header}
                        </a>
                        <span className="title-time">
                            {this.props.minutesAgo} minutes ago
                        </span>
                    </div>
                </div>
                <p className="message-body">
                    {this.props.tweetText}
                </p>
                <div>
                </div>
                <footer className="footer">
                    <a href="" className="feedback" style={{position: 'relative'}}>
                        <img src="../resources/like-gray.png" style={{width: '20px', height: '20px', position: 'absolute', top: '0px', left: '0px'}} />
                        <span className="myFeedback"></span>
                        Liked
                    </a>
                    <span className="feedback-summary">
                        1 like
                    </span>
                    <span className="feedback-summary">
                        2 comments
                    </span>
                </footer>
            </article>
    }
});

module.exports = template;