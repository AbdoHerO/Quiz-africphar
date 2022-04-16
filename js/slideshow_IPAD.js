/** @license
 *
 * SlideShow javascript
 * ----------------------------------------------
 * http://www.actando.com
 *
 * Copyright (c) 2013, IT Team. All rights reserved.
 * 
 * http://stephband.info/jquery.event.swipe/
 *
 * 
 */

/**********************
* CLASS SlideShow
**********************/
var SlideShow = $.inherit({
    
    _options: null,
    _rescfg: null,
    _dataCom: null,
    
    _xmlReader: null,
    _callbackinitialize: null,
    
    _transitionInProgress: false,
    _lastSlideDirection: "forward",
    _lastSlide: null,
    _currentSoundInProgress: null,
    
    /** quizz **/
    _quizProgress: null,
    _quizWaitUserChoices: false,

    _readaudioafter: null,
    
    _buttonState: { 'first' : { 'activate': true }, 'play' : { 'activate': true, 'state': 'play' }, 'previous' : { 'activate': true }, 'next': { 'activate': true }, 'repeat': { 'activate': true }, 'voiceover': { 'activate': true } },
    _highChartIsLoaded: null,
    
    //Events
    onWait: null,
    onSlideLoaded: null,
    onChaptersLoaded: null,
    onNote: null,
    onButtonStateChanged: null,
    onSlideChanged: null,
    onSlideInfo: null,
    
    //Variables publics
    AlwaysSendProgression: false,
    WaitActionUser: false,
    StopSwipe: false,
    latsTransition:null,
    
    ResizeCoef: 1,
    isIPAD: false,
    isMobileDevice: false,
    suspendAction:false,

    margingFullScreen : 40,
    notYetCalculated:true,
    timer:null,
    passtoFullScreen:false,
    isBlocked : false,
    isModalOpened : false,
    forcedScore : 80,
    
    //Init dimension for side Bar
    sideBarInitDim:{
       pWidth: 0.12,
       animDur: 300,
       minWidth: 160,
       animSteps: 12
    },

      //Save state before passed to detached slides (we use only animations slide is in ss_com)
    suspend_data : null,

    /* Constructor
    *
    */
    __constructor : function(cfgpath, callbackCfgLoaded, options) {
        
        // valid only on IOS < 13
        this.isIPAD = navigator.userAgent.match(/iPad/i) != null;
        if (!this.isIPAD) this.isIPAD = (navigator.userAgent.match(/iPhone/i) != null) || (navigator.userAgent.match(/iPod/i) != null);
        
        this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        this._options = $.extend({}, this.getDefaultOptions(), options);

        if (this._options.container == null) alert("SlideShow : Impossible to find container !!");
            
        var oRef=this;
        $.getScript(cfgpath, function() { 
            
            //Initialize some variable
            oRef._rescfg = new SlideShow_ConfigRes();
            
            if (oRef._rescfg.debug && ActDebug) { ActDebug.initialize(); }
            
            if (oRef._rescfg.jscom) {
                oRef._dataCom = new window[oRef._rescfg.jscom](oRef);
            }
            else {
                oRef._dataCom = new SS_COM(oRef);
            }
            
            //callback
            if (typeof callbackCfgLoaded == "function") callbackCfgLoaded.call(oRef);
            
        });
        
        this.resizeDivImage();
        
        $(window).resize($.proxy(function() { this.resizeDivImage(); }, this));
        
    },
    
    getDefaultOptions: function() {
        return {'startSlide': null, 'containerWidth': 1024, 'containerHeight': 546, 'container': 'body', 'playeraudio': null, 'playervideo': null, 'audioOptions': null, 'videoOptions': null};   
    },

    initialize: function(callbackinit){
        

        this._callbackinitialize = callbackinit;
        
        var oRef=this;
        $.ajax({
            type: "GET",
            url: oRef._rescfg.xmlslideshow,
            dataType: "xml",
            cache: false,
            success: function(xml) {
            
                oRef._xmlReader = new SlideShow_XML(xml, { "dataCom": oRef._dataCom, "displaySlides" : oRef._rescfg.displayslide ,'players' : {'playeraudio' : oRef._options.playeraudio , 'playervideo' : oRef._options.playervideo} } );
                
                //Load specific CSS
                if (oRef._xmlReader._customCSS) {
                    //oRef._xmlReader._moduleTheme
                    $.loadCSSAsync([oRef._xmlReader._moduleTheme + oRef._xmlReader._customCSS], null);
                }
                
                //Load highchart or not ?
                var loadHighChart = false;
                for(var indS = 0; indS < oRef._xmlReader.slideCount(); indS++) {
                    var curSlide = oRef._xmlReader.getSlide(indS);
                    if (curSlide.QuizzResults !== null && curSlide.QuizzResults.useHighCharts) loadHighChart = true;
                }
                
                if (loadHighChart) {
                    oRef._highChartIsLoaded = false;
                    $.getScript("js/highcharts.js", function() { 
                        oRef._highChartIsLoaded = true;
                        oRef.initializeSlideShow(oRef);
                    });                 
                }
                
                oRef.initializeSlideShow(oRef);
                
            }
        });
        
    },
    
    /********** 
    * initializeSlideShow
    *
    *********/  
    initializeSlideShow: function() {
        
        if (this._highChartIsLoaded === false) return;
        if (this._xmlReader === null) return;
        
        this._dataCom.loadData();
       
        //callback
        if (typeof this._callbackinitialize == "function") this._callbackinitialize.call(this);

        if (this.initializeSideBarObj && typeof this.initializeSideBarObj.initializesidebar === "function") this.initializeSideBarObj.initializesidebar.call(this);
        if (this.initializeScriptAvataObj && typeof this.initializeScriptAvataObj.init === "function") this.initializeScriptAvataObj.init.call(this.initializeScriptAvataObj, $("#slide"));
    
        
        //Audio
        var audioOptions = { 
            file: '',
            visible: true,
            enabled: false,
            context: this,
            img_on_enable: 'images-new/bottom-bar@2x.png',
            img_on_disable: 'images-new/bottom-bar@2x.png',
            img_off_enable: 'images-new/bottom-bar@2x.png',
            img_off_disable: 'images-new/bottom-bar@2x.png',
            onError: function(event) { 
                event.context._currentSoundInProgress = null;
                event.context._buttonState.play.activate = false;
                event.context._buttonState.repeat.activate = false;
                event.context._buttonState.next.activate = true;
                event.context.raiseButtonStateChanged(event.context._buttonState); 
                if (event.context.initializeScriptAvataObj) { event.context.initializeScriptAvataObj.stop.call(event.context.initializeScriptAvataObj); }                         
            },
            onWaitUserAction: function(event) {event.context.WaitActionUser = true; event.context.raiseSlideInfo("displaysuspend", null); return true; },
            onProgress: function(event) { if (event.context.WaitActionUser) { event.context.WaitActionUser = false; event.context.raiseSlideInfo("displaysuspend", { close: true } ); }; },
            onSuspend : function(event){ if (event.context.initializeScriptAvataObj){ event.context.initializeScriptAvataObj.stop.call(event.context.initializeScriptAvataObj); } },
            onStart  : function(event) { 
                event.context._currentSoundInProgress = event.filereaded;
                event.context._buttonState.play.state = "play";
                event.context._buttonState.play.activate = true;
                
                if (event.context.getReader().WaitEndOfAudio) {

                    event.context._buttonState.next.activate = event.context._dataCom.getCurrentSlide() < event.context._dataCom.getLastSlideReaded();
                }
                
                event.context.raiseButtonStateChanged(event.context._buttonState);  
                if (event.context.initializeScriptAvataObj){
                    var voiceInfo = event.context._options.playeraudio.actLAP('getInfo')
                    var filename = voiceInfo.file.split("/").length > 0 ?  voiceInfo.file.split("/")[voiceInfo.file.split("/").length - 1] : " ?? ";
                    var typeInfo = event.context._dataCom.getTypeSlide();
                    var curSlide = (typeInfo.type == "detached") ?  event.context._xmlReader.getSlide(typeInfo.pos -1, true) : event.context._xmlReader.getSlide(event.context._dataCom.getCurrentSlide() - 1);
                    event.context.initializeScriptAvataObj.writeText.call(event.context.initializeScriptAvataObj,$(curSlide.VoiceOver).find("[data-name='"+filename+"']").text());
                    event.context.initializeScriptAvataObj.play.call(event.context.initializeScriptAvataObj);  
                }                         
            },
            onFinish: function(event) { 

                var typeInfo = event.context._dataCom.getTypeSlide();
                if(typeInfo.type == "detached"){
                        var curSlide = event.context._xmlReader.getSlide(typeInfo.pos -1, true); 
                }
                else{
                    var curSlide = event.context._xmlReader.getSlide(event.context._dataCom.getCurrentSlide() - 1); 
                }

                if (event.EOS && $.inArray(curSlide.Type, ["introduction", "conclusion", "quiz"]) == -1 ) {
                    if(curSlide.hasAnimation() && curSlide.Animation.getCurrent() && curSlide.Animation.getCurrent().animGroup && curSlide.Animation.getCurrent().animGroup.getNotGoToNext()) {
                        curSlide.Animation.getCurrent().animGroup.setNotGoToNext(false);
                        curSlide.Animation.getCurrent().animGroup.setCallbackInfo({"event" : event, "audioOptions" : audioOptions})
                        return;
                    }
                }

                event.context._currentSoundInProgress = null;
                event.context._buttonState.play.state = "play";
                event.context.raiseButtonStateChanged(event.context._buttonState);  

                if (event.context.initializeScriptAvataObj){ event.context.initializeScriptAvataObj.stop.call(event.context.initializeScriptAvataObj); }                                                
                
                if (this._quizProgress != "" && this._quizProgress != undefined) return;
                
                if (event.EOS) {
                
                    if (event.context._readaudioafter) {
                        var rasrc = event.context._readaudioafter;
                        event.context._readaudioafter = null;
                        event.context._options.playeraudio.actLAP('play', {'file' : rasrc });
                        return;
                    }

                    
                    
                    var delay = (curSlide.Delay === null ? 1000 : curSlide.Delay)
                    
                    if ((curSlide.Type == "quiz" && event.context._quizProgress == "start")) {
                        setTimeout($.proxy(function () { 
                            this.actionNext({force: true});
                        }, event.context), delay );
                    }
                    
                    if ((curSlide.Type != "introduction") && (curSlide.Type != "conclusion") && (curSlide.Type != "quiz")) {
                        
                        if (curSlide.hasAnimation()) {
                            
                            var $img1 = event.context._options.container.find(".slideshow_img1");
                            var $img2 = event.context._options.container.find(".slideshow_img2");
                        
                            var img1Visible = ($img1.css("display") != "none");
                            var img2Visible = ($img2.css("display") != "none");
                            
                            var $workOn = (img1Visible ? $img1 : $img2);
                            
                            var animOption = {  'ratio': event.context.ResizeCoef,
                                                'container': event.context._options.container,
                                                'refPic': $workOn,
                                                'delay': delay,
                                                'callback': $.proxy(function(anim, param) {
                                                    var curAnim = anim.getCurrent();
                                                    if (curAnim === null) {
                                                        //Goto next slide
                                                      if(curSlide.IsBlocked == "0"){
                                                        setTimeout($.proxy(function () { 
                                                            this.changeSlide("forward");
                                                        }, this), param.delay );
                                                       }

                                                    }
                                                    
                                                    if (curAnim && curAnim.sound) {
                                                        this._options.playeraudio.actLAP('stop');
                                                        this._options.playeraudio.actLAP('play', {'file' : curAnim.sound });
                                                    }
                                                    else {

                                                        if(curAnim && curAnim.isBlocked == "1"){
                                                            this.pause();
                                                            return ;
                                                        }

                                                        setTimeout($.proxy(function(a, p) {
                                                            //run next animation
                                                            if(!a.start(p)){
                                                                if(event.context.getReader().WaitEndOfAudio){
                                                                 event.context._buttonState.next.activate = true;
                                                                 event.context.raiseButtonStateChanged(event.context._buttonState);
                                                                }
                                                            }

                                                        }, this, anim, param), 10);
                                                    }
                                
                                                }, event.context)
                                            };

                            
                            if (curSlide.Animation.getCurrent()) {
                                if (curSlide.Animation.getCurrent().isBlocked != "1") {
                                    var isExec = curSlide.Animation.start(animOption);
                                    if (isExec) return;
                                }
                                else {
         
                                    event.context.pause();
                                    return ;
                                }
                            }

                            
                        }

                    if(curSlide.IsBlocked == "0"){
                        setTimeout($.proxy(function () { 
                            if(!event.context.isModalOpened) this.changeSlide("forward");
                        }, event.context), delay );
                    }
                    else{
                        if(event.context.getReader().WaitEndOfAudio){
                                event.context._buttonState.next.activate = true;
                                event.context.raiseButtonStateChanged(event.context._buttonState);
                        } 
                    }

                    }
                    
                }
                
            }
        };
        
        audioOptions = $.extend({}, audioOptions, this._options.audioOptions);  
        
        
        /* Probleme de non synchronisation */
        var forceFlashPrefered = (this._xmlReader.ForceHTML5) ? false : true;
        // si le navigateur peut jouer HTML5 et FLV on passe � prefered option 
        audioOptions["audiovideosettings"]["preferFlash"] = forceFlashPrefered;

       this._options.playeraudio.actLAP(audioOptions);
        
        //Video
        var videoOptions = { 
            file: '',
            visible: true,
            context: this,
            width: "1024px",
            height: "546px",
            showControler: "never",
            onError: function(event) { alert(event.info.text); },
            onWaitUserAction: function(event) { event.context.WaitActionUser = true; event.context.raiseSlideInfo("displaysuspend", null); return true; },
            onProgress: function(event) { if (event.context.WaitActionUser) { event.context.WaitActionUser = false; event.context.raiseSlideInfo("displaysuspend", { close: true } ); }; },
            onStart: function(event) { 
                event.context._buttonState.play.state = "play";
                event.context.raiseButtonStateChanged(event.context._buttonState);                          
            },
            onFinish: function(event) { 
                
                event.context._buttonState.play.state = "play";
                event.context.raiseButtonStateChanged(event.context._buttonState);                                                  
                
                if (event.EOV) {
                    var curSlide = event.context._xmlReader.getSlide(event.context._dataCom.getCurrentSlide() - 1); 
                    var delay = (curSlide.Delay === null ? 1000 : curSlide.Delay)
                    setTimeout($.proxy(function () { 

                        this.changeSlide("forward");
                    }, event.context), delay );
                }
                
            }
        };
        
        videoOptions = $.extend({}, videoOptions, this._options.videoOptions);      
        videoOptions["audiovideosettings"]["preferFlash"] = !this._xmlReader.ForceHTML5;
        this._options.playervideo.actLVP(videoOptions);
        
        //Generate chapters
        var chapters = this._xmlReader.getChapters();
        if (chapters.length > 0) this.raiseChaptersLoaded(chapters);

        // Read copy right
        var copyright = this._xmlReader.copyright;
        if(copyright) this.raiseCopyRightLoaded(copyright);
            
        //Loading images events
        var nbSlides = this._xmlReader.slideCount();
        for(var indSlide = 0; indSlide < nbSlides; indSlide++) {
            this._xmlReader.getSlide(indSlide).ready(this._slideLoaded, this);
        }

        //Loading images events for detached slides 
        var nbSlides = this._xmlReader.detachedSlideCount();
        for(var indSlide = 0; indSlide < nbSlides; indSlide++) {
            this._xmlReader.getSlide(indSlide, true).ready(this._slideLoaded, this);
        }
        
        // //Retrive the LMS data
        // //var lmsprg = this.getLMSProgression();
        // this._currentSlide = this.getLMSSlide();
        
        var curSlide = this._dataCom.getCurrentSlide();
        
        //If "startslide" option is set
        if ($.isNumeric(this._options.startSlide) && this._options.startSlide > 0) curSlide = this._options.startSlide;

        //Check option to start always at first slide
        if (this._rescfg.alwaysstartto) {
            curSlide = parseInt(this._rescfg.alwaysstartto);
        }
        
        //Debug part
        if (ActDebug) {
            ActDebug.write("Nb Slides: " + nbSlides);
            ActDebug.write("Nb Chapters: " + chapters.length);
            ActDebug.write("init current slide: " + curSlide);
        }
        
        this._dataCom.setCurrentSlide(curSlide);

        //Events
        if(this.isMobileDevice){
        this._options.container.on({
                'swipeleft': $.proxy(function() { if (this.WaitActionUser || this.StopSwipe) { return; } /*this.changeSlide("forward");*/ this.actionNext(); }, this), 
                'swiperight': $.proxy(function() { if (this.WaitActionUser || this.StopSwipe) { return; } /*this.changeSlide("backward");*/ this.actionPrevious(); }, this),
                'movestart': function() { 
                    //if we start horizontal movement of the mouse we ignore the vertical movement
                    //si on commence un d�placement horizontal on ne tient pas compte du d�placement vertical
                    if ((e.distX > e.distY && e.distX < -e.distY) || (e.distX < e.distY && e.distX > -e.distY)) e.preventDefault(); },
                'click': $.proxy(function() { 
                    //Close tooltip
                    this.raiseNote("close", null);
                }, this)
        });
        }
        
        //Little delay to avoid mistakes with navigator lie IE6
        setTimeout($.proxy(function() { 
            // this.changeSlide("forward", curSlide); 
            this.changeSlide("forward", {"forceslide" : curSlide, "isDetached" : false}); 
            if (this._xmlReader.FullScreen) { 
                this.playHideShow(); 
                $("#barShowId").css({"display": "none" });
            }
        }, this), 1000);
        
    },

/***************************
* EVENTS
****************************/   
    
    raiseWait: function(wait) { if (typeof this.onWait === "function") this.onWait.call(this, wait); },
    raiseSlideLoaded: function(data) { if (typeof this.onSlideLoaded === "function") this.onSlideLoaded.call(this, data); },
    raiseChaptersLoaded: function(data) { if (typeof this.onChaptersLoaded === "function") this.onChaptersLoaded.call(this, data); },
    raiseNote: function(action, data) { if (typeof this.onNote === "function") this.onNote.call(this, action, data); },
    raiseButtonStateChanged: function(data) { if (typeof this.onButtonStateChanged === "function") this.onButtonStateChanged.call(this, data);  },
    raiseSlideChanged: function(data) { if (typeof this.onSlideChanged === "function") this.onSlideChanged.call(this, data);  },
    raiseSlideInfo: function(action, data) { if (typeof this.onSlideInfo === "function") this.onSlideInfo.call(this, action, data);  },
    raiseCopyRightLoaded: function(data) { if (typeof this.onCopyRightLoaded === "function") this.onCopyRightLoaded.call(this, data); },
/***************************
* LOADING SLIDE
****************************/   

    getCurrentSlide: function() {
        return this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
    },
    
/***** CHANGE DE SLIDE
 Direction = forward / backward
*/
    changeSlide: function(direction, options) {
        
        //Avoid recursive call

        if (this._transitionInProgress) return;
        this._dataCom.setTypeSlide("attached");
        this._transitionInProgress = true;
        this.unblock();
        var curSlide = null;
        
            // only when we have forceslide, we search the detached slides 
        if (options && options.forceslide) {
            currentDirection = "forward";
            curSlide = this._xmlReader.getSlide(options.forceslide - 1, options.isDetached);
          
            if(options.isDetached){
                this._dataCom.setTypeSlide("detached", options.forceslide);
                var slide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
                this.suspend_data = {"lastSlideVisited" : this._dataCom.getCurrentSlide(), "lastAnimPlayed" : (slide.hasAnimation()) ?  slide.Animation.getSuspended() : null};
            }
        }
        else {
            
            var currentSlide = this._dataCom.getCurrentSlide();
            if ($.isNumeric(direction)) {
                if (direction == currentSlide) { this._transitionInProgress = false; return; }
                if (direction > currentSlide) currentDirection = "forward";
                if (direction < currentSlide) currentDirection = "backward";
                curSlide = this._xmlReader.getSlide(parseInt(direction) - 1);
            }
            else
            {
                if (direction == "forward") { currentDirection = direction; curSlide = this._xmlReader.getSlide(currentSlide); }
                else if (direction == "backward") { currentDirection = direction; curSlide = this._xmlReader.getSlide(currentSlide - 2);    }
            }
            
        }
        
        // //set the last direction
        this._lastSlideDirection = currentDirection;
        
        if (!curSlide) {
            this._transitionInProgress = false;
            // if (currentDirection == "forward") this._currentSlide--;
            this._buttonState.play.activate = false;
            this._buttonState.play.state = "play";
            this.raiseButtonStateChanged(this._buttonState);            
            return;
        }
        
        // this._dataCom.setCurrentSlide(curSlide.Index + 1);
        if(!options || !options.isDetached) this._dataCom.setCurrentSlide(curSlide.Index + 1);
        
        if (!curSlide.isReady()) {
            this.raiseWait(true);
            curSlide.initSlide();
        }
        else
        {
           // this.startSlideAnimate(currentDirection);
            this.startSlideAnimate(currentDirection, options);
        }
        
    },

    getElementsByType: function(type){
        var animations = [];
        if(!type) return elements;
        for (var i = 0; i < this._xmlReader.getSlides().length; i++) {
            var slide = this._xmlReader.getSlides()[i];
            var animSlide = slide.getAnimations(type);
            animations = animations.concat(animSlide);
        }
        return animations;
    },

/***** STARTING ANIMATION
*/
    startSlideAnimate: function(curDir, options) {
        
        $(".haspopover, .mypopovers").popover("destroy");
        $(".haspopover").removeClass("haspopover");
        $("#backgroundvideo").remove();
        var ref = this;
        
        //get the slide to display
       // var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);

        //get the slide to display
        if(!options || !options.isDetached){
             var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        }
        else{
             var curSlide = this._xmlReader.getSlide(options.forceslide - 1, options.isDetached);
        }

         if(options && options.isDetached){

            if(this.slidesTomemorise == null){
            this.slidesTomemorise = [];
                var elements = this.getElementsByType(22);
                for (var i = 0; i < elements.length; i++) {
                   var arrayParams = (elements[i]["parameters"]) ? elements[i]["parameters"].split(";") : [];
                   for (var j = 0; j < arrayParams.length; j++) {
                       var p = arrayParams[j].split("=");
                       if(p.length == 2 && p[0]== "referencedslides"){
                          this.slidesTomemorise = this.slidesTomemorise.concat(p[1].replace(/"/g, '').split(","));
                       }
                   }
                }
            }

            if(curSlide.Anchor && $.inArray(curSlide.Anchor, this.slidesTomemorise) > -1){
                this._dataCom.addInteraction({'id':-1, 'values':[{"id": curSlide.Anchor, "value":1}], 'type': 22});
            }

        }
       
        
        this._buttonState.first.activate = false;
        this._buttonState.play.activate = false;
        this._buttonState.previous.activate = false;
        this._buttonState.next.activate = false;
        this._buttonState.repeat.activate = false;
        this._buttonState.voiceover.activate = false;
        
        this.raiseButtonStateChanged(this._buttonState);
        
        //Hide the quiz screen
        if (this._quizProgress != null) {
            this.raiseSlideInfo("hidequiz", { 'status': this._quizProgress });
            this._quizProgress = null;          
        }
        
        //Hide quiz result screen
        if (this._lastSlide !== null) {
            // not stop the original slide (this._lastSlide) after jum to detached slide (curSlide)
            if (this._lastSlide.hasAnimation() && !(!this._lastSlide.IsDetached && curSlide.IsDetached)) {
                this._lastSlide.Animation.stop();
            }
            
            if (this._lastSlide.Type == "quizzresults") {
                this.raiseSlideInfo("hidequizres", { hasHC: this._lastSlide.hasHighCharts } );
            }
            
        }

        //Delete anim
        this._options.container.find(".epanim").remove();
        
        //Si audio en cours de lecture
        this._options.playeraudio.actLAP('stop');
        this._currentSoundInProgress = null;
        
        //Si video affich�
        if (this._options.playervideo.width() > 0)
        {
            this._options.playervideo.actLVP('stop');
            this._options.playervideo.css({"width": "0px", "height": "0px", "visibility": "hidden"});
        }
        
        //Supprime les notes
        this.raiseNote("remove", null);
        
        //Gauche droite ou droite gauche
        var paramAnimate = {'left': -(this._options.containerWidth), 'opacity': 0};
        if (curDir == "backward") paramAnimate.left = -paramAnimate.left;
        
        //reset info
        this.raiseSlideInfo("hideinfo", null);
        
        var $img1 = this._options.container.find(".slideshow_img1");
        var $img2 = this._options.container.find(".slideshow_img2");
    
        var img1Visible = ($img1.css("display") != "none");
        var img2Visible = ($img2.css("display") != "none");

        //Delete the link
        $img1.unbind("click"); $img2.unbind("click");
        $img1.css('cursor', ''); $img2.css('cursor', '');
    
        //Lance les animations
        var transition = (curSlide.Effect!=null && curSlide.Effect.trim() != "") ? curSlide.Effect:0 ;
        
        var $imgDisp = (img1Visible) ? $img1 : $img2;
        var $imgHide = (img1Visible) ? $img2 : $img1;
                
        /*if (!img1Visible && !img2Visible)
        {
            //First image (no transition)
            transition = 0;
        }*/
        
        // delay alway delay
        var img = curSlide.getImage();
        $imgHide.attr('src', img.getPicture().src);
        
        //If slide is video no transition (IPAD !!!!) pr�voir de couper la transition que sur Safari
        if ($.trim(curSlide.Movie) != "") transition = 0;
              
        if (transition == 0 || transition.trim() == "") //No transition
        {
            this.resizeDivImage();
            setTimeout($.proxy(function($imgToDisp, $imgToHide, slideToDisp) {
                            
                            var divWidth = $("#image").width();
                            var divHeight = $("#image").height();
                            var imgSize = slideToDisp.getImage().getPictureSize();
                            
                            var imgRatio = imgSize.width / imgSize.height;
                            var imgWidth = divHeight * imgRatio;
                            var imgHeight = divHeight;
                            
                            if (imgWidth > divWidth) {
                                imgWidth = divWidth;
                                imgHeight = imgWidth / imgRatio;
                            }
                            
                            this.ResizeCoef = imgHeight / imgSize.height;
                            
                            var top = (divHeight - imgHeight) / 2;
                            if ($("body").height() > $(window).height()) top = 0;
            
                            $imgToDisp.css({
                                            'float': '',
                                            'left': (divWidth - imgWidth) / 2,
                                            'top': top,
                                            'width': imgWidth,
                                            'height': imgHeight,
                                            'display': 'block',
                                            'z-index': 1,
                                            'opacity': 1
                                            });
                                            
                            /*$imgToHide.css({ 'display': 'none', 'left': 0, 'z-index': 0 });
                            this.endSlideAnimate();

                    }, this, $imgHide, $imgDisp, curSlide), 200); */ 
                           if(this.notYetCalculated && this._xmlReader.FullScreen)
                           { 
                             $("#image").css("height", $(window).height());
                             $("#img1").css({ top: '0px' });
                              $("#img2").css({ top: '0px' });

    
            
                            $(".headers").addClass("headersFullScreen");
                            $("#bottom-bar").addClass("fullScreenButtomBar");
                            $(".fullScreenButtomBar").css("width",imgWidth-this.margingFullScreen);
                            $(".headersFullScreen").css("width",imgWidth-this.margingFullScreen);
                            var newSize={"width":imgWidth,"height":imgHeight};
                                if(!this.passtoFullScreen){
                                   this.fullScreenMode();
                                   this.passtoFullScreen=true;
                                }
                            this.positionBarShow(newSize,imgSize);
                            //this.playHideShow();
                              //this.notYetCalculated=false;
           
                             }
                            else if(this.notYetCalculated){
                                $(".headers").css("opacity","1");
                                $("#bottom-bar").css("opacity","1");
                                 //this.notYetCalculated=false;
                            }
            
                 if(this.latsTransition=="1"){
                    $imgToHide.animate(paramAnimate, 1000, $.proxy(function($imgToHide) {
                                                                            $imgToHide.css({'display': 'none', 'left': 0, 'z_index': 0});
                                                                            this.endSlideAnimate(options);
                                                                        }, this, $imgToHide)
                                                );
                  this.latsTransition=transition;
                  }
                  else if(this.latsTransition!=null && this.latsTransition!="0" && this.latsTransition!="1"){
            
                          $imgToHide.animateCSS(this.latsTransition,{duration:1000,callback:$.proxy(function($imgToHide) {
                                                                            $imgToHide.css({'display': 'none', 'left': 0, 'z_index': 0});
                                                                            this.endSlideAnimate(options);
                                                                           
                                                                        }, this, $imgToHide)});
                       this.latsTransition=transition;
                   }
                  else{

                            $imgToHide.css({ 'display': 'none', 'left': 0, 'z-index': 0 });
                            this.endSlideAnimate(options);
                            this.latsTransition=transition;
                   }
                    }, this, $imgHide, $imgDisp, curSlide), 200);  
        }
        else // transition
        {
            this.resizeDivImage();
            setTimeout($.proxy(function($imgToDisp, $imgToHide, slideToDisp) {
                            
                            var divWidth = $("#image").width();
                            var divHeight = $("#image").height();
                            var imgSize = slideToDisp.getImage().getPictureSize();
                            
                            var imgRatio = imgSize.width / imgSize.height;
                            var imgWidth = divHeight * imgRatio;
                            var imgHeight = divHeight;
                            
                            if (imgWidth > divWidth) {
                                imgWidth = divWidth;
                                imgHeight = imgWidth / imgRatio;
                            }
                            
                            this.ResizeCoef = imgHeight / imgSize.height;
                            
                            var top = (divHeight - imgHeight) / 2;
                            if ($("body").height() > $(window).height()) top = 0;
            
                            $imgToHide.css({'z-index': 2});
                            $imgToDisp.css({
                                            'float': '',
                                            'left': (divWidth - imgWidth) / 2,
                                            'top': top,
                                            'width': imgWidth,
                                            'height': imgHeight,
                                            'display': 'block',
                                            'z-index': 1,
                                            'opacity': 1
                                            });
                            /*$imgToHide.animate(paramAnimate, 1000, $.proxy(function($imgToHide) {
                                                                            $imgToHide.css({'display': 'none', 'left': 0, 'z_index': 0});
                                                                            this.endSlideAnimate();
                                                                        }, this, $imgToHide)
                                                );*/

            if(this.notYetCalculated && this._xmlReader.FullScreen)
            {
            
                $(".headers").addClass("headersFullScreen");
                $("#bottom-bar").addClass("fullScreenButtomBar");
                $(".fullScreenButtomBar").css("width",imgWidth-this.margingFullScreen);
                $(".headersFullScreen").css("width",imgWidth-this.margingFullScreen);
                // this.notYetCalculated=false;
                var newSize={"width":imgWidth,"height":imgHeight};
                if(!this.passtoFullScreen){
                   this.fullScreenMode();
                   this.passtoFullScreen=true;
                }
            
                this.positionBarShow(newSize,imgSize);
            //this.playHideShow();
            

            }
            else if(this.notYetCalculated){
            $(".headers").css("opacity","1");
            $("#bottom-bar").css("opacity","1");
           // this.notYetCalculated=false;
            }

                var affectedTransition = (this.latsTransition==null) ? transition : this.latsTransition;

                // be sure if the navigator support a Css Animations
                affectedTransition = (( typeof window.Modernizr !== "undefined" && window.Modernizr.cssanimations == true)) ? affectedTransition : 1 ;
                
                if(affectedTransition!="0" && this.latsTransition!=null && this.latsTransition!="" && affectedTransition!="1"){
                        $imgToHide.animateCSS(affectedTransition,{duration:1000,callback:$.proxy(function($imgToHide) {
                                                                            $imgToHide.css({'display': 'none', 'left': 0, 'z_index': 0});
                                                                            this.endSlideAnimate(options);
                                                                           
                                                                        }, this, $imgToHide)});
                                             }
                 else if(affectedTransition=="1"){
                    $imgToHide.animate(paramAnimate, 1000, $.proxy(function($imgToHide) {
                                                                            $imgToHide.css({'display': 'none', 'left': 0, 'z_index': 0});
                                                                            this.endSlideAnimate(options);
                                                                        }, this, $imgToHide)
                                                );
                 }
                    else{
                       $imgToHide.css({ 'display': 'none', 'left': 0, 'z-index': 0 });
                       this.endSlideAnimate(options);
                    }
                 
            
                         this.latsTransition=transition;



                    }, this, $imgHide, $imgDisp, curSlide), 200);

        
        }

    },

/***** END OF ANIMATION
*/  hideHeader :function(timer){
        
        if ($(".barShow:hover").length>0) {
            clearTimeout(this.timer);
        }
        else{
           //console.log("hide "+this.timer);
         $(".barShow").css("opacity","0");
        }
     },

    enableBarShow : function(curSlide){
       $(".barShow").css("visibility",(curSlide && curSlide.IsDetached) ? "hidden" : "visibile");
    },

    positionBarShow:function(newSizeP,oldSizeP){
        //positionne the element in the middle
       var visibleImg =$ ("#img1").is(":visible")?$("#img1"):$("#img2");
       var heightWindow = $("#image").height();
       var heightImg=visibleImg.height();
       var divHeight=heightWindow-heightImg;
         // console.log("the div height is "+divHeight);
        $("#img1").css({ top: (divHeight/2)+'px' });
        $("#img2").css({ top: (divHeight/2)+'px' });

       // scale the bars with the right dim
       if(newSizeP!=null && oldSizeP!=null){
         var ratioX=newSizeP.width/oldSizeP.width;
         if($(".headersFullScreen").width()*ratioX>(visibleImg.width()-2*this.margingFullScreen)){
            ratioX=(visibleImg.width()-2*this.margingFullScreen)/$(".headersFullScreen").width();
         }
         cssScale={"zoom":ratioX,"-moz-transform":"scale("+ratioX+")"};
          $(".headersFullScreen").css(cssScale);
          $(".fullScreenButtomBar").css(cssScale);
          $(".navbar-header").css(cssScale);
          $(".progress").css(cssScale);
          $(".dropdown_fullscreen_chapters").css(cssScale);
          $(".navbar-right").css(cssScale);
          

           // position the top bar in the right place
        
        var topImg =    visibleImg.offset().top;
        var leftImg=    visibleImg.offset().left;
       $(".headersFullScreen").css({ top: (topImg + 15) + 'px' });
       //console.log("width Img "+visibleImg.width()+" headers "+$(".headersFullScreen").width()+" left "+leftImg+" diff "+(((visibleImg.width()-$(".headersFullScreen").width())/2)+leftImg));
       //$(".headersFullScreen").css({ left: (((visibleImg.width()-$(".headersFullScreen").width())/2)+leftImg)+'px' });
       //position the buttom bar in the right place
       var hightWindow=$(window).height();
       $(".fullScreenButtomBar").css({ bottom: (hightWindow - topImg - heightImg + 10)+'px' });
      //$(".fullScreenButtomBar").css({ left: (((visibleImg.width()-$(".headersFullScreen").width())/2)+leftImg)+'px' });
       }
       
       //$("body").css("height",heightImg);
       },
    fullScreenMode:function() {
        window.moveTo(0, 0);
		
		try {
		
			if (document.all) {
				top.window.resizeTo(screen.availWidth, screen.availHeight);
			}

			else if (document.layers || document.getElementById) {
				if (top.window.outerHeight < screen.availHeight || top.window.outerWidth < screen.availWidth) {
					top.window.outerHeight = screen.availHeight;
					top.window.outerWidth = screen.availWidth;
				}
			}
		
		}
		catch (e) {
			
		}
		
    },

    playHideShow:function(){
        var timerMove = null;
          if ($("#bottom-bar").css("opacity") == 1) { $("#bottom-bar").fadeTo(500, 0); } 
        $("body").off("mousemove").off("mouseleave");
        
        $("body").on("mousemove", $.proxy(function() {   
            if ($("#bottom-bar").css("opacity") == 0) { $("#bottom-bar").fadeTo(500, 1); }
            if(timerMove != null) clearInterval(timerMove);
            timerMove = setTimeout(function() { 
                if ($("#bottom-bar").css("opacity") == 1 && $('.fullScreenButtomBar:hover').length == 0) { $("#bottom-bar").fadeTo(500, 0); } 
            }, 600);

        }, this));
        
        $("body").on("mouseleave", $.proxy(function() {
            setTimeout(function() { 
                if ($("#bottom-bar").css("opacity") == 1 ) { $("#bottom-bar").fadeTo(500, 0); } 
            }, 500);
        }, this));
        
  

   },

    endSlideAnimate: function(options) {

        //get the slide displayed
       // var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);

       //get the slide displayed
        if(!options || !options.isDetached){
            var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        }
        else{
              var curSlide = this._xmlReader.getSlide(options.forceslide - 1, options.isDetached);
        }
        
        // show or not the barshow after end slide animation
        this.enableBarShow(curSlide);

        var nbSlides = this._xmlReader.slideCount();

        var $img1 = this._options.container.find(".slideshow_img1");
        var $img2 = this._options.container.find(".slideshow_img2");
    
        var img1Visible = ($img1.css("display") != "none");
        var img2Visible = ($img2.css("display") != "none");
        
        var $workOn = (img1Visible ? $img1 : $img2);
        
        this._lastSlide = curSlide;
        this._quizProgress = null;
        
        if (curSlide.backGroundIsVideo) {
            $("#image #img2").after('<video id="backgroundvideo" style="position: absolute; z-index: 1" src="' + curSlide.backGroundVideo + '" loop autoplay></video>');
            this.resizeDivImage();
        }

        /*if (this.isIPAD && !this.suspendAction) {
            this.WaitActionUser = true;
            this.suspendAction = true;
            this.raiseSlideInfo("displaysuspend", null);
            console.log("it's iPad");
            //return;
        }*/
        //text info ?
        switch(curSlide.Type)
        {
            case "introduction":
                this.raiseSlideInfo("dispinfo", { "Type": curSlide.Type, "Text": curSlide.Title }); 
                break;          
            case "quiz":
                this.raiseSlideInfo("dispinfo", { "Type": curSlide.Type, "Text": curSlide.Quizz.getLabel("intro"), "Slide": curSlide, "QuizType":curSlide.QuizType }); 
                //Positionnement
                this._quizProgress = "start";
                this.resizeDivImage();
                break;
            case "conclusion": 
                this.raiseSlideInfo("dispinfo", { "Type": curSlide.Type, "Text": curSlide.Title }); 
                break;
        }
        
        //Display transcript text
        this.raiseSlideInfo("transcripttext", curSlide.TranscriptText);
        
        //If animation
        var cameFromDetached = this.suspend_data && !curSlide.IsDetached && ((this.suspend_data.lastSlideVisited - 1) == curSlide.Index);
        if (curSlide.hasAnimation() && !curSlide.Quizz ) {

            // recuperate last state if exist (make sure that the current slide is the last slide visited)
            if( cameFromDetached ){
           // if(this.suspend_data && !curSlide.IsDetached){
                var anim = this.suspend_data.lastAnimPlayed;
                 curSlide.Animation.recuperateAnimations(anim,{ 'ratio': this.ResizeCoef, 'container': this._options.container, 'refPic': $workOn});
                 this.pause();
            }
            else{

               curSlide.Animation.reset();
               curSlide.Animation.start({ 'ratio': this.ResizeCoef, 'container': this._options.container, 'refPic': $workOn, 'callback': $.proxy(function(anim, param) {
                var curAnim = anim.getCurrent();
                if (curAnim === null) return;
                //sound
                if (curAnim.sound) {
                   
                    this._options.playeraudio.actLAP('stop');
                    this._options.playeraudio.actLAP('play', {'file' : curAnim.sound });                    
                }
                else {

                    if(curAnim.isBlocked == "1"){
                               // "Pause From Not Sound";
                               this.pause();
                               return ;
                    }
                    setTimeout($.proxy(function(a, p) {
                        //run next animation
                  
                        var slide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
                        //console.log("_currentSoundInProgress", this._currentSoundInProgress);
                        if(!a.start(p)){
                       // console.log("_currentSoundInProgress", this._currentSoundInProgress,"finished");
                            if(this.getReader().WaitEndOfAudio && this._currentSoundInProgress == null){
                                this._buttonState.next.activate = true;
                                this.raiseButtonStateChanged(this._buttonState);
                            }
                            
                        }

                    }, this, anim, param), 10);
                    }
                
            }, this) });
            }
        }
        
        //Display notes if exists
        if (curSlide.hasNote()) {
            var notes = curSlide.Notes;
            var nL = notes.length;
            for(var indNote = 0; indNote < nL; indNote++) { 
                var note = notes[indNote];
                this.raiseNote("add", { 'info': note });
            }
        }
    
        //add link
        if (curSlide.Link !== null && curSlide.Link != "") {
            $workOn.css('cursor', 'pointer');
            $workOn.bind("click", $.proxy(function(l) {    
                    this.actionPlayStop();
                    window.open(l, "popup");
            }, this, curSlide.Link));
        }
        
        //Si video on lance la video
        var noFile = false;     
        if (curSlide.Type == "movie") { 
            if (this._options.playervideo.width() > 0) {
                var imgPosition = $workOn.position();
                this._options.playervideo.css( { "left": imgPosition.left, "top": imgPosition.top, "width": $workOn.width() + "px", "height": $workOn.height() + "px", "visibility": "visible" } );
                this._options.playervideo.children().css({"width" : $workOn.width() + "px", "height" : $workOn.height() + "px"});               
                this._options.playervideo.actLVP("play", { file: curSlide.Movie } );
            }
        }
        
        //Si un son on lance le son
        if (curSlide.Type != "movie") {
            if ($.trim(curSlide.Sound)) {
                this._options.playeraudio.actLAP('play', {'file' : curSlide.Sound });
            }
            else {
                noFile = true;
            }
        }
        
        //High Chart
        if (curSlide.Type == "quizzresults") {
            if (curSlide.QuizzResults.useHighCharts) {
                var hc = curSlide.QuizzResults.genereteCode({ 'com': this._dataCom, 'slideshow': this });           
                this.raiseSlideInfo("displayquizres", { "highchartsdata": hc });
            }
            else {
                var qrHTML = curSlide.QuizzResults.genereteHTML({ 'com': this._dataCom, 'slideshow': this });
                this.raiseSlideInfo("displayquizreshtml", { "html": qrHTML });
            }
            this.resizeDivImage();
        }
        
        //Activate buttons
        var currentSlide = this._dataCom.getCurrentSlide();
        
        this._buttonState.first.activate = (currentSlide > 1);
        // this._buttonState.play.activate = (!noFile);
        this._buttonState.play.activate = (!noFile  || (this.isBlocked && curSlide.Animation && curSlide.Animation.getNext()));
        this._buttonState.previous.activate = (currentSlide > 1);
        this._buttonState.next.activate = ((currentSlide < nbSlides) ||  (nbSlides == 1) || (curSlide.Type == "quiz") || (curSlide.Type == "quizzresults"));
        this._buttonState.repeat.activate = (!noFile);
        this._buttonState.voiceover.activate = (curSlide.VoiceOver);
        
        if (this.getReader().WaitEndOfAudio) {
            this._buttonState.next.activate = this._dataCom.getCurrentSlide() < this._dataCom.getLastSlideReaded() || cameFromDetached;
            if (curSlide.Type == "quizzresults") {
                this._buttonState.next.activate = curSlide.QuizzResults.isValidated({ 'com': this._dataCom, 'slideshow': this });
            }
        }
        
        this.raiseButtonStateChanged(this._buttonState);
        
        this.raiseSlideChanged( { position: currentSlide - 1, count: nbSlides, slide: curSlide, chapterindex: this._xmlReader.getCurrentChapter(currentSlide - 1) } );
        
        this._dataCom.viewSlide(this._dataCom.getCurrentSlide());
        if (this.AlwaysSendProgression) this._dataCom.saveData();
    
        this._transitionInProgress = false;
        
        if (curSlide.Type == 'quiz') this.actionNext({ force: true });

        // delate the detached data at the end of animateSlide
        if(!options || !options.isDetached){
            this.suspend_data = null;
        } 

        /*if(!this.isIPAD){
            this.raiseSlideInfo("hidesuspend", { close: true });
            console.log("not ipad");
        }
        else{
            console.log("is ipad");
        }*/
        
    },
    
/***************************
* CHARGEMENT IMAGES
****************************/   

/***** When a slide is loaded
    The delay here is very important otherwise the audio and/or video files are locked
*/
    _slideLoaded: function(data) {
    
        var slideReady = this;
        var slideReader = this.getReader();
        var img = slideReady.getImage();
        
        if (ActDebug) ActDebug.write("Load Slide: " + slideReady.Index + ", std:" + img.imageFound() + ", hd:" + img.imageHDFound() + ", count:" + slideReady.countImages());
        
        //Calculate some information
        data.raiseSlideLoaded({ "nbSlidesLoaded": slideReader.slideReadyCount(), "currentSlideLoaded": slideReady.Index, "totalSlides": slideReader.slideCount() });
        
        // cheack for the detached slide if it's demanded
        if(slideReady.IsDetached){
             data.raiseWait(false);
             setTimeout($.proxy(function() { this.startSlideAnimate("forward", {"forceslide" :slideReady.Index + 1, "isDetached" : true}); }, data), 200);
             return;
        }

        //If the slide is loaded and this is the slide to display
        if ((data._dataCom.getCurrentSlide() - 1) == slideReady.Index) {
            //Always to avoid some mistakes
            data.raiseWait(false);
            setTimeout($.proxy(function() { this.startSlideAnimate(this._lastSlideDirection); }, data), 200);
        }
        
        //Load the next slide
        if ((slideReady.Index + 1) < slideReader.slideCount()) {
            var nextSlide = slideReader.getSlide(slideReady.Index + 1);
            if (!nextSlide.isReady()) {
                setTimeout($.proxy(function() { this.initSlide(); }, nextSlide), 500);
                return;
            }
        }
        
        //Search if there is some slides not loaded (if the slide begin at the middle
        for(var indSlide = this.Index - 1; indSlide >= 0; indSlide--) {
            var prevSlide = slideReader.getSlide(indSlide);
            if (!prevSlide.isReady()) {
                setTimeout($.proxy(function() { this.initSlide(); }, prevSlide), 500);
                return;
            }
        }
        
        //All is loaded
        if (ActDebug) ActDebug.write("All Slides are loaded");
        data.raiseSlideLoaded({ "nbSlidesLoaded": slideReader.slideCount(), "currentSlideLoaded": -1, "totalSlides": slideReader.slideCount() });

    },
    
/***************************
* NAVIGATION
****************************/   
    
    actionPrevious: function() {
        
        if (!this._buttonState.previous.activate) return;
        this.changeSlide("backward");
    
    },
    
    actionFirst: function() {
    
        if (!this._buttonState.first.activate) return;
        
        this._dataCom.viewSlide(1);
        this.changeSlide("backward");
        
    },
    
    actionPlay: function() {
    
        var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        
        if (this.WaitActionUser) {
            this.raiseSlideInfo("hidesuspend", null);
            this.WaitActionUser = false;
        }
        
        // if ($.trim(curSlide.Sound) && curSlide.Type != "movie") {
        if (curSlide.Type != "movie") {
            this._options.playeraudio.actLAP('play');
        }

        if ($.trim(curSlide.Movie)) {
            this._options.playervideo.actLVP('play');
        }
        
    },

    stopExternalMedias: function(){
       
        if( this._options.container.find("video").length > 0){
          this._options.container.find("video").trigger("pause");
        }

        if(this._options.container.find("audio").length > 0){
          this._options.container.find("audio").trigger("pause");
        }

    },

    actionPause: function(){
          
        this.pause();
        this._options.playeraudio.actLAP('stop');
        this._buttonState.play.state = "stop";
        this.raiseButtonStateChanged(this._buttonState);

    },

    actionPlayOnly: function(){
       this.actionPlayStop({"action":"play"});
    },
    
    actionPlayStop: function(actionType) {

        var onlyplay = (typeof actionType !== "undefined" && actionType.action && actionType.action == "play");
        var typeInfo = this._dataCom.getTypeSlide();
        if(typeInfo.type == "detached"){
            var curSlide = this._xmlReader.getSlide(typeInfo.pos -1, true); 
        }
        else{
            var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1); 
        } 
     
        if(this.isBlocked){

        // desactiver le flag de blockage
        this.isBlocked = false;
        this._buttonState.play.state = "play";
        this._buttonState.play.activate = true;
        this.raiseButtonStateChanged(this._buttonState);
        
        var curAnim = (curSlide.hasAnimation() ? curSlide.Animation.getCurrent() : null);
        var nextAnim = (curSlide.hasAnimation() ? curSlide.Animation.getNext() : null);


        var $img1 = this._options.container.find(".slideshow_img1");
        var $img2 = this._options.container.find(".slideshow_img2");
    
        var img1Visible = ($img1.css("display") != "none");
        var img2Visible = ($img2.css("display") != "none");
        
        var $workOn = (img1Visible ? $img1 : $img2);

        if (curSlide.Sound && curSlide.Sound != "") {
                    //alert("play: " + curAnim.sound);
                    this._options.playeraudio.actLAP('stop');
                    this._options.playeraudio.actLAP('play', {'file' : curSlide.Sound });                    
        }

        if( nextAnim != null ){

            curSlide.Animation.start({ 'ratio': this.ResizeCoef, 'container': this._options.container, 'refPic': $workOn, 'callback': $.proxy(function(anim, param) {

                var curAnim = anim.getCurrent();
                if (curAnim === null) return;
                
                //sound
                if (curAnim.sound) {
                    //alert("play: " + curAnim.sound);
                    this._options.playeraudio.actLAP('stop');
                    this._options.playeraudio.actLAP('play', {'file' : curAnim.sound });                    
                }
                else {
                    // si l'element 
                    if(curAnim.isBlocked == "1"){
                               this.pause();
                               return ;
                    }
                    setTimeout($.proxy(function(a, p) {
                        if(!a.start(p)){
                            if(this.getReader().WaitEndOfAudio){
                                this._buttonState.next.activate = true;
                            }
                            this._buttonState.play.activate = false;
                            this.raiseButtonStateChanged(this._buttonState);
                        }
                    }, this, anim, param), 10);
                }
                
            }, this) });

        }

       }
       else if(!onlyplay) {

        //var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        var curAnim = (curSlide.hasAnimation() ? curSlide.Animation.getCurrent() : null);

  
        if (this.WaitActionUser) {
            this.raiseSlideInfo("hidesuspend", null);
            this.WaitActionUser = false;
        }

        var audioIsPlaying = false;
        if ($.trim(curSlide.Sound) || (curAnim && $.trim(curAnim.sound))) {
            var info = this._options.playeraudio.actLAP('getInfo');
            audioIsPlaying = info.isPlaying;
        }
        
        var videoIsPlaying = false;
        if ($.trim(curSlide.Movie)) {
            var info = this._options.playervideo.actLVP('getInfo');
            videoIsPlaying = info.isPlaying;
        }
        
        var boolContinue = true;
        if (curSlide.Type == "introduction" && this._buttonState.play.state == "play") {
            if (!audioIsPlaying) {
                this.changeSlide("forward");
                boolContinue = false;
            }
        }

        if (curSlide.Type == "quiz" && this._buttonState.play.state == "play") {
            if (this._currentSoundInProgress) {
                this._options.playeraudio.actLAP('stop');
                this._buttonState.play.state = "stop";
            }
            else {
                this._options.playeraudio.actLAP('play');
                this._buttonState.play.state = "play";
            }
        }
        
        //Si un son on lance le son
        if (($.trim(curSlide.Sound) || (curAnim && $.trim(curAnim.sound))) && curSlide.Type != "movie" && boolContinue) {
            if (audioIsPlaying) {
                this._options.playeraudio.actLAP('stop');
                this._buttonState.play.state = "stop";
            }
            else {
                this._options.playeraudio.actLAP('play');
                this._buttonState.play.state = "play";
                this._buttonState.play.activate = true;
            }
        }

        // si pas de son we stop the current one 
       if( curAnim && ( !$.trim(curAnim.sound) || $.trim(curAnim.sound) == "" ) ) {
            curAnim.isBlocked = "1";
            this._options.playeraudio.actLAP('stop');
            this._buttonState.play.state = "stop";
            this._buttonState.play.activate = true;
       }

        //Si une video on lance la video
        if ($.trim(curSlide.Movie) && curSlide.Type == "movie" && boolContinue) {
            if (videoIsPlaying) {
                this._options.playervideo.actLVP('stop');
                this._buttonState.play.state = "stop";
            } 
            else {
                this._options.playervideo.actLVP('play');
                this._buttonState.play.state = "play";
            }
        }
        
        this.raiseButtonStateChanged(this._buttonState);
        }
    },

    unblock: function(){
       this.isBlocked = false;
    },
 
    pause : function(notBlock){
        this.raiseSlideInfo("hidesuspend", null);
        this.WaitActionUser = false;
        this._buttonState.play.state = "stop";
        this._buttonState.play.activate = true;
        this._buttonState.next.activate = true;
        this.raiseButtonStateChanged(this._buttonState);
        if(typeof notBlock === "undefined" || notBlock == false) this.isBlocked = true;
    },

    activeNext:function(){
         if(this.getReader().WaitEndOfAudio){
            this._buttonState.next.activate = true;
         }
    },
    
    actionNext: function(options) {
        
        var d = this._dataCom.getCurrentSlide();
        var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        this.isBlocked = false; 
        if (!this._buttonState.next.activate) {
            if (options && options.force === true) {
                //continue
            }
            else {
                return;
            }
        }
    
        if (this._quizProgress !== null) {
            // if retry is active and the responses already exist delete responses 
            //????
            if     (curSlide.QuizType == "fillBlankQ") {    this.displayFillBlankQuiz();}
            else if(curSlide.QuizType == "classificationQ") this.displayClassificationQuiz();
            else if(curSlide.QuizType == "dragDropQ")       this.displayDragDropQuiz();
            else if(curSlide.QuizType == "buttonQ")         this.displayButtonQuiz();
            else if(curSlide.QuizType == "buttonImgQ")      this.displayButtonQuiz('withImage');
            else if(curSlide.QuizType == "validInvalidQ")   this.displayValidInvalidQuiz();
            else {this.displayQuiz();}
        }
        else if(this._xmlReader.NextElement){
             var $img1 = this._options.container.find(".slideshow_img1");
             var $img2 = this._options.container.find(".slideshow_img2");
             var img1Visible = ($img1.css("display") != "none");
             var img2Visible = ($img2.css("display") != "none");
             var $workOn = (img1Visible ? $img1 : $img2);
             //var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
             var typeInfo = this._dataCom.getTypeSlide();
             if(typeInfo.type == "detached"){
                var curSlide = this._xmlReader.getSlide(typeInfo.pos -1, true); 
             }
             else{
                var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1); 
             } 

             if(curSlide.hasAnimation() && curSlide.Animation.getNext()){
             curSlide.Animation.start({ 'ratio': this.ResizeCoef, 'container': this._options.container, 'refPic': $workOn, 'callback': $.proxy(function(anim, param) {
                // console.log("actionNext => ", this.ResizeCoef);
                var curAnim = anim.getCurrent();
                if (curAnim === null) return;
                //sound
                //if(!curSlide.Sound || curSlide.Sound == "") this._options.playeraudio.actLAP('stop');
                if (curAnim.sound) {
                    //alert("play: " + curAnim.sound);
                    this._options.playeraudio.actLAP('stop');
                    this._options.playeraudio.actLAP('play', {'file' : curAnim.sound });                    
                }
                else {
                    if(curAnim.isBlocked == "1"){
                               //console.log("Pause From Not Sound");
                               this.pause();
                               return ;
                    }
                    setTimeout($.proxy(function(a, p) {
                        if(!a.start(p)){
                            // console.log("actionNext => ", this.ResizeCoef);
                            if(this.getReader().WaitEndOfAudio && this._currentSoundInProgress == null){
                                this._buttonState.next.activate = true;
                                this.raiseButtonStateChanged(this._buttonState);
                            } 
                        }
        
                    }, this, anim, param), 10);
                }
            }, this) });
             }
             else{
                this.changeSlide("forward");
             }
            
            }
        else {
            this.changeSlide("forward");
        }
    
    },

    validateQuiz:function(){

    var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
    var listChoix= [];
    

    switch($.trim(curSlide.QuizType)){

    case "fillBlankQ":

    $(".choiceSelect").each(function(key,value){
      listChoix[$(value).attr("question-id")]=$(value).val();
    });

    var questions= curSlide.Quizz.getQuestions();
    var errorResp={};
    var currentObj=this;
    if(listChoix.length==questions.length){
        $.each( listChoix, function( key, value ){
              var question=curSlide.Quizz.getQuestion(key);
              question.userResponses.isValidated = true;
              question.userResponses.addResponse(value);
           
              // currentObj.saveQuizzResponse(question);
        });
    }
    
    this.quizzFillBlankResponse(curSlide,"validate");

    break;
    case "dragDropQ":
    this.quizzDragDropResponse(curSlide,"validate");
    var currentObj=this;
     $(".itemDrop").each(function(key,value){
     	$this=$(this);
     	var dataInfo=$this.attr("data-info");
     	var attachedDropElmnt = $this.find(".itemDrag").attr("data-link");
     	var idQ=attachedDropElmnt.split("_")[0];
     	var idCh=attachedDropElmnt.split("_")[1];
     	var question=curSlide.Quizz.getQuestion(dataInfo);
     	 question.userResponses.isValidated = true;
    	 question.userResponses.addResponse(idQ+"_"+idCh);
     });
    break;
    }
     $("#btnStartQuizz").css("display","block");
     $("#btnValidateQuiz").attr("disabled","disabled");
     $("#btnValidateQuiz").css("display","none");
    },
    
    
    actionRepeat: function() {
        
        var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        
        //Si video on lance la video
        if (curSlide.Type == "movie" && $.trim(curSlide.Movie)) {   
            this._options.playervideo.actLVP("play");
        }
        
        //Si un son on lance le son
        if ($.trim(curSlide.Sound) && curSlide.Type != "movie") {
            this._options.playeraudio.actLAP('play');
        }
        
    },
    
/***************************
* QUIZ
****************************/



    displayClassificationQuiz: function(){

     

        var curSlide   = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        var slides = this._xmlReader.getSlides();
        var linkedQ    = curSlide.Quizz.LinkedQuizz ? curSlide.Quizz.LinkedQuizz.split(",") : [];
        var quizSlides = [], linkedQuizz = [];

        this._options.playeraudio.actLAP('stop');        
        $("#myBtnNextQuestion").css("display", "none");
        $("#goToNextQuestion").css("display", "none");
        $("#btnStartQuizz").css("display", "none");

        $("#choicecomment").css("display", "none");
        
        
        for(var i = 0; i < slides.length; i++){
            if(slides[i].Quizz && ( $.inArray(slides[i].Id, linkedQ) > -1 || linkedQ.length == 0)) linkedQuizz.push(slides[i]);
        }

        var bgPicture = curSlide.getImage("q" +  curSlide.Quizz.getQuestion(0).Id);
    
        if (bgPicture !== null && bgPicture.getPicture() !== null) {
        
            var imgSize = bgPicture.getPictureSize();
            var $bgQuizz = this._options.container.find(".slideshow_quizz");

            var divWidth = $("#image").width();
            var divHeight = $("#image").height();
                            
            var imgRatio = imgSize.width / imgSize.height;
            var imgWidth = divHeight * imgRatio;
            var imgHeight = divHeight;
                            
            if (imgWidth > divWidth) {
                imgWidth = divWidth;
                imgHeight = imgWidth / imgRatio;
            }
                            
            this.ResizeCoef = imgHeight / imgSize.height;
                            
            var top = (divHeight - imgHeight) / 2;
            if ($("body").height() > $(window).height()) top = 0;
            
            $bgQuizz.find(".imgQuizzBackGround").remove();
            
            var html = '<img class="imgQuizzBackGround" src="' + bgPicture.getPicture().src + '" style="left: ' + (divWidth - imgWidth) / 2 + 'px; top: ' + top + 'px; width: ' + imgWidth + 'px; height: ' + imgHeight + 'px;" />';
            
            $bgQuizz.append(html);
        }
        else if($bgQuizz) {
            $bgQuizz.find(".imgQuizzBackGround").remove();
        }
        var q = curSlide.Quizz.getQuestion(0);
        if(!q) return;
        q.choices.sort(function(q1, q2) {if (q1.Id > q2.Id) return 1; else if(q1.Id < q2.Id) return -1; return 0; });
        var rightToRetry = (!$.isNumeric(curSlide.Quizz.RetryMaxQuizz) || curSlide.Quizz.RetryMaxQuizz > curSlide.Quizz.RetryNbre); 
        var oldSelectedAnswer = "";
        if (this._quizProgress == "start") {
            //display screen quiz
            $("#choices").html("");
            this.raiseSlideInfo("displayquiz", null);
            this.raiseSlideInfo("displayquizClassification", {"curSlide": curSlide, "linkedQuizz":linkedQuizz});
            this._quizProgress = 0;
            this._quizWaitUserChoices = true;
                 
            curSlide.Quizz.RetryNbre++;
            var quizTotal = curSlide.Quizz.countQuestion();
            var respObj = q.userResponses.getResponses();
            var selectedAnswer = "";

            for (var key in respObj) {
                if (respObj.hasOwnProperty(key)) {
                    var data =  respObj[key].split("?");
                    for(var x = 0; x < data.length; x++){
                        if(data[x].indexOf("*") > -1) {
                            oldSelectedAnswer = key;
                            data[x] = data[x].substr(0, data[x].lastIndexOf("*"));
                        }
                        var tr =  data[x].substr(0, data[x].lastIndexOf(".")).split(".").join("_");
                        $("#l_" + tr).find(".cl_dropZone[data-rang='"+key+"']").append($(".cl_dragZone[data-info='"+ data[x]+"']"));
                    }
                }
            }

              //Play audio
            if ($.trim(curSlide.Sound) != "") {
                //console.log("The current sound : "+curSlide.Sound);
                this._options.playeraudio.actLAP('play', {'file' : curSlide.Sound });
            }

            if(selectedAnswer != "") $(".classQuizDecision select").val(selectedAnswer);
            
            if(curSlide.Quizz.RetryQuizz !== true || rightToRetry !== true){
                $(".cl_dragZone").each(function(key, dragOpt){ $(dragOpt).draggable( 'disable' );});
                $(".classQuizDecision .element").prop("disabled", true);
                $(".classQuizDecision").css("display", "block");
                //$("#myBtnNextQuestion").css("display", "block");
            }
        }
        else{
            // get the data and added it in response data
            var selectedAnswer = $(".classQuizDecision select").val();
            var question = curSlide.Quizz.getQuestion(0); // only one question 
            question.userResponses.isValidated = true;
            for(var indCh = 0; indCh < question.choices.length; indCh++) {
                var response ="" +  question.choices[indCh].Id; // just to convert to string
                $(".cl_dropZone[data-rang="+question.choices[indCh].Id+"]").each(function(key, choiceZone){
                    $(choiceZone).find(".cl_dragZone").each(function(index, choice){ response += "?" + $(choice).attr("data-info");  });
                });
                response += (question.choices[indCh].Id == selectedAnswer) ?  "*" : "";
                question.userResponses.addResponse(response);
            }
            this._dataCom.saveData();
            this.changeSlide("forward");
        }

        var choiceMax = {'value': -1, 'Id': -1};
        $(".scoreClassification").each(function(key, td){
            var $td   = $(td);
            var score = 0;
            var rang  = $td.attr("data-ranginfo");
            $("[data-rang="+rang+"]").each(function(ket, tdR){
                score += $(tdR).find(".cl_dragZone").length;
            });
            if(score > choiceMax.value) {choiceMax.value = score; choiceMax.Id = $(td).attr("data-ranginfo")};
            $td.html(score);

        });

        if($(".spanChoices span").length == 0 ){
            $(".spanChoices").remove();
            $(".thColspan").each(function(key, el){
                $(el).attr("colspan", parseInt($(el).attr("colspan")) - 1);
            });
            $(".classQuizDecision").css("display", "block");
            $("#classQuizDecision").prop("disabled", curSlide.Quizz.RetryQuizz !== true || rightToRetry !== true);
           // $("#myBtnNextQuestion").css("display", 'block');
           $(".classQuizDecision select").val(oldSelectedAnswer != "" ? oldSelectedAnswer : choiceMax.Id);
        }

        this.resizeDivImage();
    },

   
    displayFillBlankQuiz: function(){

        this._permissionDragSlideInQuiz=true;
        this._options.playeraudio.actLAP('stop');
        var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        var isValidated=false;
        var countQ = curSlide.Quizz.countQuestion();
        for(var indQ = 0; indQ < countQ; indQ++) {
                    question = curSlide.Quizz.getQuestion(indQ);
                    if(question.userResponses.isValidated) 
                    {
                        isValidated=true;
                        this._permissionDragSlideInQuiz=false;
                       break;
                    }
        }
        this.raiseSlideInfo("displayquizFillBlank", curSlide.Quizz);
         if(isValidated){
          this.quizzFillBlankResponse(curSlide,"check");
          $("#btnValidateQuiz").hide();
          $("#btnStartQuizz").show();
        }
        else{
            //Play audio
            if ($.trim(curSlide.Sound) != "") {
                //console.log("The current sound : "+curSlide.Sound);
                this._options.playeraudio.actLAP('play', {'file' : curSlide.Sound });
            }
        }
        this._quizProgress=null;
       
    },

    displayDragDropQuiz : function(){
		this._permissionDragSlideInQuiz=true;
		this._options.playeraudio.actLAP('stop');
		// dynamic style
	   var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
       var isValidated=false;
       var countQ = curSlide.Quizz.countQuestion();
       for(var indQ = 0; indQ < countQ; indQ++) {
			question = curSlide.Quizz.getQuestion(indQ);
		    if(question.userResponses.isValidated) 
			{
				isValidated=true;
				this._permissionDragSlideInQuiz=false;
			    break;
		    }
	    }	
		this.raiseSlideInfo("displayquizDragDrop", curSlide.Quizz);
		$(".itemDrop").css("height",$(".itemDrag:first").height()+"px");
         if(isValidated){
          this.quizzDragDropResponse(curSlide,"check");
		  $("#btnValidateQuiz").hide();
		  $("#btnStartQuizz").show();
        }
        else{
        	//Play audio
		    if ($.trim(curSlide.Sound) != "") {
			    this._options.playeraudio.actLAP('play', {'file' : curSlide.Sound });
		    }
        }
        this._quizProgress=null;  
	},
	
    displayButtonQuiz : function(withImage){
      
       var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        var ref = this;
       this._options.playeraudio.actLAP('stop');
        $("#myBtnNextQuestion").css("display", "none");
        $("#btnStartQuizz").css("display", "none");
        $("#choicecomment").css("display", "none");
        //go to next slide
        if (this._quizProgress == "gotonext") {
            this.changeSlide("forward");
            return;
        }
    
        if (this._quizProgress == "start") {
            //display screen quiz
            this.raiseSlideInfo("displayquiz", null);
            this._quizProgress = 0;
            this._quizWaitUserChoices = true;
        }

        var question = curSlide.Quizz.getQuestion(this._quizProgress);
        if (question != null && !curSlide.Quizz.getDisplayQuestionAnswered()) {
            //On avance a la question en attente de reponse
            var countQ = curSlide.Quizz.countQuestion();
            for(var indQ = question.Index; indQ < countQ; indQ++) {
                if (this.quizzCanGoToNextQuestion(curSlide, question)) {
                    question = curSlide.Quizz.getQuestion(indQ+1);
                    this._quizProgress++;
                    this._quizWaitUserChoices = true;
                }
                else 
                {
                    break;
                }
            }
        }

        var prevquestion = curSlide.Quizz.getQuestion(this._quizProgress-1);

        //Validate previous question
        if (prevquestion != null && (!prevquestion.userResponses.isValidated || curSlide.Quizz.quizRetry === true)) {
            prevquestion.userResponses.isValidated = true;
         
           
            //Save response
            var saveResp = true;
            if (curSlide.Quizz.DisplayResponse) {
                saveResp = !this._quizWaitUserChoices;
            }
            // check if the last one than send Save ???????????????????????????????????????
            if (saveResp) {
                this._dataCom.updateQuizQuestion(prevquestion);
                this._dataCom.saveData();
            }
        }
        if (question == null && ((!curSlide.Quizz.DisplayResponse) || (curSlide.Quizz.DisplayResponse && this._quizWaitUserChoices))) {
        if (!curSlide.Quizz.DisplayResultScreen) {
            this.changeSlide("forward");
        }
        else {
            this.quizzDisplayResults(curSlide, question);
            //disable next button if slide is last
            var nbSlides = this._xmlReader.slideCount();
            this._buttonState.next.activate = (this._dataCom.getCurrentSlide() < nbSlides);
            this.raiseButtonStateChanged(this._buttonState);
        }
        return;
        }

        if (curSlide.Quizz.DisplayResponse) {
            if (!this._quizWaitUserChoices && !this.quizzCanGoToNextQuestion(curSlide, prevquestion)) { return; }
        }
        else {
            if (prevquestion != null && !this.quizzCanGoToNextQuestion(curSlide, prevquestion)) return;
        }

        //question suivante
        var questionData = (this._quizWaitUserChoices) ? question : prevquestion;
        //change background picture
        var bgPicture = curSlide.getImage("q" + questionData.Id);
        if (bgPicture !== null && bgPicture.getPicture() !== null) {
        
            var imgSize = bgPicture.getPictureSize();
            var $bgQuizz = this._options.container.find(".slideshow_quizz");

            var divWidth = $("#image").width();
            var divHeight = $("#image").height();
                            
            var imgRatio = imgSize.width / imgSize.height;
            var imgWidth = divHeight * imgRatio;
            var imgHeight = divHeight;
                            
            if (imgWidth > divWidth) {
                imgWidth = divWidth;
                imgHeight = imgWidth / imgRatio;
            }
                            
            this.ResizeCoef = imgHeight / imgSize.height;
                            
            var top = (divHeight - imgHeight) / 2;
            if ($("body").height() > $(window).height()) top = 0;
            
            $bgQuizz.find(".imgQuizzBackGround").remove();
            
            var html = '<img class="imgQuizzBackGround" src="' + bgPicture.getPicture().src + '" style="left: ' + (divWidth - imgWidth) / 2 + 'px; top: ' + top + 'px; width: ' + imgWidth + 'px; height: ' + imgHeight + 'px;" />';
            
            $bgQuizz.append(html);
        }
        else if($bgQuizz) {
            $bgQuizz.find(".imgQuizzBackGround").remove();
        }
        
        var quizData = { 'question': questionData.Text, 'quizRetry': curSlide.Quizz.quizRetry === true, 'choices': questionData.choices, 'instruction' : curSlide.Quizz.getLabel('instruction'), 'options' : questionData.options, 'q': questionData };
        var slideInfoName = (typeof withImage !== "undefined") ? 'displayButtonImgQ' : 'displayButtonQ' ;
        this.raiseSlideInfo(slideInfoName, quizData);

           //Event
        if (!questionData.userResponses.isValidated || curSlide.Quizz.quizRetry === true) {
        
            this._options.container.find(".btnStyle").on("click", { ss: this, q: questionData } , function(e) {
                            
                var $this = $(this);
                var respId = $this.attr("id").substring(3);
                var choice = e.data.q.getChoice(respId);

                //If single choice, unselect the last one
                if (!e.data.q.multichoice) {
                    if($this.hasClass("checked")) return;
                                
                    e.data.ss._options.container.find(".btnStyle").each(function() {
                        var $this = $(this);
                        if ($this.hasClass("checked")) {
                            $this.removeClass("checked");
                            //Change image
                            var respId = $this.attr("id").substring(3);
                            e.data.q.userResponses.removeResponse(respId);
                        }
                    });

                     e.data.q.userResponses.addResponse(respId);
                     $this.addClass("checked");
                    
                     if(slideInfoName == 'displayButtonImgQ' && choice.Image != ""){
                         $('#imgQuizContainer').html('<img class="img-responsive" src="' + ref._xmlReader._picPath + '/' + choice.Image + '" />');
                     }
                     else{
                         $('#imgQuizContainer').html('');
                     }
                                        
                }
                else {

                    if($this.hasClass("checked")){
                        var respId = $this.attr("id").substring(3);
                        e.data.q.userResponses.removeResponse(respId);
                        $this.removeClass("checked");
                        return ;
                    }

                                
                    var choice = e.data.q.getChoice(respId);
                    if (choice !== null && choice.group !== null) {
                                    
                        e.data.ss._options.container.find(".btnStyle").each(function() {
                            var $this = $(this);
                            var currRespId = $this.attr("id").substring(3);
                            var currChoice = e.data.q.getChoice(currRespId);
                            if ($this.hasClass("checked") == true && currChoice !== null && choice.Id != currRespId && choice.group == currChoice.group) {
                                $this.removeClass("checked");

                                e.data.q.userResponses.removeResponse(currRespId);
                            }
                        });
                                
                    }
                    
                    e.data.q.userResponses.addResponse(respId);
                    $this.addClass("checked");
                    if(slideInfoName == 'displayButtonImgQ' && choice.Image != ""){
                         $('#imgQuizContainer').html('<img class="img-responsive" src="' + ref._xmlReader._picPath + '/' + choice.Image + '" />');
                     }
                     else{
                         $('#imgQuizContainer').html('');
                     }

                                
                }
                            

                
                $("#myBtnNextQuestion").css("display", (e.data.q.userResponses.hasResponse()) ? 'block': 'none');
                                
            });

        }
        else {
            $("#myBtnNextQuestion").css("display", 'block');
        }
        
               //Play audio
        if (this._quizWaitUserChoices) {
            if (this._quizProgress == 0) {
                if ($.trim(curSlide.Sound) != "") {
                    if ($.trim(questionData.sound) != "") this._readaudioafter = questionData.sound;                
                    this._options.playeraudio.actLAP('play', {'file' : curSlide.Sound });
                }
                else {
                    if ($.trim(questionData.sound) != "") this._options.playeraudio.actLAP('play', {'file' : questionData.sound });
                }
            }
            else {
                if ($.trim(questionData.sound) != "") this._options.playeraudio.actLAP('play', {'file' : questionData.sound });
            }
        }
        
        //Display response ?
        this.quizzButtonDisplayResponse(curSlide, questionData,slideInfoName);

        if (curSlide.Quizz.DisplayResponse) {
            if (this._quizWaitUserChoices) this._quizProgress++;
            this._quizWaitUserChoices = !this._quizWaitUserChoices;
        }
        else {
            this._quizProgress++;
        } 
        
       this.resizeDivImage();

    },


    displayValidInvalidQuiz : function(){
        
        var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        var ref = this;

        this._options.playeraudio.actLAP('stop');
        $("#myBtnNextQuestion").css("display", "none");
        $("#btnStartQuizz").css("display", "none");
        $("#choicecomment").css("display", "none");

        //go to next slide
        if (this._quizProgress == "gotonext") {
            this.changeSlide("forward");
            return;
        }

        if (this._quizProgress == "start") {
            //display screen quiz
            this.raiseSlideInfo("displayquiz", null);
            this._quizProgress = 0;
            this._quizWaitUserChoices = true;
        }

        var question = curSlide.Quizz.getQuestion(this._quizProgress);
        if (question != null && !curSlide.Quizz.getDisplayQuestionAnswered()) {
            //On avance a la question en attente de reponse
            var countQ = curSlide.Quizz.countQuestion();
            for(var indQ = question.Index; indQ < countQ; indQ++) {
                if (this.quizzCanGoToNextQuestion(curSlide, question)) {
                    question = curSlide.Quizz.getQuestion(indQ+1);
                    this._quizProgress++;
                    this._quizWaitUserChoices = true;
                }
                else 
                {
                    break;
                }
            }
        }

        var prevquestion = curSlide.Quizz.getQuestion(this._quizProgress-1);

        //Validate previous question
        if (prevquestion != null && (!prevquestion.userResponses.isValidated || curSlide.Quizz.quizRetry === true)) {
            prevquestion.userResponses.isValidated = true;
            //Save response
            var saveResp = true;
            if (curSlide.Quizz.DisplayResponse) {
                saveResp = !this._quizWaitUserChoices;
            }
            if (saveResp) {
                this._dataCom.updateQuizQuestion(prevquestion);
                this._dataCom.saveData();
            }
        }

        if (question == null && ((!curSlide.Quizz.DisplayResponse) || (curSlide.Quizz.DisplayResponse && this._quizWaitUserChoices))) {
          
            if (!curSlide.Quizz.DisplayResultScreen && !curSlide.Quizz.RetryQuizz) {
              this.changeSlide("forward");
            }
           //
            else if( curSlide.Quizz.RetryQuizz && curSlide.Quizz.DisplayResultScreen){
              this.quizzDisplayRepeat(curSlide,question);
            }
            else if(curSlide.Quizz.DisplayResultScreen) {
                this.quizzDisplayResults(curSlide, question);
                //disable next button if slide is last
                var nbSlides = this._xmlReader.slideCount();
                this._buttonState.next.activate = (this._dataCom.getCurrentSlide() < nbSlides);
                this.raiseButtonStateChanged(this._buttonState);
            }
            return;
        }

        if (curSlide.Quizz.DisplayResponse) {
            if (!this._quizWaitUserChoices && !this.quizzCanGoToNextQuestion(curSlide, prevquestion)) { return; }
        }
        else {
            if (prevquestion != null && !this.quizzCanGoToNextQuestion(curSlide, prevquestion)) return;
        }

        //question suivante
        var questionData = (this._quizWaitUserChoices) ? question : prevquestion;
        //change background picture
        var bgPicture = curSlide.getImage("q" + questionData.Id);
        if (bgPicture !== null && bgPicture.getPicture() !== null) {
        
            var imgSize = bgPicture.getPictureSize();
            var $bgQuizz = this._options.container.find(".slideshow_quizz");

            var divWidth = $("#image").width();
            var divHeight = $("#image").height();
                            
            var imgRatio = imgSize.width / imgSize.height;
            var imgWidth = divHeight * imgRatio;
            var imgHeight = divHeight;
                            
            if (imgWidth > divWidth) {
                imgWidth = divWidth;
                imgHeight = imgWidth / imgRatio;
            }
                            
            this.ResizeCoef = imgHeight / imgSize.height;
                            
            var top = (divHeight - imgHeight) / 2;
            if ($("body").height() > $(window).height()) top = 0;
            
            $bgQuizz.find(".imgQuizzBackGround").remove();
            
            var html = '<img class="imgQuizzBackGround" src="' + bgPicture.getPicture().src + '" style="left: ' + (divWidth - imgWidth) / 2 + 'px; top: ' + top + 'px; width: ' + imgWidth + 'px; height: ' + imgHeight + 'px;" />';
            
            $bgQuizz.append(html);
        }
        else {
            $bgQuizz.find(".imgQuizzBackGround").remove();
        }
        
        var quizData = { 'question': questionData.Text, 'quizRetry': curSlide.Quizz.quizRetry === true, 'choices': questionData.choices, 'instruction' : curSlide.Quizz.getLabel('instruction'), 'options' : questionData.options, 'q': questionData };
    
        this.raiseSlideInfo("validInvalidQuiz", quizData);

           //Event
        if (!questionData.userResponses.isValidated || curSlide.Quizz.quizRetry === true) {
        
            // questionData.userResponses.isValidated = true;

            $(".choicesContainer").each($.proxy(function(key,choice){
                var ref = { ss: this, q: questionData };
                this.droppableZone2($(choice), function(drop,drag){
                  drop.append(drag);
                  drag.css({'left':'0px', 'top':'0px','z-index':0});
                  if($(".optionsContainer1").find(".choiceDiv").length == 0){
                    ref.q.userResponses.removeAllResponse();
                    $("#myBtnNextQuestion").css("display","block");
                    $(".validContainer").find(".choiceDiv").each(function(key,validchoice){
                        var $this = $(validchoice);
                        var respId = $this.attr("id").substring(3);
                        var correct = question.isCorrect(respId);
                        ref.q.userResponses.addResponse(respId);
                    });
                  }
                  else{
                     $("#myBtnNextQuestion").css("display","none");
                  }
                });
            },this));


            $(".choiceDiv").each($.proxy(function(key,choice){
                this.draggableItem2($(choice));
            },this));

           $(".choiceDivMirror").each($.proxy(function(key,choice){
            this.droppableZone2($(choice),
                function(drop,drag){
                  var id = drag.attr("id").substring(3);
                  $("#m_"+id).append(drag);
                  drag.css({'left':'0px', 'top':'0px','z-index':1});
                  if($(".optionsContainer1").length > 0){
                    $("#myBtnNextQuestion").css("display","none");
                  }
                });
            },this));

        }
        else {
            $("#myBtnNextQuestion").css("display", 'block');
        }
        
               //Play audio
        if (this._quizWaitUserChoices) {
            if (this._quizProgress == 0) {
                if ($.trim(curSlide.Sound) != "") {
                    if ($.trim(questionData.sound) != "") this._readaudioafter = questionData.sound;                
                    this._options.playeraudio.actLAP('play', {'file' : curSlide.Sound });
                }
                else {
                    if ($.trim(questionData.sound) != "") this._options.playeraudio.actLAP('play', {'file' : questionData.sound });
                }
            }
            else {
                if ($.trim(questionData.sound) != "") this._options.playeraudio.actLAP('play', {'file' : questionData.sound });
            }
        }
        
        //Display response ?
        this.quizValidInvalidDisplayResponse(curSlide, questionData);

        if (curSlide.Quizz.DisplayResponse) {

            if (this._quizWaitUserChoices) this._quizProgress++;
            this._quizWaitUserChoices = !this._quizWaitUserChoices;
          
        }
        else {
            this._quizProgress++;
        } 
        
       this.resizeDivImage();

    },

    draggableItem2 : function(obj){
      obj.draggable({
        containment: '.responseQuiz',
        revert     :'invalid',
        cursor : 'move', 
        stack : '.choiceDiv',

        revert: true 
      });
    },

   droppableZone2 : function(obj, callbackDrop){
    obj.droppable({
    accept : '.choiceDiv',
    activeClass: 'hover',
    hoverClass: 'active',
    drop : function(event, ui){
        var current = ui.draggable; 
        var $this = $(obj);
        if (typeof callbackDrop !== "undefined") callbackDrop($this, ui.draggable);
        
       }
      });
  },

  
    displayQuiz: function() {

        
        var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
        //Stop current audio
        this._options.playeraudio.actLAP('stop');
       
        
        $("#myBtnNextQuestion").css("display", "none");
        $("#goToNextQuestion").css("display", "none");
        $("#btnStartQuizz").css("display", "none");
        $("#choicecomment").css("display", "none");
        
        this._readaudioafter = null;
        
        //go to next slide
        if (this._quizProgress == "gotonext") {
            this.changeSlide("forward");
            return;
        }
    
        if (this._quizProgress == "start") {
            //display screen quiz
            this.raiseSlideInfo("displayquiz", null);
            this._quizProgress = 0;
            this._quizWaitUserChoices = true;
            var rightToRetry = (!$.isNumeric(curSlide.Quizz.RetryMaxQuizz) || curSlide.Quizz.RetryMaxQuizz > curSlide.Quizz.RetryNbre);
           
            if($.isNumeric(curSlide.Quizz.NombreQuestionMax)){
                curSlide.Quizz.fillListQuestions(parseInt(curSlide.Quizz.NombreQuestionMax), curSlide.Quizz.RetryQuizz === false || !rightToRetry);
            }

           // delete the previuos responses if Quizz Retry Active and question already validated and nbre of retry not achieved          
            if( curSlide.Quizz.RetryQuizz === true && rightToRetry === true){
                var quizTotal = curSlide.Quizz.countQuestion();
                for(var iQ = 0; iQ < quizTotal; iQ++)
                {
                var q = curSlide.Quizz.getQuestion(iQ);
                if(q.userResponses.isValidated) {q.randomise();}
                q.userResponses.removeAllResponse();
                }
            }
            else if(curSlide.Quizz.RetryQuizz === true && !rightToRetry){
               curSlide.Quizz.DisplayResponseColor = true; 
               curSlide.Quizz.ForceDisplayResponse = true;
            }

            if(curSlide.Animation && curSlide.hasAnimation()){
             var $imgClass = this._options.container.find(".slideshow_img1").css("display") != "none" ? ".slideshow_img1" : ".slideshow_img2";
             curSlide.Animation.recuperateAnimations(null,{ 'ratio': this.ResizeCoef, 'container': this._options.container, 'refPic': this._options.container.find($imgClass), 'isQuiz' : true});
            } 
        }

        var question = curSlide.Quizz.getQuestion(this._quizProgress);
        if (question != null && !curSlide.Quizz.getDisplayQuestionAnswered()) {
            //On avance a la question en attente de reponse
            var countQ = curSlide.Quizz.countQuestion();
            for(var indQ = question.Index; indQ < countQ; indQ++) {
                if (this.quizzCanGoToNextQuestion(curSlide, question)) {
                    question = curSlide.Quizz.getQuestion(indQ+1);
                    this._quizProgress++;
                    this._quizWaitUserChoices = true;
                }
                else 
                {
                    break;
                }
            }
        }
        
        var prevquestion = curSlide.Quizz.getQuestion(this._quizProgress-1);


        //Validate previous question
        if (prevquestion && (!prevquestion.userResponses.isValidated || curSlide.Quizz.RetryQuizz === true)) {

            prevquestion.userResponses.isValidated = true;
             if( this._quizProgress == 1 && 
                (!curSlide.Quizz.DisplayResponse || (curSlide.Quizz.DisplayResponse && !this._quizWaitUserChoices)) && 
                prevquestion.userResponses.hasResponse()) curSlide.Quizz.RetryNbre++;
            //if(this._quizProgress == 1 && prevquestion.userResponses.hasResponse()) curSlide.Quizz.RetryNbre++;
            
            // here if the MaxRetry is activated and  achieved we put the question correct
            if($.isNumeric(curSlide.Quizz.RetryMaxQuizz) && curSlide.Quizz.RetryMaxQuizz <= curSlide.Quizz.RetryNbre){
                if(!question){
                    curSlide.Quizz.ForceDisplayResponse = true;
                    curSlide.Quizz.DisplayResponseColor = true;
                }  
            }

            //Save response
            var saveResp = true;
            if (curSlide.Quizz.DisplayResponse) {
                saveResp = !this._quizWaitUserChoices;
            }
            if (saveResp) {
                this._dataCom.updateQuizQuestion(prevquestion);
                this._dataCom.saveData();
            }
        }
        
        if (question == null && ((!curSlide.Quizz.DisplayResponse) || (curSlide.Quizz.DisplayResponse && this._quizWaitUserChoices))) {

            var currentQuizScore = curSlide.Quizz.getQuizzScore();

            // test if we achieve max retry and score lower than forcedScore
            if($.isNumeric(curSlide.Quizz.RetryMaxQuizz) && curSlide.Quizz.RetryMaxQuizz < curSlide.Quizz.RetryNbre && currentQuizScore.raw <= this.forcedScore){  
              curSlide.Quizz.DisplayResponseColor = true;
              curSlide.Quizz.ForceDisplayResponse = true;
              if(!curSlide.Quizz.NotForcePScore) curSlide.Quizz.forceScore(this.forcedScore);
              this._dataCom.saveData();
            }
          

            if (!curSlide.Quizz.DisplayResultScreen && this.quizzCanGoToNextQuestion(curSlide, prevquestion)) {
              this.changeSlide("forward");
            }

            else if( curSlide.Quizz.RetryQuizz && curSlide.Quizz.DisplayResultScreen){
              this.quizzDisplayRepeat(curSlide,question);
            }
            
            else if(curSlide.Quizz.DisplayResultScreen) {
                this.quizzDisplayResults(curSlide, question);
                //disable next button if slide is last
                var nbSlides = this._xmlReader.slideCount();
                this._buttonState.next.activate = (this._dataCom.getCurrentSlide() < nbSlides);
                this.raiseButtonStateChanged(this._buttonState);
            }
            return;
        }
        
        if (curSlide.Quizz.DisplayResponse) {
            if (!this._quizWaitUserChoices && !this.quizzCanGoToNextQuestion(curSlide, prevquestion)) { return; }
        }
        else {
            var goto = this.quizzCanGoToNextQuestion(curSlide, prevquestion);
            if (prevquestion != null && !this.quizzCanGoToNextQuestion(curSlide, prevquestion)) return;
        }
        
        //Affiche la question
        var questionData = (this._quizWaitUserChoices) ? question : prevquestion;

        
        //question suivante
        //change background picture
        var bgPicture = curSlide.getImage("q" + questionData.Id);
        if (bgPicture !== null && bgPicture.getPicture() !== null) {
        
            var imgSize = bgPicture.getPictureSize();
            var $bgQuizz = this._options.container.find(".slideshow_quizz");

            var divWidth = $("#image").width();
            var divHeight = $("#image").height();
                            
            var imgRatio = imgSize.width / imgSize.height;
            var imgWidth = divHeight * imgRatio;
            var imgHeight = divHeight;
                            
            if (imgWidth > divWidth) {
                imgWidth = divWidth;
                imgHeight = imgWidth / imgRatio;
            }
                            
            this.ResizeCoef = imgHeight / imgSize.height;
                            
            var top = (divHeight - imgHeight) / 2;
            if ($("body").height() > $(window).height()) top = 0;
            
            $bgQuizz.find(".imgQuizzBackGround").remove();
            
            var html = '<img class="imgQuizzBackGround" src="' + bgPicture.getPicture().src + '" style="left: ' + (divWidth - imgWidth) / 2 + 'px; top: ' + top + 'px; width: ' + imgWidth + 'px; height: ' + imgHeight + 'px;" />';
            
            $bgQuizz.append(html);
            
            //$bgQuizz.css("background-image", "url('" + bgPicture.getPicture().src + "')");
            //$bgQuizz.css("background-size", picSize.width + 'px' + ' ' + picSize.height + 'px');
        }
        else if($bgQuizz){
            $bgQuizz.find(".imgQuizzBackGround").remove();
            //this._options.container.find(".slideshow_quizz").css("background-image", "");
        }
        

        var quizData = { 'question': questionData.Text, 'quizRetry': curSlide.Quizz.RetryQuizz === true, 'choices': questionData.choices, 'instruction' : curSlide.Quizz.getLabel('instruction'), 'options' : questionData.options, 'q': questionData };

        this.raiseSlideInfo("displayquizquestion", quizData);
        
        this._options.container.find(".imgChoiceCheck").data("disabled", false);                
        this._options.container.find(".imgChoiceCheck.imgCheck").data("check", true);
        

    
        //Event
        if (!questionData.userResponses.isValidated || (curSlide.Quizz.RetryQuizz === true && rightToRetry === true)) {
        
            this._options.container.find(".imgChoiceCheck").on("click", { ss: this, q: questionData } , function(e) {
                            
                var $this = $(this);
                var respId = $this.attr("id").substring(3);
                    
                //If single choice, unselect the last one
                if (!e.data.q.multichoice) {
                                
                    e.data.ss._options.container.find(".imgChoiceCheck").each(function() {
                        var $this = $(this);
                        if ($this.data("check") == true) {
                            $this.data("check", false);
                            //Change image
                            $this.addClass("imgUncheck");
                            $this.removeClass("imgCheck");
                            var respId = $this.attr("id").substring(3);
                            e.data.q.userResponses.removeResponse(respId);
                        }
                    });
                                        
                }
                else {
                                
                    var choice = e.data.q.getChoice(respId);
                    if (choice !== null && choice.group !== null) {
                                    
                        e.data.ss._options.container.find(".imgChoiceCheck").each(function() {
                            var $this = $(this);
                            var currRespId = $this.attr("id").substring(3);
                            var currChoice = e.data.q.getChoice(currRespId);
                            if ($this.data("check") == true && currChoice !== null && choice.Id != currRespId && choice.group == currChoice.group) {
                                $this.data("check", false);
                                //Change image
                                this.addClass("imgUncheck");
                                $this.removeClass("imgCheck");
                                e.data.q.userResponses.removeResponse(currRespId);
                            }
                        });
                                
                    }
                                
                }
                            
                //Change state
                var currentState = ($this.data("check") == null ? false : $this.data("check"));
                currentState = !currentState;
                $this.data("check", currentState); // save the new state
                            
                // Change l'image
                if (currentState) {
                    $this.addClass("imgCheck");                                                             
                    $this.removeClass("imgUncheck");                
                    e.data.q.userResponses.addResponse(respId);
                }
                else {
                    $this.addClass("imgUncheck");                                                               
                    $this.removeClass("imgCheck");          
                    e.data.q.userResponses.removeResponse(respId);                          
                }
                
                $("#myBtnNextQuestion").css("display", (e.data.q.userResponses.hasResponse()) ? 'block': 'none');
                                
            });

        }
        else {
            $("#myBtnNextQuestion").css("display", 'block');
        }
        
        //Play audio
        if (this._quizWaitUserChoices) {
            if (this._quizProgress == 0) {
                if ($.trim(curSlide.Sound) != "") {
                    if ($.trim(questionData.sound) != "") this._readaudioafter = questionData.sound;                
                    this._options.playeraudio.actLAP('play', {'file' : curSlide.Sound });
                }
                else {
                    if ($.trim(questionData.sound) != "") this._options.playeraudio.actLAP('play', {'file' : questionData.sound });
                }
            }
            else {
                if ($.trim(questionData.sound) != "") this._options.playeraudio.actLAP('play', {'file' : questionData.sound });
            }
        }
        
        //Display response ?
        this.quizzDisplayResponses(curSlide, questionData);

        if (curSlide.Quizz.DisplayResponse) {
            if (this._quizWaitUserChoices) this._quizProgress++;
            this._quizWaitUserChoices = !this._quizWaitUserChoices;
        }
        else {
            this._quizProgress++;
        }
        
    },


    quizzFillBlankResponse:function(curSlide,state){
    var isError=false;
    var msg;
    var commentInc="";
    var commentCor="";
    var nbreOfCorrectAns=0;
    var badAnswer=null;
    var goodAnswer=null;
    var countQ = curSlide.Quizz.countQuestion();
    $("#choicecomment").html("");
      for(var indQ = 0; indQ < countQ; indQ++) {
            question = curSlide.Quizz.getQuestion(indQ);
            if(state=="validate"){
                var id=$("select[question-id="+question.Id+"]").val();
            }
            else {
                var id=question.userResponses.getResponses()[0];
                $("select[question-id="+question.Id+"]").val(id);
            }
                    
            if(!question.isCorrect(id)){
                $("select[question-id="+question.Id+"]").css("border","2px solid red");
                isError=true;
                // commentInc=(parseInt(question.Index)+1)+" : is Incorrect";
                //commentInc+=", the correct one is "+question.getCorrect()[0].Text;
                commentInc = question.getComment(id);
                commentInc+="</br>";
                var msg = "<p style='color:red'>"+commentInc+"</p>";
            }
            else {
                isError=false;
                nbreOfCorrectAns++;
                $("select[question-id="+question.Id+"]").css("border","2px solid #00A65A");
                commentCor  = question.getComment(id);
                commentCor+="</br>";
                var msg = "<p style='color:green'>"+commentCor+"</p>";
            }
                //$("#choicecomment").html($("#choicecomment").html()+msg);
         }

          $("select[question-id]").attr("disabled","disabled");
          //$("#contentComment").css("display","block");
            
    },

    quizValidInvalidDisplayResponse : function(curSlide,question){
       

        if (curSlide.Quizz.DisplayResponse && !this._quizWaitUserChoices) {
            var ref= this;
                //display good & bad response
                 this._options.container.find(".choiceDiv").each(function(key,obj) {
                     var $this   = $(this);
                     var respId  = $this.attr("id").substring(3);
                     var correct = question.isCorrect(respId);
                     $className = (correct) ? "validDiv" : "invalidDiv";
                     $(obj).removeClass("choiceDiv").addClass($className);
                 });

       
            var audio = "";
            if (question.userResponses.hasResponse()) {
                var uResp = question.userResponses.getResponses();
                for(var iR = 0; iR < uResp.length; iR++) { 
                    var aud = question.getAudio(uResp[iR]);
                    if (aud != "") audio = aud;
                }
            }

            
            $("#myBtnNextQuestion").css("display", 'block');

            //audio
            if (aud != "") {
                this._options.playeraudio.actLAP('play', {'file' : aud });
            }
        }
    },

    quizzButtonDisplayResponse : function(curSlide,question,slideInfoName){

        if (curSlide.Quizz.DisplayResponse && !this._quizWaitUserChoices) {
            var ref = this;
                //display good & bad response
        
            this._options.container.find(".btnStyle").each(function() {
                var $this = $(this);
                $this.prop("disabled",true);
                var id = $this.attr("id").substring(3);
                var correct = question.isCorrect(id);
                var choice = question.getChoice(id);
                if($this.hasClass("checked")){
                   $this.removeClass("checked");
                   $this.addClass(correct ? 'correctResponseBTN': 'wrongResponseBTN');
                }
                else{
                   $this.addClass(correct ? 'correctResponseBTN': '');
                }
                if(correct && slideInfoName == 'displayButtonImgQ' && choice.Image != ""){
                    $('#imgQuizContainer').html('<img class="img-responsive" style="border:1px solid #00A65A" src="' + ref._xmlReader._picPath + choice.Image + '" />');
                }
            });        
            var audio = "";
            if (question.userResponses.hasResponse()) {
                var uResp = question.userResponses.getResponses();
                for(var iR = 0; iR < uResp.length; iR++) { 
                    var aud = question.getAudio(uResp[iR]);
                    if (aud != "") audio = aud;
                }
            }

            
            $("#myBtnNextQuestion").css("display", 'block');

            //audio
            if (aud != "") {
                this._options.playeraudio.actLAP('play', {'file' : aud });
            }
        }

    },

    quizzDragDropResponse:function(curSlide,state){
	var isError=false;
	var msg;
	var commentInc="";
	var commentCor="";
	var nbreOfCorrectAns=0;
	var badAnswer=null;
	var goodAnswer=null;
	var idQ=-1;
	var id=-1;
	var countQ = curSlide.Quizz.countQuestion();
    for(var indQ = 0; indQ < countQ; indQ++) {
					question = curSlide.Quizz.getQuestion(indQ);
					if(state=="validate"){
						var data=$(".itemDrop[data-info="+question.Id+"]").find(".itemDrag").attr("data-link");
					    id = data.split("_")[1];
					    idQ=data.split("_")[0];
					}
					else {
						var id_Resp=question.userResponses.getResponses()[0];
						id  = id_Resp.split("_")[1];
					    idQ = id_Resp.split("_")[0];
						var itemDrag = $(".itemDrag[data-link="+id_Resp+"]").detach();
						$(".itemDrop[data-info="+question.Id+"]").append("<span class='itemDrag'>"+itemDrag.html()+"</span>");
					}
					
				if(!question.isCorrect(id) ||  question.Id != idQ){
				  $(".itemDrop[data-info="+question.Id+"]").css("border","2px solid red");
				  isError=true;
				 commentInc = question.getComment(id);
				 var msg = "<p style='color:red'>"+commentInc+"</p>";
						
					}
					else {
					isError=false;
					  nbreOfCorrectAns++;
					 commentCor = question.getComment(id);
                     var msg = "<p style='color:green'>"+commentCor+"</p>";
						
					}
					$("#choicecomment").html($("#choicecomment").html()+msg);


		      }
                  $("#contentComment").css("display","block");
				// desactive Draggable	    
	},
	
    
    quizzDisplayResponses: function(curSlide, question) {

        if ((curSlide.Quizz.DisplayResponse && !this._quizWaitUserChoices) ||  curSlide.Quizz.ForceDisplayResponse) {

            this._options.container.find(".imgChoiceCheck").data("disabled", true);                 
            this._options.container.find(".imgChoiceCheck").off("click");
            this._options.container.find(".imgChoiceCheck").css("cursor", "default");
                
            //display good & bad response
            this._options.container.find(".choicetxt").each(function() {
                var $this = $(this);
                var id = $this.attr("id").substring(6);
                var correct = question.isCorrect(id);
                if(curSlide.Quizz.DisplayResponseColor && !(curSlide.Quizz.HideColorResponse == 1)){
                  $this.addClass(correct ? 'correctResponse': 'wrongResponse');
                }
            });
            // changes by Abdo 
            // check if the response is correct
            var isError=false;
            var commentInc="";
            var commentCor="";
            var nbreOfCorrectAns=0;
            var badAnswer=null;
            var goodAnswer=null;
            var nbreOfAns=question.getCorrectId().length;
            var audio = "";
            var showComment = curSlide.Quizz.DisplayResponseColor;

            $("#choicecomment").html("");
            this._options.container.find(".imgCheck").each(function() {
                var $this =$(this);
                var id= $this.attr("id").substring(3);
                var correct = question.isCorrect(id);
                if(!correct) {
                 isError=true;
                 badAnswer = question.getChoice(id);
                 commentInc += "Question N:"+(parseInt(id)+1)+" ";
                 commentInc += question.getComment(id);
                 commentInc += "</br>";
                }
                else {
                     nbreOfCorrectAns++;
                     goodAnswer  = question.getChoice(id);
                     commentCor += "Question N:"+(parseInt(id)+1)+" ";
                     commentCor += question.getComment(id);
                     commentCor += "</br>";
                }
            });

        var isQuestionComment = question.isComment;

        if(isQuestionComment && showComment){

                if(!isError && nbreOfAns == nbreOfCorrectAns ){
                    $("#choicecomment").html(question.questionCComment);
                    $("#choicecomment").css({"color":"green", "display" : "block"});
                }
                else if(nbreOfCorrectAns > 0 && (isError || nbreOfAns != nbreOfCorrectAns)){
                   $("#choicecomment").html(question.questionPComment);
                   $("#choicecomment").css({"color":"orange", "display" : "block"});
                }
                else{
                    $("#choicecomment").html(question.questionIComment);
                    $("#choicecomment").css({"color":"red", "display" : "block"});
                }

        }
        else{

            if(!isError && nbreOfAns == nbreOfCorrectAns && typeof goodAnswer.Comment !== "undefined" && showComment) {
              //correct response
              $("#choicecomment").css("color","green").html(goodAnswer.Comment);
              $("#choicecomment").css("display", 'block');
            }
            else if(!isError && nbreOfAns != nbreOfCorrectAns){
                for (var i = 0; i<question.choices.length; i++) {
                    //console.log(question.choices[i].correct);
                    if(!question.choices[i].correct) 
                     {badAnswer=question.choices[i];
                        break;}
                     }
            if(badAnswer != null && typeof badAnswer.Comment !== "undefined" && showComment ){
                $("#choicecomment").css("color","red").html(badAnswer.Comment);
                $("#choicecomment").css("display", 'block');
            }
                
            }
            else {
                // error response
               if(badAnswer != null && typeof badAnswer.Comment !== "undefined" && showComment){
                $("#choicecomment").css("color","red").html(badAnswer.Comment);
                $("#choicecomment").css("display", 'block');
               }
            }
        }
            var audio = '';
            var errorResponse = (isError || nbreOfAns != nbreOfCorrectAns) ? true : false;
            for (var i = 0; i<question.choices.length; i++) {
                if(!question.choices[i].correct && errorResponse) {
                   audio = question.getAudio(question.choices[i].Id);
                }
                else if(question.choices[i].correct && !errorResponse){
                   audio = question.getAudio(question.choices[i].Id);
                }
            }

            $("#goToNextQuestion").css("display", 'block');
            $("#myBtnNextQuestion").css("display", 'none');
            
            /*if (comment != "") {
                $("#choicecomment").html(comment);
                $("#choicecomment").css("display", 'block');
            }*/

            //audio
            if (audio != "") {
                this._options.playeraudio.actLAP('play', {'file' : audio });
            }
            
        }
    
    },

    quizzDisplayRepeat: function(curSlide, question){

        var quizTotal  = curSlide.Quizz.countQuestion();
        var quizGood   = 0;
        var quizResult = 0;
        var result     = 0;
        var nbSlides   = this._xmlReader.slideCount();

        for(var iQ = 0; iQ < quizTotal; iQ++)
        {
             var q = curSlide.Quizz.getQuestion(iQ);
             if (q.check(q.userResponses.getDecisions())) quizGood++;
             quizResult += q.getScore();
        }
        
        this._options.container.find(".slideshow_quizz").css("background-image", "");

        if (quizTotal > 0) result =  Math.round(quizResult/quizTotal);
        
        if(result < 80){
            this.raiseSlideInfo("displayquizrepeat", { 'result': result, 'quizGood':quizGood,'quizTotal':quizTotal});  
            // this._quizProgress = "gotonext"; 
            for(var iQ = 0; iQ < quizTotal; iQ++)
            {
               var q = curSlide.Quizz.getQuestion(iQ);
                q.randomise();
                q.userResponses.removeAllResponse();
            }

            this._buttonState.next.activate = false;
            
        } 
        else if(curSlide.Quizz.DisplayResultScreen){
             this.quizzDisplayResults(curSlide, question);
             this._buttonState.next.activate = (this._dataCom.getCurrentSlide() < nbSlides);
        }
        else{
            this._buttonState.next.activate = (this._dataCom.getCurrentSlide() < nbSlides);
            this.changeSlide("forward");
        }
        this.raiseButtonStateChanged(this._buttonState);
    },
    
    quizzDisplayResults: function(curSlide, question) {
    
        // //plus de question affichage des r�sultats
        var result = "0";
        
        var quizTotal = curSlide.Quizz.countQuestion();
        var quizGood = 0;
        var quizResult = 0;
        for(var iQ = 0; iQ < quizTotal; iQ++)
           {
             var q = curSlide.Quizz.getQuestion(iQ);
             if (q.check(q.userResponses.getDecisions())) quizGood++;
             quizResult += q.getScore();
          }
        
         this._options.container.find(".slideshow_quizz").css("background-image", "");
         if (quizTotal > 0) result = Math.round(quizResult/quizTotal);
         this.raiseSlideInfo("displayquizresult", { 'result': result, 'quizGood':quizGood,'quizTotal':quizTotal  });
         this._quizProgress = "gotonext";
    
    },
    
    quizzCanGoToNextQuestion: function(curSlide, question) {
    
        if (question == null) return false;
    
        var resp = new Array();
        var gp = question.getGroups();
        var countGP = {};
            
        var uResp = question.userResponses.getResponses();
        var rightToRetry = (!$.isNumeric(curSlide.Quizz.RetryMaxQuizz) || curSlide.Quizz.RetryMaxQuizz >= curSlide.Quizz.RetryNbre);
        if(!rightToRetry) return true;
        if (uResp.length == 0) return false;
        
        for(var iResp = 0; iResp < uResp.length; iResp++) {
            var choice = question.getChoice(uResp[iResp]);
            if (choice !== null) {
                if (countGP["G" + choice.group] == undefined) countGP["G" + choice.group] = 1; else countGP["G" + choice.group]++;
            }
        }
        
        for(var iGp = 0; iGp < gp.length; iGp++) {
            if (countGP["G" + gp[iGp]] == undefined) { return false; }
        }
                
        return true;

    },
    
/***************************
* LMS
****************************/   
    
    // getLMSSlide: function() {
        
        // var lastSlide = 0;
        // var lstP = this.Session.getData("cmi.suspend_data");
        // var suspend_data = lstP.split(";");
        // lstP = (suspend_data.length == 2) ? parseInt(suspend_data[1]) : 0;
        // if (isNaN(lstP)) lstP = 0;
        // return lstP;
        
    // },
    
    // getProgression: function() {
    
        // var progress = 0;
        // if (this._maxSlideDisp + 1 >= this._xmlReader.slideCount())
        // {
            // progress = 100;
        // }
        // else
        // {
            // progress = Math.round((this._maxSlideDisp)/this._xmlReader.slideCount()*100);
        // }
        // if (progress < 0) progress = 0;
        // if (progress > 100) progress = 100;
        // return progress;
    
    // },
    
    // getLMSProgression: function() {

        // var lstP = this.Session.getData("cmi.suspend_data");
        // var suspend_data = lstP.split(";");
        // lstP = (suspend_data.length == 2) ? parseInt(suspend_data[0]) : 0;
        // if (isNaN(lstP)) lstP = 0;
        // return lstP;
    
    // },
    
    // setLMSProgression: function() {
    
        // var prg = this.getProgression();
        // if (prg > this.getLMSProgression())
        // {
            // var lastSlideReaded = this._maxSlideDisp;
            // if (lastSlideReaded + 1 >= this._xmlReader.slideCount()) lastSlideReaded = this._xmlReader.slideCount();
            // this.Session.setData("cmi.suspend_data", prg + ";" + lastSlideReaded);       
        // }

// },   
    
/***************************
* MISC
****************************/   

    /********** 
    * getHelp
    *
    *********/  
    getHelp: function() {
        
        if (this._xmlReader === null) return { title: "??title??", "content": ""};
        return this._xmlReader.Help;
        
    },
    
    /********** 
    * GetLabel
    * Get label
    *********/
    getLabel: function(key) {
        if (this._xmlReader === null) return "??" + key + "??";
        var lbl = this._xmlReader.getLabel(key);
        return (lbl === null) ? "??" + key + "??" : lbl;
    },  
    
    getReader: function() {
        return this._xmlReader;
    },
    
    // buildSuspendData: function() {
    
        // /*build suspend_data key:[from-to-lastquestionsend]
            // pour 4 questions  => toto:[0-3-0] aucune question renseignee
                              // => toto:[0-3-4] 4 questions renseignees
        // */
        // var suspend_data = "";
        // var indiceLMS = 0;
        // var slides = this._xmlReader.getSlides();
        // for(var islide = 0; islide < slides.length; islide++) {
            
            // var slide = slides[islide];
            // if (slide.hasQuizz() && slide.SlideKey !== null) {
                
                // if (suspend_data != "") suspend_data += "/";
                
                // var cptprg = 0;
                // for(var indQ = 0; indQ < slide.Quizz.countQuestion(); indQ++) {
                    
                    // var question = slide.Quizz.getQuestion(indQ);
                    // question.cmiIndex = (indiceLMS + indQ);
                    // this.Session.setData("cmi.interactions." + (indiceLMS + indQ) + ".id", slide.SlideKey + '.' + question.Id);          
                    // this.Session.setData("cmi.interactions." + (indiceLMS + indQ) + ".type", 'choice');
                    // this.Session.setData("cmi.interactions." + (indiceLMS + indQ) + ".correct_responses.0.pattern", question.getCorrectId().join(";"));

                    // if (question.userResponses.isValidated) cptprg ++;
                // }
                
                // suspend_data += slide.SlideKey + ':[' + indiceLMS + '-' + (indiceLMS + (slide.Quizz.countQuestion() - 1)) + '-' + cptprg + ']';
                
                // indiceLMS += slide.Quizz.countQuestion();
                
            // }
        
        // }
        
        // return suspend_data;
            
    // },
    
    // loadQuizzResponses: function() {
        
        // if (this._quizLMSBridge === null) return;
    
        // if (this._quizLMSBridge.suspend_data == "") {
        
            // this._quizLMSBridge.suspend_data = this.buildSuspendData();
            // this.Session.setData("cmi.suspend_data", this._quizLMSBridge.suspend_data);
        
            // //Save data to LMS
            // this.Session.saveData();
            
        // }
        // else {
            
            // //Load data
            // var dtToLoad = [];
            // var questionLoadData = [];
            // var dtSuspend = this._quizLMSBridge.suspend_data.split("/");
            // for(var indquizzkey = 0; indquizzkey < dtSuspend.length; indquizzkey++) {
                
                // var dtquizz = dtSuspend[indquizzkey].split(":");
                // if (dtquizz.length == 2 && dtquizz[1].charAt(0) == '[' && dtquizz[1].charAt(dtquizz[1].length - 1) == ']') {
                    // dtquizz[1] = dtquizz[1].substring(1, dtquizz[1].length - 1);
                    // var dtquizzinfo = dtquizz[1].split("-");
                    // if (dtquizzinfo.length == 3) {
                        
                        // dtquizzinfo[0] = parseInt(dtquizzinfo[0]);
                        // dtquizzinfo[1] = parseInt(dtquizzinfo[1]);
                        // dtquizzinfo[2] = parseInt(dtquizzinfo[2]);
                        
                        // var slide = this._xmlReader.getSlideByKey(dtquizz[0]);
                        // if (slide !== null && slide.hasQuizz()) {
                            
                            // if (slide.Quizz.countQuestion() != (dtquizzinfo[1] - dtquizzinfo[0] + 1)) alert("Error suspend_data...");
                            
                            // for(var indQ = 0; indQ < slide.Quizz.countQuestion(); indQ++) {
                                
                                // var question = slide.Quizz.getQuestion(indQ);
                                // question.cmiIndex = dtquizzinfo[0] + indQ;
                                
                                // if (question.Index < dtquizzinfo[2]) {
                                    
                                    // dtToLoad.push('cmi.interactions.' + question.cmiIndex + '.student_response');
                                    // questionLoadData.push(question);
                                    
                                // }
                                
                            // }
                            
                        // }
                        
                    // }
                // }
                
            // }
            
            // //retrieve data from LMS
            // this.Session.loadDatas(dtToLoad);
            // for(var inddt = 0; inddt < dtToLoad.length; inddt++) {
                
                // var question = questionLoadData[inddt];
                // var resp = this.Session.getData('cmi.interactions.' + question.cmiIndex + '.student_response');
                
                // if (resp != "") {
                    // var tbresp = resp.split(";");
                    // for(var indresp = 0; indresp < tbresp.length; indresp++) {
                        // question.userResponses.addResponse(tbresp[indresp]);
                    // }
                    // question.userResponses.isValidated = true;                   
                // }
            
            // }
            
        // }
        
    // },
        
    // saveQuizzResponse: function(question) {
        
        // if (this._quizLMSBridge === null) return;
        
        // resp = question.userResponses.getResponses();
        
        // this.Session.setData("cmi.interactions." + question.cmiIndex + ".student_response", resp.join(";"));     
        // this.Session.setData("cmi.interactions." + question.cmiIndex + ".result", ((question.check(question.userResponses.getResponses())) ? "correct" : "wrong"));      
        
        // //Update suspend_data
        // this._quizLMSBridge.suspend_data = this.buildSuspendData();
        // this.Session.setData("cmi.suspend_data", this._quizLMSBridge.suspend_data);
        
        // this.Session.saveData(); //send to the lms

    // },
    
    getPixelParam: function(val) {
        
        val = $.trim(val).toLowerCase();
        
        var pxPos = val.indexOf("px");
        if (pxPos != -1) val = val.substr(0, pxPos);
        
        return val;
    
    },

    calculeVideoDim : function(dimContainer,selector){

        var video = document.getElementById(selector);
        var $video = $(video);
        var pw = dimContainer.width/video.videoWidth;
        var ph = dimContainer.height/video.videoHeight;
        var dims = {};

        var css = {position:"absolute",
                   top: "50%",left: "50%",
                   transform: "translateX(-50%) translateY(-50%)",
                   "background-size": "cover",
                   transition: "1s opacity"
                  };

        if(pw >= ph){
            //video.width = dimContainer.width;
            $video.attr("width",dimContainer.width);
            $video.attr("height","auto");
            $video.css(css);
        }
        else{
            //video.height = dimContainer.height;
            $video.attr("height",dimContainer.height);
            $video.attr("width","auto");
            $video.css(css);
        }

        dims.height = $video.height();
        dims.width  = $video.width();
        return dims;
    },
    
    resizeDivImage: function() {
    
        var posBottomBar = $("#bottom-bar").offset();
        var posTopBar = $("#top-bar").offset();
        var heightTopBar = $("#top-bar").outerHeight();
        
        //Resize image container
        // $("#image").css("height", posBottomBar.top - (posTopBar.top + heightTopBar));
        if (this.initializeSideBarObj && typeof this.initializeSideBarObj.initializesidebar === "function") this.initializeSideBarObj.resizeSideBar.call(this);

        if(this._xmlReader && this._xmlReader.FullScreen){
            $("#image").css("height", $(window).height());
            $("#img1").css({ top: '0px' });
            $("#img2").css({ top: '0px' });
        }
        else{
             $("#image").css("height", posBottomBar.top - (posTopBar.top + heightTopBar));
        }

        
        //Resize image
        if (this._xmlReader) {
           
            var typeInfo = this._dataCom.getTypeSlide();
            if(typeInfo.type == "detached"){
                var curSlide = this._xmlReader.getSlide(typeInfo.pos -1, true); 
            }
            else{
                var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1); 
            } 
            //var curSlide = this._xmlReader.getSlide(this._dataCom.getCurrentSlide() - 1);
            var img = curSlide.getImage();
        
            var divWidth = $("#image").width();
            var divHeight = $("#image").height();
            var imgSize = img.getPictureSize();

            var imgRatio = imgSize.width / imgSize.height;
            var imgWidth = divHeight * imgRatio;
            var imgHeight = divHeight;

            if (imgWidth > divWidth) {
                imgWidth = divWidth;
                imgHeight = imgWidth / imgRatio;
            }
            
            this.ResizeCoef = imgHeight / imgSize.height;

            var top = (divHeight - imgHeight) / 2;
            if ($("body").height() > $(window).height()) top = 0;

            $(".fullScreenButtomBar").css("width",imgWidth-this.margingFullScreen);
            $(".headersFullScreen").css("width",imgWidth-this.margingFullScreen);

            var css = { 'left': (divWidth - imgWidth) / 2,
                        'top': top,
                        'width': imgWidth,
                        'height': imgHeight
                    };
            
            var $img1 = $("#img1");
            var $img2 = $("#img2");

            $img1.css(css);
            $img2.css(css);            
            $("#sideBar").css({"height":imgHeight, "top": top});

              if (this.initializeScriptAvataObj && typeof this.initializeScriptAvataObj.resize === "function") this.initializeScriptAvataObj.resize.call( this.initializeScriptAvataObj,{'ratio' : this.ResizeCoef,'imgCSS':css});
            
            if(this._xmlReader && this._xmlReader.FullScreen){
                //$(".headers").css(cssScale);
                var newSize={"width":imgWidth,"height":imgHeight};
                this.positionBarShow(newSize,imgSize);
            }
            
            var $bgVideo = $("#backgroundvideo");
            if ($bgVideo.length > 0) {
                this.calculeVideoDim({'width': imgWidth,'height': imgHeight},"backgroundvideo");
                //$bgVideo.css(css);
            }

            if (curSlide.Type == "movie")
            {   
                var img1Visible = ($img1.css("display") != "none");
                var img2Visible = ($img2.css("display") != "none");
                
                var $workOn = (img1Visible ? $img1 : $img2);
    
                var imgPosition = $workOn.position();
                this._options.playervideo.css( { "left": imgPosition.left, "top": imgPosition.top, "width": $workOn.width() + "px", "height": $workOn.height() + "px" } );
                this._options.playervideo.children().css({"width" : $workOn.width() + "px", "height" : $workOn.height() + "px"});
            }
            
            if (curSlide.hasAnimation()) {

                var img1Visible = ($img1.css("display") != "none");
                var img2Visible = ($img2.css("display") != "none");
                
                var $workOn = (img1Visible ? $img1 : $img2);
                curSlide.Animation.resize({ 'container': this._options.container, 'refPic': $workOn, 'ratio': this.ResizeCoef});
    
            }
            
            if (curSlide.Type == "quizzresults") {
                
                var img1Visible = ($img1.css("display") != "none");
                var img2Visible = ($img2.css("display") != "none");
                
                var $workOn = (img1Visible ? $img1 : $img2);
                var imgPosition = $workOn.position();
                
                $(".quizResultScoreCalculation;").css({ 'margin-left': imgPosition.left, 'margin-top': imgPosition.top, 'width': $workOn.width() + "px", 'height': $workOn.height() + "px" });
                    
            }
            
            if (curSlide.Type == "quiz") {
                
                if ($("#quiz").css("display") != "none") {
                    
                    var img1Visible = ($img1.css("display") != "none");
                    var img2Visible = ($img2.css("display") != "none");
                
                    var $workOn = (img1Visible ? $img1 : $img2);
    
                    var imgPosition = $workOn.position();
                    
                    $("#quiz .imgQuizzBackGround").css({ 'left': 0, 'top': 0, 'width': $workOn.width() + "px", 'height': $workOn.height() + "px" });
                    $("#quiz").css({ 'left': imgPosition.left, 'top': imgPosition.top, 'width': $workOn.width() + "px", 'height': $workOn.height() + "px" });

                }
            
            }
            
            var applyCoef = this.ResizeCoef;
            $(".textToResize").each(function() {
                
                var $this = $(this);
                var initLeft = $this.attr("data-left");
                var initTop = $this.attr("data-top");
                var initWidth = $this.attr("data-width");
                var css = {};
                
                var addLeft = 0; var addTop = 0;
                if ($this.attr("id") == "text") {
                    
                    var img1Visible = ($img1.css("display") != "none");
                    var img2Visible = ($img2.css("display") != "none");
                    
                    var $workOn = (img1Visible ? $("#img1") : $("#img2"));
                    var imgPosition = $workOn.position();
                    
                    addLeft = imgPosition.left;
                    addTop = imgPosition.top;
                
                }
                
                css['font-size'] = (applyCoef * 100) + '%';
                if (initLeft != "") css["left"] = (parseFloat(initLeft) * applyCoef) + parseFloat(addLeft);
                if (initTop != "") css["top"] = (parseFloat(initTop) * applyCoef) +  parseFloat(addTop);
                if (initWidth != "") css["width"] = initWidth * applyCoef;
                
                $this.css(css);
                
            });

            if (curSlide.Type == "quiz") {
                
                if ($("#quiz").css("display") != "none") {
                    
                    var $refTxt = $("#text");
                    var txtPos = $refTxt.position();

                    var $refQuizz = $("#quiz");
                    var quizzPos = $refQuizz.position();
                    $("#question").css({ 'font-size': (this.ResizeCoef * 100) + '%', 'left': txtPos.left - quizzPos.left, 'top': txtPos.top - quizzPos.top + $refTxt.height() + 20, 'width': $refTxt.width() });
                    
                    $refTxt = $("#question");
                    var txtPos = $refTxt.position();
                    $("#responses").css({ 'font-size': (this.ResizeCoef * 100) + '%', 'width': $refTxt.width(), 'left': txtPos.left, 'top': txtPos.top + $refTxt.height() +10});
                   
                    var choiceOffset =  $("#choices").offset().top - $("#quiz").offset().top ;
                    $("#choices").css({"height" : "auto", "overflow" : "hidden"});
                    // console.log("#choices",$("#choices").height(),"#quiz", $("#quiz").height(), "offsetTop",choiceOffset, "myBtnNextQuestion" , $("#myBtnNextQuestion").outerHeight()); 
                    if($("#choices").height()  >  $("#quiz").height() - $("#myBtnNextQuestion").outerHeight() - choiceOffset){
                        $("#choices").css({"height" : $("#quiz").height() - $("#myBtnNextQuestion").outerHeight() -  choiceOffset, "overflow-y":"scroll" });
                   }
                       
                }
                
            }
            
        }
        
        //Resize transcript
        $css = { "height" : $("#image").height() * 0.8, "top": $("#image").height() * 0.1 };

        if(this._xmlReader && this._xmlReader.FullScreen){
         var visibleImg=$("#img1").is(":visible")?"#img1":"#img2";
         var top = ($.isNumeric($(visibleImg).css("top").replace("px",""))) ?(parseFloat($(visibleImg).css("top"))):0;
         $css = { "height" : $(visibleImg).height() * 0.8, "top": top+($(visibleImg).height() * 0.1) };
        }
        var y =  $("#transcript").width();
        var z =  $("#transcript").height();
        if( $("#transcript").width() > $(window).width() / 2) {
            $("#transcript").width($(window).width() / 2);
            $("#transcripttext").css("width", ($("#transcript").width() - $("#transcriptmnu").outerWidth()) + "px");
        }
        
        if ($("#transcript").attr("data-open") == "1") {
            $css["left"] = $("#image").width() - $("#transcript").outerWidth();
        }
        else {
            $css["left"] = $("#image").width() - $("#transcriptmnu").outerWidth();
        }
        $("#transcript").css($css);
        
        //Resize wait
        var divW = $("#wait").height();
        var divIc = $("#wait-icon-animated").height();
        $('#wait-icon-animated').css("margin-top", (divW - divIc) / 2); 
        
    }
    
});