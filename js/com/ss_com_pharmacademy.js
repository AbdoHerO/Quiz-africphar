var SS_COM_PHARMACADEMY = $.inherit(SS_COM,{
	
	_session: null,
	_suspendData: null,
		
	loadData: function(options) {
		
		this._session = new LMS_SlideShow_Session();
		
		this._session.loadDatas(['cmi.suspend_data', 'cmi.core.lesson_status', 'cmi.core.entry', 'cmi.student_data.mastery_score']);
		
		this._suspendData = SS_COM.getSuspendDataManager(this._session.keyDataToArray, this._session.ArrayToKeyData);
		this._suspendData.load(this._session.getLMSData("cmi.suspend_data"));
		
		//load current slide
		this.setLastSlideReaded(this._suspendData.read("lastslidereaded"));
		this.setCurrentSlide(this._suspendData.read("currentslide"));
		this.setQuestionsInfo(this._suspendData.read("validquestions"));
		
		//Initialize data		
		this._session.setLMSData("cmi.objectives.0.score.min", 0);
		this._session.setLMSData("cmi.objectives.0.score.max", 100);
		
		this.viewSlide(this.getCurrentSlide());
		
		if (this.saveQuizz()) {

			this._session.setLMSData("cmi.objectives.1.score.min", "0");
			this._session.setLMSData("cmi.objectives.1.score.max", this.getQuizzMaxScore());

			var questions = this.getQuizzQuestions()["questions"];			
			var nbQStored = this._suspendData.read("numberinteractionsstored");
			nbQStored = $.isNumeric(nbQStored) ? parseInt(nbQStored) : 0;
			
			//Load cmi
			var cmi = [];
			for(var i = 0; i < nbQStored; i++) {
				cmi.push("cmi.interactions." + i + ".student_response");
			}
			if (cmi.length > 0) this._session.loadDatas(cmi);
			
			var indInteraction = nbQStored;
			while (indInteraction < questions.length) {
				this._session.setLMSData("cmi.interactions." + indInteraction + ".id", "" + indInteraction);			
				this._session.setLMSData("cmi.interactions." + indInteraction + ".type", 'choice');
				this._session.setLMSData("cmi.interactions." + indInteraction + ".correct_responses.0.pattern", "");
				indInteraction++;
			}
			
			if (questions.length > 0) this._suspendData.write("numberinteractionsstored", questions.length);
			
			for(var i = 0; i < questions.length; i++) {
				var question = questions[i];
				this._session.setLMSData("cmi.interactions." + question.cmiIndex + ".id", "" + question.cmiIndex);
				this._session.setLMSData("cmi.interactions." + question.cmiIndex + ".correct_responses.0.pattern", question.getCorrectId().join(";"));
				//Load response
				var resp = this._session.getLMSData("cmi.interactions." + question.cmiIndex + ".student_response");
				if (resp) {
					var tbresp = resp.split(";");
					for(var indresp = 0; indresp < tbresp.length; indresp++) {
						question.userResponses.addResponse(tbresp[indresp]);
					}
					question.userResponses.isValidated = true;					
				}
			}
						
		}
		
		this.updateStatus();
		this.saveData({sendall: true});
		
	},
	
	saveData: function(options) {
		
		this._suspendData.write("lastslidereaded", this.getLastSlideReaded());
		this._suspendData.write("currentslide", this.getCurrentSlide());
		this._suspendData.write("validquestions", this.getUserResponses());
		this._session.setLMSData("cmi.suspend_data", this._suspendData.formatToString());
		
		this._session.saveData(options);
		
	},
	
	viewSlide: function(c, options) {
		
		this.__base(c);
		
		var nbSlides = this.getCountSlides();
		var lastSlideReaded = this.getLastSlideReaded();
		
		var pctRead = (nbSlides > 0 ? (lastSlideReaded / nbSlides) : 0) * 100;
		if (pctRead > 100) pctRead = 100;
		
		this._session.setLMSData("cmi.objectives.0.score.min", "0");
		this._session.setLMSData("cmi.objectives.0.score.max", "100");
		this._session.setLMSData("cmi.objectives.0.score.raw", "" + Math.round(pctRead));
		this._session.setLMSData("cmi.objectives.0.status", (pctRead >= 100) ? "completed" : "incomplete");
		
		this._session.setLMSData("act.progression", pctRead);
		
		this.updateStatus();
		this.saveData({sendall: true});
		
	},
	
	updateQuizQuestion: function(question) {
		
		resp = question.userResponses.getResponses();
		
		this._session.setLMSData("cmi.interactions." + question.cmiIndex + ".student_response", resp.join(";"));		
		this._session.setLMSData("cmi.interactions." + question.cmiIndex + ".result", ((question.check(question.userResponses.getResponses())) ? "correct" : "wrong"));		
		
		this.updateStatus();
		
	},
	
	getMasteryScore: function() {
		
		var validateScore = this._session.getLMSData("cmi.student_data.mastery_score");
		if (!$.isNumeric(validateScore)) validateScore = 0;
		
		validateScore = parseFloat(validateScore);
		
		if (!validateScore) {
			validateScore = this.__base();
			if (!$.isNumeric(validateScore)) validateScore = 0;
		}
		
		return validateScore;
		
	},	
	
	updateStatus: function() {
		
		var quizInfo = null;
		var validateScore = this.getMasteryScore();
		
		if (this.saveQuizz()) {

			if (!quizInfo) quizInfo = this.getQuizzCalculationInformation();
			
			this._session.setLMSData("cmi.objectives.1.score.raw", quizInfo.raw);
			if (quizInfo.countQuestions == quizInfo.countAnswers) {
				this._session.setLMSData("cmi.objectives.1.status", (validateScore <= quizInfo.raw) ? "passed" : "failed");	
			}
			else {
				this._session.setLMSData("cmi.objectives.1.status", "incomplete");	
			}
		
		}
		
		if (this.useQuizzForScore()) {
			
			if (!quizInfo) quizInfo = this.getQuizzCalculationInformation();
			
			this._session.setLMSData("cmi.core.score.min", "0");
			this._session.setLMSData("cmi.core.score.max", quizInfo.max);
			this._session.setLMSData("cmi.core.score.raw", quizInfo.raw);
			
			if (quizInfo.countQuestions == quizInfo.countAnswers) {
				this._session.setLMSData("cmi.core.lesson_status", (validateScore <= quizInfo.raw) ? "passed" : "incomplete");	
			}
			else {
				this._session.setLMSData("cmi.core.lesson_status", "incomplete");	
			}
			
		}
		else {
			
			var nbSlides = this.getCountSlides();
			var lastSlideReaded = this.getLastSlideReaded();
			
			var pctRead = (nbSlides > 0 ? (lastSlideReaded / nbSlides) : 0) * 100;
			if (pctRead > 100) pctRead = 100;
		
			this._session.setLMSData("cmi.core.score.min", "0");
			this._session.setLMSData("cmi.core.score.max", "100");
			this._session.setLMSData("cmi.core.score.raw", "" +  Math.round(pctRead));			
			this._session.setLMSData("cmi.core.lesson_status", (pctRead >= 100) ? "completed" : "incomplete");			
			
		}

		
		this._session.updateSessionTime();
		
	}
	
});