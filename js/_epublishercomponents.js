// -------------------------------------------------------------------------------------------------
// methode de base composant epublisher
// ybi: 14/02/2019
// -------------------------------------------------------------------------------------------------

var ePublisherComponent = function(gcl, options) {
	
	if (!ePublisherComponent.prototype.internalId) ePublisherComponent.prototype.internalId = 0;
	
	this._componentId = ++ePublisherComponent.prototype.internalId;
	this._events = { 'ready': [], 'finish': [], 'resize': [] };
	this._options = options;
	this._gClass = {};
	this._bClass = {};

	if (gcl) {
		
		//Petit mecanisme de surcharge de fonctions (partie 1)
		var overrideFunctions = ['componentFilesAreLoaded', 'create', 'destroy'];
		for(var i = 0; i < overrideFunctions.length; i++) {
			if ($.isFunction(gcl[overrideFunctions[i]])) this._gClass[overrideFunctions[i]] = gcl[overrideFunctions[i]];
		}
		
	}	
	
/*******************
	EVENTS DEB 
*******************/	

	this.addEvents = function(name, e) { 
		if (!this._events[name]) this._events[name] = [];
		var newEvent = { 'id': ++ePublisherComponent.prototype.internalId, 'e': e };
		this._events[name].push(newEvent);
		return newEvent;
	};
	
	this.raiseEvent = function(name, parameters) {
		if (!this._events[name] || this._events[name].length == 0) return;
		var eArguments = [this];
		if (typeof parameters != 'undefined') {
			if ($.isArray(parameters)) {
				eArguments = eArguments.concat(parameters);
			}
			else {
				eArguments.push(parameters);
			}
		}
		for(var i = 0; i < this._events[name].length; i++) {
			if ($.isFunction(this._events[name][i].e)) this._events[name][i].e.apply(this, eArguments);
		}
	};
	
	if (this._options && this._options.events) {
		for(var ev in this._options.events) this.addEvents(ev, this._options.events[ev]);
	}
	
/*******************
	EVENTS END 
*******************/	

/*******************
	LOAD FILES DEB 
*******************/	

	this.checkFilesLoaded = function(files) {
		
		var cpt = 0;
		for(var i = 0; i < files.length; i++) {
			var file = files[i];
			switch(file.is) {
				case "css":
					$find = $('head > link[rel="stylesheet"][href="' + file._internal.href + '"]').length;
					if ($find) { file._internal.istreated = true; cpt++; }
					break;
				default:
					if (file._internal.istreated) cpt++;
			}
			
		}
		
		if (cpt != files.length) {
			setTimeout($.proxy(function(fs) { 
				this.checkFilesLoaded(fs); 
			}, this, files), 100);
		}
		else {
			this.componentFilesAreLoaded();
		}
		
	};

	this.loadFiles = function(files) {
		
		var folderPath = this._options.component.location;
		
		for(var i = 0; i < files.length; i++) {
			
			var file = files[i];
			file['_internal'] = { 'istreated': false};
			
			switch(file.is) {
				
				case "css":
				
					var objCSS = { 'type': "text/css", 'src': null, 'media': null };
					if (file.type) objCSS.type = file.type;
					if (file.src) objCSS.src = file.src;
					if (file.media) objCSS.media = file.media;
						
					file['_internal']['href'] = folderPath + objCSS.src;
						
					//Add CSS
					//if (document.createStyleSheet){
						// var cssObj = document.createStyleSheet(objCSS.src);
						// //cssObj.type = objCSS.type;
						// if (objCSS.media) cssObj.media = objCSS.media;
						// cssObj.media = "screen";
					//}
					//else {
						var html = '<link rel="stylesheet" href="' + folderPath + objCSS.src + '" type="' + objCSS.type + '" ';
						if (objCSS.media) html += ' media="' + objCSS.media + '"';
						html += ' ></link>';
						$("head").append($(html));
					//}
			
					break;
					
				case "xml":
					
					$.ajax({
						type: "GET",
						url: folderPath + file.src,
						dataType: "xml"
					})
						.done($.proxy(function(f, e) {
							f._internal['content'] = e;
						}, this, file))
						.always($.proxy(function(f) {
							f._internal.istreated = true;
						}, this, file))
						.fail($.proxy(function(f) {
							this.raiseEvent("error", ['impossible to load file "' + f.src + '" (file not found)']);
						}, this, file));
				
					break;
					
				case "js":

				    file.src = ($.isArray(file.src)) ? file.src : [file.src];
				    this.loadSynchronousFiles(file, {"folderPath": folderPath, 'current': 0});
				
					// $.getScript(folderPath + file.src)
					// 	.done($.proxy(function(f) {
					// 		f._internal.istreated = true;
					// 	}, this, file))
					// 	.fail($.proxy(function(f) {
					// 		f._internal.istreated = true;
					// 		this.raiseEvent("error", ['impossible to load file "' + f.src + '" (file not found)']);
					// 	}, this, file));
				
					break;
					
				default:
					
					file._internal.istreated = true;
					this.raiseEvent("error", ['impossible to load file "' + f.src + '" (file is unknown)']);
					
			}
			
		}
		
		this.checkFilesLoaded(files);
		
	};

/*******************
	LOAD FILES END 
*******************/	

/*******************
	DEFAULT FUNCTIONS DEB 
*******************/

    this.loadSynchronousFiles = function(file, option){
        
        /* break condition */
        if(option.current >= file.src.length) {
          file._internal.istreated = true; return;
        }
        var syncfile = file.src[option.current];
        $.getScript(option.folderPath + syncfile)
                        .done($.proxy(function(f, o) {
                           o.current++;
                           this.loadSynchronousFiles(f, o);
                        }, this, file, option))
                        .fail($.proxy(function(f, o) {
                            o.current++;
                            this.loadSynchronousFiles(f, o);
                            this.raiseEvent("error", ['impossible to load file "' + syncfile + '" (file not found)']);
                        }, this, file, option));
    };	
	
	this.getParameter = function(paramname, defaultvalue) {
		return (this._options && this._options.parameters && this._options.parameters[paramname]) ? this._options.parameters[paramname] : defaultvalue;
	};
	
	this.getContainer = function() {
		return this._options.container;
	};
	
	this.setContainer = function($ctxt) {
		this._options.container = $ctxt;
	};
	
	this.isReady = function() {
		this.raiseEvent("ready", []);
	};
	
	this.getXMLContent = function(key) {
		
		if (this._options && this._options.loadfiles) {
			
			for(var i = 0; i < this._options.loadfiles.length; i++) {
				if (this._options.loadfiles[i].key == key) {
					if (this._options.loadfiles[i]._internal && this._options.loadfiles[i]._internal.content) return this._options.loadfiles[i]._internal.content;
				}
			}
			
		}
		
		return null;
		
	};
	
	this.getAudioFromModuleLocation = function(audio) {
		
		if (this._options && this._options.slideshow && this._options.slideshow._xmlReader) return this._options.slideshow._xmlReader._audioPath + audio;
		return null;
		
	};
	
	this.gotoNextSlide = function() {
		if (this._options && this._options.slideshow && this._options.slideshow) {
			this._options.slideshow.actionNext();
		}
	};
	
	this.getAvatar = function() {
		
		if (this._options && this._options.slideshow && this._options.slideshow.initializeScriptAvataObj) {
			return this._options.slideshow.initializeScriptAvataObj;
		}
		return null;
		
	};
	
	this.stopAvatar = function() {
		
		var oAvatar = this.getAvatar();
		if (oAvatar) oAvatar.stop();
		
	};
	
	this.hideAvatar = function() {
		var oAvatar = this.getAvatar();
		if (oAvatar) oAvatar.showAvatar(false);
	}
	
	this.playAvatar = function(txt) {
		
		var oAvatar = this.getAvatar();
		if (!oAvatar) return;
		
		oAvatar.writeText(txt);
		oAvatar.showAvatar(true);
		oAvatar.play();
		
	};
	
	this.getTxtAvatar = function(filename) {
		
		var oAvatar = this.getAvatar();
		if (!oAvatar) return;
		
		if (this._options && this._options.slideshow && this._options.slideshow._lastSlide) {
			var voices = $(this._options.slideshow._lastSlide.VoiceOver).find("span");
			var voice = null;
			for(var i = 0; i < voices.length; i++) {
				var voice = $(voices[i]);
				var attName = voice.attr("data-name");
				if (filename == attName) {
					return voice.text();
				}
			}
		}
		
	};
	
	this.componentFilesAreLoaded = function() { };
	this.create = function() { };
	this.destroy = function() { };
	this.resize = function() { };
	
	this.callFunction = function(name, parameters) {
		
		if (!name) return;
		
		var eArguments = [];
		if (typeof parameters != 'undefined') {
			if ($.isArray(parameters)) {
				eArguments = eArguments.concat(parameters);
			}
			else {
				eArguments.push(parameters);
			}
		}
		
		var continueCall = true;
		var baseFunction = $.isFunction(this._bClass[name]) ? this._bClass[name] : null;
		
		if (continueCall && $.isFunction(this._gClass[name])) {
			var retCall = this._gClass[name].apply($.extend({}, this, { 'basefunction': baseFunction } ), eArguments);
			continueCall = (retCall !== false);
		}
		
		if (continueCall && baseFunction) baseFunction.apply(this, eArguments);
		
	};
	
	//Petit mecanisme de surcharge de fonctions (partie 2)
	for(var fct in this._gClass) {
		if ($.isFunction(this[fct])) {
			this._bClass[fct] = this[fct];
			this[fct] = $.proxy(function(parameters) {  
				this.ref.callFunction(this.fct, parameters);
			}, { ref: this, fct: fct } );			
		}
	}
		
/*******************
	DEFAULT FUNCTIONS END 
*******************/	
	
	//Load files used by component
	if (this._options && this._options.loadfiles) {
		this.loadFiles(this._options.loadfiles);
	}
	else {
		this.componentFilesAreLoaded();
	}
	
};

/*******************
	LOAD COMPONENT
*******************/

ePublisherComponent.loadComponent = function(options) {
		
	if (window[options.component.object]) {
		var component = new window[options.component.object](options);
		if (options.events.componentloaded) options.events.componentloaded(component);
	}
	else {
		
		var folderRoot = (ePublisherComponent.componentsFolder) ? ePublisherComponent.componentsFolder : "";
		
		$.getScript(folderRoot + options.component.location + options.component.file)
			.done($.proxy(function(script, textStatus) {
				 var component = new window[this.component.object](this);
				 if (this.events.componentloaded) this.events.componentloaded(component);
			}, options))
			.fail($.proxy(function( jqxhr, settings, exception ) {
				if (this.noalert !== true) alert("Impossible to load component file " + this.component.location + this.component.file + " (" + jqxhr.status + ":" + exception + ")");
				if (this.events.error) this.events.error("loadcomponent", [jqxhr, settings, exception]);
			}, options))
			
	}		
	
};

/*******************
	FUNCTIONNALITIES DEB 
*******************/	

ePublisherComponent.replaceAll = function(str, find, replace) {
	return str.replace(new RegExp(find, 'g'), replace);
};
	
ePublisherComponent.controlFields = function($selector, options) {
		
	var dataControl = {
		'getTotal': function($item, options) {
					
			var $parent = (options && options['parent']) ? options['parent'] : $item.closest("." + $this.attr("data-parent"));
			var $items = (options && options['items']) ? options && options['items'] : $parent.find('[data-group="' + gpName + '"]');
				
			var info = { 'total': 0 };
			$items.each($.proxy(function(index, item) {
					
				var $this = $(item);
				var value = $this.attr("data-value");
				if ($.isNumeric(value)) this.total += parseFloat(value);
					
			}, info));				
				
			return info.total;
				
		},
		'updateItems': function($items, options) {
				
			$items.each($.proxy(function(index, item) {
					
				var $this = $(item);
						
				$this.removeClass("check-ok check-ko");
				switch($this.attr("data-check")) {
						case "equalto100":
							$this.addClass((this.total != 100) ? "check-ko" : "check-ok");
							break;
				}
					
			}, options));
				
		},
		'checkItem': function($item) {

			var $parent = $item.closest("." + $item.attr("data-parent"));
			var $items = $parent.find('[data-group="' + $item.attr("data-group") + '"]');
			var data = { 'total': this.getTotal($item, { 'parent': $parent, 'items': $items } ) };
			this.updateItems($items, data);
				
		}
	};
		
	$selector.data("controlFields", dataControl);
		
	if (!options || (options && !options.notCheck)) {
		
		$selector.each($.proxy(function(index, item) {
			
			var $this = $(item);
			var gpName = $this.attr("data-group");
			
			if (gpName && !this.alreadyCheck[gpName]) {
				
				var $parent = $this.closest("." + $this.attr("data-parent"));
				var $items = $parent.find('[data-group="' + gpName + '"]');
				var fcts = $this.data('controlFields');
				
				var data = { 'total': fcts.getTotal($this, { 'parent': $parent, 'items': $items } )  };
				fcts.updateItems($items, data);
				
				this.alreadyCheck[gpName] = true;
			}
			
		}, { 'alreadyCheck': {} } ));
		
	}
		
	return $selector.off("focus change blur").on("focus", function() {
		
		// //console.log("focus");
		
		var $this = $(this);
		var currentValue = $this.attr("data-value");
		$this.val(currentValue).select();
		
	}).on("blur", function(e, p) {

		// //console.log("blur");
		
		var $this = $(this);
		var currentValue = $this.attr("data-value");
		var dataIs = $this.attr("data-is");
		
		if (currentValue == "" || currentValue == undefined) { $this.val(""); return; }
		if (dataIs != "num" && dataIs != "pct") { $this.val(currentValue); return; }
		
		if ($this.attr("data-rounddata") == "true") { currentValue = parseInt(currentValue); $this.attr("data-value", currentValue); }
		
		if ($this.attr("data-round") == "true") currentValue = Math.round(currentValue);
		
		var formatString = $this.attr("data-format");
		var formatValue = currentValue;
		if (formatString) formatValue = ePublisherComponent.format(formatString, formatValue);
		
		if (dataIs == "pct" && formatValue != "") formatValue += "%";
		
		$this.val(formatValue);
	
		if (p && p.check) {
			var fcts = $this.data("controlFields");
			fcts.checkItem($this);
		}
	
	}).on("change", function() {
		
		// //console.log("change");
		
		var $this = $(this);
		var dataIs = $this.attr("data-is");
		var dataVal = $this.val();
		
		if (dataIs == "num" || dataIs == "pct") {
			dataVal = ePublisherComponent.replaceAll(dataVal, '%', '');
			dataVal = ePublisherComponent.replaceAll(dataVal, ' ', '');
		}
	
		if ((dataIs == "num" || dataIs == "pct") && dataVal != "" && !$.isNumeric(dataVal)) {
			
			// RO_Core.displayModal({
				// size: "20%",
				// title: 'Warning',
				// body: "'" + $this.val() + "' is not numeric",
				// save: {	'title': 'Ok' },
				// close: { 'hide': true }
			// });
			
			$this.val($this.attr("data-value"));
			return;
			
		}
		
		if ($this.attr("data-abs") == "true") dataVal = Math.abs(dataVal);
		
		$this.attr("data-value", dataVal);
		
		//Check
		if ($this.attr("data-group")) {
			var fcts = $this.data("controlFields");
			fcts.checkItem($this);
		}		
			
		$this.trigger("ro-change", dataVal);
		
		var ua = window.navigator.userAgent;
		if ((ua.indexOf('MSIE ') > 0) || (ua.indexOf('Trident/') > 0) || (ua.indexOf('Edge/') > 0)) {
			//console.log("call blur");
			$this.trigger("blur"); //Pb IE
		}
		
	});
	
};

ePublisherComponent.format = function( m, v){
	if (!m || isNaN(+v)) {
		return v; //return as it is.
	}
	//convert any string to number according to formation sign.
	var v = m.charAt(0) == '-'? -v: +v;
	var isNegative = v<0? v= -v: 0; //process only abs(), and turn on flag.
   
	//search for separator for grp & decimal, anything not digit, not +/- sign, not #.
	var result = m.match(/[^\d\-\+#]/g);
	var Decimal = (result && result[result.length-1]) || '.'; //treat the right most symbol as decimal
	var Group = (result && result[1] && result[0]) || ',';  //treat the left most symbol as group separator
   
	//split the decimal for the format string if any.
	var m = m.split( Decimal);
	//Fix the decimal first, toFixed will auto fill trailing zero.
	v = v.toFixed( m[1] && m[1].length);
	v = +(v) + ''; //convert number to string to trim off *all* trailing decimal zero(es)

	//fill back any trailing zero according to format
	var pos_trail_zero = m[1] && m[1].lastIndexOf('0'); //look for last zero in format
	var part = v.split('.');
	//integer will get !part[1]
	if (!part[1] || part[1] && part[1].length <= pos_trail_zero) {
		v = (+v).toFixed( pos_trail_zero+1);
	}
	var szSep = m[0].split( Group); //look for separator
	m[0] = szSep.join(''); //join back without separator for counting the pos of any leading 0.

	var pos_lead_zero = m[0] && m[0].indexOf('0');
	if (pos_lead_zero > -1 ) {
		while (part[0].length < (m[0].length - pos_lead_zero)) {
			part[0] = '0' + part[0];
		}
	}
	else if (+part[0] == 0){
		part[0] = '';
	}
   
	v = v.split('.');
	v[0] = part[0];
   
	//process the first group separator from decimal (.) only, the rest ignore.
	//get the length of the last slice of split result.
	var pos_separator = ( szSep[1] && szSep[ szSep.length-1].length);
	if (pos_separator) {
		var integer = v[0];
		var str = '';
		var offset = integer.length % pos_separator;
		for (var i=0, l=integer.length; i<l; i++) {
		   
			str += integer.charAt(i); //ie6 only support charAt for sz.
			//-pos_separator so that won't trail separator on full length
			if (!((i-offset+1)%pos_separator) && i<l-pos_separator ) {
				str += Group;
			}
		}
		v[0] = str;
	}

	v[1] = (m[1] && v[1])? Decimal+v[1] : "";
	return (isNegative?'-':'') + v[0] + v[1]; //put back any negation and combine integer and fraction.
};
