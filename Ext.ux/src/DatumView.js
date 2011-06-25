Ext.ux.FilteredDataView = Ext.extend(Ext.DataView,{
    itemSelector: '.item',
    emptyText: '<div class="empty">No Recent Events</div>',
    loadingText: 'Loading',
    
    // override this method to pick which
    // records are allowed
    collect: function(record){
        return true;
    },
    
    sort: false,
    
    collectData: function(records,idx){
        var rs = [];
        for (var i=0; i < records.length; i++) {
            if(this.collect(records[i]))
                rs.push( records[i].data );
        }
        if(this.sort)
            rs.sort(this.sort);
        return rs;
    },
    
    onUpdate: function(ds, record) {
        // standard onUpdate fails so just refresh everything for now
        this.refresh();
    },
    
    initComponent: function(){
        // better errors
        if(!this.store)
            throw new Error("No store attached to DataView");
        if(!this.tpl)
            throw new Error("No tpl assigned to DataView");
        // super
        Ext.ux.FilteredDataView.superclass.initComponent.apply(this, arguments);
    }
    
});

Ext.ux.DatumView = Ext.extend(Ext.ux.FilteredDataView,{
    // faster collectData for single
    collectData: function(records,idx){
        for (var i=0; i < records.length; i++) {
            if(records[i].internalId===this.internalId)
                return [records[i].data];
        }
        return [];
    },
    initComponent: function(){
        // check we have a record id
        // we use internalId so that unsynced records can be used
        if(this.record)
            this.internalId = this.record.internalId;
        if(!this.internalId)
            throw new Error('you must supply a record or internalId property');
        // super
        Ext.ux.DatumView.superclass.initComponent.apply(this, arguments);
    }
});