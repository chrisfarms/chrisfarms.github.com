Ext.ux.FilteredList = Ext.extend(Ext.ux.BufferedList, {
    maxItemHeight: 50,
    blockScrollSelect: true,
    batchSize: 100,
    singleSelect: true,
    allowDeselect: false,
    ui: 'light',
    fullscreen: true,
    _filters: {},
    filterData: function(records, startIndex){
        var rs = records;
        for(var name in this._filters){
            if(this._filters.hasOwnProperty(name)){
                console.log('running filter', name);
                rs = this._filters[name](rs);
            }
        }
        return rs;
    },
    listeners: {
        'itemtap': function(list, idx, node){
            var r = list.getRecord(node);
            this.lastSelected = r;
            Ext.defer(function(){ // make tap feel more responsive
                this.up().fireEvent("itemtap", r);
            },0, this);
        }
    },
    afterRefresh: function(){
        if(this.lastSelected)
            this.selectRecord(this.lastSelected);
    },
    selectRecord: function(record){
        // if item is off the page scroll it if we can
        // defered so as not to confuse the selection model (i think)
        Ext.defer(function(){
            ridx = this.indexOfRecord(record);
            if(!ridx || this.getVisibleItems(true).indexOf(ridx)<0)
                this.scrollIntoView(record);
            this.getSelectionModel().deselectAll();
            this.getSelectionModel().select(record, false, false);
            this.lastSelected = record;
        },0,this);
    },
    selectFirst: function(){
        if(!this.records)
            return;
        var r = this.records[0];
        if(r)
            this.fireEvent('itemtap',this, 0, this.getNode(0));
        else{
            this.getSelectionModel().deselectAll();
            this.up().up().clear(true); // clear main viewport
        }
    },
    setFilter: function(name,fn){
        this._filters[name] = fn;
    },
    removeFilter: function(name){
        delete this._filters[name];
    },
    removeAllFilters: function(){
        this._filters = {};
    }
});