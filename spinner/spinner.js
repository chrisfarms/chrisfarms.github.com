 
/*
 * Plugin that renders a customisable activity indicator (spinner) using SVG or VML.
 * Ported by [chrisfarms at gmail] from NETEYE Activity Indicator 1.0.0 
 * Originaly written by Felix Gnass [fgnass at neteye dot de]
 *
 * Licensed under the MIT license
 * 
 */

/* 
 * usage:
 * spinner = new Spinner('elementId');
 * spinner.start();
 * spinner.remove();
 */

var Spinner = (function() {

	var Spinner = function(target,opts) {
		if(typeof target == 'string')
			this.target = document.getElementById(target);
		else
			this.target = target;
		if(!this.target)
			throw new Error("Required argument 'target' missing.");
		this.opts = {};
		for(var k in Spinner.defaults)
			this.opts[k] = Spinner.defaults[k];
		for(var k in opts)
			this.opts[k] = opts[k];
		// create the spinner html
		this.container = document.createElement('div');
		this.container.style.position = 'relative';
		this.container.className = this.opts.spinnerClass;
		this.render();
	};
	
	Spinner.defaults = {
		segments: 12,
		space: 3,
		length: 7,
		width: 4,
		speed: 1.2,
		align: 'center',
		valign: 'center',
		padding: 4,
		busyClass: 'busy',
		spinnerClass: 'spinner',
		color: '#555'
	};
	
	Spinner.prototype.start = function(){
		// append contianer to target
		this.target.appendChild(this.container);
		// start animation
		this.animate();
	}
	
	Spinner.prototype.remove = function(){
		this.inanimate();
		this.target.removeChild(this.container);
	}
	
	Spinner.prototype.getOpacity = function(i) {
		var steps = this.opts.steps || this.opts.segments-1;
		var end = this.opts.opacity !== undefined ? this.opts.opacity : 1/steps;
		return 1 - Math.min(i, steps) * (1 - end) / steps;
	};
	
	/**
	 * Default rendering strategy. If neither SVG nor VML is available, a div with class-name 'busy' 
	 * is inserted, that can be styled with CSS to display an animated gif as fallback.
	 */
	Spinner.prototype.render = function() {
		this.container.setAttribute('class', this.opts.busyClass);
	};
	
	/**
	 * The default animation strategy does nothing as we expect an animated gif as fallback.
	 */
	Spinner.prototype.animate = function() {
	};
	
	/**
	 * The default animation strategy does nothing as we expect an animated gif as fallback.
	 */
	Spinner.prototype.inanimate = function() {
		if(this.interval)
			clearInterval(this.interval);
	};
	
	/**
	 * Utility function to create elements in the SVG namespace.
	 */
	var svg = function(tag, attr) {
		var el = document.createElementNS("http://www.w3.org/2000/svg", tag || 'svg');
		if(attr)
			for(var k in attr)
				el.setAttributeNS(null, k, attr[k]);
		return el;
	}
	
	if (document.createElementNS && document.createElementNS( "http://www.w3.org/2000/svg", "svg").createSVGRect) {
	
		// =======================================================================================
		// SVG Rendering
		// =======================================================================================
		
		/**
		 * Rendering strategy that creates a SVG tree.
		 */
		Spinner.prototype.render = function() {
			var innerRadius = this.opts.width*2 + this.opts.space;
			var r = (innerRadius + this.opts.length + Math.ceil(this.opts.width / 2) + 1);
			
			var el = svg();
			el.style.width = (r*2);
			el.style.height = (r*2);
			
			var g = svg('g', {
				'stroke-width': this.opts.width, 
				'stroke-linecap': 'round', 
				'stroke': this.opts.color
			});
			var g2 = svg('g', {transform: 'translate('+ r +','+ r +')'})
			g2.appendChild(g);
			el.appendChild(g2)
			
			for (var i = 0; i < this.opts.segments; i++) {
				g.appendChild(svg('line', {
					x1: 0, 
					y1: innerRadius, 
					x2: 0, 
					y2: innerRadius + this.opts.length, 
					transform: 'rotate(' + (360 / this.opts.segments * i) + ', 0, 0)',
					opacity:this.getOpacity(i)
				}));
			}
			this.container.appendChild(el);
		};
				
		// Check if Webkit CSS animations are available, as they work much better on the iPad
		// than setTimeout() based animations.
		
		if (document.createElement('div').style.WebkitAnimationName !== undefined) {

			var animations = {};
		
			/**
			 * Animation strategy that uses dynamically created CSS animation rules.
			 */
			Spinner.prototype.animate = function(){
				var duration = Math.round(10 / this.opts.speed) / 10;
				var steps = this.opts.segments;
				if (!animations[steps]) {
					var name = 'spin' + steps;
					var rule = '@-webkit-keyframes '+ name +' {';
					for (var i=0; i < steps; i++) {
						var p1 = Math.round(100000 / steps * i) / 1000;
						var p2 = Math.round(100000 / steps * (i+1) - 1) / 1000;
						var value = '% { -webkit-transform:rotate(' + Math.round(360 / steps * i) + 'deg); }\n';
						rule += p1 + value + p2 + value; 
					}
					rule += '100% { -webkit-transform:rotate(100deg); }\n}';
					document.styleSheets[0].insertRule(rule);
					animations[steps] = name;
				}
				this.container.childNodes[0].style.webkitAnimation = animations[steps] + ' ' + duration +'s linear infinite';
			};
		
		
		} else {
		
			/**
			 * Animation strategy that transforms a SVG element using setInterval().
			 */
			Spinner.prototype.animate = function() {
				var duration = Math.round(10 / this.opts.speed) / 10;
				var steps = this.opts.segments;
				var rotation = 0;
				var g = this.container.childNodes[0].getElementsByTagName('g')[0].getElementsByTagName('g')[0];
				this.interval = setInterval(function() {
					g.setAttributeNS(null, 'transform', 'rotate(' + (++rotation % steps * (360 / steps)) + ')');
				}, duration * 1000 / steps);
			};
			
		}
		
	} else {
		
		// =======================================================================================
		// VML Rendering
		// =======================================================================================
		
		var createEl = function(tag,attrs){
			var el = document.createElement(tag);
			if(attrs)
				for(var k in attrs)
					el[k] = attrs[k];
			return el;
		}
		
		var s = createEl('shape');
		s.style.behavior = 'url(#default#VML)';
		document.getElementsByTagName('body')[0].appendChild(s);
			
		if (s.adj) {
		
			// VML support detected. Insert CSS rules for group, shape and stroke.
			var sheet = document.createStyleSheet();
			var cRules = ['group', 'shape', 'stroke'];
			for(var i=0; i<cRules.length; i++)
				sheet.addRule(cRules[i], "behavior:url(#default#VML);");
			
			/**
			 * Rendering strategy that creates a VML tree. 
			 */
			Spinner.prototype.render = function() {
				var d = this.opts;
				var innerRadius = d.width*2 + d.space;
				var r = (innerRadius + d.length + Math.ceil(d.width / 2) + 1);
				var s = r*2;
				var o = -Math.ceil(s/2);
				var el = createEl('group', {coordsize: s + ' ' + s, coordorigin: o + ' ' + o});
				el.style.left = el.style.top = o;
				el.style.width = el.style.height = s;
				for (var i = 0; i < d.segments; i++) {
					var c = createEl('shape', {
						path: 'm ' + innerRadius + ',0  l ' + (innerRadius + d.length) + ',0'
					})
					c.style.height = c.style.width = s;
					c.style.rotation = (360 / d.segments * i) + 'deg';
					c.appendChild(
						createEl('stroke', {color: d.color, weight: d.width + 'px', endcap: 'round', opacity: this.getOpacity(i)})
					);
					el.appendChild(c);
				}
				var g = createEl('group', {coordsize: s + ' ' + s});
				g.style.height = g.style.width = s;
				g.style.overflow = 'hidden';
				g.appendChild(el);
				this.container.appendChild(g);
			};
		
			/**
		     * Animation strategy that modifies the VML rotation property using setInterval().
		     */
			Spinner.prototype.animate = function() {
				var duration = Math.round(10 / this.opts.speed) / 10;
				var steps = this.opts.segments;
				var rotation = 0;
				var g = this.container.childNodes[0];
				this.interval = setInterval(function() {
					g.style.rotation = ++rotation % steps * (360 / steps);
				},  duration * 1000 / steps);
			};
		}
		document.body.removeChild(s);
	}

	return Spinner;
})();
