var LMS_Session = $.inherit({
		
	LMS_DATA : { INIT: 0, CURRENT: 1 },	
		
	_setLMSDataKey : {}, // lms key updated
	_lmsData : {}, // lms data => [cmi] = { 'init': 'initial lms data', 'current': 'current lms data' }
	_API : null,
	_lmsInitialise : false,
	_lmsStartTime: null,
	
	/* Constructor
	*/
	__constructor : function() {
		this._API = this.getAPI();
		if (this._lmsStartTime === null) this._lmsStartTime = new Date();				
		if (this.APIisOK())
		{
			this._API.LMSInitialize("");
			this._lmsInitialise = true;
		}
	},

	updateSessionTime : function(){
      var strTime = null;
	  if (this._lmsStartTime !== null) {			
		var dt = new Date();
		strTime = this.formatTime(dt - this._lmsStartTime);
	  }
	
	  if (this._lmsInitialise)
	  {
		if (strTime !== null) this._API.LMSSetValue("cmi.core.session_time", strTime);
	  }

	  // console.log(strTime);
	},
	
	destroy: function() {

		var strTime = null;
		if (this._lmsStartTime !== null) {			
			var dt = new Date();
			strTime = this.formatTime(dt - this._lmsStartTime);
			this._lmsStartTime = null;
		}
	
		if (this._lmsInitialise)
		{
			if (strTime !== null) this._API.LMSSetValue("cmi.core.session_time", strTime);
			
			var prg = this.getValue("cmi.suspend_data");
			var prg = prg.split(";");
			prg = (prg.length == 2) ? parseInt(prg[0]) : 0;	
			if (this._API.LMSGetValue('cmi.core.lesson_status') != 'completed') {
				if (prg >= 100) {
					this._API.LMSSetValue('cmi.core.lesson_status', 'completed');
				}
				else {
					this._API.LMSSetValue('cmi.core.lesson_status', 'incomplete');
				}
			}
			this._API.LMSCommit("");
			this._API.LMSFinish("");
			this._API = null;			
			this._lmsInitialise = false;
		}
	},

	finish: function() {

		if (this._lmsInitialise)
		{
			this._API.LMSFinish("");
			this._API = null;			
			this._lmsInitialise = false;
		}
		
	},
	
	getValue: function(key) {
	
		if (this.APIisOK() && this.getLMSDataCount() == 0) this.loadData();
		return this.getData(key);
		
	},
	
	setValue: function(key, value) {
		
		if (this.APIisOK() && this.getLMSDataCount() == 0) this.loadData();
		return this.setData(key, value);
		
	},
	lmsCommit:function(param){
     
      if (this.APIisOK()) this._API.LMSCommit(param);
      //console.log("commit");
      return true;
	},

	deleteValue: function(key, value) {
		
		if (this.APIisOK() && this.getLMSDataCount() == 0) this.loadData();
		return this.deleteData(key, value);
		
	},

	/******************************
	* STORE DATA
	******************************/

	getLMSDataCount: function() {
	
		var nb = 0;
		for(var k in this._lmsData) nb++;
		return nb;
		
	},
				
	clearLMSKeyChanged: function() {
		this._setLMSDataKey = {};
	},
	
	initLMSData: function(key, value) {
		this._lmsData[key] = { 'init': value, 'current': value };
	},
	
	getLMSData: function(key, w) {
		if (this._lmsData[key] == null) return null;
		return (w == this.LMS_DATA.INIT) ? this._lmsData[key].init : this._lmsData[key].current;
	},
	
	setLMSData: function(key, value) {
		if (this._lmsData[key] == null) this._lmsData[key] = { 'init': null, 'current': null };
		this._lmsData[key].current = value;
		this._setLMSDataKey[key] = true;
	},
	
	getLMSKeyChanged: function(all) {

		var allkeys = (all === true);
		var keys = new Array();
		
		if (all) {
		
			for(var k in this._lmsData) {
				keys.push(k);
			}
		
		}
		else {
		
			for(var k in this._setLMSDataKey) {
				if (this._setLMSDataKey[k] === true) keys.push(k);
			}
		
		}
		return keys;
	
	},
	
	/******************************************
	* syntaxe A?|B?|...
	*******************************************/
	getMultipleData: function(data, positem) {
		
		if (positem > 25) throw "getMultipleData(). Item > 25";
		
		var itemsearch = String.fromCharCode(65+positem) + "?";

		var tbdata = data.split("|");
		for(var i = 0; i< tbdata.length; i++) {
			if (tbdata[i].substr(0, 2) == itemsearch) return tbdata[i].substr(2);	
		}
		
		return null;
	
	},
	
	setMultipleData: function(data, newitem, positem, nbitems) {
		
		if (nbitems > 26) throw "setMutlipleData(). Item > 26";
		if (positem > 25) throw "setMutlipleData(). pos > 25";
		
		var tbdata = data.split("|");
		if (nbitems > tbdata.length) 
		{ 
			for(var ind = tbdata.length - 1; ind < nbitems; ind++) {
				tbdata[ind] = String.fromCharCode(65+ind) + "?";
			}
		}
		
		itemsearch = String.fromCharCode(65+positem) + "?";
		for(var ind = 0; ind < nbitems; ind++) {
			if (tbdata[ind].substr(0, 2) == itemsearch) {
				tbdata[ind] = itemsearch + newitem;
				break;
			}
		}
		
		return tbdata.join('|');
	
	},
	
	/******************************************
	* stock sous la forme key structure => cle:sizeof(content):content|cle:sizeof(content):content
	* totalement flexible mais prend un peu plus de place
	* ATTENTION PAS PLUS DE 1000 ITEMS
	* les cl�s sont toujours traiter en minuscule
	*******************************************/
	
	keyDataToArray: function(data)
	{
		var ref = 0;
		var cpt = 0; // au cas o� :-)
		var stop = false;
		var pos = 0;		
		var tbdata = {};
		
		if (data === null || data === undefined) return tbdata;
		
		var datalen = data.length;
		
		while (!stop && cpt++ < 1000 && pos <= datalen)
		{
			ref = pos;
			first = data.indexOf(':', pos);
			var second = 0;
			var third = 0;
			if (first == -1) { stop = true; }
			
			if (!stop)
			{
				pos = first + 1;
				second = data.indexOf(':', pos);
				if (second == -1) { stop = true; }
			}
			
			if (!stop)
			{
				pos = first + 1;
				third = data.indexOf(':', pos);
				if (third === false) { stop = true; }
			}
			
			if (!stop)
			{
				var key = data.substr(ref, first - ref);
				var sizeofcontent = data.substr(first + 1, second - first - 1);
				sizeofcontent = parseInt(sizeofcontent);
				
				if (isNaN(sizeofcontent)) stop = true;
			
				if (!stop)
				{
					var content = data.substr(third + 1, sizeofcontent);
			
					pos = third + sizeofcontent + 1;
					if (pos < datalen)
					{
						//Next character must be |
						stop = (data.charAt(pos) != "|");
					}
					pos++;
			
					if (!stop && key.length > 0 && sizeofcontent > 0)
					{
						tbdata[key.toLowerCase()] = content;
					}
					
				}
			}
						
		}	
		console.log("tbdata",tbdata);
		return tbdata;
		
	},
	
	ArrayToKeyData: function(tb) {
	
		var dt = "";
		for(var k in tb)
		{
			var value = tb[k].toString();
			if (value.length > 0) { dt += (k.toLowerCase() + ':' + value.length + ':' + value + '|'); }
		}
		if (dt.length > 0) dt = dt.substr(0, dt.length - 1);
		return dt;
		
	},
	
	setKeyData: function(data, key, value) {
		
		if (value === null || value === undefined) value = "";
		var key = key.toLowerCase();
		var tb = this.keyDataToArray(data);
		tb[key] = value;
		return this.ArrayToKeyData(tb);
		
	},
	
	getKeyData: function(data, key) {
	
		key = key.toLowerCase();
		var tb = this.keyDataToArray(data);
		return (tb[key] === null || tb[key] === undefined) ? null : tb[key];
		
	},
	
	deleteKey: function(data, key) {
	
		key = key.toLowerCase();
		var tb = this.keyDataToArray(data);
		if (tb[key] === null || tb[key] === undefined) return data;
		delete tb[key];
		return this.ArrayToKeyData(tb);
	
	},
	
	getKeys: function(data, search) {
	
		var tb = this.keyDataToArray(data);
		var keys = [];
		if (search) {
			search = search.replace(".", "\.");
			for(var k in tb) {
				if (k.search(search) > -1) keys.push(k);
			}
			return keys;
		} else {
			for(var k in tb) keys.push(k);		
		}
		return keys;
		
	},
	
	/******************************************
	* API SCORM
	*******************************************/
	
	_findAPI: function(win) {
		var g_nFindAPITries = 0; 
		while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
			g_nFindAPITries ++;
			if (g_nFindAPITries > 100) { return null; }
			win = win.parent;			
		}
		return win.API;
	},
	
	getAPI: function() {
		
		var objAPI = null;
		
		if (window.API != null) objAPI = window.API; 
		if ((objAPI == null) && (window.parent) && (window.parent != window)) { objAPI = this._findAPI(window.parent); }
		if ((objAPI == null) && (window.opener != null)) { objAPI = this._findAPI(window.opener); }
		
		return objAPI;
	
	},
	
	APIisOK: function() {
		return ((typeof(this._API) != "undefined") && (this._API != null));
	},
	
	formatTime: function(ms) {
		
		var secs = Math.floor(ms / 1000);
		
		var days = (secs / 86400) >> 0;
		var hours = (secs % 86400 / 3600) >> 0;
		var minutes = (secs % 3600 / 60) >> 0;
		var seconds = (secs % 60);    
		//var milli = Math.floor((ms - (secs * 1000)) / 10);
				
		seconds = seconds < 10 ? "0" + seconds : seconds;
		minutes = minutes < 10 ? "0" + minutes : minutes;
		hours = ((days * 24) + hours);
		//milli = milli < 10 ? "0" + milli : milli;
			
		if (hours < 10) { hours = "000" + hours; }
		else if (hours < 100) { hours = "00" + hours; }
		else if (hours < 1000) { hours = "0" + hours; }
		
		//return hours + ":" + minutes + ":" + seconds + "." + milli;
		return hours + ":" + minutes + ":" + seconds + ".00";
			
	}	
	
});