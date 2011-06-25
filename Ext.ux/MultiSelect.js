/*
    Author       : Mitchell Simoens
    Site         : http://simoens.org/Sencha-Projects/demos/
    Contact Info : mitchellsimoens@gmail.com
    Purpose      : Create more customizable Select field
    
    License      : GPL v3 (http://www.gnu.org/licenses/gpl.html)
    Warranty     : none
    Price        : free
    Version      : 1.0b
    Date         : 01/09/2011
*/

Ext.ns("Ext.form.ux.touch");

Ext.form.ux.touch.MultiSelect = Ext.extend(Ext.form.Select, {
    columns: 2,
    selectedItemCls: "x-multiselect-item-selected",
    itemWidth: 200,
    itemType: "list",
    multiSelect: true,
    delimiter: ",",

    getDataView: function() {
        var config = this.getItemConfig() || {};
        
        Ext.applyIf(config, {
            xtype: "dataview",
            store: this.store,
            itemId: "list",
            scroll: false,
            simpleSelect: this.multiSelect,
            itemSelector: "div.x-multiselect-item",
            tpl: new Ext.XTemplate(
                '<div class="x-multiselect-wrap" style="-webkit-column-count: ' + this.columns + ';">',
                    '<tpl for=".">',
                        '<div class="x-multiselect-item">{' + this.displayField + '}</div>',
                    '</tpl>',
                '</div>'
            )
        });
        
        return config;
    },

    getList: function() {
        var config = this.itemConfig || {};
        
        Ext.applyIf(config, {
            xtype: "list",
            store: this.store,
            itemId: "list",
            scroll: false,
            simpleSelect: this.multiSelect,
            itemTpl : [
                '<span class="x-list-label">{' + this.displayField + '}</span>',
                '<span class="x-list-selected"></span>'
            ]
        });
        
        return config;
    },

    getItemPanel: function() {
        if (!this.itemPanel) {
            var item;
            switch (this.itemType) {
                case "dataview" :
                    item = this.getDataView();
                    break;
                case "list" :
                    item = this.getList();
                    break;
            }

            if (typeof item === "undefined") {
                throw "Valid options for itemType - dataview, list, picker";
            }

            item.listeners = {
                scope: this,
                selectionchange: this.onListSelectionChange
            };

            this.itemPanel = new Ext.Panel({
                floating         : true,
                stopMaskTapEvent : false,
                hideOnMaskTap    : true,
                width            : this.itemWidth,
                cls              : "x-select-overlay",
                scroll           : "vertical",
                items            : item,
                listeners        : {
                    scope : this,
                    hide  : this.destroyItemPanel
                }
            });
        }

        return this.itemPanel;
    },
    
    destroyItemPanel: function() {
        this.itemPanel.destroy();
        delete this.itemPanel;
    },

    showComponent: function() {
        var itemType = this.itemType;
        if (itemType === "picker") {
            this.getPicker().show();
        } else {
            var itemPanel = this.getItemPanel();

            itemPanel.showBy(this.el, "fade", false);
        }
        this.isActive = true;
    },

    onListSelectionChange: function(sm, recs) {
        var numSelected = recs.length;

        if (numSelected > 0) {
            var values = [];
            for (var i = 0; i < numSelected; i++) {
                var rec = recs[i];
                values.push(rec.get(this.valueField));
            }
            this.setValue(this.returnValue(values));
            this.fireEvent("selectionchange", this, recs);
        } else {
            this.setValue("");
        }
        if (!this.multiSelect) {
            var itemPanel = this.getItemPanel();
            itemPanel.hide();
        }
    },
    
    // either an Array or csv depending on this.returnType
    returnValue: function(values) {
        return this.returnType=="array" ?
            values : values.join(this.delimiter);
    },

    setValue: function(value) {
        var idx = 0,
            hiddenField = this.hiddenField,
            text = [],
            rec,
            store = this.store;
        var values = value;
        if (value.length > 0 || typeof value === "number") {
            switch(typeof value){
                case "string": values = value.split(this.delimiter); break;
                case "number": values = [value]; break;
                default: values = value; break;
            }

            var valuesLen = values.length;
            for (var i = 0; i < valuesLen; i++) {
                idx = store.findExact(this.valueField, values[i]);
                if (idx < 0) {
                    idx = store.find(this.valueField, values[i]);
                }
                if (idx >= 0) {
                    rec = store.getAt(idx);
                    text.push(rec.get(this.displayField));
                }
            }
        }
        this.value = values;
        if(this.fieldEl)
            this.fieldEl.dom.value = hiddenField ?
                this.value :
                text.join(this.delimiter);
        this.fireEvent("change", this, this.getValue());
    },

    destroy: function() {
        Ext.form.ux.touch.MultiSelect.superclass.destroy.apply(this, arguments);
        Ext.destroy(this.itemPanel);
    }
});

Ext.reg("multiselectfield", Ext.form.ux.touch.MultiSelect);