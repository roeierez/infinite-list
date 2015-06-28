var template = React.createClass({

    getInitialState: function(){
        return {imageLoaded: false};
    },

    render: function(){
        return  <article>
                    <div className="title">
                        {this.props.title}
                    </div>
                    <span style={{height: '100px', display: this.state.imageLoaded ? 'none' : 'block'}}> {"Loading..."} </span>
                    <img style={{width: '200px', height: '200px', display: this.state.imageLoaded ? 'block' : 'none'}} onLoad={this.onImageLoaded} src={"https://farm" + this.props.farm + ".staticflickr.com/" + this.props.server + "/" + this.props.id + "_" + this.props.secret + "_n.jpg"} />
                </article>
    },

    componentWillReceiveProps: function(){
        this.setState({imageLoaded: false});
    },

    onImageLoaded: function(){
        var me = this;
        this.setState({imageLoaded: true}, function(){
            if (me.props.onImageLoaded) {
                me.props.onImageLoaded();
            }
        });
    }
});

module.exports = template;

//https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg