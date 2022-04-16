/** @license
*
* JQuery Actando Extended Functionnalities
* Ajout de quelques fonctions à JQuery
* ----------------------------------------------
* http://www.actando.com
*
* Copyright (c) 2013, IT Team. All rights reserved.
*
* 
*/

/***********
* Object Browser (cause $.browser doesn't exist anymore with Jquery 1.9)
************/
if (typeof $.browser === "undefined") {
		
	$.browser = {};
	$.browser.mozilla = /mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit/.test(navigator.userAgent.toLowerCase());
	$.browser.webkit = /webkit/.test(navigator.userAgent.toLowerCase());
	$.browser.opera = /opera/.test(navigator.userAgent.toLowerCase());
	$.browser.msie = /msie/.test(navigator.userAgent.toLowerCase());	

}

/***********
* getTagName()
************/
if (typeof $.fn.getTagName === "function") {
	alert("function getTagName already exists");
}
else {	
	$.fn.actTagName = function () { return this.get(0).tagName.toLowerCase(); };
}

/***********
* getAttributes()
************/
if (typeof $.fn.getAttributes === "function") {
	alert("function getAttributes already exists");
}
else {

	$.fn.actAttributes = function () { 
			
		var map = {};
		var attributes = this.get(0).attributes
		var aLength = attributes.length;

		for (var a = 0; a < aLength; a++) {
			map[attributes[a].name.toLowerCase()] = attributes[a].value;
		}
		
		return map;
	};

}
/***********
* getClasses()
************/
if (typeof $.fn.getClasses === "function") {
	alert("function getClasses already exists");
}
else {

	$.fn.getClasses = function () {

		var classes = [];
		var attributes = this.get(0).attributes;
		var aLength = attributes.length;
		
		for (var a = 0; a < aLength; a++) {
			if (attributes[a].name.toLowerCase() == "class") {
				
				var lstClasses = attributes[a].value.split(" ");
				
				for(var indClass = 0; indClass < lstClasses.length; indClass++)
				{
					lstClasses[indClass] = $.trim(lstClasses[indClass]);
					if (lstClasses[indClass] != "") classes.push(lstClasses[indClass]);
				}
				
				break;
			}
		}
		
		return classes;
		
	};

}

/***********
* loadCSSAsync
************/
if (typeof $.loadCSSAsync === "function") {
	alert("function loadCSSAsync already exists");
}
else {

	$.loadCSSAsync = function (listOfCSS, callback) {
		
		var objCallBack = { 'list': [], 'callback': callback }
	
		for(var i = 0; i < listOfCSS.length; i++) {
		
			var objCSS = { 'type': "text/css", 'src': null, 'media': null, 'callbackiscalled': false, 'toms': 100 };
			if (typeof listOfCSS[i] === "string") {
				objCSS.src = listOfCSS[i];
			}
			else {
				if (listOfCSS[i].type) objCSS.type = listOfCSS[i].type;
				if (listOfCSS[i].src) objCSS.src = listOfCSS[i].src;
				if (listOfCSS[i].media) objCSS.media = listOfCSS[i].media;
			}
			if (objCSS.src) objCallBack.list.push(objCSS);
				
			//Add CSS
			if (document.createStyleSheet){
				var cssObj = document.createStyleSheet(objCSS.src);
				//cssObj.type = objCSS.type;
				if (objCSS.media) cssObj.media = objCSS.media;
				cssObj.media = "screen";
			}
			else {
				var html = '<link rel="stylesheet" href="' + objCSS.src + '" type="' + objCSS.type + '"';
				if (objCSS.media) html += ' media="' + objCSS.media + '"';
				html += ' ></link>';
				$("head").append($(html));
			}
				
		}
	
		var fctToCall = function(fct) {

			var cssToCheck = this;
			var cptToCheck = 0;
			var cptFind = 0;
			
			for(var i = 0; i < cssToCheck.list.length; i++) {
				if (!cssToCheck.list[i].callbackiscalled) cptToCheck++;
			}
			
			if (cptToCheck) {
			
				$('head > link[rel="stylesheet"]').each(function() {
					
					var $this = $(this);
					var hrefCSS = $this.attr("href");
					
					for(var i = 0; i < cssToCheck.list.length; i++) {
						
						if (!cssToCheck.list[i].callbackiscalled) {
						
							if (hrefCSS == cssToCheck.list[i].src) {
								cssToCheck.list[i].callbackiscalled = true;
								if ($.isFunction(cssToCheck.callback)) {
									cssToCheck.callback.apply({ 'is': 'css', 'src': cssToCheck.list[i] });
									cptFind++;
								}
							}
						
						}
						
					}
				
				});
			
			}
			
			if (cptToCheck == cptFind) {
				if ($.isFunction(cssToCheck.callback)) {
					cssToCheck.callback.apply({ 'is': 'finish' });
				}
			}
			else {
				setTimeout($.proxy(fct, this, fct), this.toms);
			}
		
		};

		setTimeout($.proxy(fctToCall, objCallBack, fctToCall), objCallBack.toms);
	
	};

}
