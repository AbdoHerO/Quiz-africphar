var SS_COM_SCORM_1_2 = $.inherit(SS_COM,{
	
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
		this.setQuestionsInfo(this._suspendData.read("validquestions"), this.getMasteryScore());

		
		//Initialize data		
		this._session.setLMSData("cmi.objectives.0.score.min", 0);
		this._session.setLMSData("cmi.objectives.0.score.max", 100);
		this._session.setLMSData("cmi.student_data.mastery_score", this.getMasteryScore());

		/* load validated interactions state */
		this.interactionsParse(this._suspendData.read("interactions"));
		
		this.viewSlide(this.getCurrentSlide());
		
		if (this.saveQuizz()) {

			this._session.setLMSData("cmi.objectives.1.score.min", "0");
			this._session.setLMSData("cmi.objectives.1.score.max", this.getQuizzMaxScore());

			var questions = this.getQuizzQuestions();			
			var nbQStored = this._suspendData.read("numberinteractionsstored");
			nbQStored = $.isNumeric(nbQStored) ? parseInt(nbQStored) : 0;
						
		}
		
		this.updateStatus();
		this.saveData({sendall: true});
		
	},
	
	saveData: function(options) {
		
		this._suspendData.write("lastslidereaded", this.getLastSlideReaded());
		this._suspendData.write("currentslide", this.getCurrentSlide());
		this._suspendData.write("validquestions", this.getUserResponses());
		this._suspendData.write("interactions", this.interactionsStringify());
		this._session.setLMSData("cmi.suspend_data", this._suspendData.formatToString());
		
		this._session.saveData(options);
		this._session.lmsCommit("");
		
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
		
		this.updateStatus();
		this.saveData({sendall: true});
		
	},
	
	updateQuizQuestion: function(question) {
		
		resp = question.userResponses.getResponses();
		
		this._session.setLMSData("cmi.interactions." + question.cmiIndex + ".student_response", resp.join(";"));		
		this._session.setLMSData("cmi.interactions." + question.cmiIndex + ".result", ((question.check(question.userResponses.getDecisions())) ? "correct" : "wrong"));		
		
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
			var completeByLastSlide = this.getOptionByName("fCmpltByLS");
			
			this._session.setLMSData("cmi.core.score.min", "0");
			this._session.setLMSData("cmi.core.score.max", quizInfo.max);
			this._session.setLMSData("cmi.core.score.raw", quizInfo.raw);

			if(completeByLastSlide == "1"){
			    var pctRead = (this.getCountSlides() > 0 ? (this.getLastSlideReaded() / this.getCountSlides()) : 0) * 100;
			    if (pctRead > 100) pctRead = 100;
			    this._session.setLMSData("cmi.core.lesson_status", (pctRead >= 100) ?  "completed": "incomplete");	
			}
			
			else if (quizInfo.countQuestions == quizInfo.countAnswers) {
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
			this._session.setLMSData("cmi.core.lesson_status", (pctRead >= 100) ? "passed" : "incomplete");			
			/*console.log("lastSlideReaded => "+this.getLastSlideReaded());
			console.log(this._session.getLMSData("cmi.core.lesson_status"));*/
		}

		this._session.updateSessionTime();

		this._session.lmsCommit("");
	}
	
});