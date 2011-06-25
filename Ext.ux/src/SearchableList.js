
Ext.ux.SearchToolbar = Ext.extend(Ext.Toolbar,{
    dock: 'top',
    layout: {pack: 'center'},
    ui: 'light',
    
    compileFilter: function(q){
        return function(records){
            if(!q)
                return records;
            if(records.length<1)
                return [];
            var index = records[0].store.getIndexFor(records);
            return index.query(q);
        };
    },
    
    setSearchFilter: function(q){
        // prevent double searching
        if(this.lastSearch===q)
            return;
        console.log('query',q);
        this.lastSearch = q;
        // update the list filter
        // search only looks at the fields specified as searchField
        // on the Model definition
        this.list.setFilter('search', this.compileFilter(q));
        // refresh the list
        this.list.refresh();
        this.list.scroller.scrollTo({x:0,y:0});
        // show record
        if(this.selectOnSearch!==false)
            this.list.selectFirst();
    },
    
    onSearch: function(){
        // "this" context is searchfield
        this.up().setSearchFilter(this.getValue());  
    },
    
    onAction: function(){
        // "this" context is searchfield
        this.up().onSearch.call(this);
    },
           
    initComponent: function(){
        if(!this.list){
            throw new Error("No list attached to SearchToolbar");
        }
        this.items = [];
        // self
        var self = this;
        // add search field
        this.searchField = new Ext.form.Search({
            placeHolder: 'Search',
            name: 'searchfield',
            listeners: {
                change: this.onSearch,
                keyup: this.onSearch,
                tap: this.onSearch
            },
            initEvents: function(){
                Ext.form.Search.superclass.initEvents.apply(this,arguments);
                if(this.fieldEl){
                    this.mon(this.fieldEl, {
                        search: self.onAction,
                        scope: this
                    });
                }
            }
        });
        this.items.push(this.searchField);
        // add cog menu item
        if(this.popup){            
            this.cog = {
                xtype: 'button',
                iconMask: true,
                iconCls: 'settings6',
                ui: 'plain',
                popup: this.popup,
                handler: function(){
                    if(this.popup)
                        this.popup.showBy(this.el,'fade');
                }
            };
            this.items.push(this.cog);
        }
        // super
        Ext.ux.SearchToolbar.superclass.initComponent.apply(this, arguments);
    }
});

//////////////////////////////////////////////////////////////////////////////////////

Ext.ux.SearchableList = Ext.extend(Ext.Panel,{
    dock: 'left',
    width: 300,
    grouped: false,
    indexBar: false,
    layout: 'fit',
    selectOnSearch: true,
    
    listeners: {
        'itemtap': function(record){ // just the default listener override it
            this.record = record;
            Ext.dispatch({
                controller: this.controller || this.tplName+"s",
                action: 'show',
                record: record
            });
        }
    },
    
    setSearch: function(q){
        this.searchbar.searchField.setValue(q);
        this.searchbar.setSearchFilter(q);
    },
    
    selectFirst: function(){
        this.list.selectFirst();
    },
    
    initComponent: function(){
        if(!this.tplName)
            this.tplName = this.store.model.modelName.toLowerCase();
        // the main list
        this.list = new Ext.ux.FilteredList({
            store: this.store,
            maxItemHeight: this.maxItemHeight || 35,
            ui: 'light',
            itemTpl: this.itemTpl || HTML(this.tplName+'-list-item'),
            grouped: this.grouped,
            indexBar: this.indexBar
        });
        // setup the cogMenu
        if(this.menuItems)
            this.cogMenu = new app.PopupMenu({
                data: this.menuItems,
                scope: this
            });
        // search and filter for list
        this.searchbar = new Ext.ux.SearchToolbar({
            list: this.list,
            cogMenu: this.cogMenu,
            selectOnSearch: this.selectOnSearch
        });
        // add list to main area
        this.items = [this.list];
        // add searchbar to docked items
        if(!this.dockedItems)
          this.dockedItems = [];
        this.dockedItems.push(this.searchbar);
        // super
        Ext.ux.SearchableList.superclass.initComponent.apply(this, arguments);
    }
});
