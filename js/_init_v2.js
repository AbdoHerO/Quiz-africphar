$(function(){
    
    


    /**************************************************
     * Script to initialise slideshow 
     * Hundling events
     * Type of Device / Events to trigger
     **************************************************/


	slideshow = null;
    cmpSwipe = 0;
    // IS_IPAD = (/iPad|iPhone|iPod/.test(navigator.platform) ||
	// 	(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
	// 	!window.MSStream ;

    clickEvent = window.IS_IPAD ? "touchend" : "click";
 

    /**************************************************
     *           Attach global events                 *
     **************************************************/

    function _gslideshow_events(slideshow){

    	$(document).on(clickEvent, "#transcriptmnu", function() {
      
           var $tsdiv = $("#transcript");
           $tsdiv.attr("data-open", $tsdiv.attr("data-open") != "1" ? "1": "0");
      
            if ($tsdiv.attr("data-open") == "1") {
               $tsdiv.animate({ left: "-=" + $("#transcripttext").outerWidth() }, 500);
            }

            else {
               $tsdiv.animate({ left: "+=" + $("#transcripttext").outerWidth() }, 500);      
            }
    
         });

    	// $(document).on('click', '.ssanimate:has(.jumpToSlide)',function(e) {
        $(document).on(clickEvent, '.jumpToSlide',function(e) {
            var x = e.type;
            console.log(e.type + ' is fired');
            
            e.preventDefault(); 
            var $this = $(this);
            var slideNumber = $this.attr("slide-num");
            var isDetached  = $this.attr("slide-detached") == "1";
            var slideAnchor = $this.attr("slide-anchor");

            if(slideAnchor && $.trim(slideAnchor) != "") {
                slideAnchorInfo = slideshow._xmlReader.getSlideByAnchor(slideAnchor, {'isDetached': isDetached}); 
                slideNumber     = (slideAnchorInfo) ? slideAnchorInfo.number : null;
            }

            if( $.isNumeric(slideNumber)){
                var dir = (parseInt(slideNumber) > slideshow.getCurrentSlide()) ? "forwar" : "backword";
                slideshow.changeSlide(dir,{"forceslide" : slideNumber, "isDetached" : isDetached, "isAnchor": (slideAnchor) ? true : false});
            }  

        });

        $("#exit").click(function() { 
    
            if (typeof parent.Academy_Header_Exit == 'function') 
                parent.Academy_Header_Exit();
            else
                document.location.href="http://actando.com";
    
        });

        // just stop swipe after changing the elements of Slider Type
        $(document).on("touchstart touchmove touchend",".slider, .stopSwipe",function(){

            slideshow.StopSwipe = true;
            cmpSwipe++;
            setTimeout(function(){
                cmpSwipe --;
                if(cmpSwipe <= 0) slideshow.StopSwipe = false;
            },800);

        });
       
        $(document).on(clickEvent, '.nextAnim',function() { 

            var slide = slideshow.getCurrentSlide();
            if(slide.Animation.getNext() != null){
                slideshow.pause();
                slideshow.actionPlayStop.call(slideshow); 
            }
            else{
                slideshow.actionNext.call(slideshow); 
            }
               
        });
        
        $(document).on(clickEvent, "#voiceover", function() { 
				
		    if (slideshow.WaitActionUser) { return; }
		    var curSlide = slideshow.getCurrentSlide();

			if (!$('#voiceover').hasClass("haspopover")) {
				
				$('#voiceover').popover({ 
					html: true,
					content: curSlide.VoiceOver,
					placement: 'top',
                    container: 'body'
				}).on('show.bs.popover', function () {
						$('#voiceover').addClass("haspopover");
				});
				$('#voiceover').popover("show");					
			}

	    });

	    $(document).on("click","#myBtnNextQuestion,#myBtnNext,#goToNextQuestion",function() { 

                if (slideshow.WaitActionUser) {  return; } 
                slideshow.actionNext.call(slideshow, { force: true} ); 

        });

        $(document).on("click","#btnRepeatQuiz",function(){

            var slideNumber = slideshow._dataCom.getCurrentSlide();
            slideshow.changeSlide.call(slideshow, "backword" ,{"forceslide" : slideNumber, "isDetached" : false}); 
               
        });

        $(document).on("change",".choiceSelect",function(){

            $this = $(this);
            var foundEmpty = false;
            lisChoice = $(this).closest(".questionsFillBlank").find(".choiceSelect");

            $.each(lisChoice,function(key,obj){
                if($(obj).val()==""){
                    $("#btnValidateQuiz").attr("disabled","disabled");
                    foundEmpty = true;
                    return;
                }
                if(!foundEmpty) $("#btnValidateQuiz").removeAttr("disabled");
            });

        });

        //help
        $("#help_content").dialog({
            modal:true,
            autoOpen: false,
            show: { effect: 'drop', direction: "left" },
            hide: { effect: 'drop', direction: "right" },
            width: 600
        });
            
        $("#help").on(clickEvent, function() { 
            if (slideshow.WaitActionUser) { return; } 
            $("#help_content").dialog("open"); 
        });

        $("#transcript").resizable({
            handles: 'e, w', 
            minWidth: 160,
            start: function(){
                $("#transcript").resizable("option","maxWidth",$(window).width()/2);
            },
            resize: function(q, ui){
                var w = $("#transcript").width();

                if($("#transcript").attr("data-open") != 1){
                    $("#transcript").resizable("option","maxWidth",ui.size.width);
                }
                else {
                    if($("#transcript").width() >= $(window).width()/2) $("#transcript").resizable("option","maxWidth",ui.size.width);
                    $("#transcripttext").css("width", ($("#transcript").width() - $("#transcriptmnu").outerWidth()) + "px");
                }                   
            },
            stop: function(){
                $("#transcript").resizable("option","maxWidth",$(window).width()/2);
            } 
        });

    }



    /**********************************************
     * External Callback functions for slideshow  *
     **********************************************/

    $.fn.myRandom = function() {
      var m = this.length, t, i;
      while (m) {
        i = Math.floor(Math.random() * m--);
        t = this[m];
        this[m] = this[i];
          this[i] = t;
      }
      return this;
    };

    urldecode = function (str) {
       return decodeURIComponent((str + '').replace(/\+/g, '%20'));
    };

    unloadEvent = function() {
        //Close LMS session
		if (slideshow._dataCom._session && slideshow._dataCom._session._lmsInitialise) {
			slideshow._dataCom.updateStatus();
			slideshow._dataCom.saveData({sendall : true});
			slideshow._dataCom._session.finish();
		}
    };

    function myUnloadHandler(evt){

		if (evt.persisted) {
			unloadEvent();
			return;
		}

	}

	slideLoaded = function(data) {
        
    };

    waitScreen = function(wait) {
            
        if (wait) {
            var divW = $("#wait").height();
            var divIc = $("#wait-icon-animated").height();
            $('#wait-icon-animated').css("margin-top", (divW - divIc) / 2);
            $("#wait").css("display", "block");
            $('#wait-icon-animated').sprite({fps: 18, no_of_frames: 9});						
        }
        else {
            $('#wait-icon-animated').destroy();
            $("#wait").css("display", "none");
        }
        
    };

    resizeSideBar = function(){


        if(this._xmlReader && this._xmlReader.CollapseBar && $("#sideBar").attr("processing") !="1"){
            
            var sidebarWidth = $(window).width() * this.sideBarInitDim.pWidth > this.sideBarInitDim.minWidth ? $(window).width() * this.sideBarInitDim.pWidth : this.sideBarInitDim.minWidth; // init
            var transcriptWidth = $("#transcriptmnu").outerWidth();
            $("#sideBar").css({"min-width": sidebarWidth, "max-width": sidebarWidth});
            $("#transcripttext").css("width", sidebarWidth - transcriptWidth);

            if($("#sideBar").attr("data-open") != "1" ){
              $("#sideBar").css("margin-right", -sidebarWidth + transcriptWidth)
            }

        }

    };

    initializesidebar = function(){

    	var sideBarInitDim = this.sideBarInitDim;
        if((!this._xmlReader || !this._xmlReader.CollapseBar || !sideBarInitDim)) return;
  
        /* construction of html */
        $("#slide").contents().unwrap();
        $("#transcript").wrap("<nav id='sideBar' style='visibility: hidden;'>");
        $("#transcript").contents().unwrap();
        $("#content").wrap("<div class='wrapper'>");
        $(".wrapper").prepend($("#sideBar").detach());
        $("#content").append($("#bottom-bar").detach());

        /* INITIALISE AND SCALE THE CONTENTS DIV */
        var sidebarWidth = $(window).width() * sideBarInitDim.pWidth > sideBarInitDim.minWidth ? $(window).width() * sideBarInitDim.pWidth : sideBarInitDim.minWidth; // init
        var transcriptWidth = $("#transcriptmnu").outerWidth();
        
        $("#sideBar").css({"min-width" : sidebarWidth, "max-width": sidebarWidth});
        $("#transcripttext").css("width", sidebarWidth - transcriptWidth);

        $("#transcriptmnu").on(clickEvent, $.proxy(function() {

            if(timer) return;

            $("#sideBar").attr("processing","1");
            var margin = 0, x = 0;  
            sidebarWidth = $(window).width() * sideBarInitDim.pWidth > sideBarInitDim.minWidth ? $(window).width() * sideBarInitDim.pWidth : sideBarInitDim.minWidth;
            transcriptWidth = $("#transcriptmnu").outerWidth();
           
            if($("#sideBar").attr("data-open") == "1"){ margin = - ( sidebarWidth - transcriptWidth ) ; $("#sideBar").removeAttr("data-open");}
            else{ $("#sideBar").attr("data-open","1");}
            
            $("#sideBar").animate({"margin-right": margin},{duration: sideBarInitDim.animDur});

            var timer  = setInterval($.proxy(function(){
               if(x <= sideBarInitDim.animSteps) { $(window).trigger('resize'); x++; }
               else { clearInterval(timer);  $("#sideBar").removeAttr("processing");timer = null; }
            },this),( sideBarInitDim.animDur / sideBarInitDim.animSteps ));  

        },this));

    };

    slideChanged = function(data) {

        //progression
        $("#numSlide").html((data.position + 1) + "/" + data.count);
        $("#slideprogressionbar").attr("aria-valuenow",(data.position + 1));
        $("#slideprogressionbar").attr("aria-valuemin",1);
        $("#slideprogressionbar").attr("aria-valuemax",data.count);
        $("#slideprogressionbar").width(Math.round((data.position + 1)/data.count*100)+"%");
        
        //title
        var title = data.slide.Title;
        if (data.slide.Type == "quiz") { /*title = data.slide.Quizz.getLabel("intro");*/ title = ""; }
        $("#Titre").html(title);
    
        //Chapter
		var disableShortCut = slideshow.getReader().DisableShortCut;
        var disableJTChapter  = slideshow.getReader().DisableJTChapter;
		var currentMaxSlide = slideshow._dataCom.getLastSlideReaded();
        var xmlReader = this._xmlReader;

        $(".is_chapter").each(function() {
			
			var $this = $(this);
            $this.removeClass("disabled");
            var isDropDown = xmlReader.DropDownChapter;
			var indchapter = $this.attr("data-chapter");
            if (indchapter == data.chapterindex) {
                $this.addClass("active");
                if(isDropDown){
                     $(".cb_namechapter").html($(this).find("a").html());
                }
            }
            else {
                $this.removeClass("active");
            }
			
			var activateLink = true;
			if (disableShortCut || disableJTChapter) {
				activateLink = parseInt($this.attr("data-slide")) <= currentMaxSlide;

			}
			
			if (activateLink) {

				$this.css({ 'cursor': '' });
				$this.find("a").css({ 'cursor': '' });
				$this.on(clickEvent, function() {
					if (slideshow.WaitActionUser) return false;
					slideshow.changeSlide($(this).attr("data-slide"));
                    if(isDropDown){
                     $(".cb_namechapter").html($(this).find("a").html());
                    }
				});

			}
			else {

				$this.css({ 'cursor': 'default' });
				$this.find("a").css({ 'cursor': 'default' });
				$this.off(clickEvent);
                $this.addClass("disabled");
			}
			
        });
		

        var slideVoiceOver = (data.slide.VoiceOver) ? data.slide.VoiceOver.replace(/<[/]*hvo>/g,"") : "";
        slideVoiceOver = slideVoiceOver.replace(/<htrans>((?!<htrans>)[.\s\S])*<\/htrans>/gm,"");
        $("#transcripttext").html(slideVoiceOver);
        
    };


    copyRightLoaded = function(copyRight){
       $("#copyRight").html(copyRight);
    };
    
    chaptersLoaded = function(chapters) {
    
        var liHTML = "";
        var lC = chapters.length;
        for(indChapter = 0; indChapter < lC; indChapter++) {
            var actClick = "";
            var chapStyle = "";
			var aStyle = "";
            liHTML += '<li data-slide="' + (chapters[indChapter].slide + 1) + '" id="chapter_' + indChapter + '" data-chapter="' + indChapter + '" class="is_chapter"><a href="#" onclick="return false;">' + chapters[indChapter].name + '</a></li>';
        }

        if(this._xmlReader.FullScreen) {
            $(".simpleChapter").hide();
            $(".dropDownChapter").show();
			if (slideshow._xmlReader.FullScreen) $(".dropdown_fullscreen_chapters").show();
            $(".dropdown-menu-chapter").html(liHTML);
         }
         else {
            $("#menu_items").html(liHTML);
         }
		
    };

    noteInfo = function(action, data) {
    
        switch(action) {

            case "remove":
                $(".slideshow_notebase.hastooltip").tooltip("destroy");
                $(".slideshow_notebase").remove();				
                break;
                
            case "close":
                $(".slideshow_notebase.hastooltip").tooltip("close");
                break
                
            case "add":
                
                var idNote = $(".slideshow_notebase").length + 1;
                
                var defClassIcon = "slideshow_note";
                if (data.info.Type == "pdf") defClassIcon = "slideshow_notepdf";
                if (data.info.Text) defClassIcon += ' hastooltip';
                
                $("#image").append('<div id="slideshow_note_' + idNote + '" class="slideshow_notebase ' + defClassIcon + '" title="">&nbsp</div>');
                $("#slideshow_note_" + idNote).css({ 'left': data.info.X + 'px' , 'top': data.info.Y + 'px' });
                
                if (data.info.Text) {
                    $("#slideshow_note_" + idNote).tooltip( { content: data.info.Text, position: { my: "left+5 center", at: "right center" }, width: '200px' } );
                }
                
                if (data.info.downloadLink) {
                    $("#slideshow_note_" + idNote).click({ dlink: data.info.downloadLink }, function(e) { window.open(e.data.dlink, 'Download'); });
                }
                
                break;
        }		
        
    };

    buttonStateChanged = function(data) {
    
        for(var btn in data) {

            $("#" + btn).css("cursor", data[btn].activate ? "pointer" : "default");
			
			if (data[btn].activate)
				$("#" + btn).removeClass("disabled");
			else
				$("#" + btn).addClass("disabled");
			
            switch(btn) {

                case 'first':
                    $("#" + btn).addClass("first");
                    break;
                case 'previous':
                    $("#" + btn).addClass("previous");
                    break;
                case 'next':
                    $("#" + btn).addClass("next");
                    break;
                case 'play':
                    if (data[btn].state != "play") {
						$("#" + btn).addClass("btnplay");
						$("#" + btn).removeClass("btnpause");
					}
                    else {
						$("#" + btn).removeClass("btnplay");
						$("#" + btn).addClass("btnpause");
					}
                    break;
                case 'repeat':
                    $("#" + btn).addClass("repeat");
                    break;					
				case 'voiceover':
                    if(this._xmlReader && this._xmlReader.HideTranscript){
                       $("#transcript").css({"display": "none"});
                       $("#sideBar").css({"display": "none"});
                    }
                    else{
                        $("#transcript").css({"display": (data[btn].activate ? 'block' : 'none' )});
                        $("#transcripttext").css({"display": (data[btn].activate ? 'block' : 'none' )});
                        if($("#sideBar").css("visibility") != "visible") $("#sideBar").css({"visibility":  'visible' });
                    }
                    if(slideshow && slideshow.initializeScriptAvataObj) slideshow.initializeScriptAvataObj.showAvatar.call(slideshow.initializeScriptAvataObj,data[btn].activate);
                    $("#" + btn).attr("src","images-new/" + (data[btn].activate ? "btn-voiceover@2x.png" : "btn-voiceover-inactive@2x.png")); 
                    break;					
					
            }
        }
    
    };

    function draggableItem(obj, selector){

       obj.draggable({
            revert :'invalid',
           cursor : 'move', 
           stack : selector 
       });

    };

    function dorppableItemCont(obj){

        obj.droppable({
            accept : function(d){
            if(d.attr('data-link')==$(this).attr('data-link')) return true;
                return false;
            },
            activeClass: 'hover',
            hoverClass: 'active',
            drop : function(event, ui){

                var current = ui.draggable; 
                $(this).append(current.css({'left':'0px', 'top':'0px'}));
                var listChoice = $(this).closest('.textQuiz').find(".itemDrop");
                var foundEmpty=false;

                $.each(listChoice,function(key,obj){
                   if(!($(obj).find(".itemDrag").length>0)){
                   foundEmpty=true;
                   $("#btnValidateQuiz").attr("disabled","disabled");
                   return;
                }

            });

            if(!foundEmpty) $("#btnValidateQuiz").removeAttr("disabled");
            return false;
            }
        });
    };

    function droppableZone(obj){
        
        obj.droppable({
            accept : '.itemDrag',
            activeClass: 'hover',
            hoverClass: 'active',

            drop : function(event, ui){
                var current = ui.draggable; 
                var detach = current.detach(); 

                if($(this).find(".itemDrag").length){
        
                    var $currentItem = $(this).find(".itemDrag");
                    var left1 = $(this).position().left;
                    var top1 = $(this).position().top;
                    var left2 = $(".itemDragCont[data-link="+$currentItem.attr("data-link")+"]").position().left;
                    var top2 = $(".itemDragCont[data-link="+$currentItem.attr("data-link")+"]").position().top;
                    var cssT = {'left':left1-left2+'px', 'top':top1-top2+'px','z-index':0};
                    $(".itemDragCont[data-link="+$currentItem.attr("data-link")+"]").append($currentItem.css(cssT).animate({'left':'0px','top':'0px'}));

                }

                $(this).empty();
                $(this).prepend(detach.css({'left':'0px','top':'0px'})); // et enfin, ajout de l'image dans 
                var listChoice = $(this).closest('.questionsDrag').find(".itemDrop");
                var foundEmpty = false;

                $.each(listChoice,function(key,obj){

                    if(!($(obj).find(".itemDrag").length>0)){
                        foundEmpty=true;
                        $("#btnValidateQuiz").attr("disabled","disabled");
                        return;
                    }

                });

                if(!foundEmpty) $("#btnValidateQuiz").removeAttr("disabled");
            }

        });
    };

    slideInfo = function(action, data) {
    
        switch (action) {
			
			case "transcripttext":

				if (data) {
					//Has transcript => show the div and set the text
				}
				else {
					//No transcript => hide the div
				}
				break;
			
            case "hideinfo":

                $("#text").css("display", "none");
                break;
                
            case "dispinfo":	

                var $text = $("#text");
				$text.removeAttr("data-left"); $text.removeAttr("data-top"); $text.removeAttr("data-width");
				$("#text").css({'position': '', 'left:': '', 'width': '', 'font-size': ''});
                $text.removeClass("textIntro").removeClass("textQuiz").removeClass("textConclusion").removeClass("textToResize");
                $text.html(data.Text);
                $text.css("display", "block");

                switch(data.Type) {

                    case "introduction": $text.addClass("textIntro"); break;
                    case "quiz":
						var css = { 'position': 'absolute', 'font-size': (slideshow.ResizeCoef * 100) + '%' };
						if (data.Slide.Quizz.TitlePosX)  { css["left"]  = slideshow.getPixelParam(data.Slide.Quizz.TitlePosX) * slideshow.ResizeCoef; $text.attr("data-left", slideshow.getPixelParam(data.Slide.Quizz.TitlePosX)); }
						if (data.Slide.Quizz.TitlePosY)  { css["top"]   = slideshow.getPixelParam(data.Slide.Quizz.TitlePosY) * slideshow.ResizeCoef; $text.attr("data-top", slideshow.getPixelParam(data.Slide.Quizz.TitlePosY)); }
						if (data.Slide.Quizz.TitleWidth) { css["width"] = slideshow.getPixelParam(data.Slide.Quizz.TitleWidth) * slideshow.ResizeCoef; $text.attr("data-width", slideshow.getPixelParam(data.Slide.Quizz.TitleWidth)); }
						$text.css(css);
						$text.addClass("textToResize");

                        if($.trim(data.QuizType) == "fillBlankQ" || $.trim(data.QuizType) == "dragDropQ"){
                            $text.html('<div class="textQuiz">' + data.Text + '</div><button id="btnValidateQuiz" disabled class="btn btn-primary" >Validate</button><button id="btnStartQuizz" style="display:none" class="btn btn-primary" >Submit</button><div id="contentComment"><div id="choicecomment"></div></div>');
                            $text.find("#btnValidateQuiz").on('click', function() {
                            slideshow.validateQuiz.call(slideshow); });
                        }
                        else{
						   $text.html('<div class="textQuiz">' + data.Text + '</div><button id="btnStartQuizz" class="btn btn-primary" >Submit</button>');
                        }

						$text.find("#btnStartQuizz").on('click', function() { if (slideshow.WaitActionUser) { return; } slideshow.actionNext.call(slideshow, {force: true}); });

						break;
                    case "conclusion": $text.addClass("textConclusion"); break; 
                }
				break;
                    
            case "displayquiz":
         
                //Display quizz screen
                $("#quiz").removeClass("quizResults");
                $("#quiz").addClass("quizQuestions");
                $("#quiz").css("display", "block");
                $("#question").css("display", "");
                $("#responses").css("display", "");
                $("#instruction").css("display", "");
                $("#result").css("display", "");				
                break;
            
			case "hidequiz":
				$("#quiz").css("display", "");
				break;
            
			case "displayquizres":
				$("#quizres").css("display", "block");
				$("#quizres").highcharts(data.highchartsdata);
				break;
            
			case "displayquizreshtml":
				$("#quizres").html(data.html);
				$("#quizres").css("display", "block");
				break;
            
			case "hidequizres":
				if (data.hasHC) $("#quizres").highcharts("destroy");
				$("#quizres").css("display", "");
				$("#quizres").html("");				
                break;
                
            case "displayquizClassification": 
                
                if(!data || !data.linkedQuizz || !data.curSlide) return '';
                
                var question = data.curSlide.Quizz.getQuestion(0); // only one question 
                if(!question) return; 

                $("#question").html(question.Text);
               
                var htmlContent = '<div class="classQuiz" style="font-size:11px; width:100%;">';
                htmlContent += '<div class="classQuizResponse">';
                htmlContent += '<table class="table table-bordered table-condensed">';
              
                htmlContent += '<tr><td></td><td class="spanChoices"></td>';
                

                for(var indCh = 0; indCh < question.choices.length; indCh++) {
                    htmlContent += '<th>' +question.choices[indCh].Text + '</th>';
                }

                htmlContent += '</tr>';

                for(var indQuizz = 0; indQuizz < data.linkedQuizz.length; indQuizz++){
                    var countQ = data.linkedQuizz[indQuizz].Quizz.countQuestion();
                    htmlContent += '<tr><th>' + data.linkedQuizz[indQuizz].Quizz.getLabel("intro") + '</th><th class="thColspan" colspan="'+( question.choices.length + 1 )+'"></th></tr>';
                    for(var indQ = 0; indQ < countQ; indQ++) {
                        var q = data.linkedQuizz[indQuizz].Quizz.getQuestion(indQ);
                        htmlContent += '<tr id="l_'+data.linkedQuizz[indQuizz].Id + '_' + indQ+'">';
                     
                        htmlContent += '<td>' +q.Text+ '</td>';

                        htmlContent += '<td class="spanChoices">';
                        if (q.userResponses.isValidated){
                            for(var indCh = 0; indCh < q.choices.length; indCh++) {
                                 if(q.userResponses.responseExists(q.choices[indCh].Id)){
                                    htmlContent += '<span class="cl_dragZone btn-primary btn btn-xs" data-info= "'+data.linkedQuizz[indQuizz].Id + '.' + indQ + '.' + q.choices[indCh].Id+'" data-q="'+indQuizz+'_'+indQ+'" id="cl_'+indQ+'_'+q.choices[indCh].Id+'">' +q.choices[indCh].Text + '</span>' ;
                                 }
                            }
                         }

                        htmlContent += '</td>';

                        for(var indCh = 0; indCh < question.choices.length; indCh++) {
                            htmlContent += '<td data-rang="'+question.choices[indCh].Id+'" data-id="'+question.choices[indCh].Id+'"  data-q="'+indQuizz+'_'+indQ+'" class="cl_dropZone choice_'+indCh+'"></td>';
                        }

                        htmlContent += '</tr>';
                    }
                }
                
                htmlContent += '<tr><th class="thColspan" colspan="2">Score</th>';

                for(var indCh = 0; indCh < question.choices.length; indCh++) {
                    htmlContent += '<td data-ranginfo="'+question.choices[indCh].Id+'" class="scoreClassification">0</td>';
                }
                htmlContent    += '</tr></table>';
                htmlContent    += '</div>';

                htmlContent    += '<div class="classQuizDecision" style="display:none;"><div class="form-inline" onclick="return false;">';
                htmlContent    +=   '<label class="element" id="confirmBTN">Confirmez vous que la couleur dominante du médecin est bien: </label> &nbsp;';
                htmlContent    +=   '<select class="form-control input-sm element">';
                for(var indCh = 0; indCh < question.choices.length; indCh++) {
                    htmlContent += '<option value="'+question.choices[indCh].Id+'">' + question.choices[indCh].Text + '</option>';
                }
                htmlContent    +=   '</select>';
                htmlContent    +=  '<br><button class="btn btn-primary btn-sm " id="confirmBTN">'+slideshow.getLabel("validate")+'</button>';
                htmlContent    += '</div></div>';

    
                htmlContent    += '</div>';

                


                var $html = $(htmlContent);

                $(".classQuizDecision .element").prop("disabled", true);
                $(".classQuizDecision").css("display", "none");
                $("#myBtnNextQuestion").css("display", "none");

                $html.find("#confirmBTN").click(function(){
                    if (slideshow.WaitActionUser) {  return; } 
                    slideshow.actionNext.call(slideshow, { force: true} ); 
                    //$("#myBtnNextQuestion").css("display","block");
                });

                $html.find(".cl_dragZone").each(function(key, obj){
                    draggableItem($(obj), '.cl_dropZone');
                });
                $html.find(".cl_dropZone").each(function(key, obj){
                $(obj).droppable({
                    accept : '.cl_dragZone',
                    activeClass: 'hover',
                    hoverClass: 'active',
                    drop: function (ev, ui) {
                        var $draggable = $(ui.draggable).css({"left":"","top":""});
                        if($(ev.target).attr("data-q") != $draggable.attr("data-q")) return false;
                        $(ev.target).append($draggable);
                        var choiceMax = {'value': -1, 'order': -1};
                        $(".scoreClassification").each(function(key, td){
                            var $td  = $(td);
                            var score = 0;
                            var rang = $td.attr("data-ranginfo");
                            $("[data-rang="+rang+"]").each(function(ket, tdR){
                                score += $(tdR).find(".cl_dragZone").length;
                            });
                            if(score > choiceMax.value) {choiceMax.value = score; choiceMax.Id = $td.attr("data-ranginfo")};
                            $td.html(score);

                        });

                        if($(".spanChoices span").length == 0 ){
                            $(".spanChoices").remove();
                            $(".thColspan").each(function(key, el){
                                $(el).attr("colspan", parseInt($(el).attr("colspan")) - 1);
                            });
                            $(".classQuizDecision").css("display", 'block');
                            $(".classQuizDecision select").val(choiceMax.Id);
                           // $("#myBtnNextQuestion").css("display", 'block');
                        }
                        
                    }
                });

            });
                $("#choices").append($html);
               break;

            case "displayquizFillBlank" :

                var listQuestions= data.getQuestions();
                var strInsert = $('<div class="questionsFillBlank"></div>');  
                var strQuestions = $('<form class="form-inline"></form>');  

                if(data.QuizQuestion!=null){
                    strQuestions.append("<div class=' questionQuiz' >"+data.QuizQuestion+"</div>");
                }     

                for(var indQ = 0; indQ < listQuestions.length; indQ++) { 

                	var question=listQuestions[indQ];
                    var selectList='<span class="styled-select"><select question-id="'+question.Id+'" class="choiceSelect form-control input-sm"><option value="">Choose Answer</option>';
                    
                    for (var i = 0; i < question.choices.length; i++) {
                        var choix=question.choices[i];
                        selectList+="<option value="+choix.Id+">"+choix.Text+"</option>";
                    }
                    selectList+="</select></span>";

                    var strQuestion=$("<p class='questionFillBlank'>");
                    var text =question.Text.replace(/_{2,}/,selectList);
                    strQuestion.append("<div class='form-group form-group-sm' > "+(indQ+1)+") "+text+"</div>");
                    strQuestions.append(strQuestion);
                }

                strInsert.append(strQuestions);
                $(".textQuiz").html(strInsert);

            break;

            case "displayquizDragDrop" :
            
                var listQuestions= data.getQuestions();
                var strProposition = $('<div class="listItemsDrag"></div>');  
                var  strQuestions=$('<div class="questionsDrag"></div>')  ;  

                if(data.QuizQuestion!=null){  strProposition.prepend("<div class='questionQuiz'>"+data.QuizQuestion+"</div>"); }
                
                for(var indQ = 0; indQ < listQuestions.length; indQ++) { 
                	var question=listQuestions[indQ];
                    var itemDrop=$('<span class="itemDrop" data-info="'+question.Id+'"></span>');
                    var pQuestion=$('<p>'+question.Text.replace(/_{2,}/,'')+'</p>');
                    pQuestion.append(itemDrop);

                    for (var i = 0; i < question.choices.length; i++) {
                        var choix=question.choices[i];
                        var itemDragCont=$("<span class='itemDragCont' data-link='"+question.Id+"_"+choix.Id+"'></span>");
                        var itemDragRemind=$("<span class='itemDragRemind' data-link='"+question.Id+"_"+choix.Id+"'>"+choix.Text+"</span>");
                        var pChoix=$("<span class='itemDrag' data-link='"+question.Id+"_"+choix.Id+"'>"+choix.Text+"</span>");
                        draggableItem(pChoix, '.itemDrag');
                        dorppableItemCont(itemDragCont);
                        droppableZone(itemDrop);
                        itemDragCont.append(itemDragRemind);
                        itemDragCont.append(pChoix);
                        strProposition.append(itemDragCont);
                    }
                    
                    strQuestions.append(pQuestion);
                }
                
                $(".textQuiz").append(strProposition);$(".textQuiz").append(strQuestions);
            break;

            case 'validInvalidQuiz':
                
                var $container = $('<div class="responseQuiz col-md-12">');
                $("#question").html(data.question);
                /* Choices Div */
                var $choicesDiv = $('<div class="col-md-4 col-xs-4 optionsContainer1">');

                if(!data.q.userResponses.isValidated){

                    for(var indQ = 0; indQ < data.choices.length; indQ++) {
                       if($.trim(data.choices[indQ].Text) == "") break;
                       $choiceDiv = $('<div class="choiceDivMirror" id="m_'+data.choices[indQ].Id+'">');
                       $choiceDiv.append('<div class="optionDiv1 choiceDiv" id="div'+data.choices[indQ].Id+'">');
                       $choiceDiv.find('.optionDiv1').append('<div class="optionDiv2">');
                       $choiceDiv.find('.optionDiv2').append('<p>'+data.choices[indQ].Text+'</p>');
                       $choicesDiv.append($choiceDiv);
                    }

                }
                else{

                    for(var indQ = 0; indQ < data.choices.length; indQ++) {
                      if($.trim(data.choices[indQ].Text) == "") break;
                      $choiceDiv = $('<div class="choiceDivMirror" id="m_'+data.choices[indQ].Id+'">&nbsp;</div>');
                      $choicesDiv.append($choiceDiv);
                    }

                }

                $container.append($choicesDiv);

                var $validDiv   = $('<div class="col-md-4 col-xs-4 optionsContainer">');
                $validDiv.append('<div class="optionDiv1 validDiv"><div class="optionDiv2"><p>Valid</p></div></div>');
                $validDiv.append('<div class="choicesContainer validContainer">');
                $validDiv.find('.choicesContainer').append('<p class="rotate">valid options</p>');

                if (data.q.userResponses.isValidated){
                   for(var indQ = 0; indQ < data.choices.length; indQ++) {

                        if(data.q.userResponses.responseExists(data.choices[indQ].Id)){
                           var choiceDiv  = $('<div class="optionDiv1 choiceDiv" id="div'+data.choices[indQ].Id+'">');
                           choiceDiv.append('<div class="optionDiv2">');
                           choiceDiv.find('.optionDiv2').append('<p>'+data.choices[indQ].Text+'</p>');
                           $validDiv.find('.choicesContainer').append(choiceDiv); 
                        }

                   }

                }
                $container.append($validDiv);


                var $inValidDiv   = $('<div class="col-md-4 col-xs-4 optionsContainer">');
                $inValidDiv.append('<div class="optionDiv1 invalidDiv"><div class="optionDiv2"><p>Invalid</p></div></div>');
                $inValidDiv.append('<div class="choicesContainer invalidContainer">');
                $inValidDiv.find('.choicesContainer').append('<p class="rotate">valid options</p>');
                $container.append($inValidDiv);

                if (data.q.userResponses.isValidated){

                    for(var indQ = 0; indQ < data.choices.length; indQ++) {

                        if(!data.q.userResponses.responseExists(data.choices[indQ].Id)){
                            var choiceDiv  = $('<div class="optionDiv1 choiceDiv" id="div'+data.choices[indQ].Id+'">');
                           choiceDiv.append('<div class="optionDiv2">');
                           choiceDiv.find('.optionDiv2').append('<p>'+data.choices[indQ].Text+'</p>');
                           $inValidDiv.find('.choicesContainer').append(choiceDiv); 
                        }

                    }
                }


                $("#choices").html($container);

                $(".choiceDivMirror").each(function(key,obj){
                   var h = $(".choiceDiv").height();
                   $(obj).height(h);
                });

            break;

            case 'displayButtonQ' :
            
            $("#question").html(data.question);
            var strQuestion = '<table class="tabchoices">';

            if(data.choices.length > 0)   strQuestion += '<tr>';

            for(var indQ = 0; indQ < data.choices.length; indQ++) {

                if($.trim(data.choices[indQ].Text) == "") break;
                var cl = data.q.userResponses.responseExists(data.choices[indQ].Id) ? "checked" : "";
                strQuestion += '<td class="col-md-4 case"> <button class="btnStyle ' + cl + '" id="btn' + data.choices[indQ].Id + '">' + data.choices[indQ].Text + ' </button></td>';
                   
                if( (indQ + 1) % 3 == 0){
                    strQuestion += '</tr>';
                    strQuestion += '<tr>';
                }

            }

            if( indQ % 3 == 0){
               strQuestion += '</tr>';
            }

            strQuestion += '</table>';
            $("#choices").html(strQuestion);
               
            break;

        case 'displayButtonImgQ' :
            
            $("#question").html(data.question);
             var classDiv     = (data.choices.length > 4) ? 'col-md-6 col-md-offset-1' : 'col-md-4 ';
             var nbrCell      = (data.choices.length > 4) ? 2 : 1;
             var img          = (data.q.Image) ? '<img src="'+ this._xmlReader._picPath + data.q.Image +'" class="img-responsive" />' : ''; 
             var strQuestion  =  '<div class="col-md-12" >'
                              +  '  <div class="col-md-8" >'
                              +  '     <div id="imgQuizContainer">' + img
                              +  '     </div>'
                              +  '  </div>'
                              +  '  <div class="'+classDiv+'" >'
                              +  '    <table class="tabchoices">';

            if(data.choices.length > 0)   strQuestion += '<tr>';

            for(var indQ = 0; indQ < data.choices.length; indQ++) {

                if($.trim(data.choices[indQ].Text) == "") break;

                var cl = data.q.userResponses.responseExists(data.choices[indQ].Id) ? "checked" : "";
                strQuestion += '<td class="col-md-4 case"> <button class="btnStyle ' + cl + '" id="btn' + data.choices[indQ].Id + '">' + data.choices[indQ].Text + ' </button></td>';
                   
                if((indQ + 1)%nbrCell == 0){
                    strQuestion += '</tr>';
                    strQuestion += '<tr>';
                }
            }

            if( indQ % 3 == 0){
                strQuestion += '</tr>';
            }
            
            strQuestion      += '    </table>';
                              +  '</div>'
                              +  '</div>';

            $("#choices").html(strQuestion);
               
            break;
            
			case "displayquizquestion":
			
				//Question text
				$("#question").html(data.question);
                
                //Choices
                var strQuestion = '<table class="tabchoices">';

                for(var indQ = 0; indQ < data.choices.length; indQ++) {
                    // dont show the empty choices
                    if($.trim(data.choices[indQ].Text) == "") break;

					var cl = data.q.userResponses.responseExists(data.choices[indQ].Id) ? "imgCheck" : "imgUncheck";
					strQuestion += '<tr>';
					strQuestion += '<td style="vertical-align:top"; ><div class="imgChoiceCheck ' + cl + '" id="chk' + data.choices[indQ].Id + '"></div></td>'; // tag id + class imgChoiceCheck is very important don't remove them
					strQuestion += '<td><div class="choicetxt" id="choice' + data.choices[indQ].Id + '">' + data.choices[indQ].Text + '</div></td>'; // choicetxt is important
					strQuestion += '</tr>';

				}

                strQuestion += '</table>';
                $("#choices").html(strQuestion);
                
                //images effect
                if (data.q.userResponses.isValidated && ! data.quizRetry) {
                    $(".imgChoiceCheck").css('cursor', 'default');
                }
                else if(data.rightToRetry) {
                    
                    $(".imgChoiceCheck").css('cursor', '');
                    $(".imgChoiceCheck").mouseover(function() {
                        $this = $(this);
                        if (!$this.data("disabled"))  {
                            $this.addClass("imgCheck");								
                            $this.removeClass("imgUncheck");								
                        }
                    })
                    .mouseout(function() {
                        $this = $(this);
                        if ($this.data("check") != true) {
                            $this.addClass("imgUncheck");																
                            $this.removeClass("imgCheck");								
                        }
                    });
                    
                }
		
				$("#instruction").html(data.instruction);
				slideshow.resizeDivImage();
				
                break;

            case "displayquizrepeat":
                
                $("#result").html(data.result);
                var content = slideshow.getLabel("retryquizlabel");
                content = content.replace("{{score}}",data.result);
                $("#resultText").html(content); 
                $("#result").css("display", "none");
                $("#resultText").css({"display" : "block", "text-align" : "left" });
                $("#quiz").addClass("quizRetry");
                $("#quiz").removeClass("quizResults");
                $("#quiz").removeClass("quizQuestions");
                $("#question").css("display", "none");
                $(".imgQuizzBackGround").css("display", "none");
                $("#responses").css("display", "none");
                $("#instruction").css("display", "none");

                break;
            
			    case "displayquizresult":


                $("#result").html(data.result + "%");
                var content = slideshow.getLabel("resultQuizLabel");
                content = content.replace("{{nbrResp}}",data.quizGood);
                content = content.replace("{{nbrTotal}}",data.quizTotal);
                $("#resultText").html(content); 
                $("#result").css("display", "block");
                $("#resultText").css("display", "block");
                $("#quiz").addClass("quizResults");
                $("#quiz").removeClass("quizQuestions");
                $("#quiz").removeClass("quizRetry");
                $("#question").css("display", "none");
                $(".imgQuizzBackGround").css("display", "none");
                $("#responses").css("display", "none");
                $("#instruction").css("display", "none");

                break;
            
            case "displaysuspend":

                var divW = $("#start").height();
                var divIc = $("#startpicture").height();
                $('#startpicture').css("margin-top", (divW - divIc) / 2);
                $("#start").css("display", "block");
                break;
    
            case "hidesuspend":
                $("#start").css("display", "");
                break;
    
        }
        
    };



    /*******************************
       Initialise window events
    ********************************/
    window.onbeforeunload = unloadEvent;
    window.onunload = unloadEvent;

    if (!window.location.getParameter) {
        
        window.location.getParameter = function(key) {
        
            key = key.toLowerCase();
            var q=window.location.search.substring(1);

            if(q && q.length > 2) {

                var params=q.split("&");
                var l=params.length;
                for (var i=0;i<l;i++) {
                    var pair=params[i].split("=");
                    if (pair[0].toLowerCase()==key) return pair[1];
                }

            }	
            
        };

    };



    /**************************************************************
       call functions 
    **************************************************************/
    var dt = new Date();
    $(".year").html(dt.getFullYear());
    waitScreen(true);

    if(!window.cfgfilepath){
       window.cfgfilepath  = window.location.getParameter("cfgpath");
       if (!window.cfgfilepath) window.cfgfilepath = "res/config.js"; else window.cfgfilepath = urldecode(cfgfilepath);
    }

    /****************************************************************
       Instanciation for slideshow Object and initialise contents
    *****************************************************************/

    slideshow = new SlideShow(window.cfgfilepath, function() { 
            
      if (window.parent.sendToLmsDuringTransition) this.AlwaysSendProgression = window.parent.sendToLmsDuringTransition;

      //Attach events
      this.onWait = waitScreen;
      this.onSlideLoaded = slideLoaded;
      this.onChaptersLoaded = chaptersLoaded;
      this.onCopyRightLoaded = copyRightLoaded;
      this.onNote = noteInfo;
      this.onButtonStateChanged = buttonStateChanged;
      this.onSlideChanged = slideChanged;
      this.onSlideInfo = slideInfo;
      this.initializeSideBarObj = {'initializesidebar': initializesidebar, 'resizeSideBar' : resizeSideBar};
      //this.initializeScriptAvataObj   = new AvatarTranscript();
      

      //buttons event
      $("#next").on('click', function() { if (slideshow.WaitActionUser || $(this).hasClass("disabled")) { return; } slideshow.actionNext.call(slideshow); });
      $("#first").on('click', function() { if (slideshow.WaitActionUser || $(this).hasClass("disabled")) {  return; } slideshow.actionFirst.call(slideshow); });
      $("#previous").on('click', function() { if (slideshow.WaitActionUser || $(this).hasClass("disabled")) { return; } slideshow.actionPrevious.call(slideshow); });
      $("#play").on('click', function() { if (slideshow.WaitActionUser || $(this).hasClass("disabled")) { return; } slideshow.actionPlayStop.call(slideshow); });
      $("#repeat").on('click', function() { if (slideshow.WaitActionUser || $(this).hasClass("disabled")) { return; } slideshow.actionRepeat.call(slideshow); });
      $("#start").on('click', function() { $("#start").css("display", ""); slideshow.actionPlay.call(slideshow);});

      _gslideshow_events(slideshow);

      // not set it 
      //Load files and initialize
      this.initialize(function() {

       // if(this._xmlReader && this._xmlReader.ScriptAvatar) this.initializeScriptAvataObj   = new AvatarTranscript();
       
       if(this._xmlReader && this._xmlReader.ScriptAvatar && this._xmlReader.ScriptAvatar != 0) this.initializeScriptAvataObj   = new AvatarTranscript({"type" : this._xmlReader.ScriptAvatar});
                
        //Display banner
        if (this._xmlReader._customBanner != "" || this._xmlReader._customBannerHD != "") {

          var urlBanner = $("#navbanner").css("background-image");
          var posExt = urlBanner.indexOf(".");
          var boolHD = false;
          if (posExt > 3) urlBanner = urlBanner.substr(posExt - 3, 3);
          boolHD = (urlBanner.toLowerCase() == "@2x");
          if (!boolHD && this._xmlReader._customBanner != "") $("#navbanner").css("background-image", 'url("' + this._xmlReader._customBanner + '")');
          if (boolHD && this._xmlReader._customBannerHD != "") $("#navbanner").css("background-image", 'url("' + this._xmlReader._customBannerHD + '")');
        }
        
        $("#navbanner").css("visibility", "visible");      
          //help
        var help = this.getHelp();
        $( '#help_content' ).dialog({  autoOpen: false, }); 
        $('#help_content').dialog('option', 'title', help.title);
        $("#help_content").html(help.content);				
                
        $(document).attr('title', this.getLabel("title")) //Bug IE if $("title").text("toto");
        $("#moduletitle").text(this.getLabel("title"));
        $("#exitLabel").text(this.getLabel("exit"));

        // traduction of static labels
        // $("#myBtnNextQuestion").text(this.getLabel("nextQuizBTNLabel"));
        var nextLabelName = slideshow._xmlReader.getOptions('nextQuizBTNLabel');
        $("#myBtnNextQuestion").text(slideshow._xmlReader.getLabel((nextLabelName) ? nextLabelName : "nextQuizBTNLabel"));
        $("#goToNextQuestion").text(slideshow._xmlReader.getLabel("nextQuizBTNLabel"));
        $("#modalCloseBTN").html(slideshow._xmlReader.getLabel('close'));
        $("#transcriptLabel").html(slideshow.getLabel("transcript"));
					
		var lbl = this._xmlReader.getLabel("chapters", true);
		if (!lbl) lbl = "Chapters";
	    $(".cb_namechapter").html(lbl);
        $("#slide").attr('lang',this._xmlReader.language);


        if(this._xmlReader.language == 'ar'){
          $("#content").attr('dir','rtl');
          $("#slide").attr('dir','rtl');
          $("#myModal").attr('dir','rtl');
          $("#sideBar").attr('dir','rtl');
        }
					       
      });
            
      }, 
      { 'container': $('#image'), 'playeraudio': $('#playeraudio'), 'playervideo': $('#movie'), 
                            'audioOptions': { 'audiovideosettings': { 'flash': { 'version': '5' } } },
                            'videoOptions': { 'audiovideosettings': { 'flash': { 'version': '5' } } }
      }
    );


});