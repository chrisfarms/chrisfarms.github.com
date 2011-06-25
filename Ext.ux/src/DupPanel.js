
Ext.ux.DupPanelItem = Ext.extend(Ext.Panel,{ // internal use only
    layout: 'hbox',
    bodyPadding: 0,
    
    copyThis: function(){
        this.up().addDup(this.items.get(0));
    },
    
    removeThis: function(){
        this.up().removeDup(this);       
    },
    
    buttonConfig: {
        xtype: 'button',
        ui: 'plain',
        // width:50,
        iconMask: true
    },
    
    initComponent:function(){
        this.items = [
            {flex:1, bodyPadding:0, items: this.itemConfig},
            Ext.apply({iconCls:'add_black', handler:this.copyThis, scope:this},this.buttonConfig),
            Ext.apply({iconCls:'minus_black1', handler:this.removeThis, scope:this},this.buttonConfig)
        ];
        Ext.ux.DupPanelItem.superclass.initComponent.apply(this,arguments);
    }
});

Ext.ux.DupPanel = Ext.extend(Ext.Panel,{
    bodyPadding: 0,
    itemHeight: 200, // the layout can't work out the height so set it manually
    dupItemContainer: Ext.ux.DupPanelItem,
    
    addDup: function(panel){
        var newPanel = this.dupItem();
        this.add(newPanel);
        this.fixLayout();
        return newPanel;
    },
    
    removeDup: function(panel){
        // always leave one item
        if(this.items.length==1)
            return;
        this.remove(panel);
        this.fixLayout();
    },
    
    fixLayout: function(){
        this.setHeight(this.items.length*this.itemHeight);
        this.doLayout();
    },
    
    dupItem: function(){
        return new this.dupItemContainer({
            itemConfig: this.itemConfig, 
            height: this.itemHeight
        });
    },
    
    initComponent: function(){
        this.height = this.itemHeight;
        this.itemConfig = Ext.apply({},this.items);
        this.items = [this.dupItem()];
        Ext.ux.DupPanel.superclass.initComponent.apply(this,arguments);
    }
});


