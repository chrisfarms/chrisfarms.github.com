
Ext.ux: Misc Sencha Touch Extensions
====================================

Anything that seems like it might be generically useful from my projects I'll add to this library. Not everything in here is created by me, some items are collated from others were I needed to slightly modify them.

I'll start documenting these items now, starting with TokenField.js

Ext.ux.TokenField
-----------------

TokenField is the basis for a more complicated AutoComplete component (which I shall add to this library shortly), it is useful when you are asking people to fill in a field that should be comma-seperated, or if there are discrete items that you want to list, like tags.

![example](http://dl.dropbox.com/u/22519236/Screenshots/0u.png)

See the demo here or checkout the example config below for options.

```javascript
{
    xtype: 'tokenfield',         // the TokenField xtype
    tokenSeperator: ',',         // [optional] a single character to use as the delimiter 
    name:'tags',                 // standard Field name
    label:'Tags',                // [optional] standard Field label
    returnType: 'string',        // [optional] choice of either 'string' or 'array' return-type default is 'array'
    value:'red,green,blue'       // [optional] initial value accepted as csv-string or Array
}
````


