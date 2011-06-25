Ext.ux.SplitPanel = Ext.extend(Ext.Panel,{
    iconCls: 'user_list',
    layout: 'card',
    
    clear: function(addEmpty){
        this.removeAll();
        if(this.viewCard){
            this.viewCard.destroy();            
            delete this.viewCard;
        }
        if(this.editCard){
            this.editCard.destroy();
            delete this.editCard;            
        }
        if(addEmpty){
            this.add(this.emptyCard);
            this.doLayout();
        }
    },
    
    switchToEdit: function(record, anim){
        if(this.editCard)
            this.remove(this.editCard);
        this.editCard = new this.editCardType({record:record});
        this.add(this.editCard);    
        this.editCard.load(record);
        this.setActiveItem(this.editCard, anim);
    },
    
    switchToView: function(record, anim){
        if(this.viewCard)
            this.remove(this.viewCard);
        this.viewCard = new this.viewCardType({record:record});
        this.add(this.viewCard);
        this.setActiveItem(this.viewCard, anim);
    },
    
    initComponent: function(){
        // init sub views
        if(!this.sidebar)
            throw new Error("You must supply a sidebar component for SplitPanel");
        // component to use for edit
        if(!this.editCardType)
            throw new Error("You must supply an editCardType for SplitPanel");
        if(!this.viewCardType)
            throw new Error("You must supply an viewCardType for SplitPanel");
        // type of model this split pane is for
        this.sidebar = new this.sidebar();
        this.modelName = this.sidebar.store.model.modelName;
        // guess title
        if(!this.title)
            this.title = this.modelName+'s';
        // dummy card to show before selction
        this.emptyCard = {html: 'Choose '+this.modelName, cls: 'empty'};
        // add sub views
        Ext.apply(this, {
            dockedItems: [this.sidebar],
            items: [this.emptyCard]
        });
        // super
        Ext.ux.SplitPanel.superclass.initComponent.apply(this, arguments);
    }
    
});
