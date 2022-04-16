var SS_COM = $.inherit({
	
	//SUSPEND_DATA
	//[c:current slide]/[]/
	
	_session: null,
	_slideshow: null,
	_currentTypeSlide: null,
	_currentDetachedSlide: 1,
	_currentSlide: 1,
	_lastSlideReaded: 1,
	_interactiveStates: {"interactions" : []},
	
	/* Constructor
	*/
	__constructor : function(slideshow) {
		this._slideshow = slideshow;

	},
	
	/****
	****/
	
	loadData: function(options) {
	},
	
	saveData: function(options) {
	},
	
	viewSlide: function(c, options) {
		this.setCurrentSlide(c);
	},

	/****
	****/
	setTypeSlide: function(type, pos) {this._currentTypeSlide = type; this._currentDetachedSlide = pos;},

	getTypeSlide: function() { return {"type" : this._currentTypeSlide, "pos" : this._currentDetachedSlide };},

	getCurrentSlide: function() { return this._currentSlide; },
	
	setCurrentSlide: function(num) { 
		
		if (!$.isNumeric(num)) num = 1;
		
		var nbSlides = this._slideshow.getReader().slideCount();
		
		if (num < 0) num = 1;
		if (num > nbSlides) num = nbSlides;
		
		this._currentSlide = num;
		
		if (this._lastSlideReaded < num) this._lastSlideReaded = num;
		
		return this._currentSlide;
		
	},
	
	getLastSlideReaded: function() {  return this._lastSlideReaded; },
	setLastSlideReaded: function(num) { 
		
		if (!$.isNumeric(num)) num = 1; 
		
		var nbSlides = this._slideshow.getReader().slideCount();

		if (num < 0) num = 1;
		if (num > nbSlides) num = nbSlides;
		
		this._lastSlideReaded = num; 
		
		return this._lastSlideReaded;
		
	},
	getQuestionsInfo:function(data){

        var questionsInfo = data.split(";");
        var validatedQuestions = [];
        if(questionsInfo.length > 0){
  
           for(var i = 0; i < questionsInfo.length; i++) {
			  var questionInfo = questionsInfo[i].split("_");
			  if(questionInfo.length == 4){
			  	var ids        = questionInfo[0].split("-");
			  	var choices    = questionInfo[1].split("-");
			  	var isForced   = questionInfo[2] == '1' ? true : false;
			  	var retrynbre  = questionInfo[3];
			  	if (ids.length == 2 && choices.length > 0){
			  		validatedQuestions.push({"quiz":ids[0], "q": ids[1], "choices": choices, "isForced" : isForced, "retrynbre" : retrynbre });
			  	}
			  }
			
		   }

        }
        return validatedQuestions;
	},
	setQuestionsInfo: function(data, forcedScore){
      

        var validatedQuestions = this.getQuestionsInfo(data);
        if(validatedQuestions.length > 0){
            var questions = this.getQuizzQuestions()["questions"];
            for(var i = 0; i < questions.length; i++) {
			   var question = questions[i];
			   for(var j = 0; j < validatedQuestions.length; j++) {
			   	 if(validatedQuestions[j].q == question.Id && validatedQuestions[j].quiz == question.quiz){
			   	 	question.userResponses.isValidated = true;
			   	 	question.isForced = validatedQuestions[j].isForced;
			   	 	question.forcedScore = forcedScore;
			   	 	var quiz = this.getQuizz(question.quiz);
			   	 	quiz.RetryNbre = validatedQuestions[j].retrynbre;
			   	 	for(var k = 0; k < validatedQuestions[j].choices.length; k++) {
			   	 		question.userResponses.addResponse(validatedQuestions[j].choices[k]);
			   	 	}

			   	 }
			   }
			   
		    }	
        }
	},

    interactionsParse: function(data){   
        /* parse interactions scorm and initialise 'object scorm interactions' */
        this._interactiveStates = {"interactions" : []};
        var listInteractions = data.split(";");
        for (var i = 0; i < listInteractions.length; i++) {
        	var interactionInfo = listInteractions[i].split("_");
            if(interactionInfo.length == 3){
            	var interactionvalues = interactionInfo[1].split(",");
            	if(interactionvalues.length > 0){
            		var interactionObj = {"id": interactionInfo[0], 'values':[], 'type': interactionInfo[2]};
            		for (var j = 0; j < interactionvalues.length; j++) {
            			var interactionvalue = interactionvalues[j].split(":");
            			if(interactionvalue.length == 2 ){
            				interactionObj.values.push({"id": interactionvalue[0], "value": interactionvalue[1]});
            			}
            		}
            		if(interactionObj.values.length > 0) this._interactiveStates.interactions.push(interactionObj);
            	}
            }
        }
	},

	readInteractionsByType: function(type){
		interactions = [];
		for (var i = 0; i < this._interactiveStates.interactions.length; i++) {
			if(this._interactiveStates.interactions[i].type == type) interactions.push(this._interactiveStates.interactions[i]);
		}
		return interactions;
	},

	addInteraction:function (info) {
		var notfound = true;
		for (var i = 0; i < this._interactiveStates.interactions.length; i++) {
			if(this._interactiveStates.interactions[i].id == info.id && this._interactiveStates.interactions[i].type == info.type){
                for (var j = 0; j < info.values.length; j++) {
		 			var found = false;
		 			for (var k = 0; k < this._interactiveStates.interactions[i].values.length; k++) {
		 				if(this._interactiveStates.interactions[i].values[k].id == info.values[j].id){
		 					this._interactiveStates.interactions[i].values[k].value = info.values[j].value;
		 					found = true;
		 				}
		 			}
		 			if (!found) this._interactiveStates.interactions[i].values.push(info.values[j]);
		 		}
				notfound = false; break;
			}
		}
		if(notfound){
		 	this._interactiveStates.interactions.push({'id':info.id, 'values':info.values, 'type': info.type});
		 	return;
		}
	},

	saveInteraction: function(obj, data){
		 /* update 'object scorm interactions' */
		 for (var i = 0; i < this._interactiveStates.interactions.length; i++) {
		 	if(this._interactiveStates.interactions[i].id == obj.id){
		 		this._interactiveStates.interactions[i].values = data;
		 		return;
		 	}
		 }
		 this._interactiveStates.interactions.push({'id':obj.id, 'values':data, 'type': obj.compositeType});
	},

	readInteraction: function(id){
		/* read 'object scorm interactions' return data */
		for (var i = 0; i < this._interactiveStates.interactions.length; i++) {
		 	if(this._interactiveStates.interactions[i].id == id){
		 		return {'values' : this._interactiveStates.interactions[i].values, 'type':this._interactiveStates.interactions[i].type};
		 	}
		}
		return null;
	},



	interactionsStringify: function(){
		/* stringify 'object scorm interactions' */
		 /* String format: 'idanim_id1:value1,id2:value2' */
        var ints = '';
        for (var i = 0; i < this._interactiveStates.interactions.length; i++) {
        	var interaction = this._interactiveStates.interactions[i];
        	var interactionString = interaction.id+ '_';
        	for (var j = 0; j < interaction.values.length; j++) {
        		var val = interaction.values[j];
        		interactionString += val.id+ ':' +val.value+ ',';
        	}
        	if(interaction.values.length > 0) interactionString = interactionString.slice(0, -1);
        	ints += interactionString+  '_'+ interaction.type +';';
        }

        return ints;
	},
	
	getCountSlides: function() { return this._slideshow.getReader().slideCount(); },
	
	/****
	****/
	
	getMasteryScore: function() {
		return this._slideshow.getReader().MasteryScore;
	},
	
	saveQuizz: function() {
		return this._slideshow.getReader().SaveQuizz || this.useQuizzForScore();
	},

	useQuizzForScore: function() {

		var quizInfos = this.getQuizzQuestions();

		var quizzQuestions = quizInfos["questions"];
		var quizzElements  = quizInfos["elements"];
		for(var i = 0; i < quizzQuestions.length; i++) {
			if (quizzQuestions[i].scoreCalculation) return true;
		}

		return quizzElements.length > 0;

	},
	
	// useQuizzForScore: function() {
	//
	// 	var quizzQuestions = this.getQuizzQuestions()["questions"];
	// 	for(var i = 0; i < quizzQuestions.length; i++) {
	// 		if (quizzQuestions[i].scoreCalculation) return true;
	// 	}
	//
	// 	return false;
	//
	// },

	getQuizzMaxScore: function() {
		return 100;
	},
	
	// getQuizzCalculationInformation: function(quizIds) {
	//
    //     var questions = this.getQuizzQuestions(quizIds);
	//
	// 	var info = { 'countQuestions': 0, 'countCorrectAnswers': 0, 'countAnswers': 0, 'min': 0, 'max': this.getQuizzMaxScore(), 'raw': 0 };
	//
	// 	for(var i = 0; i < questions.length; i++) {
	// 		var question = questions[i];
	// 		if (question.scoreCalculation) {
	// 			info.countQuestions++;
	// 			if (question.userResponses.isValidated) {
	// 				info.countAnswers++;
	// 				if (question.check(question.userResponses.getResponses())) info.countCorrectAnswers++;
	// 			}
	// 		}
	// 	}
	//
	// 	if (info.countQuestions > 0) {
	// 		info.raw = Math.round(info.countCorrectAnswers / info.countQuestions * 10000) / 100;
	// 	}
	// 	console.log(info);
	// 	return info;
	//
	// },

	getUserResponses: function(){
        
        var data = '';
        var questions = this.getQuizzQuestions()["questions"];
        var alwaysShowScore = this._slideshow.getReader().AlwaysShowScore;

        for(var i = 0; i < questions.length; i++) {
			var question = questions[i];
			if ( (question.scoreCalculation || alwaysShowScore) && question.userResponses.isValidated && question.userResponses.hasResponse()) {

				var respObj  = question.userResponses.getResponses();
				var userResponses = [];
				if(question.isComplex){
					for (var key in respObj) {
						if (respObj.hasOwnProperty(key)) {
							userResponses.push(key + '?' + respObj[key]);
						}
					}
					 // concatenation key.value (ex key.QuizId.indexQuest.IdChoice)
					 userResponses = userResponses.join('-')
				}
				else userResponses = question.userResponses.getResponses().join("-");

                var isForced = (question.isForced === true) ? '1' : '0';
                var quiz = this.getQuizz(question.quiz);
                var retrynbre = (quiz && quiz.RetryNbre && $.isNumeric(quiz.RetryNbre)) ? quiz.RetryNbre : 0; 
                data += question.quiz +'-'+ question.Id + '_' + userResponses + '_' + isForced  + '_' + retrynbre + ';' ;
			}
		}
		if(data.length > 0) data = data.slice(0, -1);

        return  data ;
	},

	getOptionByName: function(name){
		return this._slideshow.getReader().getOptions(name);
	},

	getScoreComponent: function(componentIds, type){
        var info = {raw : 0, cmpt: 0, sum: 0};
		if(!$.isArray(componentIds) || componentIds.length == 0) return info;

		for (var i = 0; i < componentIds.length; i++){
			var componentIdArray = componentIds[i].split('_');
			if(componentIdArray.length == 2){

				var slides = this._slideshow.getReader().getSlides();
				var componentAnim = null;
				for(var islide = 0; islide < slides.length; islide++) {
					if(slides[islide].Id != componentIdArray[0]) continue;
					var animations = slides[islide].getAnimations();
					for (var iAnim = 0; iAnim < animations.length; iAnim++){
						if(animations[iAnim]['compositeType'] == 19){
							componentAnim = animations[iAnim]; break;
						}
					}
				}
				var interactions = this.readInteraction(componentAnim ? componentAnim.id : -2);
				if(interactions && interactions.values && interactions.values.length > 0){
					for(var k = 0; k < interactions.values.length; k++){
						if(interactions.values[k].id == componentIdArray[1]){
							info.sum += ($.isNumeric(interactions.values[k].value)) ? parseFloat(interactions.values[k].value) : 0;
							info.cmpt++;
						}
					}
				} else {

					if (componentAnim['componentScore'] && componentAnim['componentScore'][componentIdArray[1]]) {
						info.sum += $.isNumeric(componentAnim['componentScore'][componentIdArray[1]]) ? componentAnim['componentScore'][componentIdArray[1]] : 0;
						info.cmpt++;
					}

				}
			}
		}
		if(info.cmpt > 0) info.raw = info.sum / info.cmpt;
		return info ;

	},

	getQuizzCalculationInformation: function(quizIds, notForScorm) {


		var notScorm  = !(typeof notForScorm === "undefined") && notForScorm == true;
		var questionsData = notScorm ? this.getQuizzQuestions(quizIds, {'notScorm': notScorm}) : this.getQuizzQuestions(quizIds);
		var questions = questionsData["questions"];
		var elements  = questionsData["elements"];


		var alwaysShowScore = this._slideshow.getReader().AlwaysShowScore;


		var info = { 'countQuestions': 0, 'countCorrectAnswers': 0, 'countAnswers': elements.length, 'min': 0, 'max': this.getQuizzMaxScore(), 'raw': 0 };
		var totalValue = 0;

		for(var i = 0; i < questions.length; i++) {
			var question = questions[i];
			if (question.scoreCalculation || (alwaysShowScore && notForScorm)) {
				info.countQuestions++;
				if (question.userResponses.isValidated === true) {
					info.countAnswers++;
					if (question.check(question.userResponses.getDecisions())) info.countCorrectAnswers++;
				}
				var quizScore = question.getScore();

				totalValue   += quizScore;
			}
		}

		info.countQuestions += elements.length;


		for(var i = 0;  i < elements.length; i++){
			totalValue += elements[i].score;
		}

		// var totalValueElmnt = 0;
		// for(var i = 0;  i < elements.length; i++){
		// 	totalValueElmnt += elements[i].score;
		// }

		if (info.countQuestions > 0) {
			//info.raw = Math.round(info.countCorrectAnswers / info.countQuestions * 10000) / 100;
			info.raw   =  Math.round(totalValue / (questionsData.nbreQuestions + questionsData.nbreElements));
			//info.raw  = questionsData.nbreQuestions > 0 ? totalValue / questionsData.nbreQuestions : 0;
			//info.raw += questionsData.nbreElements > 0 ? totalValueElmnt / questionsData.nbreElements : 0;
			//info.raw = questionsData.nbreQuestions > 0 && questionsData.nbreElements > 0  ? Math.round(info.raw / 2) : Math.round(info.raw);
		}

		return info;

	},

	// getQuizzCalculationInformation: function(quizIds, notForScorm) {
	//
	//
    //     var questionsData = this.getQuizzQuestions(quizIds);
    //     var questions = questionsData["questions"];
	//
    //     var alwaysShowScore = this._slideshow.getReader().AlwaysShowScore;
    //     var notScorm  = !(typeof notForScorm === "unedfined") && notForScorm == true;
	//
	// 	var info = { 'countQuestions': 0, 'countCorrectAnswers': 0, 'countAnswers': 0, 'min': 0, 'max': this.getQuizzMaxScore(), 'raw': 0 };
	//     var totalValue = 0;
	//
	// 	for(var i = 0; i < questions.length; i++) {
	// 		var question = questions[i];
	// 		if (question.scoreCalculation || (alwaysShowScore && notForScorm)) {
	// 			info.countQuestions++;
	// 			if (question.userResponses.isValidated === true) {
	// 				info.countAnswers++;
	// 				if (question.check(question.userResponses.getDecisions())) info.countCorrectAnswers++;
	// 			}
	// 		    var quizScore = question.getScore();
	//
	// 		    totalValue   += quizScore;
	// 		}
	// 	}
	//
	// 	if (info.countQuestions > 0) {
	// 		//info.raw = Math.round(info.countCorrectAnswers / info.countQuestions * 10000) / 100;
	// 		info.raw   =  Math.round(totalValue / questionsData.nbreQuestions);
	// 	}
	//
	// 	return info;
	//
	// },

	updateQuizQuestion: function(question) {
	},

	getQuizz : function(idQ){

		var slides = this._slideshow.getReader().getSlides();

		for(var islide = 0; islide < slides.length; islide++) {
			
			var slide = slides[islide];
			if ( slide.hasQuizz()  && slide.Id == idQ) {
				return slide.Quizz;
			}
		
		}

		return null;

	},

	getQuizzQuestions: function(quizIds, options) {

		var slides = this._slideshow.getReader().getSlides();
		var selectedQuiz = (Array.isArray(quizIds) && quizIds.length > 0);

		var questions = []; var indexQ = 0; elements = [];
		var nbreQuestionsInScore = 0, nbreElementsInScore = 0;

		for(var islide = 0; islide < slides.length; islide++) {

			var slide = slides[islide];
			if ( !selectedQuiz || ($.inArray(slide.Id,quizIds) >= 0)  ) {

				if(slide.hasQuizz()){

					var question = slide.Quizz.getQuestion(indQ);
					nbreQuestionsInScore += (!slide.Quizz.scoreCalculation) ? 0 : ($.isNumeric(slide.Quizz.NombreQuestionMax)) ? parseInt(slide.Quizz.NombreQuestionMax) : slide.Quizz.countQuestion();
					for(var indQ = 0; indQ < slide.Quizz.countQuestion(); indQ++) {
						var question = slide.Quizz.getQuestion(indQ);
						question.scoreCalculation = slide.Quizz.scoreCalculation;
						question.cmiIndex = indexQ++;
						questions.push(question);

					}

				} else if(slide.getAnimationsInScore(options).length > 0){
					var elements_list = slide.getAnimationsInScore(options);
					nbreElementsInScore += elements_list.length;
					for(var i = 0 ; i < elements_list.length; i++){
						elements.push({"id": elements_list[i].id, "score": elements_list[i].getAnimationScore()});
					}
				}

			}

		}

		return  {"questions" : questions, "nbreQuestions" :nbreQuestionsInScore, "elements": elements, "nbreElements": nbreElementsInScore };

	},

	// getQuizzQuestions: function(quizIds) {
	//
	// 	var slides = this._slideshow.getReader().getSlides();
	// 	var selectedQuiz = (Array.isArray(quizIds) && quizIds.length > 0);
	//
	// 	var questions = []; var indexQ = 0;
	// 	var nbreQuestionsInScore = 0;
	//
	// 	for(var islide = 0; islide < slides.length; islide++) {
	//
	// 		var slide = slides[islide];
	// 		if ( slide.hasQuizz() && ( !selectedQuiz || ($.inArray(slide.Id,quizIds) >= 0) ) ) {
	// 				var question = slide.Quizz.getQuestion(indQ);
	// 				nbreQuestionsInScore += (!slide.Quizz.scoreCalculation) ? 0 : ($.isNumeric(slide.Quizz.NombreQuestionMax)) ? parseInt(slide.Quizz.NombreQuestionMax) : slide.Quizz.countQuestion();
	// 			    for(var indQ = 0; indQ < slide.Quizz.countQuestion(); indQ++) {
	// 				    var question = slide.Quizz.getQuestion(indQ);
	// 				    question.scoreCalculation = slide.Quizz.scoreCalculation;
	// 				    question.cmiIndex = indexQ++;
	// 				    questions.push(question);
	//
	// 			    }
	// 		}
	//
	// 	}
	//
	// 	return  {"questions" : questions, "nbreQuestions" :nbreQuestionsInScore };
	//
	// },
	//
	getVersion: function() { return "1.0.4298"; }
	
},{
	
	getSuspendDataManager: function(fctsplit, fctjoin) {
		
		var data = { 
			
			_data: null,
			'fctSplit': fctsplit,
			'fctJoin': fctjoin,
			'read': function(n) {
				
				if (this._data) {
					switch(n) {
						case "currentslide":
							return (this._data["cs"]) ? this._data["cs"] : "";
							break;
						case "lastslidereaded":
							return (this._data["lsr"]) ? this._data["lsr"] : "";
							break;
						case "numberinteractionsstored":
							return (this._data["nbs"]) ? this._data["nbs"] : "";
							break;
						case "validquestions":
							return (this._data["vq"]) ? this._data["vq"] : "";
							break;
						case "interactions":
							return (this._data["ins"]) ? this._data["ins"] : "";
							break;
					}
				}
				
				alert("impossible to read suspend_data entry [" + n + "]")
				
			},
			'write': function(n,v) {
				
				if (!this._data) this._data = {};
				switch(n) {
					case "currentslide":
						this._data["cs"] = v;
						return;
					case "lastslidereaded":
						this._data["lsr"] = v;
						return;
					case "numberinteractionsstored":
						this._data["nbs"] = v;
						return;
					case "validquestions":
						this._data["vq"] = v;
						return;
					case "interactions":
						this._data["ins"] = v;
						return;
					
				}
				
				alert("impossible to write suspend_data entry [" + n + "]")				
				
			},
			'load': function(d) {
				if (!d) { this._data = {}; return; }
				this._data = this.fctSplit(d);
			},
			'formatToString': function() {
				return this.fctJoin(this._data);
			}
		};
		
		
		
		return data;
		
	}

});
