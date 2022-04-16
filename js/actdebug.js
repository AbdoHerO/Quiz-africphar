/** @license
 *
 * ActDebug javascript
 * ----------------------------------------------
 * http://www.actando.com
 *
 * Copyright (c) 2013, IT Team. All rights reserved.
 * 
 * http://stephband.info/jquery.event.swipe/
 *
 * 
 */

ActDebugMove = function() {

	$debugdiv = $("#act_screen_debug");
	dHeight = $debugdiv.height()+20;
	dWidth = $debugdiv.width()+20;
	dTop = ($(window).height()+$(window).scrollTop()-dHeight)+"px";	
	dLeft = ($(window).width()-dWidth)+"px";	
	$debugdiv.css({'top': dTop, 'left': dLeft});	
	
};

$(window).on({'resize': ActDebugMove, 'scroll': ActDebugMove });
 
var ActDebug = {
		
	initialize: function() {
		
		var divTxt = '<div id="act_screen_debug" style="text-align: left; padding: 5px; width:600px; top:0; left:0; height: 600px; border: solid 1px black; position: absolute; z-index: 10000; background-color: white; display: block; overflow-y: scroll;"></div>';
		$("body").append(divTxt);
		ActDebugMove();
	
	},
	
	destroy: function() {
		
		$("#act_screen_debug").remove();
		
	},
	
	write: function(msg, title) {
		
		var txt = msg;
		if (title !== undefined && title != "") txt = title + ": " + txt;
		$("#act_screen_debug").append("<p>" + txt + "</p>");
	
	}
	
};