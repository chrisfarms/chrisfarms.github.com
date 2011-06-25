// dupform items ... for creating complex sub-form items
Ext.ux.DupFormItem = Ext.extend(Ext.ux.DupPanelItem,{ // internal use only
    getFields: function(){
        return Ext.form.FormPanel.prototype.getFields.apply(this, arguments);
    },
    getValues: function(){
        return Ext.form.FormPanel.prototype.getValues.apply(this, arguments);
    },
    setValues: function(){
        Ext.form.FormPanel.prototype.setValues.apply(this, arguments);
    }
});

Ext.ux.DupFormField = Ext.extend(Ext.ux.DupPanel, {
    isContainer: false, // trick Ext.form.FormPanel into treating this as a single Field
    isField: true,
    dupItemContainer: Ext.ux.DupFormItem,
        
    getName: function(){
        return this.name || this.id || '';
    },
    
    // returns [{field:value}]
    getValue: function(){
        var values = [];
        this.items.each(function(item){
            values.push(item.getValues());
        });
        return values;
    },

    // setValue([{field: value}])
    setValue: function(values){
        this.value = values;
        // clear any items
        this.removeAll();
        // add a dupitem for each value
        for (var i=0; i < values.length; i++) {
            this.addDup().setValues(values[i]);
        }
    }
});