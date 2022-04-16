/** @license
 *
 * Actando Audio Video Common
 * ----------------------------------------------
 * http://www.actando.com
 *
 * Copyright (c) 2012, IT Team. All rights reserved.
 * 
 * 
 *
 * 
 */

/**********************
* class ActAudioVideoDetection
* Flash & HTML 5 Autodetection
**********************/
var actAudioVideoDetection = $.inherit({
	
	FLASH: "flash",
	HTML5: "html5",
	UNDEFINED: "undefined",
	
	flashVersion: "0.0.0",
	flashSupported: false,
	html5Supported: false,
	preferFlash: false,
	
	_options: null,
	_videoDetectElement: null,
	_audioDetectElement: null,
			
	/**********************
	* Constructor
	**********************/			
	__constructor : function(options) {
		
		this._options = $.extend({}, this.getDefaultOptions(), options);
		//console.log(options);
		if (typeof swfobject !== "undefined")
		{
			var ver = swfobject.getFlashPlayerVersion();
			if (ver.major > 0) { this.flashVersion = ver.major + "." + ver.minor + "." + ver.release; this.flashSupported = true; }
		}
		
		this.preferFlash = this._options.preferFlash;
		
		if (this._options.isAudio === null && this._options.isVideo === null) alert("defined video or audio");
		
		if (this._options.isAudio)
		{
			this._audioDetectElement = document.createElement('audio') || null;
			this.html5Supported = ((this._audioDetectElement !== null) && (typeof this._audioDetectElement.canPlayType !== "undefined"));			
		}
		
		if (this._options.isVideo)
		{
			this._videoDetectElement = document.createElement('video') || null;
			this.html5Supported = ((this._videoDetectElement !== null) && (typeof this._videoDetectElement.canPlayType !== "undefined"));	
		}
		
	},
	
	/**********************
	* defaultOptions
	**********************/		
	getDefaultOptions: function() {
		
		return {
			'isAudio': null,
			'isVideo': null,
			'flashFormatSupported': ['video/mp4', 'video/x-flv', 'audio/mp3', 'audio/x-flv'],
			'preferFlash' : true
		};
		
	},
	
	/**********************
	* canPlayType
	**********************/			
	canPlayType: function(mediatype, player) {
				
		if (typeof mediatype != "string") return false;
		
		mediatype = mediatype.toLowerCase();
		
		if (player == this.FLASH)
		{
			var flashSupport = this._options.flashFormatSupported;
			var fsL = flashSupport.length;
			var supportfind = false;
			for(var indfs = 0; indfs < fsL; indfs++)
			{
				if (flashSupport[indfs] == mediatype) { supportfind = true; break; }
			}
			return supportfind;
		}
		else if (player == this.HTML5)
		{
			if (this.html5Supported) 
			{
				if (this._videoDetectElement != null)
					return (this._videoDetectElement.canPlayType(mediatype) === "maybe" || this._videoDetectElement.canPlayType(mediatype) === "probably");
				else
					return (this._audioDetectElement.canPlayType(mediatype) === "maybe" || this._audioDetectElement.canPlayType(mediatype) === "probably");
			}
		}
		else
		{
			throw "actAudioVideoDetection.canPlayType:player `" + player + "` unknown";
		}
		
		return false;
				
	},
	
	/**********************
	* canPlayType
	**********************/			
	usePlayer: function(mediatype) {

		var canFLASH = this.canPlayType(mediatype, this.FLASH);
		var canHTML5 = this.canPlayType(mediatype, this.HTML5);

		if (!this.flashSupported) canFLASH = false;
		if (!this.html5Supported) canHTML5 = false;
		
		if (!canFLASH || !canHTML5)
		{
			if (canHTML5)
				return this.HTML5;
			else if (canFLASH)
				return this.FLASH;
			else
				return this.UNDEFINED;
		}
		else
		{
			return (this._options.preferFlash) ? this.FLASH : this.HTML5;
		}
	
	},
	
	transformFileName: function(file) {
		
		var uri = new actURI(file);
		var tmime = uri.getTypeMimeWithExtension();
		var player = this.usePlayer(tmime);
       
		if (player == "undefined")
		{
			if (this.html5Supported)
			{
				return this._transformFileNameWithPreference(file, "html5");
			}
		}
		else if (player == "flash")
		{
			return this._transformFileNameWithPreference(file, player);
		}
		else if (player == "html5")
		{
			return this._transformFileNameWithPreference(file, player);
		}
		
		return file;
	
	},
	
	_transformFileNameWithPreference: function(filename, player) {
	
		if (this._options && this._options.hasOwnProperty(player) && this._options[player].hasOwnProperty("transformfile"))
		{
			var lastpos = filename.lastIndexOf('.');
			var ext = filename.substr(lastpos+1).toLowerCase();
			if (this._options[player].transformfile.hasOwnProperty(ext)) return filename.substr(0, lastpos+1) + this._options[player].transformfile[ext];
		}
		
		return filename;
	
	}
	
});

/**********************
* class ActURI
* Information of URI
**********************/

var actURI = $.inherit({

	URI: "",
	IsAbsolute: false,
	IsRelative: false,
	
	/**********************
	* Constructor
	* uri = uri to analyse
	**********************/			
	__constructor : function(uri) {
		
		if (typeof uri != "string" || (uri.length == 0)) return;
			
		this.URI = uri;
			
		var workuri = uri.toLowerCase().replace(" ", "");
			
		//Si http:// ou https://
		if (workuri.indexOf("http://") == 0 || workuri.indexOf("http://") == 0) 
			this.IsAbsolute = true;
		else
			this.IsRelative = true;		
			
	},
	
	/**********************
	* transformURI
	* tP = update URI with a relatif path
	* options
	* example : if uri = images/toto.png and tp = ../ => return ../images/toto.png
	*           if uri = http://www.actando.com/images/logo.png and tp = ../ => return http://www.actando.com/images/logo.png
	**********************/	
	transformURI: function(tP, options) {
	
		var retURI = this.URI;
		if (this.IsRelative && tP !== null) retURI = tP + this.URI;
		
		if (options && options.hasOwnProperty("transformfile"))
		{
			var lastpos = retURI.lastIndexOf('.');
			var ext = this.URI.substr(lastpos+1).toLowerCase();
			if (options.transformfile.hasOwnProperty(ext)) retURI = this.URI.substr(0, lastpos+1) + options.transformfile[ext];
		}
		
		return retURI;
	
	},

	/**********************
	* getTypeMimeWithExtension
	* get the type mime of the uri
	**********************/	
	getTypeMimeWithExtension: function() {
	
		var lastpos = this.URI.lastIndexOf('.');
		switch (this.URI.substr(lastpos).toLowerCase())
		{
			case ".mp3":
				return "audio/mp3";
				break;
			case ".mp4":
				return "video/mp4";
				break;
			case ".flv":
				return "video/x-flv";			
				break;
			case ".ogg":
				return "audio/ogg"; 
				break;
			case ".wav":
				return "audio/wav";
				break;
			case ".webm":
				return "video/webm";
				break;
			case ".ogv":
				return "video/ogg";
				break;
		}
			
		return "";
	
	}
	
});