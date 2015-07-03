var template = React.createClass({

    getInitialState: function(){
        return {imageLoaded: false};
    },

    render: function(){
        return  <article syle="height: 200px">
                    <div className="title">
                        {this.props.title}
                    </div>
                    <span style={{backgroundImage: "url('../resources/loading.gif')", backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '200px', height: '100px', display: this.state.imageLoaded ? 'none' : 'block'}}> </span>
                    <img style={{display: this.state.imageLoaded ? 'block' : 'none'}} onLoad={this.onImageLoaded} src={"https://farm" + this.props.farm + ".staticflickr.com/" + this.props.server + "/" + this.props.id + "_" + this.props.secret + "_n.jpg"} />
                </article>
    },
    componentWillReceiveProps: function(nextProps){
        if (this.props.id != nextProps.id) {
            this.setState({imageLoaded: false});
        }
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