/** @license
 *
 * AvatarTranscript javascript
 * ----------------------------------------------
 * http://www.actando.com
 *
 * Copyright (c) 2019, IT Team. All rights reserved.
 * 
 */

/**********************
* CLASS AvatarTranscript
**********************/
var AvatarTranscript = $.inherit({
    

    _options : null,
    _epubspeakAvatar: null,
    _avatarStage : null,
    _currentTop  : null,
    _currentLeft : null,
    _currentRatio: null,
    _coefResize: {"Y": 0, "X": 0},

     __constructor : function(options) {
       this._options = options;
       this._options["scriptsPath"] = "js/avatars";
       this._options["scripts"] = [{"id" : 1, "scriptsInfo" : [{"file": "epublisher_europe_man_speak.js", "className" : "europemalespeak", "constructor" : "epublisher_europe_man_speak"}]},
                                   {"id" : 2, "scriptsInfo" : [{"file": "business-animation-female-speak.js", "className" : "europefemalespeak", "constructor" : "businessanimationfemalespeak"}]}
                                 ];
    },

    getAvatarInfo : function() {
         if(!this._options || !this._options.type) return  this._options["scripts"][0];
          for(var i =0; i < this._options["scripts"].length; i++){
            if(this._options["scripts"][i]["id"] == this._options.type) return this._options["scripts"][i];
          }
          return this._options["scripts"][0];
    },

   touchHandler: function(event) {
        var touch = event.changedTouches[0];
        var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent({
            touchstart: "mousedown",
            touchmove: "mousemove",
            touchend: "mouseup"
        }[event.type], true, true, window, 1,
            touch.screenX, touch.screenY,
            touch.clientX, touch.clientY, false,
            false, false, false, 0, null);

        touch.target.dispatchEvent(simulatedEvent);
        event.preventDefault();
    },


    init: function($container){
       
        var html  = '<div id="avatarscript" style="visibility:hidden" data-state="">';
        html     += '  <div id="epub_toggle" class="epub_rotate"><i class="far fa-arrow-alt-circle-down"></i></div>';
        html     += ' <div id="transimgcontainer">';
        html     += '  <div id="epub_script" class="avatarimage"><div class="text"><p class="textP">&nbsp;</p></div></div>';
        html     += '  <div id="epub_avatar" class="avatarimage"></div>';
        html     += ' </div>';
        html     += '</div>';

        var avatarInfo = this.getAvatarInfo().scriptsInfo[0];

        var $html = $(html);
        
        $container.append($html);

        $html.get(0).addEventListener("touchstart", this.touchHandler, true);
        $html.get(0).addEventListener("touchmove", this.touchHandler, true);
        $html.get(0).addEventListener("touchend", this.touchHandler, true);
        $html.get(0).addEventListener("touchcancel", this.touchHandler, true);

        this._currentTop  = null;
        this._currentLeft = null;

        /* Script to integrate the animated avatar */
        //this._epubspeakAvatar = ( this._options && this._options.avatarscript && this._options.avatarscriptspeak) ? new window[this._options.avatarscript][this._options.avatarscriptspeak]() : new europemalespeak.epublisher_europe_man_speak();
        //this._epubspeakAvatar = new europemalespeak.epublisher_europe_man_speak();
        this._epubspeakAvatar = new window[avatarInfo.className][avatarInfo.constructor]();
        var $avatarcanvas = $('<canvas class="scriptavatar" id="canvasscriptavatar" width="' +( $("#avatarscript").width() / 2 )+ '"  height="' + $("#avatarscript").height() / 2 + '"/>');
        $html.find("#epub_avatar").append($avatarcanvas);
        this._epubspeakAvatar.visible = true;
        this._avatarStage = new createjs.Stage($avatarcanvas.get(0));
	      this._avatarStage.addChild(this._epubspeakAvatar);
	      this._avatarStage.update();
        createjs.Ticker.setFPS(europemalespeak.properties.fps);
        createjs.Ticker.addEventListener("tick", this._avatarStage);

        this._coefResize.Y = ($("#avatarscript").height() / 2 ) / europemalespeak.properties.width;
        this._coefResize.X = ($("#avatarscript").width() / 2 ) / europemalespeak.properties.width;

        //setTimeout(function(){  console.log(this); this.stop();}.bind(this), 2000);
        // setTimeout(function(){  this.play();}.bind(this), 4000);

        this._epubspeakAvatar.scaleY = this._coefResize.Y;
        this._epubspeakAvatar.scaleX = this._coefResize.X;
        var refThis = this;
        $html.draggable({
           containment : '#slide',
           cursor      : 'move', 
           stop: function(e){
            var offset = $("#avatarscript").offset();
             refThis._currentLeft = (refThis._currentRatio) ? offset.left/refThis._currentRatio : offset.left;
             refThis._currentTop  = (refThis._currentRatio) ? offset.top/refThis._currentRatio   : offset.top;
           }
        });

        $html.find("#epub_toggle").click(function(){ 
            $html.find(".epub_rotate").toggleClass("down");
            if($html.attr("data-state") == "hidden") $html.height(parseInt($html.attr('data-height')) * slideshow.ResizeCoef); 
            $html.find("#transimgcontainer").slideToggle('slow', function(){
                 if($html.attr("data-state") != "hidden") $html.height(0);
                 $html.attr('data-state', $html.attr("data-state") == "hidden" ? "" : "hidden" );
            });
        });
    },

    stop: function(){

      createjs.Ticker.reset();
      createjs.Ticker.init();
      this._avatarStage.update();
    	//console.log("call stop!");
    },

    play: function(){

        createjs.Ticker.addEventListener("tick", this._avatarStage);
        //console.log("call play!");
    },

    resize: function(options){
     
       var $html = $("#avatarscript");
       var w     =  $html.attr('data-width')  ? parseInt($html.attr('data-width'))   : $html.width();
       var h     =  $html.attr('data-height') ? parseInt($html.attr('data-height'))  : $html.height();
       var font  =  $html.attr('data-font')   ? parseInt($html.attr('data-font'))    : parseInt($html.css("font-size"));

       $html.attr('data-width', w);
       $html.attr('data-height', h);  
       $html.attr('data-font', font); 

       var top  = ( this._currentTop  != null ) ? this._currentTop * options.ratio  :  options.imgCSS.top  + options.imgCSS.height - ( h * options.ratio );
       var left = ( this._currentLeft != null) ? this._currentLeft * options.ratio :  options.imgCSS.left + options.imgCSS.width  - ( w * options.ratio);
       var font = parseInt($html.css('font-size')) * options.ratio;
       
       this._currentRatio = options.ratio;
       
       $html.css({
            'width'     : w * options.ratio,
            'height'    : $("#avatarscript").height() == 0 ? 0 : h * options.ratio,
            'top'       : top,
            'left'      : left,
            // 'font-size' :  (font * options.ratio) + 'px',
            'visibility':'visible'
       });

       this._avatarStage.canvas.width  = w * options.ratio / 2;
       this._avatarStage.canvas.height = h * options.ratio / 2;
       this._epubspeakAvatar.scaleX = options.ratio * this._coefResize.X;
       this._epubspeakAvatar.scaleY = options.ratio * this._coefResize.Y;
       this._avatarStage.update();

       $html.find("#epub_toggle").css({"font-size": (font * options.ratio) + 'px', "top" : - ((font + 5 ) * options.ratio), 'height' : (font * options.ratio) + 'px', "width": (font * options.ratio) + 'px'});
      
       if($html.find(".text").length > 0 && $html.find(".text").get(0).scrollHeight > $html.find(".text").get(0).clientHeight){
            $html.find(".text").css("overflow-y","scroll");
       }
       else{ $html.find(".text").css("overflow-y","hidden"); }

    },

    writeText: function(text){
        //if(!this._xmlReader || !this._xmlReader.ScriptAvatar) return;
        var $html = $("#avatarscript");
        $html.css("opacity", 1);
        if(typeof text !== "undefined") $html.find(".textP").html(text);
        if($html.find(".text").length > 0 && $html.find(".text").get(0).scrollHeight > $html.find(".text").get(0).clientHeight){
            $html.find(".text").css("overflow-y","scroll");
        }
    },

    ariseText: function(){
        var $html = $("#avatarscript");
        $html.find(".textP").html("");
        $html.find(".text").css("overflow-y","hidden");
    },
    
    showAvatar: function(show){
       if(!show) { this.ariseText(); $("#avatarscript").css("opacity", 0.6);}
       $("#avatarscript").css({"display": (show ? 'block' : 'none' )});
    }

});