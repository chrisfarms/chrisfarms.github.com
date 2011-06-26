Ext.ux.TokenField = Ext.extend(Ext.form.Text,  {
    
    // what this field returns. 
    // 'array' returns an array
    // 'string' returns values as a string seperated by <tokenSeperator> so a csv string by default
    returnType: 'array',
    
    // set this to split tokens on something other than comma
    tokenSeperator: ',',
    
    tokenTpl: [
        '<tpl for="tokens">',
            '<span class="ux-token" data-idx="{#}">',
                '{.}', 
                '<a href="#" class="ux-token-clear"></a>',
            '</span>',
        '</tpl>'
    ],
    
    KEY_BACK_SPACE: 8,
    KEY_ENTER: 13,

    // fetch the current value as an array
    getData: function(){
        return this.value || [];
    },
    
    // get each ux-token + the current value of ux-token-input 
    // return either array or csv based on this.returnType
    getValue: function(){
        var data = [],
            active = this.getInputValue();
        data = data.concat(this.getData());
        if(active)
            data.push(active);
        return this.returnType=='array' ? data : data.join(this.tokenSeperator);
    },
    
    setValue: function(values){
        if(typeof values == 'string')
            this.value = values.split(this.tokenSeperator);
        else if(Ext.isArray(values))
            this.value = values;
        else
            console.warn("TokenField only supports string or array values was given: ",values);
        this.updateTokenTpl();
    },
    
    removeToken: function(idx){
        var data = this.getData();
        if(idx===-1)
            idx = data.length-1;
        data.splice(idx,1);
        this.updateTokenTpl();
    },
    
    getInputValue: function(){
        if(this.fieldEl)
            return this.fieldEl.dom.value.trim();
    },
    
    appendToken: function(){        
        var token = this.getInputValue();
        if(token)
            this.getData().push(token.replace(/,$/,'').trim());
        this.updateTokenTpl();
    },
    
    clearInput: function(){
        this.fieldEl.dom.value = '';
    },
    
    updateTokenTpl: function(){
        if(this.fieldEl && this.el && this.el.dom)
            this.tokenTpl.overwrite(this.el.down('.ux-tokens'), {tokens:this.getData()});
    },
    
    // dynamically resize input width to fit word
    // well... try to anyway
    resizeInput: function(){
        if(!this.fieldEl)
            return;
        var w = this.fieldEl.dom.value.length*14;
        this.fieldEl.setStyle('width', (w<75 ? 75 : w)+'px');        
    },
    
    onChangeInput: function(input, e){
        if(!this.fieldEl)
            return;
        // trigger event for some keys
        var c = this.fieldEl.dom.value[this.fieldEl.dom.value.length-1];
        if(e.browserEvent.keyCode == this.KEY_BACK_SPACE){
            if(!this.fieldEl.dom.value){
                if(this.preventRemoveToken){
                    this.preventRemoveToken = false;
                }else{
                    this.removeToken(-1);
                }
            }
            return;
        }else if(e.browserEvent.keyCode == this.KEY_ENTER || c == this.tokenSeperator){
            this.appendToken();
            this.clearInput();
        }
        this.resizeInput();
        this.preventRemoveToken = true;
    },
    
    onFieldTap: function(e){
        e.preventDefault();
        if(!this.fieldEl)
            return;
        var idx,
            node = Ext.get(e.target);
        if((parent = node.up('.ux-token'))){
            node = parent;
        }
        if(node.hasCls('ux-token')){
            idx = node.getAttribute('data-idx');
            this.removeToken(parseInt(idx-1,10));
        }
        this.fieldEl.dom.focus();
    },
    
    initRenderData: function() {
        this.renderData = Ext.ux.TokenField.superclass.initRenderData.apply(this, arguments);
        this.renderData.tokens = this.getData();
        return this.renderData;
    },
    
    initComponent: function(){
        Ext.ux.TokenField.superclass.initComponent.apply(this,arguments);
        // init template
        this.renderTpl = [
            '<tpl if="label">',
                '<div class="x-form-label"><span>{label}</span></div>',
            '</tpl>',
            '<tpl if="fieldEl">',
                '<div class="x-form-field-container ux-token-field-container" style="background:#fff">',
                    '<span class="ux-tokens">'];
        this.renderTpl = this.renderTpl.concat(this.tokenTpl);
        this.renderTpl = this.renderTpl.concat('</span>',
                    '<input id="{inputId}" style="width:50px; display:inline-block;" type="text" name="{name}" class="{fieldCls} ux-token-input" autocorrect="false" autocapitalize="false", autocomplete="false">',
                    '<tpl if="useMask"><div class="x-field-mask"></div></tpl>', //remove?
                '</div>',
            '</tpl>');
        this.tokenTpl = new Ext.XTemplate(this.tokenTpl);
        // listen for keypresses
        this.on('keyup',this.onChangeInput);
        // 
        this.on('tap',this.onFieldTap, this, {element:"el"});
    }
});

Ext.reg('tokenfield', Ext.ux.TokenField);