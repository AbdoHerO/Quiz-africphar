var LMS_SlideShow_Session = $.inherit(LMS_Session, {
	
	getData: function(key) {
		var data = this.getLMSData(key);
		if (data === null) data = "";		
		return data;
	},
	
	setData: function(key, value) {
		this.setLMSData(key, value);			
	},
	
	loadDatas: function(keys) {
	
		if (!this.APIisOK()) return;
	
		if (this._API.executeQueries)
		{
			
			//On récupère
			var queries = [];
			for(var indKey = 0; indKey < keys.length; indKey++)
			{
				queries.push(this._API.createStandardQuery("lmsgetvalue", keys[indKey]));
			}
			
			var retQ = this._API.executeQueries(queries);
			var lQ = retQ.Queries.length;
			for(var indQ = 0; indQ < lQ; indQ++)
			{
				var q = retQ.Queries[indQ];
				var key = q.getParameter("param");
				if (key !== null)
				{
					if ($.isArray(q.Returns) && q.Returns.length > 0) this.initLMSData(key, q.Returns[0].Value);
				}
			}
			
		}
		else
		{
			
			//On récupère
			for(var indKey = 0; indKey < keys.length; indKey++)
			{
				this.initLMSData(keys[indKey], this._API.LMSGetValue(keys[indKey]));
			}
			
		}
	
	},
	
	/* loadData
	* Chargement des données du LMS
	*/
	loadData: function() {		
		return;
	},
	
	/* saveData
	* Sauvegarde des données du module
	*/
	
	entryIsReadOnly: function(entry) {
		
		switch(entry) {
			case "cmi.core.entry":
			case "cmi.student_data.mastery_score":
				return true;
				break;
		}
		
		return false;
		
	},
	
	saveData: function(options) {

		if (!this.APIisOK()) return;
		
		var keyChanged = this.getLMSKeyChanged( ((options && options.sendall && options.sendall === true) ? true : false)  );
		var lK = keyChanged.length;
		var boolClearKeyChanged = true;
		
		if (lK == 0) return;
		
		if (this._API.executeQueries)
		{
		
			var queries = [];
			for(var indKey = 0; indKey < lK; indKey++)
			{
				if (!this.entryIsReadOnly(keyChanged[indKey])) {
					var qry = this._API.createStandardQuery("lmssetvalue", keyChanged[indKey], this.getLMSData(keyChanged[indKey]));
					queries.push(qry);
				}
			}
			var ret = this._API.executeQueries(queries);
			boolClearKeyChanged = !ret.hasError();
		}
		else
		{

			for(var indKey = 0; indKey < lK; indKey++)
			{
				if (!this.entryIsReadOnly(keyChanged[indKey])) {
					this._API.LMSSetValue(keyChanged[indKey], this.getLMSData(keyChanged[indKey]));
				}
			}

		}

		if (boolClearKeyChanged) this.clearLMSKeyChanged();

	}
	
});