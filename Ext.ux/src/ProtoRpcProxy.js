
Ext.ux.ProtoRpcProxy = Ext.extend(Ext.data.Proxy, {
    
    PRELOADING: 1,
    BACKGROUND: 2,
    SYNCING: 3,
    
    constructor: function(config) {
        config = config || {};
        Ext.ux.ProtoRpcProxy.superclass.constructor.call(this, config);
        this.path = '/rpc/';
        this.service = this.kind = config.kind;
        this.initialized = false;
        if(!this.kind)
            throw new Error("Require config param 'kind' not set on ProtoRpcProxy");
        this.cache = [];
        // queues
        this.pendingReads = [];
        this.pendingFetches = [];
        // batches
        if(!this.batchSize)
            this.batchSize = 250;
        if(!this.initalBatchSize)
            this.initalBatchSize = this.batchSize;
    },
    
    getStore: function(){
        if(this.store)
            return this.store;
        for(var storeName in app.stores){
            if(!app.stores.hasOwnProperty(storeName))
                continue;
            if(app.stores[storeName].model.modelName==this.model.modelName){
                this.store = app.stores[storeName];
                break;
            }
        }
        return this.store;
    },
    
    processFetch: function(requestData, callback, state){
        this.fetching = true;
        // set defaults
        Ext.applyIf(requestData,{limit: this.batchSize});
        // request
        Ext.Ajax.request({
            method: 'POST',
            url: this.path+this.service+'.fetch',
            success: function(response){
                var data = Ext.decode(response.responseText);
                var entities = data.entities || [];
                // add/update any new records that were returned            
                for (var i=0; i<entities.length; i++) {
                    var values = entities[i];
                    var record = new this.model(values, values.id);
                    this.updateOrAddRecord(record);
                }
                
                // if there are more results then queue up another fetch
                if(entities.length===requestData.limit){
                    Ext.apply(requestData, {cursor: data.cursor});
                    this.fetch(requestData, callback, state);
                    
                // if we might still have more records
                }else{
                    // if this is the main preloader then before finishing
                    if(state === this.PRELOADING){
                        // some reads might be queued by now so execute them
                        this.processPendingReads();
                        // we will store the preload cursor 
                        // so we can do fetchLatest()
                        this.updateCursor = data.cursor;
                        // mark proxy as upto date
                        this.initialized = true;
                    }else if(state == this.SYNCING){
                        this.updateCursor = data.cursor;
                    }
                    if(callback){
                        callback.call(this);
                    }
                } 
                
                // load the store (and events)
                // this.getStore().load();
                
                // process the request queue
                this.fetching = false;
                this.processNextFetch();
            },
            failure: function(){
                console.log(this.kind,"fetch failed");
                if(state == this.SYNCING){
                    // reinstate the last known updateCursor if we died
                    this.updateCursor = this.prevUpdateCursor;
                }
                this.fetching = false;
                this.processNextFetch();
            },
            scope: this,
            jsonData: requestData || {}
        });        
    },
    
    processNextFetch: function(){
        if(this.pendingFetches.length>0)
            this.processFetch.apply(this, this.pendingFetches.shift());
    },
    
    fetch: function(data, callback, state){
        this.pendingFetches.push(arguments);
        if(!this.fetching)
            this.processNextFetch();
    },
    
    put: function(data, callback){
        Ext.Ajax.request({
            method: 'POST',
            url: this.path+this.service+'.put',
            success: function(response){
                var data = Ext.decode(response.responseText);
                callback.call(this, data);
            },
            failure: function(){
                console.log(this.kind,"put failed");
            },
            scope: this,
            jsonData: data || {}
        });    
    },
    
    _delete: function(data, callback){
        Ext.Ajax.request({
            method: 'POST',
            url: this.path+this.service+'.delete',
            success: function(response){
                var data = Ext.decode(response.responseText);
                callback.call(this, data);
            },
            failure: function(){
                console.log(this.kind,"delete failed");
            },
            scope: this,
            jsonData: data || {}
        });    
    },
    
    fetchUpdated: function(callback){
        if(!this.updateCursor){
            console.log("cannot run "+this.kind+" update without updateCursor");
            return;
        }
        // start pulling in new items
        this.fetch({
            limit: this.initalBatchSize, 
            cursor: this.updateCursor
        }, callback, this.SYNCING);
        // to prevent two fetches being sent at the same time for the same
        // cursor we remove the updateCursor and let fetch() reassign it
        this.prevUpdateCursor = this.updateCursor;
        this.updateCursor = null;
    },
    
    startPreloading: function(){
        if(this.preload===false){
            this.processPendingReads();
        }else{ // do preload
            this.fetch({limit: this.initalBatchSize}, false, this.PRELOADING);
        }
    },
    
    updateOrAddRecord: function(record){
        var r = this.updateRecord(record);
        if(!r){
            this.cache.push(record);
            r = record;
        }
        return r;
    },
    
    updateRecord: function(record){
        for(var i=0; i<this.cache.length; i++){
            if(this.cache[i].getId()===record.getId()){
                this.cache[i].set( record.data );
                this.cache[i].dirty = false;
                return true;
            } 
        }
        return false;
    },
    
    getRecord: function(id){
        for(var i=0; i<this.cache.length; i++)
            if(this.cache[i].getId()==id)
                return this.cache[i];
    },
    
    sortRecords: function(){
        // ensure the records are sorted if we have have a sort function
        if(this.sort){
            this.cache.sort(this.sort);
        }        
    },
    
    getRecords: function(){
        return this.cache;
    },
    
    removeRecord: function(record){
        for(var i=0; i<this.cache.length; i++)
            if(this.cache[i].getId()==record.getId())
                this.cache.splice(i, 1);
    },

    completeReadOperation: function(operation, callback, scope){
        var records = this.getRecords();
        this.sortRecords();
        // add records to resultSet
        operation.resultSet = new Ext.data.ResultSet({
            records: records,
            total  : records.length,
            loaded : true
        });
        // complete the operation
        operation.setSuccessful();
        operation.setCompleted();
        // exec cb
        if (typeof callback == 'function') {
            callback.call(scope || this, operation);
        }
    },
    
    processRead: function(operation, callback, scope){
        // if the read has a filter attached then we 
        // ask to fetch the query and then process the op later
        if(this.preload===false && operation.filters && operation.filters.length>0){
            this.fetch({filters:operation.filters}, function(){
                this.completeReadOperation(operation, callback, scope);
            });
        // else we just use whatever data the proxy has in it's cache
        }else{
            this.completeReadOperation(operation, callback, scope);
        }
    },
    
    processPendingReads: function(){
        while(this.pendingReads.length>0)
            this.processRead.apply(this, this.pendingReads.shift());
    },
    
    create: function(operation, callback, scope) {
        console.log("create");
        this.update(operation, callback, scope);
    },
    
    // while preloading reads might be queued up
    // after initialization, reads are never in a queue
    // however fetches themselves might be queued
    read: function(operation, callback, scope) {
        if(!this.initialized){
            this.pendingReads.push(arguments);
            this.startPreloading();
        }else{
            this.processRead.apply(this, arguments);
        }
    },
    
    // converts record properties back to message values
    // ie. Date -> timestamp
    recordsToMessage: function(records){
        var data,entities = [];
        for(var i=0; i<records.length; i++){
            data = {};
            for(var k in records[i].data){
                var value = records[i].data[k];
                if(Ext.isDate(value)){
                    value = value.getTime()/1000;
                }
                data[k] = value;
            }
            entities.push(data);
        }
        return entities;
    },
    
    update: function(operation, callback, scope) {
        operation.setStarted();
        // post
        this.put({entities: this.recordsToMessage(operation.records)},function(data){
            // on success
            var ids = data.ids || [];
            
            if(ids.length != operation.records.length)
                console.log("expected "+operation.records.length+" ids to return from update but got "+ids.length);
                
            for (var i=0; i<operation.records.length; i++) {
                var record = operation.records[i];
                var id = ids[i];
                record.setId(id);
                record.dirty = false;
                record.phantom = false;
                this.updateOrAddRecord(record);
            }
            
            operation.resultSet = new Ext.data.ResultSet({
                records: operation.records,
                total  : operation.records.length
            });
            
            if (typeof callback == 'function') {
                callback.call(scope || this, operation);
            }
        });
    },
    
    destroy: function(operation, callback, scope) {
        var records = operation.records;
        operation.setStarted();
        var ids = [];
        for(var i=0; i<operation.records.length; i++)
            ids.push(operation.records[i].getId());
        // post
        this._delete({ids: ids},function(data){
            // on success
            for (var i=0; i<records.length; i++) {
                this.removeRecord(records[i]);
            }
            operation.setCompleted();
            operation.setSuccessful();
            if (typeof callback == 'function') {
                callback.call(scope || this, operation);
            }            
        });
    }
});

Ext.data.ProxyMgr.registerType('protorpc', Ext.ux.ProtoRpcProxy);