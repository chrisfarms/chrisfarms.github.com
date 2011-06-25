// combines multiple forms into one 
Ext.ux.TabbedFormPanel = Ext.extend(Ext.TabPanel,{
    
    initComponent: function(){
        // build a form for each set of fields
        this.forms = [];
        for(var i=0; i<this.fields.length; i++){
            var formConfig = this.fields[i];
            formConfig.record = this.record;
            formConfig.scroll = true;
            formConfig.submitOnAction = false;
            this.forms.push(new Ext.form.FormPanel(formConfig));
        }
        // add sub views
        Ext.apply(this, {
            items: this.forms
        });
        // super
        Ext.ux.TabbedFormPanel.superclass.initComponent.apply(this, arguments);
        // start timer to fix layout
        this.fixLayout();
    },
    
    // call to set height to parent height
    fixLayout: function(){
        console.warn("trying to fix layout");
        Ext.defer(function(){
            var parent = this.up().up(); //ACOM specific
            if(!parent){
                this.fixLayout();
                return;
            }
            this.setHeight(parent.getHeight()-50); //ACOM specific
        },500,this);
    },
    
    load: function(record){
        for(var i=0; i<this.forms.length; i++){
            this.forms[i].load(record);
        }
    },
    
    getValues: function(){
        var values = {};
        for(var i=0; i<this.forms.length; i++){
            if(this.forms[i]===false)
                continue;
            var formValues = this.forms[i].getValues();
            for(var k in formValues){
                if(formValues.hasOwnProperty(k))
                    values[k] = formValues[k];
            }
        }
        return values;
    }
});