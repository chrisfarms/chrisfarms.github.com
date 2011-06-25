//
// adds missing features to Models/Records
// by dynamically attaching things to the regular Ext.data.Model class
// during creation. records ARE NOT instances of some Ext.ux.Model this is just
// a helper function that patches the normal models
//
// usage is the same as passing to Ext.regModel
//
Ext.ux.modelFns = {};

// get all the names of the fields set with 'search:true'
// set refresh to true to prevent it using the memorized version
Ext.ux.modelFns.searchFields = function(refresh){
    if(refresh || !this._searchFields){
        this._searchFields = [];
        for (var i=0; i < this.fields.length; i++) {
            if(this.fields[i].search)
                this._searchFields.push( this.fields[i].name );
        }
    }
    return this._searchFields;
};

// mirror of regModel but extends models via Ext.ux.modelFns
Ext.ux.regModel = function(name, config){
    var fields = config.fields;
    // convert extended types to standard types
    // config.fields = [];
    // for (var i=0; i < fields.length; i++) {
    //     fields[i]
    // };
    model = Ext.regModel(name, config);
    // keep the fields collection for introspection later
    model.fields = fields;
    // extend
    for(var k in Ext.ux.modelFns)
        model[k] = Ext.ux.modelFns[k];
    // assign to main collection and return
    app.models[name] = model;
    return app.models[name];
};

// a key is a unique cross-model string to identify this record
// analogous to the AppEngine entity key but smaller
Ext.data.Model.prototype.key = function(){
    if(this.phantom)
        return '';
    return this.store.model.modelName+'#'+this.getId();
};

Ext.ux.ArrayField = Ext.extend(Ext.Panel, {
    
});


// add a record.formFields() function to generate a form based on schema
Ext.apply(Ext.data.Model.prototype,{
    
    storeForModel: function(name){
        return app.models[name].proxy.getStore();
    },
    
    stringInput: function(field){
        return {
            xtype: 'textfield'
        };
    },
    
    textInput: function(field){
        return {
            xtype: 'textareafield'
        };
    },
    
    intInput: function(field){
        return {
            xtype: 'numberfield',
            getValue: function(){
                var v = Ext.form.Number.superclass.getValue.apply(this,arguments);
                return parseInt(v,10);
            }
        };
    },
    
    autoInput: function(field){
        return {
            xtype: 'textfield'
        };
    },
    
    tokenInput: function(field){
        return {
            xtype: 'tokenfield'
        };
    },
    
    // returns a panel with one or more fieldsets inside it
    // each fieldset can be duplicated by clicking the plus icon
    subtypeInput: function(field){
        // just first fieldset - multifield sets won't work
        var fs = this.formFields({fields: field.fields, allowId:true})[0];
        fs.title = field.label || field.name;
        return new Ext.ux.DupFormField({
            isOwnFieldset: true,
            items: fs
        });
    },
    
    // needs "model" and "displayField" properties on scehma
    referenceListInput: function(field){
        return {
            xtype        : "multiselectfield",
            store        : this.storeForModel(field.model),
            displayField : field.displayField || "name",
            valueField   : "id",
            itemWidth    : 400,
            itemType     : "list",
            returnType   : "array"
        };
    },
    
    referenceInput: function(field){
        return {
            xtype: 'selectfield',
            store: this.storeForModel(field.model),
            displayField: field.displayField || "name",
            valueField: 'id'
        };        
    },
    
    selectInput: function(field){
        return {
            xtype: 'selectfield',
            options: field.options
        };
    },
    
    inputFor: function(field){
        var inputType,input;
        if(field.input){
            inputType = field.input+'Input';
        }else if(field.model){
            if(field.type=='auto')
                inputType = 'referenceListInput';
            else
                inputType = 'referenceInput';
        }else if(field.fields){
            inputType = 'subtypeInput';
        }else{
            if(field.options)
                inputType = 'selectInput';
            else
                inputType = field.type+'Input';
        }
        if(!this[inputType]){
            console.warn('There is no input type for '+inputType);
            return;
        }
        input = this[inputType](field);
        input.name = field.name;
        input.title = input.label = field.label || field.name;
        return input;
    },
    
    // returns a panel with one or more fieldsets of fields 
    // built based on this records schema
    //
    // to build a form from the schema, annotate fields with:
    // input: false           disables field
    // input: 'name'          uses nameInput function for input genertion
    // model: ModelObj        for reference properties
    // label: 'somestring'    label for the field otherwises uses name
    // group: 'somename'      named groups for seperating fields
    // 
    // if no input type specified it will try and guess based on type
    // 
    // pass group to only generate fields for that group
    // pass fields to override the fields to use
    formFields: function(opts){
        if(!opts)
            opts = {};
        var input,
            items = [],
            sets = {},
            setName,
            fields = opts.fields || this.store.model.fields,
            group = opts.group;
        for (var i=0; i < fields.length; i++) {
            if(group && fields[i].group!=group)
                continue;
            if(fields[i].input===false)
                continue;
            if(fields[i].name=="id" && !opts.allowId)
                continue;
            input = this.inputFor(fields[i]);
            if(!input)
              continue;
            // if input is marked as "noset"
            if(input.isOwnFieldset){
              setName = input.label || fields[i].name;
              sets[setName] = input;
            }
            // find fieldset to place this in
            else {
              setName = fields[i].set || 'default';
              if(!sets[setName])
                sets[setName] = {xtype:'fieldset', title:setName, items:[]};
              sets[setName].items.push( input );
            }
        }
        // return array of fieldsets
        for(var k in sets)
          items.push(sets[k]);
        return items;
    }
    
});