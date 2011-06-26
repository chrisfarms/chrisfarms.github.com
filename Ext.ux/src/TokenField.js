Ext.ux.TokenField = Ext.extend(Ext.form.Text,  {
    
    // what this field returns. 
    // 'array' returns an array
    // 'string' returns values as a string seperated by <tokenSeperator> so a csv string by default
    returnType: 'array',
    
    // set this to split tokens on something other than comma
    tokenSeperator: ',',
    
    // set this to true if you want to make it easier to remove tokens by tapping anywhere
    // on the token bubble element
    largeTapArea: false,
    
    // the min size the input box can be
    minInputWidth: 60,
    
    tokenTpl: [
        '<tpl for="tokens">',
            '<a class="ux-token" data-idx="{#}">',
                '{.}', 
                '<span href="#" class="ux-token-clear"></span>',
            '</a>',
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
        return '';
    },
    
    // if multiple tokens are found in the input then they are split up
    // and each added
    appendToken: function(){        
        var token = this.getInputValue().replace(/,$/,'').trim();
        if(token){
            var tokens = token.split(this.tokenSeperator);
            for (var i=0; i < tokens.length; i++) {
                token = tokens[i].trim();
                if(token)
                    this.getData().push(token);
            }
        }
        this.updateTokenTpl();
    },
    
    clearInput: function(){
        this.fieldEl.dom.value = '';
    },
    
    updateTokenTpl: function(){
        if(this.fieldEl && this.el && this.el.dom){
            // shrink the input box 
            var curValue = this.fieldEl.dom.value;
            this.fieldEl.dom.value = '';
            this.fieldEl.setWidth( this.minInputWidth );
            // re-render
            this.tokenTpl.overwrite(this.el.down('.ux-tokens'), {tokens:this.getData()});
            // enlarge the input box and return it's value
            this.resizeInput();
            this.fieldEl.dom.value = curValue;
        }
    },
    
    // dynamically resize input width to fit remaining space
    // well... try to anyway
    resizeInput: function(){
        if(!this.fieldEl)
            return;
        var offsetLeft = this.fieldEl.getOffsetsTo(this.el.down('.ux-token-field-container'))[0];
        var w = this.el.down('.ux-token-field-container').getWidth() - offsetLeft -10;
        this.fieldEl.setWidth( w<this.minInputWidth ? this.minInputWidth : w);
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
        this.preventRemoveToken = true;
    },
    
    onFieldTap: function(e){
        e.preventDefault();
        if(!this.fieldEl)
            return;
        var idx,
            token,
            node = Ext.get(e.target);
        if(node.hasCls('ux-token-clear') && (parent = node.up('.ux-token')))
            token = parent;
        if(this.largeTapArea && node.hasCls('ux-token'))
            token = node;
        if(token){
            idx = token.getAttribute('data-idx');
            this.removeToken(parseInt(idx-1,10));            
        }
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
        this.on('singletap',this.onFieldTap, this, {element:"el"});
        this.on('afterRender',this.resizeInput, this);
    }
});

Ext.reg('tokenfield', Ext.ux.TokenField);