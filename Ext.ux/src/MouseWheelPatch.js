Ext.Component.prototype._originalScrollable = Ext.Component.prototype.setScrollable;
Ext.Component.prototype.setScrollable = function(config){
    var ret = this._originalScrollable.apply(this, arguments);
    if (config !== false) {
        this.addListener({
            el: {
                mousewheel: function(e) {
                    var s = this.scroller;
                    if( s ){
                        var delta = e.browserEvent.wheelDelta;
                        this.scroller.scrollBy({
                            x: 0,
                            y: delta
                        });
                        this.scroller.fireScrollEndEvent();
                    }
                },
                scope:this
            }
        });
    }
    return ret;
};