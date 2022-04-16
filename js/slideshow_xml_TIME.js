/** @license
 *
 * SlideShow_XML (reader XML)
 * ----------------------------------------------
 * http://www.actando.com
 *
 * Copyright (c) 2020, IT Team. All rights reserved.
 *
 *
 *
 *
 */

var SlideShow_XML = $.inherit({

    _labels: null,
    _slides: null,
    _dataCom: null,

    _picPath: "",
    _flvPath: "",
    _audioPath: "",
    _swfPath: "",
    _videoPath: "",
    _defPath: "",

    _customBanner: "",
    _customBannerHD: "",
    _customCSS: "",

    DisplaySlides: null,
    DisableShortCut: false,
    SaveQuizz: false,
    Help: null,
    ForceHTML5: false,
    AlwaysShowScore: false,

    WaitEndOfAudio: false,
    MasteryScore: null,
    NextElement: false,

    /* Constructor
	*
	*/
    __constructor: function (xml, options) {

        var $dom = $(xml);


        // the audio player for affect events
        this.players = options.players;

        // the dataCom
        this._dataCom = options.dataCom;

        // download attributs browser support
        var a = document.createElement('a');
        this.ForceDownload = (typeof a.download != "undefined") ? "download" : "target='_blank'";

        //Load the labels
        this._labels = {};
        this._labels["title"] = $dom.find("root > config > moduletitle").text();

        // load labels traduction
        this._labels["nextQuizBTNLabel"] = $dom.find("root > config > labels > nextQuizBTNLabel").text();
        this._labels["resultQuizLabel"] = $dom.find("root > config > labels > resultQuizLabel").text();
        this._labels["transcriptLabel"] = $dom.find("root > config > labels > transcriptLabel").text();

        // this._labels["transcriptLabel"] = $dom.find("root > config > labels > transcriptLabel").text();
        // this._labels["transcriptLabel"] = $dom.find("root > config > labels > transcriptLabel").text();
        // this._labels["transcriptLabel"] = $dom.find("root > config > labels > transcriptLabel").text();
        // this._labels["transcriptLabel"] = $dom.find("root > config > labels > transcriptLabel").text();
        var ref = this;
        $dom.find("root > config > labels > *").each(function () {
            var $item = $(this);
            ref._labels[$item.actTagName()] = $item.text().trim();
        });


        //help
        this.Help = {'title': "??title??", 'content': "??content??"};
        this.Help.title = $dom.find("root > config > help > title").text();
        this.Help.content = $dom.find("root > config > help > text").text();
        if (this.Help.content != "") this.Help.content = this.Help.content.replace(/\r\n|\r|\n/g, '<br/>');

        this.language = $dom.find("root > config > language").text();
        this.copyright = $dom.find("root > config > copyRight").text();
        this.extraoptions = $dom.find("root > config > extraoptions").text();

        this.DisableShortCut = $dom.find("root > config > disableshortcut").text();
        this.DisableShortCut = (this.DisableShortCut == "1");

        this.DisableJTChapter = $dom.find("root > config > deac_jt_chapter").text();
        this.DisableJTChapter = (this.DisableJTChapter == "1");

        this.SaveQuizz = $dom.find("root > config > saveQuizz").text();
        this.SaveQuizz = (this.SaveQuizz == "1");

        this.WaitEndOfAudio = $dom.find("root > config > wait_eoa_nbtn").text() == "1";
        this.FullScreen = $dom.find("root > config > fullScreen").text() == "1";
        this.CollapseBar = $dom.find("root > config > collapsebar").text() == "1";
        this.NextElement = $dom.find("root > config > nextElement").text() == "1";
        this.MasteryScore = $dom.find("root > config > mastery_score").text();
        this.MasteryScore = ($.isNumeric(this.MasteryScore)) ? parseFloat(this.MasteryScore) : 80;

        this.ForceHTML5 = $dom.find("root > config > forceHTML5").text() == "1";

        this.AlwaysShowScore = $dom.find("root > config > alwaysShowScore").text() == "1";

        this.DropDownChapter = $dom.find("root > config > dropDownChapter").text() == "1";

        //this.ScriptAvatar   = (this.getOptions("scriptAvatar") && this.getOptions("scriptAvatar") == "1") ? true : false ;
        this.ScriptAvatar = (this.getOptions("scriptAvatar") && $.isNumeric(this.getOptions("scriptAvatar")) && this.getOptions("scriptAvatar") != "0") ? this.getOptions("scriptAvatar") : 0;

        this.HideTranscript = (this.getOptions("hideTranscript") && this.getOptions("hideTranscript") == "1") ? true : false;

        if ($dom.find("root > config > deactivate_toc_link").text() == "1") this.DisableShortCut = true;

        var oXML = this;
        $dom.find("root > config > help > *").each(function () {
            var $item = $(this);
            oXML._labels["help." + $item.actTagName()] = $item.text();
        });

        $dom.find("root > config > credits > *").each(function () {
            var $item = $(this);
            oXML._labels["credits." + $item.actTagName()] = $item.text();
        });

        $dom.find("root > config > labels > *").each(function () {
            var $item = $(this);
            oXML._labels[$item.actTagName()] = $item.text();
        });

        //Load the different path
        this._defPath = $dom.find("root > config > pathMedias > def").text();
        this._picPath = $dom.find("root > config > pathMedias > pic").text();
        this._flvPath = $dom.find("root > config > pathMedias > flv").text();
        this._audioPath = $dom.find("root > config > pathMedias > flv").text();
        this._swfPath = $dom.find("root > config > pathMedias > swf").text();
        this._videoPath = $dom.find("root > config > pathMedias > mp4").text();
        this._moduleTheme = $dom.find("root > config > moduleTheme").text();
        this._customCSS = $dom.find("root > config > modulecss").text();

        //Client Customization
        this._customBanner = $dom.find("root > config > custom > banner").text();
        if (this._customBanner != "") this._customBanner = this._picPath + this._customBanner;
        this._customBannerHD = $dom.find("root > config > custom > bannerhd").text();
        if (this._customBannerHD != "") this._customBannerHD = this._picPath + this._customBannerHD;

        //Load the slides
        var dispSlides = null;
        if (options && options.displaySlides && $.isArray(options.displaySlides)) dispSlides = options.displaySlides;

        oXML._slides = [];
        oXML._detachedSlides = [];
        var indSlide = 0;
        var oRef = this;
        var initialCount = $dom.find("root > slides > *").length;
        $dom.find("root > slides > *").each(function () {
            var addSlide = true;
            if (dispSlides) {
                addSlide = false;
                for (indS = 0; indS < dispSlides.length; indS++) {
                    if (dispSlides[indS] == indSlide) {
                        addSlide = true;
                        break;
                    }
                }
            }
            if (addSlide) {
                // var newslide = new SlideShow_Slide($(this), oXML, oRef.players, oRef._dataCom);
                // oXML._slides.push(newslide);
                var newslide = new SlideShow_Slide($(this), oXML, oRef.players, oRef._dataCom);
                // for single preview
                newslide.IsDetached = (initialCount > 1) ? newslide.IsDetached : 0;
                if (newslide.IsDetached) {
                    oXML._detachedSlides.push(newslide);
                } else {
                    //newslide.IsDetached = 0;
                    oXML._slides.push(newslide);
                    indSlide++;
                }
            }
            // indSlide++;
        });

    },

    displaySlides: function (listslides) {

        var SlidesToDisp = [];

        this._slides = SlidesToDisp;

    },


    getChapters: function () {

        var chapters = [];

        var sL = this._slides.length;
        for (var indS = 0; indS < sL; indS++) {
            var curSlide = this._slides[indS];
            if (curSlide.Chapter !== null && $.trim(curSlide.Chapter).length > 0) chapters.push({
                "name": curSlide.Chapter,
                "slide": indS
            });
        }

        return chapters;

    },

    getCurrentChapter: function (slide) {

        var currChapter = -1;
        var sL = this._slides.length;
        for (var indS = 0; indS < sL; indS++) {
            var curSlide = this._slides[indS];
            if (curSlide.Chapter !== null && $.trim(curSlide.Chapter).length > 0) {
                currChapter++;
            }
            if (indS == slide) break;
        }
        return currChapter;

    },

    // getSlide: function(index) {

    // 	if (this._slides.length == 0) return null;
    // 	if (index < 0 || index > this._slides.length) return this._slides[0];
    // 	return this._slides[index];

    // },
    getSlide: function (index, isDetached) {
        var slides = (isDetached) ? this._detachedSlides : this._slides;
        // if(isDetached){
        if (slides.length == 0) return null;
        if (index < 0 || index > slides.length) return slides[0];
        return slides[index];
        // }
        // else{
        // 	if (this._slides.length == 0) return null;
        //  if (index < 0 || index > this._slides.length) return this._slides[0];
        //  return this._slides[index];
        // }
    },
    // options = {isDetached: true/false, returnType: object/num}
    getSlideByAnchor: function (anchor, options) {
        var slides = (options.isDetached && options.isDetached == true) ? this._detachedSlides : this._slides;
        for (var i = 0; i < slides.length; i++) {
            if (slides[i].Anchor && slides[i].Anchor == anchor)
                return {'slide': slides[i], 'number': (i + 1)};
        }
        return null;
    },

    slideCount: function () {
        return this._slides.length;
    },

    detachedSlideCount: function () {
        return this._detachedSlides.length;
    },

    slideReadyCount: function () {

        var count = 0;
        var sL = this._slides.length;
        for (var indS = 0; indS < sL; indS++) {
            var curSlide = this._slides[indS];
            if (curSlide.isReady()) count++;
        }
        return count;

    },

    getSlides: function () {
        return this._slides;
    },

    getLabel: function (name, nullifnotexists) {

        // if (this._labels[name] !== undefined && this._labels[name] !== null) return this._labels[name];
        // return "??" + name + "??";
        if (this._labels[name] !== undefined && this._labels[name] !== null) return this._labels[name];
        if (nullifnotexists === true) return null;
        return "??" + name + "??";

    },

    getOptions: function (name) {
        var optionsArray = this.extraoptions ? this.extraoptions.split(";") : [];
        var options = [];
        if (optionsArray) {
            $.each(optionsArray, function (key, option) {
                var optionArray = option.split("=");
                if (optionArray.length == 2) {
                    options[optionArray[0]] = optionArray[1].replace(/"/g, '');
                }
            });
        }
        return (typeof name !== "undefined") ? ((options[name]) ? options[name] : null) : options;
    },

    getSlideByKey: function (key) {

        var count = 0;
        var sL = this._slides.length;
        for (var indS = 0; indS < sL; indS++) {
            var curSlide = this._slides[indS];
            if (curSlide.SlideKey == key) return curSlide;
        }
        return null;

    },

    getSlideQuizByRef: function (ref) {

        var count = 0;
        var sL = this._slides.length;
        for (var indS = 0; indS < sL; indS++) {
            var curSlide = this._slides[indS];
            if (curSlide.Quizz !== null && curSlide.Quizz.Ref == ref) return curSlide;
        }
        return null;

    }

});

/**********************
 * Object SlideShow_Group
 * Manage the Group Of Synchronised Animations
 **********************/

var Slideshow_Group = $.inherit({

    _options: null,
    _info: null,

    __constructor: function () {

    },

    setCallbackInfo: function (info) {
        this._info = info; // save temp data
    },

    setNotGoToNext: function (value) {
        this._notGoToNext = value;
    },
    getNotGoToNext: function () {
        return this._notGoToNext;
    },

    play: function (options) {

        this._options = options;
        this.item = this._options.item;
        this.animtedItemIds = [];
        this.nextWasPlayed = false;
        this._notGoToNext = false;

        if (this._options.anim["compositeItems"] && this._options.anim["compositeItems"].length > 0) {

            // hide the animated elements
            $.each(this._options.anim["compositeItems"], $.proxy(function (key, underElements) {
                if (underElements.dir != "" && underElements.dir != "-1" && underElements.dir != "simple") {
                    this.item.find("#animateItemText" + underElements.id).css({"visibility": "hidden"});
                    this.animtedItemIds.push(underElements.id);
                } else {
                    this.item.find("#animateItemText" + underElements.id).css({"visibility": "visible"});
                }
            }, this));

            this._options.param.container.append(this.item);

            // play audio asynchronously
            if (this._options.anim.sound) {
                this._options.slideshowAnim._slide.players.playeraudio.actLAP('stop');
                this._options.slideshowAnim._slide.players.playeraudio.actLAP('play', {'file': this._options.anim.sound});
                this._notGoToNext = true;
            }


            this._options.slideshowAnim.affectEvents(this._options.anim, this._options.param);
            this._options.slideshowAnim.resize(this._options.param);

            var animationType = this._options.slideshowAnim.getParameterByName("animType");
            var animDuration = this._options.slideshowAnim.getParameterByName("animDur");
            animDuration = $.isNumeric(animDuration) ? animDuration : 500;

            // play 'animaion during' for all under elements not animated
            $.each(this._options.anim["compositeItems"], $.proxy(function (key, underElements) {
                if ($.inArray(underElements.id, this.animtedItemIds) == -1) this.playAnimDuring(underElements);
            }, this));


            if (animationType != 1) {
                // start Playing Animations
                if (this._options.anim.dir != "-1" && this._options.anim.dir != "") {
                    this.item.animateCSS(this._options.anim.dir, {
                        duration: parseInt(animDuration), animationClass: "", callback: $.proxy(function () {
                            this.playAnimDuring(this._options.anim, true);
                        }, this)
                    });
                } else {
                    this.item.css({"opacity": 1, "visibility": "visible"});
                }

                $.each(this._options.anim["compositeItems"], $.proxy(function (key, underElements) {
                    if ($.inArray(underElements.id, this.animtedItemIds) > -1) this.item.find("#animateItemText" + underElements.id).animateCSS(underElements.dir, {
                        duration: animDuration, animationClass: "", callback:
                            $.proxy(function () {
                                this.playAnimDuring(underElements);
                            }, this)
                    });
                }, this));
                this.goToNext();
            } else {
                // start Playing Animations
                var allready = false;
                if (this._options.anim.dir != "-1" && this._options.anim.dir != "") {
                    this.item.animateCSS(this._options.anim.dir, {
                        duration: parseInt(animDuration), animationClass: "", callback: $.proxy(function () {
                            //this.endAnimationCallBack();
                            if (!allready) {
                                this.playAnimDuring(this._options.anim.dir, true);
                                this.playNext({"animDur": animDuration}); // call it one time!!
                            }
                            allready = true;
                        }, this)
                    });
                } else {
                    this.item.css({"visibility": "visible"});
                    //this.endAnimationCallBack();
                    this.playNext({"animDur": animDuration});
                }


            }
            this.endAnimationCallBack();
        }
    },
    goToNext: function () {
        if (!this._notGoToNext && this._info != null) {
            this._info.audioOptions.onFinish(this._info.event);
            this._info = null;
            this._notGoToNext = true;
        }
        this._notGoToNext = false;
        return;

    },
    playNext: function (options) {

        if (this.animtedItemIds.length == 0) {
            if (!this._notGoToNext && this._info != null) {
                this._info.audioOptions.onFinish(this._info.event);
                this._info = null;
            }
            this._notGoToNext = false;
            return;
        }
        var nextAnim = this.animtedItemIds.shift();
        $.each(this._options.anim["compositeItems"], $.proxy(function (key, underElements) {
            if (underElements.id == nextAnim) this.item.find("#animateItemText" + underElements.id).animateCSS(underElements.dir, {
                duration: parseInt(options.animDur), animationClass: "", callback:
                    $.proxy(function () {
                        this.playAnimDuring(underElements);
                        this.playNext({"animDur": options.animDur});
                    }, this)
            });
        }, this));

    },
    endAnimationCallBack: function () {
        if (this._options.anim.animOut.trim() != "") {
            this._options.slideshowAnim._lastAnimOutObj = this.item;
            this._options.slideshowAnim._lastAnimOut = this._options.anim.animOut;
        } else {
            this._options.slideshowAnim._lastAnimOutObj = null;
            this._options.slideshowAnim._lastAnimOut = null;
        }
        this._options.slideshowAnim.endAnimationCallBack(this._options.anim, this._options.param);
    },
    playAnimDuring: function (animation, isGlobal) {
        if (animation.animDur && $.trim(animation.animDur) != "") {
            if (typeof isGlobal === "undefined" || isGlobal == false) this.item.find("#animateItemText" + animation.id).removeClass(animation.animDur);
            else this.item.removeClass(animation.animDur);
        }

    }


});

/**********************
 * Object SlideShow_Picture
 **********************/
var SlideShow_Picture = $.inherit({

    //static
    info: {"errorHD": 0},

    //variables
    _pictureSrc: null,
    _pictureComplete: false,
    _pictureReady: false,
    _picture: null,

    _pictureHDSrc: null,
    _pictureHDComplete: false,
    _pictureHDReady: false,
    _pictureHD: null,

    _onReady: null,
    _isInit: false,

    Id: null,

    __constructor: function (src, readyEvent, id) {

        this._picture = new Image();
        this._picture.RefSSP = this;
        this._pictureHD = new Image();
        this._pictureHD.RefSSP = this;

        this._pictureSrc = src;
        this.Id = id;
        var ref = this;
        //HD Picture
        var posExt = this._pictureSrc.lastIndexOf(".");
        if (posExt > -1) {
            this._pictureHDSrc = this._pictureSrc.substring(0, posExt) + '@2x' + this._pictureSrc.substring(posExt);
        }

        $(this._picture).load(function () {

            /**
             Il y a une différence de comportement en fonction des navigateurs si on utilise ici this.complete, on concidere donc que si l'evenemt load est appelé l'image est chargée
             **/
            this.RefSSP._pictureReady = true;
            this.RefSSP._pictureComplete = true;
            this.RefSSP.onPictureReady();

        });

        $(this._picture).error(function () {

            this.RefSSP._pictureReady = true;
            this.RefSSP.onPictureReady();

        });

        $(this._pictureHD).load(function () {

            /**
             Il y a une différence de comportement en fonction des navigateurs si on utilise ici this.complete, on concidere donc que si l'evenemt load est appelé l'image est chargée
             **/
            this.RefSSP._pictureHDReady = true;
            this.RefSSP._pictureHDComplete = true;
            this.RefSSP.onPictureReady();

        });

        $(this._pictureHD).error(function () {

            this.RefSSP._pictureHDReady = true;
            this.RefSSP.onPictureReady();
            this.RefSSP.info.errorHD++;

        });

        this._onReady = readyEvent;

    },

    loadPictures: function () {

        if (this._isInit) return;
        this._isInit = true;

        //if more than 5 HD pictures loading aborted
        //module is not HD
        if ((this.info.errorHD < 5 && window.devicePixelRatio >= 2))
            //if (this.info.errorHD < 5)
            this._pictureHD.src = this._pictureHDSrc;
        else
            this._pictureHDReady = true;

        this._picture.src = this._pictureSrc;

    },

    onPictureReady: function () {

        if ((!this._pictureReady) || (!this._pictureHDReady)) return;

        if (this._onReady !== null && typeof this._onReady === "function")
            this._onReady();

    },

    imageFound: function () {
        return this._pictureComplete;
    },
    imageHDFound: function () {
        return this._pictureHDComplete;
    },

    isReady: function () {
        return this._pictureReady && this._pictureHDReady;
    },

    pictureIsHD: function () {
        return this._pictureHDComplete;
    },

    getPictureSize: function () {

        if (this._pictureHDComplete) {
            return {'width': this._pictureHD.width / 2, 'height': this._pictureHD.height / 2};
        } else {
            return {'width': this._picture.width, 'height': this._picture.height};
        }

    },

    getPicture: function () {
        return (this._pictureHDComplete) ? this._pictureHD : this._picture;
    }

});

/**********************
 * Object SlideShow_Slide
 **********************/
var SlideShow_Slide = $.inherit({

    _reader: null,
    _onReady: null,
    _isInit: false,
    _pictures: null,
    _dataCom: null,

    Index: 0,

    Title: "",
    Type: "",
    Effect: 1,
    Delay: null,
    Sound: null,
    Movie: null,
    AutoTransition: true,
    Notes: null,
    Quizz: null,
    QuizzResults: null,
    Chapter: null,
    Link: null,
    SlideKey: null,
    TranscriptText: null,
    Animation: null,
    VoiceOver: null,
    QuizType: null,
    IsBlocked: null,
    backGroundIsVideo: false,
    backGroundVideo: null,

    __constructor: function ($xml, reader, players, dataCom) {

        this._reader = reader;
        this.players = players;
        this._dataCom = dataCom;

        var id = $xml.attr("id");
        this.Id = id;

        var val = $xml.find("parm > type").text();
        val = val.split("-");
        this.Type = (val.length > 0) ? val[0].toLowerCase() : '';
        this.IsDetached = (val.length > 1) ? (val[1].toLowerCase() == 'detached') : false;

        this.Index = (this.IsDetached) ? reader.detachedSlideCount() : reader.slideCount();

        this.Title = $xml.find("title").text();

        var src = $.trim($xml.children("snd").text());
        if (src != "") this.Sound = this._reader._audioPath + src;

        var val = $xml.find("parm > effect").text();
        //if ($.isNumeric(val)) this.Effect = val;
        this.Effect = val;

        var val = $xml.find("parm > isBlocked").text();
        if ($.isNumeric(val)) this.IsBlocked = val;
        else this.IsBlocked = 0;


        var val = $xml.find("delay").text();
        if ($.isNumeric(val)) this.Delay = val;

        var val = $xml.find("autoTransition").text().toLowerCase();
        if (val == "false") this.AutoTransition = false;

        var val = $.trim($xml.find("chapter").text());
        if (val != "") this.Chapter = val;

        var val = $.trim($xml.find("anchor").text());
        if (val != "") this.Anchor = val;

        var val = $.trim($xml.find("key").text());
        if (val != "") this.SlideKey = val;

        var val = $.trim($xml.find("parm > link").text());
        if (val != "") this.Link = val;

        var val = $xml.find("ttext").text();
        if (val != "") this.TranscriptText = val;

        var val = $xml.find("voiceover").text();
        if (val != "") {
            //var regex = /(<([^>]+)>)/ig, val = val.replace(regex, "");
            this.VoiceOver = val;
        }
        ;

        var val = $xml.find("quizType").text();
        if (val != "") this.QuizType = val;

        this._pictures = [];
        var pictureSrc = "";
        switch (this.Type) {
            case "introduction":
                pictureSrc = "images/slide_begin.jpg";
                this.Title = $xml.find("parm > text").text();
                break;

            case "pic":
                pictureSrc = this._reader._picPath + $xml.find("src").text();
                var tmpPicName = pictureSrc.toLowerCase();
                if ((tmpPicName.indexOf(".ogg") > -1) || (tmpPicName.indexOf(".webm") > -1) || (tmpPicName.indexOf(".mp4") > -1)) {
                    this.backGroundIsVideo = true;
                    this.backGroundVideo = this._reader._videoPath + $xml.find("src").text();
                    ;
                    pictureSrc = "";
                }
                break;

            case "movie":
                pictureSrc = "images/slide_blank.jpg";
                var src = $.trim($xml.find("src").text());
                if (src != "") this.Movie = this._reader._videoPath + src;
                break;

            case "quiz":
                this.AutoTransition = false;
                pictureSrc = $.trim($xml.find("parm > src").text());
                pictureSrc = (pictureSrc == "") ? "images/slide_quizbegin.jpg" : (this._reader._picPath + pictureSrc);
                this.Title = $xml.find("parm > text").text();
                this.Quizz = new SlideShow_Quizz($xml, this);
                break;

            case "quizres":
                this.Type = "quizzresults";
                this.QuizzResults = new SlideShow_QuizzResults($xml, this);
                this.AutoTransition = false;
                break;

            case "conclusion":
                pictureSrc = "images/slide_end.jpg";
                this.Title = $xml.find("parm > text").text();
                break;

        }

        //Load pictures used by the slide
        if ($.trim(pictureSrc) == "") pictureSrc = "images/slide_blank.jpg";
        this._pictures.push(new SlideShow_Picture(pictureSrc, $.proxy(this.onPicturesReady, this)));

        if (this.Quizz !== null) {
            for (var indQuestion = 0; indQuestion < this.Quizz.countQuestion(); indQuestion++) {
                var Q = this.Quizz.getQuestion(indQuestion);
                if (Q["background-picture"] != "") {
                    this._pictures.push(new SlideShow_Picture(this._reader._picPath + Q["background-picture"], $.proxy(this.onPicturesReady, this), "q" + indQuestion));
                }
                //Audio ?
                if (Q["sound"] != "") Q["sound"] = this._reader._audioPath + Q["sound"];
            }
        }

        //Notes
        var refSlide = this;
        $xml.find("notes > *").each(function () {
            if (refSlide.Notes === null) refSlide.Notes = [];
            refSlide.Notes.push(new SlideShow_Note($(this), refSlide));
        });

        if ($xml.find("parm > anim").length > 0) {
            this.Animation = new SlideShow_Animation($xml.find("parm > anim"), refSlide, reader);
        }

    },

    getAnimations: function (type) {
        if (!this.hasAnimation()) return [];
        if (typeof type == "undefined") return this.Animation._animation;
        var animations = [];
        for (var i = 0; i < this.Animation._animation.length; i++) {
            var animation = this.Animation._animation[i];
            if (animation["compositeType"] == type) {
                animations.push(animation);
            }
        }
        return animations;
    },

    getComponent: function () {
        var animations = this.getAnimations(19);
        return (animations.length > 0 ? animations[0] : null);
    },

    getAnimationsInScore: function (options) {

        var notScorm = !(typeof options === "undefined") && options.notScorm;
        if (!this.hasAnimation()) return [];
        var animations = [];
        for (var i = 0; i < this.Animation._animation.length; i++) {
            var animation = this.Animation._animation[i];
            if (
                (this.Animation.getParameterByName("isInScore", animation.id) == 1)
                && (notScorm || this.Animation.getParameterByName("notInScorm", animation.id) != 1)
            ) {
                animations.push(animation);
            }
        }
        return animations;

    },

    getReader: function () {
        return this._reader;
    },

    ready: function (callback, param) {
        this._onReady = {'event': callback, 'param': param};
    },

    initSlide: function () {

        //Load images
        if (this._isInit) return;
        this._isInit = true;

        for (var indPic = 0; indPic < this._pictures.length; indPic++) this._pictures[indPic].loadPictures();

        // init components inside Slide
        if (this.hasAnimation()) {
            for (var i = 0; i < this.Animation._animation.length; i++) {
                var animation = this.Animation._animation[i];

                if (animation["compositeType"] == 19 && animation["componentItem"]) {
                    var refAnim = animation;
                    if (animation["componentItem"]["startLoaded"]) continue;

                    var stringParams = animation["parameters"];
                    var arrayParams = stringParams.split(";");
                    var params = {};
                    if (arrayParams) {
                        $.each(arrayParams, function (key, param) {
                            arrayParam = param.split("=");
                            if (arrayParam.length == 2) {
                                params[arrayParam[0]] = arrayParam[1].replace(/"/g, '');
                            }
                        });
                    }
                    animation["componentItem"]["startLoaded"] = true;
                    animation["splitedParameters"] = params;
                    var component = animation["componentItem"];
                    //var slideshow = this._slide._dataCom._slideshow; YBI LE 10/08
                    var dataCom = (this._slide) ? this._slide._dataCom : this._dataCom;
                    var slideshow = dataCom._slideshow;
                    ePublisherComponent.loadComponent({
                        // 'container' : $('#animateItemText' + animation.id),
                        'component': {
                            'id': component.id,
                            'name': component.name,
                            'location': component.location,
                            'file': component.file,
                            'object': component.object
                        },
                        'slideshow': slideshow,
                        'config': component.config,
                        'parameters': params,
                        /*'noalert': true,*/
                        'events': {
                            'error': function (name, param) {

                            },
                            'savedata': function (obj, data) {
                                refAnim['componentScore'] = data;
                                if (data && typeof data == "object") {
                                    var values = [];
                                    for (var key in data) {
                                        if (Object.prototype.hasOwnProperty.call(data, key)) {
                                            values.push({"id": key, "value": data[key]});
                                        }
                                    }
                                    dataCom.addInteraction({
                                        'id': refAnim['id'],
                                        'values': values,
                                        'type': refAnim['compositeType']
                                    });
                                }
                            },
                            'componentloaded': function (c) {
                                refAnim["objectComponent"] = c;
                            },
                            'ready': function () {
                                refAnim["objectComponent"]["ready"] = true;
                            },
                            'finish': function () {

                            }
                        }

                    });
                }
            }
        }

    },

    onPicturesReady: function () {

        if (!this.isReady()) return;

        if (this._onReady.event !== null && typeof this._onReady.event === "function")
            this._onReady.event.call(this, this._onReady.param);

    },

    isReady: function () {

        var isready = true;

        for (var indPic = 0; indPic < this._pictures.length; indPic++) {
            if (!this._pictures[indPic].isReady()) {
                isready = false;
                break;
            }
        }

        // if images then load the componenet if exists
        if (isready && this.hasAnimation()) {
            for (var i = 0; i < this.Animation._animation.length; i++) {
                var animation = this.Animation._animation[i];
                if (animation["compositeType"] == 19 && animation["componentItem"]) {
                    console.log("*********** Compenent is ready **********");
                    if (!animation["componentItem"]["startLoaded"]) isready = false;
                    break;
                }
            }

        }

        return isready;

    },

    hasAnimation: function () {
        return (this.Animation !== null);
    },
    hasNote: function () {
        return (this.Notes !== null && this.Notes.length > 0);
    },
    hasQuizz: function () {
        return (this.Quizz instanceof SlideShow_Quizz);
    },

    getImage: function (id) {

        if (this._pictures.length == 0) return null;

        if (id == null) {
            return this._pictures[0];
        } else {
            for (var indQ = 0; indQ < this._pictures.length; indQ++) {
                var Q = this._pictures[indQ];
                if (Q.Id == id) return Q;
            }
        }

        return null;

    },

    countImages: function () {
        return this._pictures.length;
    }

});

/**********************
 * Object SlideShow_Anim
 **********************/
var SlideShow_Animation = $.inherit({

    _slide: null,
    _animation: null,
    _currentAnim: -1,
    _lastAnimOutObj: null,
    _lastAnimOut: null,
    _reader: null,
    _isPlaying: false,
    // _isFliped  : false,
    // _modernizr:null,

    __constructor: function ($xml, slide, reader) {

        this._animation = [];
        // this._modernizr = window.Modernizr;
        this._slide = slide;
        this._reader = reader;
        var refAnim = this;

        $xml.find("item").each(function () {

            var $this = $(this);
            var anim = {
                'id': $this.attr("id"),
                'x': parseFloat($this.attr("x")),
                'y': parseFloat($this.attr("y")),
                'width': parseFloat($this.attr("width")),
                'effect': $this.attr("effect"),
                'dir': $this.attr("dir"),
                'animOut': $this.attr("animOut"),
                'duration': $this.attr("duration"),
                'class': $.trim($this.attr("class")),
                'style': $.trim($this.attr("style"))
            };

            if ($.isNumeric($this.attr("height"))) anim['height'] = parseFloat($this.attr("height"));

            if (!$.isNumeric(anim.duration)) anim.duration = 350;

            anim["text"] = $this.find("item > text").text();
            anim.text = anim.text.replace(/{module.path}/g, refAnim._slide._reader._picPath);
            anim.text = anim.text.replace(/{module.forcedownload}/g, refAnim._slide._reader.ForceDownload);
            if (anim.text.indexOf("</script>") > -1) {
                anim.text = refAnim.escapeQuotes(anim.text);
            }
            //anim.text             = (anim.text.indexOf("</script>") >-1) ? anim.text.replace(/<p>(.*?)(^\[\\]')(.*?)<\/p>/g, "<p>$1\\$2$3</p>") : anim.text;
            anim["sound"] = $this.find("item >  snd").text();
            anim["parameters"] = $this.find("item >  parameters").text();
            anim["itemRef"] = $this.attr("itemRef");
            anim["type"] = $this.attr("type");
            anim["depth"] = $this.attr("depth");
            anim["compositeType"] = $this.attr("compositeType");
            anim["linktype"] = $this.attr("linktype");
            anim["linkids"] = $this.attr("linkids");
            anim["linkidsArray"] = $this.attr("linkids") ? $this.attr("linkids").split(";") : [];
            anim["animOutBefore"] = $this.attr("animOutBefore");
            anim["animDur"] = $this.attr("animDur");
            anim["animInfinite"] = $this.attr("animInfinite");


            if (anim["sound"]) anim["sound"] = refAnim._slide._reader._audioPath + anim["sound"];
            anim["isBlocked"] = $this.attr("isBlocked");

            if ($this.find("compositeItems").length > 0) {
                anim["compositeItems"] = [];
                $this.find("compositeItems").find("underItem").each(function () {
                    var $currentAnim = $(this);
                    var varAnim = {
                        'id': $currentAnim.attr("id"),
                        'x': parseFloat($currentAnim.attr("x")),
                        'y': parseFloat($currentAnim.attr("y")),
                        'width': parseFloat($currentAnim.attr("width")),
                        'effect': $currentAnim.attr("effect"),
                        'dir': $currentAnim.attr("dir"),
                        'animOut': $currentAnim.attr("animOut"),
                        'duration': $currentAnim.attr("duration"),
                        'class': $.trim($currentAnim.attr("class")),
                        'style': $.trim($currentAnim.attr("style"))
                    };
                    if ($.isNumeric($currentAnim.attr("height"))) varAnim['height'] = parseFloat($currentAnim.attr("height"));

                    if (!$.isNumeric(varAnim.duration)) varAnim.duration = 350;

                    varAnim["text"] = $currentAnim.find("text").text();
                    varAnim.text = varAnim.text.replace(/{module.path}/g, refAnim._slide._reader._picPath);
                    varAnim.text = varAnim.text.replace(/{module.forcedownload}/g, refAnim._slide._reader.ForceDownload);
                    varAnim["sound"] = $currentAnim.find("snd").text();
                    varAnim["style"] = $currentAnim.attr("style");
                    varAnim["bodyText"] = $currentAnim.find("bodytext").text();
                    varAnim["bodyText"] = varAnim["bodyText"].replace(/{module.path}/g, refAnim._slide._reader._picPath);
                    varAnim["order"] = $currentAnim.attr("order");
                    varAnim["top"] = $currentAnim.attr("top");
                    varAnim["left"] = $currentAnim.attr("left");
                    varAnim["compositeType"] = $currentAnim.attr("compositeType");
                    varAnim["itemRef"] = $currentAnim.attr("itemRef");
                    varAnim["animOutBefore"] = $currentAnim.attr("animOutBefore");
                    varAnim["isBlocked"] = $currentAnim.attr("isBlocked");
                    varAnim["option"] = $currentAnim.attr("option")
                    varAnim["linkidsArray"] = $currentAnim.attr("linkids") ? $currentAnim.attr("linkids").split(";") : [];
                    varAnim["dir"] = $currentAnim.attr("dir");
                    varAnim["interaction"] = $currentAnim.attr("interaction");
                    varAnim["animDur"] = $currentAnim.attr("animDur");
                    varAnim["animInfinite"] = $currentAnim.attr("animInfinite");

                    if (varAnim["sound"]) varAnim["sound"] = refAnim._slide._reader._audioPath + varAnim["sound"];

                    anim["compositeItems"].push(varAnim);
                });
                // randomise elements
                if (anim["compositeType"] == 1) anim["compositeItems"].sort(function () {
                    return 0.5 - Math.random()
                });
            }


            if ($this.find("options").length > 0) {
                anim["options"] = [];
                $this.find("options").find("option").each(function () {
                    var $current = $(this);
                    var opt = {'id': $current.attr("id")};
                    opt['text'] = $current.find("text").text();
                    opt['text'] = opt['text'].replace(/{module.path}/g, refAnim._slide._reader._picPath);
                    opt['value'] = $current.find("value").text();
                    opt['value'] = opt['value'].replace(/{module.path}/g, refAnim._slide._reader._picPath);
                    opt['audio'] = refAnim._slide._reader._audioPath + $current.find("audio").text();
                    opt['params'] = $current.find("params").text();
                    anim["options"].push(opt);
                });
            }

            if ($this.find("componentItem").length > 0) {
                // force block of the animation
                // anim["isBlocked"] = "1";
                var $component = $this.find("componentItem");
                var $config = $component.find("config");
                anim["componentItem"] = {
                    "id": $component.find("id").text(),
                    "name": $component.find("name").text(),
                    "location": $component.find("location").text(),
                    "file": $component.find("file").text(),
                    "object": $component.find("object").text(),
                    "config":
                        {
                            "id": $config.find("id").text(),
                            "name": $config.find("name").text(),
                            "folder": $config.find("folder").text()
                        }
                };

                anim["componentItem"]["config"]["languages"] = [];
                if ($config.find("languages").length > 0) {
                    $config.find("languages").find("language").each(function () {
                        var $currentLg = $(this);
                        anim["componentItem"]["config"]["languages"].push({
                            "id": $currentLg.attr("id"),
                            "name": $currentLg.text()
                        });
                    });
                }

                anim["componentItem"]["parameters"] = {};
                if ($component.find("parameters").length > 0) {

                    $component.find("parameters").find("*").each(function () {
                        var $tag = $(this);
                        anim["componentItem"]["parameters"][$tag[0].tagName] = $tag.text();
                    });

                }

            }

            refAnim._animation.push(anim);

            /* functions for IsInScore Elements  */
            if (refAnim.getParameterByName("isInScore", anim.id) == 1) {

                anim['user_interactions'] = null;
                anim['getUserResponses'] = function () {
                    if (this.user_interactions == null || this.user_interactions.length == 0) {
                        this.user_interactions = (refAnim._slide._dataCom.readInteraction(this.id)) ? (refAnim._slide._dataCom.readInteraction(this.id).values) : [];
                    }
                    var response_details = {"values": [], "forced": false, "retryNbre": 0};
                    for (var i = 0; i < this.user_interactions.length; i++) {
                        if (this.user_interactions[i].id == "f") response_details.forced = this.user_interactions[i].value == 1 ? 1 : 0;
                        else if (this.user_interactions[i].id == "r") response_details.retryNbre = $.isNumeric(this.user_interactions[i].value) ? parseInt(this.user_interactions[i].value) : 0;
                        else response_details.values.push(this.user_interactions[i]);
                    }
                    return response_details;
                };

                anim['saveUserResponses'] = function (user_responses) {
                    this.user_interactions = user_responses;
                    refAnim._slide._dataCom.saveInteraction(this, user_responses);
                };

                anim["getAnimationScore"] = function () {
                    var strict = refAnim.getParameterByName("isStric", this.id) == 1;
                    var responses = this.getUserResponses();
                    var score = 0;
                    var numberOfResponses = 0;
                    if (!responses) return score;

                    if (!responses.values || responses.values.length == 0) return score;
                    $.each(responses.values, function (keyResp, reponse) {
                        if (reponse.id != -1) numberOfResponses++; // to be sure to calculate only elements was dropped  take the MIN (nbreDrag, nbreDrop) -> (example number of draggable element > number of droppable zone)
                    });
                    if (numberOfResponses == 0) return score;

                    switch (this.compositeType) {

                        case "26":
                            for (var i = 0; i < responses.values.length; i++) {
                                score += (responses.values[i].value.charAt(0)  == responses.values[i].value.charAt(1)) ? 1 : 0;
                            }
                            break;

                        case "17":
                            for (var i = 0; i < responses.values.length; i++) {
                                var data_info = responses.values[i].value + "";
                                score += (data_info.charAt(0) == 1) ? 1 : 0;
                            }
                            break;

                        case "27":

                            for (var i = 0; i < responses.values.length; i++) {
                                var dropZoneId = responses.values[i].id + "";
                                var dragZoneId = responses.values[i].value + "";
                                var dragElmnt = null;
                                $.each( this.compositeItems, function(key, item){
                                    if(item.id === dragZoneId){
                                        dragElmnt = item;
                                        return false;
                                    }
                                });
                                score += (dragElmnt && $.inArray(dropZoneId, dragElmnt.linkidsArray) > -1) ?  1 : 0;
                            }

                            break;

                        case "18":
                        default  :
                            for (var i = 0; i < responses.values.length; i++) {
                                score += (responses.values[i].id == responses.values[i].value) ? 1 : 0;
                            }
                            break;
                    }
                    if (responses.forced === 1 && ((score / numberOfResponses) * 100) < refAnim._slide._dataCom.getMasteryScore()) return refAnim._slide._dataCom.getMasteryScore();
                    return strict ? (score == numberOfResponses ? 100 : 0) : ((score / numberOfResponses) * 100);
                }

            }


        });

    },

    reset: function () {
        this._currentAnim = -1;
    },

    escapeResize: function (anim) {
        if ($.inArray(anim.compositeType, ["19"]) > -1) {
            $("#animateItemText" + anim.id).trigger("epublisher-resize");
            return true;
        }
        return false;
    },

    resize: function (param) {

        var picPos = param.refPic.position();

        for (var iAnim = 0, maxAnim = ((this._currentAnim + 1 > this._animation.length) ? this._currentAnim : this._currentAnim + 1); iAnim < maxAnim; iAnim++) {

            var curAnim = this._animation[iAnim];
            if (!curAnim) continue;

            var css = {
                'top': (picPos.top + (curAnim.y * param.ratio)) + 'px',
                'left': (picPos.left + (curAnim.x * param.ratio)) + 'px',
                'width': (curAnim.width * param.ratio) + 'px'
            };

            if (curAnim.height != '') css['height'] = (curAnim.height * param.ratio) + 'px';


            param.container.find("#animateItem" + curAnim.id).css(css);
            param.container.find("#animateItemText" + curAnim.id).css({'font-size': (param.ratio * 100) + '%'});
            if (this.escapeResize(curAnim)) continue;

            var initCss = param.container.find("#animateItemText" + curAnim.id).attr("data-style");
            var $obj = param.container.find("#animateItemText" + curAnim.id);
            if (initCss) {
                var initCss = JSON.parse(initCss);
                var newCss = {};

                if (initCss.padding) {

                    //$obj.css("padding",initCss.padding);
                    newCss = {
                        "padding-top": parseInt(initCss.padding[0]) * param.ratio + 'px',
                        "padding-bottom": parseInt(initCss.padding[2]) * param.ratio + 'px',
                        "padding-left": parseInt(initCss.padding[3]) * param.ratio + 'px',
                        "padding-right": parseInt(initCss.padding[1]) * param.ratio + 'px'
                    };

                }

                if (initCss.margin) {

                    //$obj.css("padding",initCss.padding);
                    // newCss = { "margin-top" : parseInt(initCss.margin[0]) * param.ratio +'px', "margin-bottom" :parseInt(initCss.margin[2]) * param.ratio +'px',
                    // "margin-left" :  parseInt(initCss.margin[3]) * param.ratio +'px',  "margin-right" : parseInt(initCss.margin[1]) * param.ratio +'px'};
                    newCss["margin-top"] = parseInt(initCss.margin[0]) * param.ratio + 'px';
                    newCss["margin-bottom"] = parseInt(initCss.margin[2]) * param.ratio + 'px';
                    newCss["margin-left"] = parseInt(initCss.margin[3]) * param.ratio + 'px';
                    newCss["margin-right"] = parseInt(initCss.margin[1]) * param.ratio + 'px';

                }
                if (initCss.lineHeight) {
                    //newCss["line-height"] = parseInt(initCss.lineHeight) * (param.ratio) + 'px';
                }
                $obj.css(newCss);

            }

            //resize elements inside text
            this.resizeInnerElement(curAnim.id, param);

            /* Resize options if they are positioned */
            if(curAnim["options"] && $.inArray(curAnim["compositeType"], ["26"]) > -1){
                $.each(curAnim["options"], $.proxy(function (key, opt) {
                    var underCss = {
                        'top' : opt.value * param.ratio,
                        'left': opt.text * param.ratio,
                    };
                    param.container.find("#animateItemText" + curAnim.id + '_' + opt.id).css(underCss);
                    var scale = {
                        'transform' : 'scale(' +param.ratio+ ')',
                        'transform-origin': '0px 0px',
                    };
                    param.container.find("#animateItemText" + curAnim.id + '_' + opt.id).find(".customCheckbox_small").css(scale);
                }, this));
            }

            if (curAnim["compositeItems"]) {
                $.each(curAnim["compositeItems"], $.proxy(function (key, underItem) {
                    var underCss = {
                        'top': underItem.y * param.ratio,
                        'left': underItem.x * param.ratio,
                        'width': underItem.width * param.ratio,
                        'height': underItem.height * param.ratio
                    };
                    if (underItem.height != '') underCss['height'] = (underItem.height * param.ratio) + 'px';
                    param.container.find("#animateItemText" + underItem.id).css(underCss);
                    var $obj = param.container.find("#animateItemText" + underItem.id);
                    var initCss = $obj.attr("data-style");

                    try {
                        json = $.parseJSON(initCss);
                        if (json.fontSize) $obj.css({"font-size": parseFloat(json.fontSize) * param.ratio + "px"});
                        else param.container.find("#animateItemText" + underItem.id).css({'font-size': (param.ratio * 100) + '%'});

                    } catch (e) {
                        param.container.find("#animateItemText" + underItem.id).css({'font-size': (param.ratio * 100) + '%'});
                    }
                    //param.container.find("#animateItemText" + underItem.id).css({'font-size' : (param.ratio * 100) + '%'});

                }, this));
            }

        }

        for (var i = 0; i < this._animation.length; i++) {
            var anim = this._animation[i];
            if (anim.objectComponent && $.isFunction(anim.objectComponent.resize)) {
                anim.objectComponent.resize();
            }
        }


    },

    escapeQuotes: function (str) {

        //    var listTags = {
        //    "p" : /<p(.*?)?>(.*?[^\\])(')(.*?)<\/p>/g,
        //    "li" : /<li(.*?)?>(.*?[^\\])(')(.*?)<\/li>/g,
        //    "h2" : /<h2(.*?)?>(.*?[^\\])(')(.*?)<\/h2>/g
        //    }
        // var cmpt = 0;

        //    for (tag in listTags) {
        //     var pattern = listTags[tag];
        //     var text = str.match(pattern);
        //     while(text !== null && cmpt <100){
        //         str =  str.replace(pattern, "<"+tag+" $1>$2\\$3$4</"+tag+">");
        //            text = str.match(pattern);
        //            cmpt++;
        //     }
        //    }
        return str;
    },

    /* return the params with format {paramname:paramvalue, paramname:paramevalue}*/
    getParameters: function (idAnim) {

        var params = {};
        var selectedAnim = null;
        if (typeof idAnim == "undefined" && this._currentAnim < this._animation.length &&
            $.trim(this._animation[this._currentAnim]["parameters"]) != ""
            && typeof idAnim == "undefined") selectedAnim = this._animation[this._currentAnim];

        else if (typeof idAnim != "undefined") {
            for (var i = 0; i < this._animation.length; i++) {
                if (this._animation[i]["id"] == idAnim) {
                    selectedAnim = this._animation[i];
                    break;
                }
            }
        }
        if (selectedAnim == null) return params;


        var stringParams = selectedAnim["parameters"];
        var arrayParams = stringParams.split(";");
        if (arrayParams) {
            $.each(arrayParams, function (key, param) {
                arrayParam = param.split("=");
                if (arrayParam.length == 2) {
                    params[arrayParam[0]] = arrayParam[1].replace(/"/g, '');
                }
            });
        }

        return params;

    },

    getPreviousAnimByType: function (typeAnim, currentAnim) {
        var startIndice = -1;
        for (var i = 0; i < this._animation.length; i++) {
            if (this._animation[i].id == currentAnim) {
                startIndice = i;
            }
        }

        for (var i = startIndice; i >= 0; i--) {
            var anim = this._animation[i];
            if (anim.compositeType == typeAnim) return anim;
        }

        return null;

    },

    getParameterByName: function (param, idAnim) {

        if (typeof idAnim !== "undefined") var params = this.getParameters(idAnim);
        else params = this.getParameters();
        if (params != null && params[param]) return params[param];
        return '';
    },

    saveState: function (anim, options) {
        if (typeof anim !== 'object' || anim == null) return;
        if (!anim.state) anim.state = {};
        if (options.length > 0) {
            for (var i = 0; i < options.length; i++) {
                anim.state[options[i]["name"]] = options[i]["value"];
            }
        }
    },

    deleteState: function (anim) {

        if (anim.state) delete anim.state;
        if (anim.compositeItems && anim.compositeItems.length > 0) {
            $.each(anim.compositeItems, function (key, underItem) {
                if (underItem.state) delete underItem.state;
            })
        }

    },

    getCurrent: function () {

        if (this._currentAnim < this._animation.length) return this._animation[this._currentAnim];
        return null;

    },

    getSuspended: function () {

        if (this._currentAnim < this._animation.length) return this._animation[this._currentAnim];
        return this._animation[this._animation.length - 1];

    },

    getNext: function () {
        if (this._currentAnim < this._animation.length - 1) return this._animation[this._currentAnim + 1];
        return null;

    },

    getScore: function () {
        var dataCom = this._slide._dataCom;
        var curAnim = this.getCurrent();
        var score = "??%";
        if (curAnim != null) {
            var allQuizIds = (curAnim["linkids"] && curAnim["linkids"].trim() != "") ? curAnim["linkids"].split(";") : [];
            var quizIds = [];
            var quizComponent = [];
            for (var i = 0; i < allQuizIds.length; i++) {
                if (allQuizIds[i].indexOf('_') > -1) quizComponent.push(allQuizIds[i]);
                else quizIds.push(allQuizIds[i]);
            }
            if (quizComponent.length > 0) {
                score = dataCom.getScoreComponent(quizComponent);
                score.notPercent = true;
            } else {
                score = dataCom.getQuizzCalculationInformation(quizIds, true);
            }
        }
        return score;
    },

    createUnderElements: function (animation, param) {
        var content = '';

        switch (animation["compositeType"]) {

            case "1":
            case "8":
                var compositeItems = animation["compositeItems"];
                var notRandomCh = this.getParameterByName("notRandomCh") == 1 ? true : false;

                if (!notRandomCh) compositeItems.sort(function (a, b) {
                    return 0.5 - Math.random();
                });

                content += ' <div class="sortableContainer sortableContainer_' + animation["id"] + '" data-animation="' + animation["id"] + '">';
                content += '     <div class="sortableHeader underLineBox">';
                content += animation["text"];
                content += '     </div>';
                content += '     <div>';
                content += '         <ul class="sortableList sortableList_' + animation["id"] + '">';

                $.each(compositeItems, function (key, underItem) {
                    content += '          <li style="' + underItem['style'] + '" data-sort="' + (key) + '"  data-order = "' + underItem["order"] + '" > <span style="display:inline-block;font-size: 16px," class="glyphicon glyphicon-resize-vertical"></span> ' + underItem["text"] + ' </li>';
                });
                content += '         </ul>';

                if (animation["compositeType"] == 1) {
                    content += '         <button style="margin: 10px; display:none;" class="btn btn-primary btn-sm validateSortableElement "> ' + this._reader.getLabel('submit') + ' </button>';
                }
                content += '     </div>';
                content += ' </div>';

                break;


            case "2":
            case "16":

                var frontContent = "", backContent = "", backAnim = null, composite = [], showBack = true,
                    showFront = true;
                var dbfaceType = this.getParameterByName("dbfaceType");
                if (dbfaceType == "scoreMsg") {
                    var score = this.getScore();
                    var masteryScore = this._slide._dataCom.getMasteryScore();
                    showFront = (score && masteryScore && score.raw >= masteryScore) ? true : false;
                    showBack = !showFront;
                } else if (dbfaceType == "lastAttemptsMsg") {
                    // get last the quiz and check how
                    showFront = this._slide._dataCom._slideshow.canRetryQuiz();
                    showBack = !showFront;
                }

                /* Front Face content */
                $.each(animation["compositeItems"], function (key, underItem) {
                    if (underItem["compositeType"] == 2002) {
                        backAnim = underItem;
                        // affect right sound to play
                        animation.sound = ((dbfaceType == "scoreMsg" || dbfaceType == "lastAttemptsMsg") && showBack) ? backAnim.sound : animation.sound;
                    } else if (underItem["compositeType"] == 2003) {
                        composite.push(underItem);
                    }
                    if (underItem["compositeType"] == 2001) {
                        frontContent += '        <div  id="animateItemText' + underItem.id + '" ';
                        var uStyle = (underItem["style"]) ? underItem["style"] : "";
                        if (uStyle.length > 0 && uStyle[uStyle.length - 1] != ";") uStyle += ';position:absolute;';
                        uStyle += ';position:absolute;';
                        uStyle += 'width: ' + underItem.width + 'px; top: ' + underItem.y + 'px; left: ' + underItem.x + 'px;';
                        if (underItem.height) uStyle += 'height:' + underItem.height;
                        if (uStyle.length > 0) frontContent += ' style="' + uStyle + '"';

                        var classNames = 'flipText ';
                        if (underItem["class"]) classNames += underItem["class"];
                        frontContent += ' class="' + classNames + '"';

                        frontContent += '>';
                        frontContent += underItem.text + '</div>';
                    }
                });

                /* back  Face content */
                if (backAnim != null) {
                    backAnim["compositeItems"] = composite;
                    $.each(backAnim["compositeItems"], function (key, underItem) {
                        if (underItem["compositeType"] == 2003) {
                            backContent += '        <div  id="animateItemText' + underItem.id + '" ';
                            var uStyle = (underItem["style"]) ? underItem["style"] : "";
                            if (uStyle.length > 0 && uStyle[uStyle.length - 1] != ";") uStyle += ';position:absolute;';
                            uStyle += ';position:absolute;';
                            uStyle += 'width: ' + underItem.width + 'px; top: ' + underItem.y + 'px; left: ' + underItem.x + 'px;';
                            if (underItem.height) uStyle += 'height:' + underItem.height;
                            if (uStyle.length > 0) backContent += ' style="' + uStyle + '"';

                            var classNames = 'flipText ';
                            if (underItem["class"]) classNames += underItem["class"];
                            backContent += ' class="' + classNames + '"';

                            backContent += '>';
                            backContent += underItem.text + '</div>';
                        }
                    });
                }


                var globalCss = (animation["style"]) ? animation["style"] : "";
                if (globalCss.length > 0 && globalCss[globalCss.length - 1] != ";") globalCss += ';';

                content += ' <div id="animateItemText' + animation["id"] + '" style="width:100%; height:100%;" class="flipCard"> ';
                var classNme = (animation["class"]) ? animation["class"] : '';

                if (showFront) {
                    content += '     <div class="front  ' + classNme + '" style="' + globalCss + ' ;width:100%; height:100%;" > ';
                    content += '        <div>';
                    content += animation["text"];
                    content += frontContent;
                    content += '</div>';
                    if (animation["compositeType"] == 2) {
                        content += '<div style="margin:5px; text-align:center; z-index:30000; position:absolute;bottom:5px;left:0; right:0; margin:auto;"><button class="btn btn-secondary btn-lg flipCardBtn flipCardCheckFront" > &nbsp; ' + this._reader.getLabel("check") + ' &nbsp;</div>';
                    }
                    content += '     </div>';
                }

                if (backAnim != null && showBack) {
                    var globalBackCss = (backAnim["style"]) ? backAnim["style"] : "";
                    if (globalBackCss.length > 0 && globalBackCss[globalBackCss.length - 1] != ";") globalBackCss += ';';
                    var classBackName = (backAnim["class"]) ? backAnim["class"] : '';
                    content += '     <div class="back  ' + classBackName + '" style="' + globalBackCss + ' ;width:100%; height:100%;">';
                    content += '        <div id="animateItemTextd' + backAnim["id"] + '" >';
                    content += backAnim["text"];
                    content += backContent;
                    content += '</div>';
                }
                if (animation["compositeType"] == "2") {
                    content += '<div style="margin:5px; text-align:center; z-index:30000; position:absolute;bottom:5px;left:0; right:0; margin:auto;"><button class="btn btn-secondary btn-lg flipCardBtn  flipCardCheckBack" > &nbsp; ' + this._reader.getLabel("check") + ' &nbsp;</div>';
                }

                content += '     </div>';

                content += ' </div>';


                break;

            case "3":

                content += ' <div class="panel-group"  id="accordion' + animation["id"] + '">';

                animation["compositeItems"].sort(function (a, b) {
                    return a.order - b.order;
                });
                $.each(animation["compositeItems"], function (key, underItem) {
                    content += ' <div class="panel panel-default panelCustom"  data-id= "' + underItem.id + '"  >';
                    content += '    <div style="' + underItem.style + '" class="panel-heading ' + underItem.class + ' ">';
                    content += '          <h4 class="panel-title">';
                    content += '              <a data-toggle="collapse" data-parent="#accordion' + animation["id"] + '" href="#collapse' + underItem.id + '">' + underItem.text + '</a>';
                    content += '          </h4>';
                    content += '    </div>';
                    content += '    <div id="collapse' + underItem.id + '" class="panel-collapse collapse ">';
                    // content += '          <div class="panel-body" style="'+underItem.style+'" >';
                    content += '          <div class="panel-body"  style="position:relative;">';
                    content += underItem.bodyText;
                    content += '           </div>';
                    content += '    </div>';
                    content += ' </div>';
                });
                content += '</div>';

                break;

            case "26":

                $.each(animation["options"], function (key, opt) {
                    var style = "position:absolute; ";
                    if(opt.text) style += "left:" + opt.text + "px;";
                    if(opt.value) style += "top:" + opt.value + "px";
                    content += '<div id="animateItemText'+animation['id']+'_'+opt.id+'" class="checkbox_list" style="' +style+ '">';
                    content += '<label class="customCheckbox customCheckbox_small">';
                    content += '<input  style="position: absolute; margin: 0px;"  type="checkbox" data-id="'+opt.id+'" data-value="' +opt.value+ '"  name="checkOption'
                        + animation['id'] + '" class="checkOption" data-correct = "' + opt.params
                        + '" data-option = "' + opt.id + '" value="' + opt.params + '"  />';
                    content += '  <span class="checkmark"></span>';
                    content += '</label>';
                    content += '</div>';


                });

                $.each(animation["compositeItems"], function (key, underItem) {
                    var width = $.isNumeric(underItem.width) ? underItem.width + 'px' : '';
                    var height = $.isNumeric(underItem.height) ? underItem.height + 'px' : '';
                    var uStyle = ' position: absolute; width: ' + width + '; height: ' + height + '; top: ' + underItem.y + 'px; left: ' + underItem.x + 'px;';
                    uStyle += underItem['compositeType'] == 14 ? "" : "border:1px solid #999;";
                    iStyle += (underItem["style"]) ? underItem["style"] : "";
                    var className = (underItem["class"]) ? underItem["class"] : '';
                    content += '<div id="animateItemText' + underItem["id"] + '"  class="submitUnderElement" style="' + uStyle + '" data-id="' + underItem["id"] + '" >';
                    content += '   <div class=" ' + className + ' stopSwipe" style=" ' + iStyle + ' " data-id="' + underItem["id"] + '"';
                    content += '  >';
                    content += underItem.text;
                    content += '  </div>';
                    content += '</div>';

                });

                break;

            case "4":
            case "21":
                var isCheckbox = this.getParameterByName("cheackboxchoice");
                var isOnChoice = this.getParameterByName("onechoice") == 1 ? true : false;


                content += '<div class="tabeOptions_' + animation["id"] + ' tableOptions">';

                content += ' <table class="table table-bordered table-condensed" border style="width:100%;" ">';
                var isAllHidden = true;
                var header = ' <tr><td >' + animation["text"] + '</td>';
                $.each(animation["options"], function (key, option) {
                    if (!option.params || option.params != 1) isAllHidden = false;
                    header += '<td style="text-align:center;" ><b>' + ((!option.params || option.params != 1) ? option["text"] : '') + '</b></td>';
                });
                header += '</tr>';
                if (!isAllHidden) content += header;

                $.each(animation["compositeItems"], function (key, underItem) {
                    content += ' <tr style="' + underItem["style"] + '" data-id="' + underItem.id + '" class="optionLine"><td >' + underItem["text"] + ' </td>';
                    if (animation["options"]) {
                        $.each(animation["options"], function (key, opt) {
                            content += '<td style="text-align:center; vertical-align:middle" class="">';
                            if (isCheckbox) {
                                content += '<label class="customCheckbox">';
                                content += '<input type="checkbox" data-value="' +opt.value+ '" data-choice="' + (isOnChoice ? '1' : '0') + '" name="checkOption'
                                    + underItem['id'] + '" class="checkOption" data-correct = "' + underItem["option"]
                                    + '" data-option = "' + opt.id + '" value="' + underItem.option + '"  />';
                                content += '  <span class="checkmark"></span>';
                                content += '</label>'
                            } else {
                                content += '<input type="radio" data-value="' +opt.value+ '"  name="' + ((isOnChoice) ? 'onechoice_' + animation["id"] : 'checkOption' + underItem["id"]) + '" class="checkOption" data-correct = "' + underItem["option"] + '" data-option = "' + opt.id + '" value="' + underItem.option + '"  />';
                                //content += '<input type="radio" data-choice="'+(isOnChoice ? '1': '0')+'" name="checkOption'+underItem['id']+'" class="checkOption" data-correct = "'+underItem["option"]+'" data-option = "'+opt.id+'" value="'+underItem.option+'"  />';
                            }
                            content += '</td>';
                        });
                    }
                    content += '</tr>';
                });

                content += ' </table>';

                if (animation["compositeType"]) content += '<div style="width:100%;padding:0px;margin:0px;" ><button class="btn btn-primary btn-sm validateOptions " style="display:none;"> ' + this._reader.getLabel('submit') + ' </button></div>'

                content += ' </div>';
                break;

            case '23':
                var isCheckbox = this.getParameterByName("cheackboxchoice");
                var isCustom = this.getParameterByName("customchoice");
                var validateBtn = this.getParameterByName("vlidatebutton");
                var columnWidth = $.isNumeric(this.getParameterByName("columnWidth")) ? parseFloat(this.getParameterByName("columnWidth")) : 0;

                var countOptions = animation["options"].length;
                if ($.isNumeric(validateBtn) && validateBtn == 1) countOptions++;

                if (countOptions > 0) {
                    /* Table Header */
                    var widthDiv = (100 - columnWidth) / (countOptions + (columnWidth == 0 ? 1 : 0));
                    content += ' <table class="tableOptions tableMultiOptions table-condensed" style="width:100%;height:100%;">';
                    content += '<tr>';
                    content += '    <td style="width:' + (columnWidth == 0 ? widthDiv : columnWidth) + '%;">' + (animation["ElementContent"] ? animation["ElementContent"] : "") + '</td>';
                    $.each(animation["options"], function (key, opt) {
                        content += '<td style="width:' + widthDiv + '%">' + ((opt["text"]) ? opt["text"] : '') + '</td>';
                    });
                    if ($.isNumeric(validateBtn) && validateBtn == 1) content += "<td style='width:" + widthDiv + "%; border:none;'></td>";
                    content += '</tr>';

                    /* Table Content */
                    $.each(animation["compositeItems"], $.proxy(function (key, underItem) {
                        var selectOptions = (underItem['option'] && underItem['option'].split(";").length == animation["options"].length) ? underItem['option'].split(";") : [];
                        content += ' <tr style="' + underItem["style"] + '" id="item' + underItem["id"] + '"><td style="vertical-align:middle;">' + underItem["text"] + ' </td>';
                        $.each(animation["options"], $.proxy(function (key, opt) {
                            if (isCheckbox) {
                                content += '<td style="text-align:center; vertical-align:middle;">';
                                content += "<input type='checkbox'/>";
                            } else if (isCustom) {
                                var className = 'muloptcusom' + (selectOptions.length > 0 ? selectOptions[key] : '');
                                content += '<td class="muloptcusom" class-name="' + className + '" style="cursor:pointer;" >';
                            }
                            content += '</td>';
                        }, this));
                        if ($.isNumeric(validateBtn) && validateBtn == 1) content += "<td style='border:none;'><button style='width:100%;' class='btn btn-sm btn-primary validate'>" + this._reader.getLabel('validate') + "</td>";
                        content += '</tr>';
                    }, this));


                }
                break;


            case '24':

                var score = this.getScore();
                var masteryScore = this._slide._dataCom.getMasteryScore();
                if (score && masteryScore && score.raw >= masteryScore && score.raw < 100) {

                    content += '<div id="animateItemText' + animation["id"] + '" ';
                    var iStyle = (animation["style"]) ? animation["style"] : "";

                    if (animation.height) {
                        if (!iStyle) iStyle = "";
                        if (iStyle.length > 0 && iStyle[iStyle.length - 1] != ";") iStyle += ';';
                        iStyle += "height:100%";
                    }


                    if (iStyle.length > 0) content += ' style="' + iStyle + '"';
                    if (animation["class"]) content += ' class="' + animation["class"] + '"';

                    content += '>';
                    content += animation["text"];
                    content += '</div>';
                }

                break;

            case '5':
                var infoScore = this.getScore();
                if (infoScore) {
                    content = infoScore.raw + (infoScore.notPercent ? "" : "%");
                }
                break;

            case '6':
                var sliderTicks = '[';
                var sliderTicksLabels = '[';
                $.each(animation["options"], function (key, option) {
                    sliderTicks += option.value + ',';
                    sliderTicksLabels += '"' + option.text + '"' + ',';
                });

                if (sliderTicks.length > 1) {
                    sliderTicks = sliderTicks.slice(0, -1);
                    sliderTicksLabels = sliderTicksLabels.slice(0, -1);
                }
                sliderTicks += ']';
                sliderTicksLabels += ']';

                content = '<input class="epubSlider stopSwipe"  data-id="' + animation["id"] + '" type="text" data-slider-value="0" data-slider-ticks=\'' + sliderTicks + '\'  data-slider-ticks-snap-bounds="1" data-slider-ticks-labels=\'' + sliderTicksLabels + '\'/>';

                break;

            case '7':
                var globalCss = (animation["style"]) ? animation["style"] : "";
                if (globalCss.length > 0 && globalCss[globalCss.length - 1] != ";") globalCss += ';';
                var classNme = (animation["class"]) ? animation["class"] : '';
                content += '<button class="btn btn-primary  optionSubmit" style="' + globalCss + '" data-id="' + animation["id"] + '">' + animation["text"] + '</button>';

                break;

            case '9':
                content = animation["text"];

                break;

            case '10':
                var header = '';
                var body = '';
                var params = '';

                var options = (animation["options"]) ? animation["options"] : [];

                if (options.length > 0) {
                    header = animation['options'][0]['text'];
                    body = animation['options'][0]['value'];
                    params = animation['options'][0]['params'];
                }
                content += '<span class="mypopovers" data-toggle="popover" data-placement="' + ((params != "") ? params : 'left') + '"  data-html="true" title="' + header + '" data-content="' + body + '" data-id="' + animation["id"] + '">';
                content += animation["text"];
                content += '</span>';

                break;

            case '11':
            case '15':

                var isRTL = (this.getParameterByName("orientation") && this.getParameterByName("orientation") == "rtl");
                content += '<table class="dragDropElement" data-id="' + animation["id"] + '" style="width:100%; height:100%;" cell-padding="10">';


                var columnWidth = $.isNumeric(this.getParameterByName("columnWidth")) ? parseFloat(this.getParameterByName("columnWidth")) : 0;
                var countOptions = animation["options"].length;

                if (countOptions > 0) {

                    var widthDiv = (100 - columnWidth) / (countOptions + (columnWidth == 0 ? 1 : 0));
                    var firstColumn = '    <td style="width:' + (columnWidth == 0 ? widthDiv : columnWidth) + '%;"></td>';

                    content += '  <thead>';
                    content += '  <tr class="">';
                    // content += '    <td style="width:'+(columnWidth == 0 ? widthDiv : columnWidth )+'%;"></td>';
                    if (!isRTL) content += firstColumn;
                    $.each(animation["options"], function (key, option) {
                        content += '<td class="dragdropOptions" style="width:' + widthDiv + '%; " data-id="' + option.id + '">';
                        content += option["text"];
                        content += '</td>';
                    });
                    if (isRTL) content += firstColumn;
                    content += '</tr>';
                    content += '</thead>'

                    content += '  <tbody>';
                    content += '<tr class="optionsListContainerRow">';
                    var options = '<td class="optionsListContainer optionsContainerDroppable" style="width:' + (widthDiv * 1) + '%;">';
                    var compositeItems = animation["compositeItems"].sort(function () {
                        return 0.5 - Math.random()
                    });
                    $.each(compositeItems, function (key, underItem) {
                        options += '<div class="choiceItemMirror stopSwipe"  data-id="m' + underItem["id"] + '" data-option="' + underItem["option"] + '">';
                        options += '<div class="choiceItem" style="' + underItem["style"] + '" id="item' + underItem["id"] + '">' + underItem["text"] + '</div>';
                        options += '</div>';
                    });
                    options += '</td>';
                    if (!isRTL) content += options;
                    // content += '<td class="optionsListContainer optionsContainerDroppable" style="width:'+(widthDiv * 1)+'%;">';
                    // var compositeItems = animation["compositeItems"].sort(function(){return 0.5 - Math.random()});
                    // $.each(compositeItems,function(key, underItem){
                    // 	content   += '<div class="choiceItemMirror stopSwipe"  data-id="m'+underItem["id"]+'" data-option="'+underItem["option"]+'">';
                    // 	content   += '<div class="choiceItem" style="'+underItem["style"]+'" id="item'+underItem["id"]+'">' + underItem["text"] + '</div>';
                    //     content   += '</div>';
                    // });
                    // content += '</td>';
                    // options places
                    $.each(animation["options"], function (key, option) {
                        content += '<td class="optionsContainer optionsContainerDroppable" style="width:' + widthDiv + '%;" data-option="' + option.id + '">';
                        content += '</td>';
                    });
                    if (isRTL) content += options;
                    content += '   </tr>';

                }

                content += '  </tbody>';
                content += '</table>';


                break;

            case "27":
                content += animation["text"];
                $.each(animation["compositeItems"], function (key, underItem) {
                    var display =  underItem["compositeType"] == 14 ? 'none' : 'block';
                    var width = $.isNumeric(underItem.width) ? underItem.width + 'px' : '';
                    var height = $.isNumeric(underItem.height) ? underItem.height + 'px' : '';
                    var droppable = animation["compositeType"] == 27 ? 'droppableInteractive' : '';
                    var submitClass = underItem['compositeType'] == 14 ? 'submitUnderElement ' : '';
                    var className = (underItem["class"]) ? underItem["class"] : '';
                    var listDroppableZones = (underItem["linkids"]) ? underItem["linkids"]  : "";
                    var typeElInt = underItem.option == 1 ? 'underInteractiveElt' : 'interactiveElt';

                    if(underItem.option == 1){  // element is draggable
                        var uStyle = ' position: absolute; width: ' + width + '; height: ' + height + '; top: ' + underItem.y + 'px; left: ' + underItem.x + 'px;';
                        uStyle += underItem['compositeType'] == 14 ? "" : "border:1px solid #999;";
                        var iStyle =  'position:absolute; top:0px left:0px;width:100%; height: 100%; ';
                        iStyle += (underItem["style"]) ? underItem["style"] : "";
                        var className = (underItem["class"]) ? underItem["class"] : '';
                        content += '<div id="animateItemText' + underItem["id"] + '"  class="' + droppable + ' ' + submitClass + '" style="' + uStyle + '" data-id="' + underItem["id"] + '"   data-interaction="' + listDroppableZones + '" >';
                        content += '   <div class=" ' + (underItem['compositeType'] == 14 ? '' : 'draggableIntractive ') + className + ' stopSwipe" style=" ' + iStyle + ' " data-id="' + underItem["id"] + '"   data-interaction="' + listDroppableZones + '"';
                        content += '  >';
                        content += underItem.text;
                        content += '  </div>';
                        content += '</div>';
                    }else{ // element is droppable & submit button
                        var underInteractiveElt = underItem['compositeType'] == 14 ?  "" : "underInteractiveElt";
                        content += '<div onclick="void(0)"  id="animateItemText' + underItem["id"] + '" data-id="' + underItem["id"] + '" class="'+ underInteractiveElt +' ' + submitClass + ' ' + droppable + ' ' + className + ' " data-animation="' + underItem.dir + '"  data-interaction="'+underItem.id+'" ';
                        var uStyle = (underItem["style"]) ? underItem["style"] : "";
                        uStyle += ';position:absolute; display:' + display + ';';
                        uStyle += 'width: ' + width + '; height: ' + height + '; top: ' + underItem.y + 'px; left: ' + underItem.x + 'px;';
                        if (uStyle.length > 0) content += ' style=\'' + uStyle + '\'';

                        content += '>';
                        content += underItem.text;
                        content += '</div>';
                    }

                });

                break;


            case "12":
            case "25":
            case "18":

                content += animation["text"];
                var isReverse = this.getParameterByName("reverseDragDrop", animation.id) == 1 ? true : false;

                $.each(animation["compositeItems"], function (key, underItem) {

                    var interaction = $.isNumeric(underItem.interaction) ? underItem.interaction : '-1';
                    var display = ($.isNumeric(underItem.interaction) && animation["compositeType"] == 12) ? 'none' : 'block';
                    var typeElInt = ($.isNumeric(underItem.interaction) ^ isReverse) ? 'underInteractiveElt' : 'interactiveElt';
                    var width = $.isNumeric(underItem.width) ? underItem.width + 'px' : '';
                    var height = $.isNumeric(underItem.height) ? underItem.height + 'px' : '';
                    var droppable = animation["compositeType"] == 18 ? 'droppableInteractive' : '';
                    var submitClass = underItem['compositeType'] == 14 ? 'submitUnderElement ' : '';

                    /* */
                    if (animation["compositeType"] == 25 || animation["compositeType"] == 12 || ($.isNumeric(underItem.interaction) ^ isReverse)) {
                        var className = (underItem["class"]) ? underItem["class"] : '';
                        var underItemDisplay = underItem['compositeType'] == 14 ? 'none' : display;
                        content += '<div onclick="void(0)"  id="animateItemText' + underItem["id"] + '" data-id="' + underItem["id"] + '" class="' + typeElInt + ' ' + submitClass + ' ' + droppable + ' ' + className + ' " data-animation="' + underItem.dir + '"  data-interaction="' + interaction + '" ';
                        var uStyle = (underItem["style"]) ? underItem["style"] : "";
                        uStyle += ';position:absolute; display:' + display + ';';

                        uStyle += 'width: ' + width + '; height: ' + height + '; top: ' + underItem.y + 'px; left: ' + underItem.x + 'px;';

                        if (uStyle.length > 0) content += ' style=\'' + uStyle + '\'';

                        content += '>';
                        content += underItem.text;
                        content += '</div>';
                    } else {
                        var underItemDisplay = underItem['compositeType'] == 14 ? 'none' : 'block';
                        var uStyle = ' position: absolute; width: ' + width + '; height: ' + height + '; top: ' + underItem.y + 'px; left: ' + underItem.x + 'px;';
                        uStyle += underItem['compositeType'] == 14 ? "" : "border:1px solid #999;";
                        var iStyle = (isReverse) ? 'position:relative; top:0px left:0px; ' : 'position:absolute; top:0px left:0px;width:100%; height: 100%; ';
                        iStyle += (underItem["style"]) ? underItem["style"] : "";
                        uStyle += 'display:' + underItemDisplay + ';';
                        var className = (underItem["class"]) ? underItem["class"] : '';
                        content += '<div id="animateItemText' + underItem["id"] + '"  class="' + droppable + ' ' + submitClass + '" style="' + uStyle + '" data-id="' + underItem["id"] + '"   data-interaction="' + interaction + '" >';
                        content += '   <div class=" ' + (underItem['compositeType'] == 14 ? '' : 'draggableIntractive ') + className + ' stopSwipe" style=" ' + iStyle + ' " data-id="' + underItem["id"] + '"   data-interaction="' + interaction + '"';

                        content += '  >';

                        content += underItem.text;
                        content += '  </div>';
                        content += '</div>'

                    }

                });

                break;

            case "13":

            case "17":
                var width = $.isNumeric(this.getParameterByName("maxWidth")) ? parseFloat(this.getParameterByName("maxWidth")) : '';
                var unit  = this.getParameterByName("unit") ? this.getParameterByName("unit") : '';
                unit = $.inArray(unit, ['px', '%']) > -1 ? unit : 'px';
                var percentWidth = ($.isNumeric(animation["width"]) && $.isNumeric(width)) ? ((parseFloat(width) / parseFloat(animation["width"])) * 100) + '%' : '100%';

                if (animation["compositeType"] == '17')
                    percentWidth = ($.isNumeric(animation["width"]) && $.isNumeric(width)) ? width + unit : '';

                content += '<select class="comboType" data-id="' + animation["id"] + '" "  style="color:#222; ' + (percentWidth != '' ? 'max-width:' + percentWidth : '') + '">';
                $.each(animation["options"], function (key, option) {
                    content += '<option option-id="' + option["id"] + '" data-info ="' + ((option["params"]) ? option["params"] : 0) + '">' + option["text"] + '</option>';
                });
                content += '</select>';

                if (animation["compositeType"] == '17') {
                    content = animation["text"].replace(/___/g, content);
                }

                $.each(animation["compositeItems"], function (key, underItem) {
                    var width = $.isNumeric(underItem.width) ? underItem.width + 'px' : '';
                    var height = $.isNumeric(underItem.height) ? underItem.height + 'px' : '';
                    var underItemDisplay = underItem['compositeType'] == 14 ? 'block' : 'block';
                    var uStyle = ' position: absolute; width: ' + width + '; height: ' + height + '; top: ' + underItem.y + 'px; left: ' + underItem.x + 'px;';
                    uStyle += underItem['compositeType'] == 14 ? "" : "border:1px solid #999;";
                    iStyle += (underItem["style"]) ? underItem["style"] : "";
                    uStyle += 'display:' + underItemDisplay + ';';
                    var className = (underItem["class"]) ? underItem["class"] : '';
                    content += '<div id="animateItemText' + underItem["id"] + '"  class="submitUnderElement" style="' + uStyle + '" data-id="' + underItem["id"] + '" >';
                    content += '   <div class=" ' + className + ' stopSwipe" style=" ' + iStyle + ' " data-id="' + underItem["id"] + '"';
                    content += '  >';
                    content += underItem.text;
                    content += '  </div>';
                    content += '</div>';

                });


                break;

            case "20":

                var interactions = this._slide._dataCom.readInteraction(animation["id"]);
                if (interactions) {
                    var selectedValues = [];
                    for (var i = 0; i < interactions.values.length; i++) {
                        selectedValues.push(interactions.values[i].id);
                    }
                    $.each(animation["compositeItems"], function (key, item) {
                        if ($.inArray(item.id, selectedValues) > -1) item.isSelected = true;
                    });
                }

                content = '<table class="table" data-id="' + animation["id"] + '">';

                content += '<thead><tr>';
                content += '<td colspan="2"><div class="questionDiv">';
                content += animation["text"];
                content += '</div></td>';
                content += '</tr></thead>';

                content += '<tbody>';
                var step = $.isNumeric(this.getParameterByName("nbreAnswers")) ? parseInt(this.getParameterByName("nbreAnswers")) : 2;
                if (animation["compositeItems"]) {
                    var firstAnswer = (animation["lSelectedAnswer"]) ? animation["lSelectedAnswer"] : 0;
                    firstAnswer = (firstAnswer > 0) ? (firstAnswer - step + 1) : 0;
                    var cmpt = 0;
                    $.each(animation["compositeItems"], function (key, item) {
                        if (key < firstAnswer) return;
                        cmpt++;
                        var imgname = (item.isSelected) ? "check3.png" : "uncheck3.png";

                        var itemStyle = "vertical-align:middle;";
                        itemStyle += (item["style"]) ? item["style"] : "";
                        var itemClass = (item["class"]) ? item["class"] : "";
                        content += '<tr>';
                        content += '  <td style="width:8%;vertical-align:middle;"><img data-checked = "' + ((item.isSelected) ? 1 : 0) + '" class="imgChoose20" data-item = "' + item["id"] + '" src="images/' + imgname + '" /></td>';
                        content += '  <td style="' + itemStyle + '" class="' + itemClass + '">' + item["text"] + '</td>';
                        content += '</tr>';
                        animation["lSelectedAnswer"] = key;
                        if (cmpt == step) return false;
                    });

                }
                content += '</tbody>';

                var nextActivation = (animation["lSelectedAnswer"] < animation["compositeItems"].length - 1) ? true : false;
                var prevActivation = (animation["lSelectedAnswer"] >= step) ? true : false;


                content += '<tfoot><tr>';
                content += '<td colspan="2">';
                content += '   <button class="btn btn-primary btn-sm pull-left  stepAnswer prevAnswer"  style="display: ' + (prevActivation ? '' : 'none') + '"  data-info="' + animation["id"] + '"> <i class="glyphicon  glyphicon-chevron-left"></i> ' + this._reader.getLabel('previous') + ' </button>';
                content += '   <button class="btn btn-primary btn-sm pull-right stepAnswer nextAnswer"  style="display: ' + (nextActivation ? '' : 'none') + '"  data-info="' + animation["id"] + '"> ' + this._reader.getLabel('submit') + ' <i class="glyphicon  glyphicon-chevron-right"></i> </button>';
                content += '</td>';
                content += '</tr></tfoot>';

                content += '</table>';


                break;


            case "22":
                var compositeItems = animation["compositeItems"];
                if (compositeItems && compositeItems.length < 0) return;
                var interactions = this._slide._dataCom.readInteractionsByType(animation["compositeType"]);
                var memorisedSlides = [];
                for (var i = 0; i < interactions.length; i++) {
                    for (var k = 0; k < interactions[i].values.length; k++) {
                        memorisedSlides.push(interactions[i].values[k].id);
                    }
                }
                var paramsArray = [];
                var param = this.getParameterByName("referencedslides");
                var isValidated = false;
                if (param && param.length > 0 && param.split(",").length > 0) {
                    isValidated = true;
                    paramsArray = param.split(",");
                    for (var i = 0; i < paramsArray.length; i++) {
                        if (memorisedSlides.indexOf(paramsArray[i]) < 0) {
                            isValidated = false;
                            break;
                        }
                    }
                }
                var underItem = compositeItems[0];
                content += ' <div  id="animateItemText' + underItem.id + '" ';
                var uStyle = 'position: absolute;';
                uStyle += (underItem["style"]) ? underItem["style"] : "";
                uStyle += 'width: ' + underItem.width + 'px; top: ' + underItem.y + 'px; left: ' + underItem.x + 'px;';
                if (underItem.height) uStyle += 'height:' + underItem.height;

                var regex = /url\((.*)\)/gm;
                var y = uStyle.match(regex);
                if (!isValidated && ((m = regex.exec(uStyle)) !== null)) {
                    if (m.length > 1) {
                        var image = m[1].split("/")[m[1].split("/").length - 1];
                        uStyle = uStyle.replace(image, 'not_' + image);
                    }
                }
                if (uStyle.length > 0) content += ' style="' + uStyle + '"';

                content += ' class="' + (underItem["class"] ? underItem["class"] : '') + '"';
                content += '>';
                content += underItem.text + '</div>';
                content += animation["text"];

                break;


        }

        return content;

    },


    showLastAnswers: function (animation, param) {

        var isInScore = this.getParameterByName("isInScore", animation.id) == 1 ? true : false;
        if (!isInScore) return -1;

        var isReverse = this.getParameterByName("reverseDragDrop", animation.id) == 1 ? true : false;
        var maxRetry = this.getParameterByName("maxRetry", animation.id);
        var displayColor = this.getParameterByName("displayColor", animation.id) == 1 ? true : false;
        var userResponses = animation.getUserResponses();
        var notRetry = isInScore && $.isNumeric(maxRetry) && userResponses.retryNbre >= maxRetry;
        var compositeType = animation["compositeType"];

        if (!notRetry) return -1;

        /* Remove Events in the Element */
        this.removeEvents(animation);

        /* Recuperate the last Answers */
        switch (compositeType) {


            case "26":
                for (var i = 0; i < userResponses.values.length; i++) {
                    var isChecked = userResponses.values[i].value.charAt(1) == 1 ? true : false;
                    var option_id = userResponses.values[i].id;
                    $("#animateItem" + animation["id"] + " [data-id='" +option_id+ "']").prop("checked", isChecked);
                }

                var $button = $("#animateItem" + animation["id"] + " .submitUnderElement");
                $button.addClass("submited");
                $button.addClass("calculeRetry");
                $("#animateItem" + animation["id"] + " .checkOption").prop("disabled",true);
                $button.find("button").html(this._reader.getLabel('next'));
                $button.show();
                break;

            case "17":
                for (var i = 0; i < userResponses.values.length; i++) {
                    var option_id = userResponses.values[i].value + "";
                    var $combo = $("#animateItem" + animation.id + " select.comboType");
                    $combo.find("[option-id='" + option_id.substring(1) + "']").prop('selected', true);
                    var displayColor = this.getParameterByName("displayColor", animation.id) == 1 ? true : false;
                    var showCorrectAnswers = this.getParameterByName("displayAnswer", animation.id) == 1 ? true : false;
                    if (displayColor == 1) {
                        var choiceClass = $combo.find("[option-id='" + option_id.substring(1) + "']").attr("data-info") == 1 ? "choiceCorrect" : "choiceError";
                        console.log(option_id.substring(1), $combo.find("[option-id='" + option_id.substring(1) + "']").attr("data-info"));
                        $combo.addClass(choiceClass);
                    }
                    if (showCorrectAnswers == 1) {
                        $combo.find("option[data-info=1]").prop("selected", true);
                        $combo.removeClass("choiceError").addClass("choiceCorrect");
                    }
                }

                var $button = $("#animateItem" + animation["id"] + " .submitUnderElement");
                $button.addClass("submited");
                $button.addClass("calculeRetry");
                $button.find("button").html(this._reader.getLabel('next'));
                $button.show();
                break;
            case "18":
            case "27":
                for (var i = 0; i < userResponses.values.length; i++) {
                    var listDraggableZone = $("#animateItem" + animation.id + " .draggableIntractive");
                    $.each(listDraggableZone, function (key, item) {

                        var containerInt = (!isReverse) ? $(item).closest(".underInteractiveElt").attr("data-interaction") : $(item).closest(".underInteractiveElt").attr("data-id");
                        var itemInt = (!isReverse) ? $(item).attr("data-id") : $(item).attr("data-interaction");
                        $(item).removeClass("errorDrop").removeClass("correctDrop");

                        for (var i = 0; i < userResponses.values.length; i++) {
                            if (userResponses.values[i].id && userResponses.values[i].value == itemInt) {
                                var container = (!isReverse) ? $(item).closest("#animateItem" + animation.id).find(".underInteractiveElt[data-interaction=" + userResponses.values[i].id + "]") : $(item).closest("#animateItem" + animation.id).find(".underInteractiveElt[data-id=" + userResponses.values[i].id + "]");

                                if( container.length > 0) container.append($(item).detach().css('top', '0px'));

                                if (displayColor) {
                                    var isCorrect = false;
                                    var dragElmnt = null;
                                    if (compositeType != 27) $(item).addClass(containerInt == itemInt ? "correctDrop" : "errorDrop");
                                    else if (compositeType == 27 && $(item).parent('.underInteractiveElt').length > 0){
                                        $.each(animation['compositeItems'], function(key, item){
                                            if(item.id === itemInt){
                                                dragElmnt = item;
                                                return false;
                                            }
                                        });
                                        isCorrect = (dragElmnt && $.inArray(containerInt, dragElmnt.linkidsArray) > -1);
                                        $(item).addClass(isCorrect ? "correctDrop" : "errorDrop");
                                    }

                                }
                            }
                        }
                        $(item).css('opacity', '1');

                    });
                }

                var $button = $("#animateItem" + animation["id"] + " .submitUnderElement");
                $button.addClass("submited");
                $button.addClass("calculeRetry");
                $button.find("button").html(this._reader.getLabel('next'));
                $button.show();
                break;
        }
        return 0;
    },

    removeEvents: function (animation) {
        switch (animation["compositeType"]) {
            case "18":
            case "27":
                $("#animateItem" + animation["id"] + " .draggableIntractive").draggable('disable');
                break;
            case "17":
                $("#animateItem" + animation["id"] + " select.comboType").prop('disabled', true);
                break;
        }
    },

    affectEvents: function (animation, param) {

        var oRef = this;
        var container = param.container;

        // global Events
        var goToNextAnim = this.getParameterByName("goToNextAnim", animation.id) == 1 ? true : false;
        var goToNextSlide = this.getParameterByName("goToNextSlide", animation.id) == 1 ? true : false;

        if (goToNextAnim === true) {
            var $div = container.find("#animateItemText" + animation.id);
            $div.on("touchend click", function () {
                if (oRef.getCurrent() && oRef.getCurrent().id == animation.id && $div.has('[disabled]').length == 0) {
                    oRef._slide._dataCom._slideshow.actionNext();
                }
            })
        }

        if (goToNextSlide === true) {
            var $div = container.find("#animateItemText" + animation.id);
            $div.on("touchend click", function () {
                oRef._slide._dataCom._slideshow.changeSlide("forward");
            })
        }

        container.find("#animateItemText" + animation.id + " > .interactiveElt").on("touchend click", function (key, obj) {

            if ($(this).hasClass("goToNextAnim")) {
                if (oRef.getCurrent() && oRef.getCurrent().id == animation.id) {
                    oRef._slide._dataCom._slideshow.actionNext();
                }
            }
        });


        // Specific Events
        switch (animation["compositeType"]) {

            case "21":

                var $div = container.find("#animateItemText" + animation.id);
                $div.find(".customCheckbox").on("touchend click", function (e) {
                    e.preventDefault();
                    $(".tabeOptions_" + animation.id).find('input[data-choice=1]').prop("checked", false);
                    $(this).find("input").prop("checked", !$(this).find("input").prop("checked"));
                });

                break;

            case "24":
                var $div = container.find("#animateItemText" + animation.id);
                var header = '';
                var options = (animation["options"]) ? animation["options"] : [];
                if (options.length > 0) {
                    header = animation['options'][0]['text'];
                }
                $div.find("button").click(function () {
                    var questionsData = oRef._slide._dataCom.getQuizzQuestions();
                    var questions = questionsData["questions"];
                    var html = '';
                    for (var i = 0; i < questions.length; i++) {
                        var question = questions[i];

                        if (question.userResponses.isValidated === true) {
                            if (!question.check(question.userResponses.getDecisions())) {
                                html += '<div>';
                                html += '<p>' + question['Text'] + '</p>';
                                html += '<ul>';

                                for (var j = 0; j < question["choices"].length; j++) {
                                    var choice = question["choices"][j];
                                    var className = choice.correct ? "correctResponse" : "";
                                    html += '<li class="' + className + '"> ' + choice.Text + ' </li>';
                                }
                                ;

                                html += '</ul>';

                                html += '</div>';
                            }
                        }

                    }

                    $("#myModal .modal-title").html(header);
                    $("#myModal .modal-body").html(html);
                    $("#myModal").modal('show');

                });

                break;

            case "23":
                var $div = container.find("#animateItemText" + animation.id);
                var isCheckbox = this.getParameterByName("cheackboxchoice");
                var isCustom = this.getParameterByName("customchoice");

                if ($div.find(".muloptcusom").length > 0) {
                    $div.find(".muloptcusom").click(function () {
                        //$(this).toggleClass($(this).attr("class-name"));
                        if (!$(this).hasClass("validatedResponse")) $(this).toggleClass("muloptcusom0");
                    });

                    $.each(animation["compositeItems"], function (key, underItem) {
                        var selectOptions = (underItem['option'] && underItem['option'].split(";").length == animation["options"].length) ? underItem['option'].split(";") : [];
                        if (selectOptions.length > 0) {
                            $("#item" + underItem.id + " .validate").click(function () {
                                var $this = $(this);
                                // show correct options
                                if (isCheckbox) {
                                    $.each(selectOptions, function (key, correctOpt) {
                                        $("#item" + underItem.id + " td:eq(" + (key + 1) + ")").prop("checked", (selectOptions[key] == 1 ? true : false));
                                    });
                                } else if (isCustom) {
                                    for (var i = 0; i < isCustom; i++) {
                                        $("#item" + underItem.id + " td").removeClass("muloptcusom" + i);
                                    }
                                    $.each(selectOptions, function (key, correctOpt) {
                                        $("#item" + underItem.id + " td:eq(" + (key + 1) + ")").addClass("muloptcusom" + selectOptions[key]);
                                        $("#item" + underItem.id + " td:eq(" + (key + 1) + ")").addClass("validatedResponse");
                                    });
                                }
                                // play sounds if exist
                                if (underItem["sound"]) {
                                    oRef._slide.players.playeraudio.actLAP('stop');
                                    oRef._slide.players.playeraudio.actLAP('play', {'file': underItem["sound"]});
                                }
                            });
                        }
                    });

                    $div.find(".validate").click(function () {


                    });
                }
                break;

            case "20":
                var $div = container.find("#animateItemText" + animation.id);
                var ref = this;
                $div.find(".stepAnswer").click(function () {
                    //$(this).closest("tbody").css("visibility","");
                    param.ratio = ref._slide._dataCom._slideshow.ResizeCoef;
                    var isNext = $(this).hasClass("nextAnswer");
                    if ($div.find("img[data-checked=1]").length == 0 && isNext) return;
                    var lSelectedAnswer = (animation["lSelectedAnswer"]) ? animation["lSelectedAnswer"] : -1;
                    var cmpt = 0, content = '';
                    var step = $.isNumeric(ref.getParameterByName("nbreAnswers", animation["id"])) ? parseInt(ref.getParameterByName("nbreAnswers", animation["id"])) : 2;

                    var start = isNext ? (lSelectedAnswer + 1) : (step * (Math.floor(lSelectedAnswer / step) - 1));
                    for (var i = start; i < animation["compositeItems"].length; i++) {
                        var item = animation["compositeItems"][i];
                        animation["lSelectedAnswer"] = i;
                        cmpt++;
                        var imgname = (item.isSelected) ? "check3.png" : "uncheck3.png";
                        var itemStyle = "vertical-align:middle;";
                        itemStyle += (item["style"]) ? item["style"] : "";
                        var itemClass = (item["class"]) ? item["class"] : "";
                        content += '<tr>';
                        content += '  <td style="width:8%;vertical-align:middle;"><img  data-checked = "' + ((item.isSelected) ? 1 : 0) + '" class="imgChoose20" data-item = "' + item["id"] + '" src="images/' + imgname + '" /></td>';
                        content += '  <td style="' + itemStyle + '"  class="' + itemClass + '">' + item["text"] + '</td>';
                        content += '</tr>';
                        if (cmpt == step) break;
                    }

                    if (content != '') $(this).closest("table").find("tbody").html(content);
                    ref.resizeInnerElement(animation.id, param);
                    ref.affectDataStyle(animation.id, param);
                    // ref.resize(param);
                    //if(animation["lSelectedAnswer"] >= animation["compositeItems"].length -1) $div.find(".nextAnswer").hide();
                    if (isNext && animation["compositeItems"].length > step) $div.find(".prevAnswer").show();
                    if (!isNext && animation["lSelectedAnswer"] < step) $div.find(".prevAnswer").hide();
                    if (!isNext && animation["compositeItems"].length > step) $div.find(".nextAnswer").show();

                    /************************** VALIDATE INTERACTIONS ***************************/
                    if (lSelectedAnswer == animation["compositeItems"].length - 1) {

                        if (isNext) {
                            if (ref.getParameterByName("isNextElement", animation.id) == 1 && $(this).attr("clicked") != 1) {
                                $(this).attr("clicked", "1");
                                ref._slide._dataCom._slideshow.actionPlayStop(ref._slide._dataCom._slideshow);
                            }
                            $(this).hide();
                            //$(this).closest("tbody").css("visibility","hidden");
                        }
                        var selectedInteractions = [];

                        $.each(animation["compositeItems"], function (key, item) {
                            if (item.isSelected) {
                                selectedInteractions.push({'id': item.id, 'value': 1});
                            }
                        });

                        oRef._slide._dataCom.saveInteraction(animation, selectedInteractions);
                    }


                });

                $(document).off("click", ".imgChoose20").on("click", ".imgChoose20", function () {
                    var notSelected = [];
                    var selected = $(this).attr("data-item");
                    $(this).attr("data-checked", "1").attr("src", "images/check3.png");
                    $div.find(".imgChoose20").not(this).attr("data-checked", "0").attr("src", "images/uncheck3.png").each(function (key, item) {
                        notSelected.push($(item).attr("data-item"));
                    });
                    $.each(animation["compositeItems"], function (key, item) {
                        if (item.id == selected) item["isSelected"] = true;
                        else if ($.inArray(item.id, notSelected) !== -1) item["isSelected"] = false;
                    });
                });

                break;

            case "19":
                var $div = container.find("#animateItemText" + animation.id);
                container.find("#animateItemText" + animation.id).on("epublisher-resize", function () {
                    if ($div.get(0).scrollHeight > $div.height()) {
                        $div.css("overflow-y", "scroll");
                    } else {
                        $div.css("overflow-y", "hidden");
                    }
                });

                break;


            case "12":
                var singleShow = this.getParameterByName("singleShow", animation.id) == 1 ? true : false;
                container.find("#animateItemText" + animation.id + " > .interactiveElt").on("click", function (key, obj) {


                    var interactionId = $(this).attr("data-id");
                    var interactionObj = $("[data-interaction=" + interactionId + "]");
                    var opened = false;

                    if (singleShow) {
                        container.find("#animateItemText" + animation.id + " > .underInteractiveElt").css("display", "none");
                    }

                    if (interactionObj.length > 0) {
                        var interactionType = $("[data-interaction=" + interactionId + "]").attr("data-animation");
                        var interactAnim = null;
                        for (var i = 0; i < animation["compositeItems"].length; i++) {
                            if (animation["compositeItems"][i]["id"] == interactionId) {
                                interactieAnim = animation["compositeItems"][i];
                                break;
                            }
                        }
                        if ($("[data-interaction=" + interactionId + "]").is(":hidden")) {
                            opened = true;
                            $("[data-interaction=" + interactionId + "]").animateCSS(interactionType, {
                                duration: 500,
                                callback: function () {
                                }
                            });
                            if (interactieAnim && interactieAnim["sound"] && interactieAnim["sound"] != "") {
                                oRef._slide.players.playeraudio.actLAP('stop');
                                oRef._slide.players.playeraudio.actLAP('play', {'file': interactieAnim["sound"]});
                            }
                        } else {
                            opened = false;
                            var infoVoice = oRef._slide.players.playeraudio.actLAP('getInfo');
                            if (interactieAnim && interactieAnim["sound"] == infoVoice.file) {
                                oRef._slide.players.playeraudio.actLAP('stop');
                                oRef._slide._dataCom._slideshow.pause();
                            }
                            $("[data-interaction=" + interactionId + "]").css("display", "none");
                        }

                        // update State Of Anim
                        for (var i = 0; i < animation["compositeItems"].length; i++) {
                            var unAnim = animation["compositeItems"][i];
                            if (unAnim["interaction"] && unAnim["interaction"] == interactionId) {
                                oRef.saveState(unAnim, [{"name": "opened", "value": opened}]);
                            }
                        }
                    }

                });

                break;

            // case "19":
            // 	var $div = container.find("#animateItemText" + animation.id);
            // 	container.find("#animateItemText" + animation.id).on("epublisher-resize", function () {

            // 		if ($div.get(0).scrollHeight > $div.outerHeight()) {
            // 			$div.css("overflow-y", "scroll");
            // 		} else {
            // 			$div.css("overflow-y", "hidden");
            // 		}
            // 	});

            // 	break;

            case "26":

                var isInScore = this.getParameterByName("isInScore", animation.id) == 1 ? true : false;
                if (isInScore) {
                    oRef._slide._dataCom._slideshow._buttonState.next.f_dis_activate = true;
                    oRef._slide._dataCom._slideshow._buttonState.play.activate = false;
                    oRef._slide._dataCom._slideshow.raiseButtonStateChanged(oRef._slide._dataCom._slideshow._buttonState);
                }

                $("#animateItem" + animation["id"] + " .submitUnderElement").click($.proxy(function (e) {

                    var submitBTN = $(e.currentTarget);
                    var checkboxList = animation;
                    var maxRetry = this.getParameterByName("maxRetry", checkboxList.id);
                    var forceScore = this.getParameterByName("forceScore", checkboxList.id);
                    var displayColor = this.getParameterByName("displayColor", checkboxList.id) == 1 ? true : false;
                    var showCorrectAnswers = this.getParameterByName("displayAnswer", checkboxList.id) == 1 ? true : false;

                    if (submitBTN.hasClass("submited")) {

                        if (submitBTN.hasClass("calculeRetry")) {
                            var maxRetry = this.getParameterByName("maxRetry", checkboxList.id);
                            var forceScore = this.getParameterByName("forceScore", checkboxList.id);
                            var current_responses = checkboxList.getUserResponses();
                            var retryNbre = current_responses.retryNbre + 1;
                            current_responses.values.push({id: 'r', value: retryNbre});
                            if ($.isNumeric(maxRetry) && retryNbre > parseInt(maxRetry)) {
                                current_responses.values.push({id: 'f', value: (forceScore ? 1 : 0)});
                            }
                            if (checkboxList != null) {
                                checkboxList.saveUserResponses(current_responses.values);
                            }
                        }

                        submitBTN.remove();
                        oRef._slide._dataCom._slideshow._buttonState.next.f_dis_activate = false;
                        oRef._slide._dataCom._slideshow.actionNext({force: true});
                        return;
                    }

                    var responses = [];
                    $("#animateItem" + animation["id"] + " .checkOption").each(function(key, checkbox){
                        responses.push({
                            id: $(checkbox).attr('data-id'),
                            value: ($(checkbox).attr('data-correct') == 1 ? 1 : 0 ) + "" + ($(checkbox).is(":checked") ? 1 : 0)
                        });
                    });

                    $("#animateItem" + animation["id"] + " .checkOption").prop("disabled",true);

                    submitBTN.addClass("submited");
                    submitBTN.find("button").html(oRef._reader.getLabel('next'));

                    if(displayColor){
                        $("#animateItem" + animation["id"] + " .checkOption").each(function(key, checkbox){
                            var $checkbox = $(checkbox);
                            $checkbox.removeClass("correctrbshowopt").removeClass("incorrectrbshowopt");
                            if(  ($checkbox.attr('data-correct') == 1 && $checkbox.is(":checked")) ||
                                 ($checkbox.attr('data-correct') == 0 && !$checkbox.is(":checked"))
                                 ) {
                                $checkbox.addClass("correctrbshowopt");
                            }else{
                                $checkbox.addClass("incorrectrbshowopt");
                            }
                        });
                    }

                    if(showCorrectAnswers){
                        $("#animateItem" + animation["id"] + " .checkOption").each(function(key, checkbox){
                            var $checkbox = $(checkbox);
                            if(  $checkbox.attr('data-correct') == 1 ) {
                                $checkbox.prop("checked", true);
                            }else{
                                $checkbox.prop("checked", false);
                            }
                        });
                    }

                    if (isInScore) {
                        var current_responses = checkboxList.getUserResponses();
                        var retryNbre = current_responses.retryNbre + 1;
                        if (!$.isNumeric(maxRetry) || retryNbre <= parseInt(maxRetry)) {
                            responses.push({id: 'r', value: retryNbre});
                            responses.push({id: 'f', value: 0});
                            checkboxList.saveUserResponses(responses);
                        } else {
                            current_responses.values.push({id: 'f', value: (forceScore ? 1 : 0)});
                            current_responses.values.push({
                                id: 'r',
                                value: current_responses.retryNbre + 1
                            });
                            checkboxList.saveUserResponses(current_responses.values);
                            $("#animateItem" + animation["id"]).find("button").prop("disabled", true);
                            //this.removeEvents(dragDropOpen);
                        }
                        this.removeEvents(animation);
                    }


                }, this));
                break;

            case "17":

                var isInScore = this.getParameterByName("isInScore", animation.id) == 1 ? true : false;
                if (isInScore) {
                    oRef._slide._dataCom._slideshow._buttonState.next.f_dis_activate = true;
                    oRef._slide._dataCom._slideshow._buttonState.play.activate = false;
                    oRef._slide._dataCom._slideshow.raiseButtonStateChanged(oRef._slide._dataCom._slideshow._buttonState);
                }

                $("#animateItem" + animation["id"] + " .submitUnderElement").click($.proxy(function (e) {

                    var target = $(e.currentTarget);
                    var combo = animation;
                    var maxRetry = this.getParameterByName("maxRetry", combo.id);
                    var forceScore = this.getParameterByName("forceScore", combo.id);
                    var displayColor = this.getParameterByName("displayColor", combo.id) == 1 ? true : false;
                    var showCorrectAnswers = this.getParameterByName("displayAnswer", combo.id) == 1 ? true : false;
                    var isGlobalSubmit = this.getParameterByName("isGlobal", combo.id) == 1 ? true : false;

                    var listElements = [combo];
                    if (isGlobalSubmit && oRef._animation) {
                        // check for all combo in the slide
                        $.each(oRef._animation, function (key, anim) {
                            if (anim.id != combo.id) listElements.push(anim);
                        });
                    }

                    if (target.hasClass("submited")) {

                        if (target.hasClass("calculeRetry")) {

                            /* activate scoring 17 */
                            $.each(listElements, $.proxy(function (key, element) {
                                var comboInScore = this.getParameterByName("isInScore", element.id) == 1 ? true : false;
                                if (comboInScore) {
                                    var current_responses = element.getUserResponses();
                                    var retryNbre = current_responses.retryNbre + 1;
                                    if (!$.isNumeric(maxRetry) || retryNbre <= parseInt(maxRetry)) {
                                        element.responses.push({id: 'r', value: retryNbre});
                                        element.responses.push({id: 'f', value: 0});
                                        element.saveUserResponses(element.responses);
                                    } else {
                                        current_responses.values.push({id: 'f', value: (forceScore ? 1 : 0)});
                                        current_responses.values.push({
                                            id: 'r',
                                            value: current_responses.retryNbre + 1
                                        });
                                        element.saveUserResponses(current_responses.values);
                                        $("#animateItem" + animation["id"]).find("button").prop("disabled", true);
                                        //this.removeEvents(dragDropOpen);
                                    }
                                    this.removeEvents(element);
                                }
                            }, this));

                            // var current_responses = combo.getUserResponses();
                            // var retryNbre = current_responses.retryNbre + 1;
                            // current_responses.values.push({id: 'r', value: retryNbre});
                            // if ($.isNumeric(maxRetry) && retryNbre > parseInt(maxRetry)) {
                            //     current_responses.values.push({id: 'f', value: (forceScore ? 1 : 0)});
                            // }
                            // if (combo != null) {
                            //     combo.saveUserResponses(current_responses.values);
                            // }
                        }
                        target.remove();
                        oRef._slide._dataCom._slideshow._buttonState.next.f_dis_activate = false;
                        oRef._slide._dataCom._slideshow.actionNext({force: true});
                        return;
                    }

                    target.addClass("submited");
                    target.addClass("calculeRetry");
                    target.find("button").html(oRef._reader.getLabel('next'));


                    $.each(listElements, $.proxy(function (key, element) {
                        var $combo = $("select.comboType[data-id='" + element.id + "']");
                        $combo.removeClass("choiceCorrect").removeClass("choiceError");
                        var comboValue = $combo.find(":selected").attr("data-info") + $combo.find(":selected").attr("option-id");
                        element.responses = [{id: element.id, value: comboValue}];
                        if (displayColor == 1) {
                            var choiceClass = $combo.find("option[data-info=1]").prop("selected") ? "choiceCorrect" : "choiceError";
                            $combo.addClass(choiceClass);
                        }
                        if (showCorrectAnswers == 1) {
                            $combo.find("option[data-info=1]").prop("selected", true);
                            $combo.removeClass("choiceError").addClass("choiceCorrect");

                        }
                    }, this));


                }, this));


                break;


            case "18":
            case "27":

                var isReverse = this.getParameterByName("reverseDragDrop", animation.id) == 1 ? true : false;
                var isInScore = this.getParameterByName("isInScore", animation.id) == 1 ? true : false;
                if (isInScore) {
                    oRef._slide._dataCom._slideshow._buttonState.next.f_dis_activate = true;
                    oRef._slide._dataCom._slideshow._buttonState.play.activate = false;
                    oRef._slide._dataCom._slideshow.raiseButtonStateChanged(oRef._slide._dataCom._slideshow._buttonState);
                }

                $("#animateItem" + animation["id"] + " .droppableInteractive").each($.proxy(function (key, elmnt) {

                    $(elmnt).droppable({
                        accept: ".interactiveElt",
                        activeClass: 'hover',
                        hoverClass: 'highlight',
                        accept: function (event, ui) {
                            var dropZone = $(elmnt);
                            if (!isReverse && dropZone.find(".draggableIntractive").length > 0) return false;
                            return true;
                        },
                        drop: function (event, ui) {

                            var dragItem = ui.draggable;
                            var dropZone = $(elmnt);
                            dropZone.append(dragItem);
                            $(dragItem).css({'left': '0px', 'top': '0px', 'z-index': 0});
                            var left = dragItem.css("left");
                            var top = dragItem.css("top");
                        }

                    });

                }, this));


                $("#animateItem" + animation["id"] + " .draggableIntractive ").each($.proxy(function (key, choice) {
                    $(choice).draggable({
                        containment: "#animateItem" + animation["id"],
                        revert: "invalid",
                        stack: "#animateItem" + animation["id"] + " .droppableInteractive",
                        // zIndex: 100,
                        stop: function (event, ui) {
                            this.parent.css("z-index", 0);
                            if ($("#animateItem" + animation["id"] + " .underInteractiveElt:not(:has(.draggableIntractive))").length == 0 && isInScore) {
                                oRef._slide._dataCom._slideshow._buttonState.next.f_dis_activate = false;
                                oRef._slide._dataCom._slideshow._buttonState.next.activate = true;
                                oRef._slide._dataCom._slideshow._buttonState.play.activate = true;
                                $("#animateItem" + animation["id"] + " .submitUnderElement").show();
                                oRef._slide._dataCom._slideshow.raiseButtonStateChanged(oRef._slide._dataCom._slideshow._buttonState);
                            }
                        },
                        drag: function (event, ui) {
                            this.parent = $(this).parent().css("z-index", 1000);
                        }
                    });
                }, this));

                $("#animateItem" + animation["id"] + " .submitUnderElement").click($.proxy(function (e) {

                    if ($("#animateItem" + animation["id"] + " .underInteractiveElt:not(:has(.draggableIntractive))").length > 0 || !isInScore) return;

                    var target = $(e.currentTarget);
                    var dragDropOpen = animation;
                    var maxRetry = this.getParameterByName("maxRetry", dragDropOpen.id);
                    var forceScore = this.getParameterByName("forceScore", dragDropOpen.id);
                    var isReverse = this.getParameterByName("reverseDragDrop", dragDropOpen.id) == 1 ? true : false;
                    var displayColor = this.getParameterByName("displayColor", dragDropOpen.id) == 1 ? true : false;
                    var showCorrectAnswers = this.getParameterByName("displayAnswer", dragDropOpen.id) == 1 ? true : false;
                    var type = animation["compositeType"];

                    if (target.hasClass("submited")) {

                        if (target.hasClass("calculeRetry")) {
                            var current_responses = dragDropOpen.getUserResponses();
                            var retryNbre = current_responses.retryNbre + 1;
                            current_responses.values.push({id: 'r', value: retryNbre});
                            if ($.isNumeric(maxRetry) && retryNbre > parseInt(maxRetry)) {
                                current_responses.values.push({id: 'f', value: (forceScore ? 1 : 0)});
                            }
                            if (dragDropOpen != null) {
                                dragDropOpen.saveUserResponses(current_responses.values);
                            }
                        }
                        target.remove();
                        oRef._slide._dataCom._slideshow._buttonState.next.f_dis_activate = false;
                        oRef._slide._dataCom._slideshow.actionNext({force: true});
                        return;
                    }

                    target.addClass("submited");
                    target.find("button").html(oRef._reader.getLabel('next'));

                    var responses = [];
                    var incorrectChoices = [];

                    var listDraggableZone = $("#animateItem" + dragDropOpen.id + " .draggableIntractive");
                    $.each(listDraggableZone, function (key, item) {

                        var containerInt = (!isReverse) ? $(item).closest(".underInteractiveElt").attr("data-interaction") : $(item).closest(".underInteractiveElt").attr("data-id");
                        var itemInt = (!isReverse) ? $(item).attr("data-id") : $(item).attr("data-interaction");
                        var dragElmnt = null;
                        $(item).removeClass("errorDrop").removeClass("correctDrop");
                        responses.push({id: $.isNumeric(containerInt) ? containerInt : -1, value: itemInt});

                        if (displayColor == 1) {

                            if (type != 27)  $(item).addClass(containerInt == itemInt ? "correctDrop" : "errorDrop");
                            else if(type == 27 && $(item).parent('.underInteractiveElt').length > 0){
                                var isCorrect = false;
                                $.each(animation['compositeItems'], function(key, item){
                                    if(item.id === itemInt){
                                        dragElmnt = item;
                                        return false;
                                    }
                                });
                                isCorrect = (dragElmnt && $.inArray(containerInt, dragElmnt.linkidsArray) > -1);
                                $(item).addClass(isCorrect ? "correctDrop" : "errorDrop");
                            }

                        }

                        if (showCorrectAnswers == 1) {
                            if(type != 27) {
                                var correctContainer = (!isReverse) ? $(item).closest("#animateItem" + dragDropOpen.id).find(".underInteractiveElt[data-interaction=" + itemInt + "]") : $(item).closest("#animateItem" + dragDropOpen.id).find(".underInteractiveElt[data-id=" + itemInt + "]");
                                $item = $(item).detach();
                                correctContainer.append($item);
                                $item.addClass("correctDrop");
                            } else if(dragElmnt){
                                if($.inArray(containerInt, dragElmnt.linkidsArray) <= -1){  // not in correct place
                                    incorrectChoices.push({'item': $(item).detach(), 'dragElmnt': dragElmnt});
                                }
                            }
                        }
                        $(item).css('opacity', '1');
                    });

                    // place the elements in right place in the drag/drop Multiplechoice (27) element type
                    $.each(incorrectChoices, function(key, info){
                        $.each(info.dragElmnt.linkidsArray, function(key, correctDroppableZoneId){
                            var y = $(".droppableInteractive[data-id="+ correctDroppableZoneId +"]").find(".draggableIntractive").length;
                            if($(".droppableInteractive[data-id="+ correctDroppableZoneId +"]").find(".draggableIntractive").length === 0){
                                $(".droppableInteractive[data-id="+ correctDroppableZoneId +"]").append(info.item);
                                return false;
                            }
                        });
                    });




                    /* activate scoring  */

                    if (isInScore) {
                        var current_responses = dragDropOpen.getUserResponses();
                        var retryNbre = current_responses.retryNbre + 1;
                        if (!$.isNumeric(maxRetry) || retryNbre <= parseInt(maxRetry)) {
                            responses.push({id: 'r', value: retryNbre});
                            responses.push({id: 'f', value: 0});
                            dragDropOpen.saveUserResponses(responses);
                        } else {
                            current_responses.values.push({id: 'f', value: (forceScore ? 1 : 0)});
                            current_responses.values.push({
                                id: 'r',
                                value: current_responses.retryNbre + 1
                            });
                            dragDropOpen.saveUserResponses(current_responses.values);
                            $("#animateItem" + animation["id"]).find("button").prop("disabled", true);
                            //this.removeEvents(dragDropOpen);
                        }
                        this.removeEvents(animation);
                    }


                }, this));


                break;

            case "1":
            case "8":
                var displayColor = this.getParameterByName("displayColor") == 1 ? true : false;
                container.find(".sortableList_" + animation["id"]).sortable({
                    stop: function (ev, ui) {
                        container.find(".sortableList_" + animation["id"] + " li").each(function (key, obj) {
                            $(obj).attr("data-sort", (key));
                            container.find(".validateSortableElement").css("display", "block");
                        });
                    }
                });
                container.find(".sortableList_" + animation["id"]).disableSelection();
                if (animation["compositeType"] == "1") {
                    container.find(".sortableContainer_" + animation["id"] + " .validateSortableElement").click(function () {
                        var listItems = container.find(".sortableList_" + animation["id"] + " li");

                        var content = '';

                        if (displayColor) {
                            $.each(listItems, function (key, underItem) {
                                if (($(underItem).attr("data-sort") == $(underItem).attr("data-order"))) {
                                    var assignedClass = "correctSort";
                                    var iconImg = "<span style='color:green;' class='glyphicon glyphicon-ok'></span>";
                                } else {
                                    var assignedClass = "errorSort";
                                    var iconImg = "<span style='color:red;' class='glyphicon glyphicon-remove'></span>";
                                }
                                content += '   <li data-sort="' + (key + 1) + '" class = "' + assignedClass + '"  data-order = "' + $(underItem).attr("data-order") + '" > ' + iconImg + ' ' + $(underItem).text() + ' </li>';
                            });
                        } else {

                            listItems.sort(function (a, b) {
                                return parseInt($(a).attr("data-order")) - parseInt($(b).attr("data-order"));
                            });
                            $.each(listItems, function (key, underItem) {
                                content += '   <li data-sort="' + (key + 1) + '"   data-order = "' + $(underItem).attr("data-order") + '" >  ' + $(underItem).text() + ' </li>';
                            });
                        }


                        container.find(".sortableList_" + animation["id"]).sortable("disable").html(content);
                        $btnNext = $("<button  class='btn btn-primary nextAnim btn-sm'>" + oRef._reader.getLabel('continue') + "</button>");
                        $btnNext.click(function () {
                            $(this).hide();
                        });
                        $(this).replaceWith($btnNext);
                    });
                }
                break;

            case '2' :
            case '16':

                var dbfaceType = this.getParameterByName("dbfaceType");
                var flipOnce = this.getParameterByName("flipOnce");
                switch (dbfaceType) {
                    case "scoreMsg":
                    case "lastAttemptsMsg":
                        /* No Event Actually */
                        break;
                    default:
                        container.find("#animateItemText" + animation.id).flip({trigger: 'click'});
                        var backSound = '';
                        $.each(animation["compositeItems"], function (key, underItem) {
                            if (underItem.compositeType == 2002) {
                                if (underItem.sound != '') backSound = underItem.sound;
                            }
                        });
                        animation["isBackFace"] = false;
                        container.find("#animateItemText" + animation.id).on('flip:done', $.proxy(function () {
                            animation["isBackFace"] = !animation["isBackFace"];
                            if (flipOnce == 1) {
                                container.find("#animateItemText" + animation.id).off(".flip");
                            }
                            this.stopAnimationDuring(animation, param);
                            // if there is a videos we stop theme
                            if (container.find("#animateItemText" + animation.id + " video").length > 0) {
                                for (var i = 0; i < container.find("#animateItemText" + animation.id + " video").length; i++) {
                                    container.find("#animateItemText" + animation.id + " video")[i].pause();
                                }
                            }
                            if (animation["isBackFace"] && backSound != '') {
                                oRef._slide.players.playeraudio.actLAP('stop');
                                oRef._slide.players.playeraudio.actLAP('play', {'file': backSound});
                            }
                            oRef.saveState(animation, [{"name": "isFliped", "value": animation["isBackFace"]}]);
                        }, this));

                        container.find(".flipCardBtn").click(function () {
                            var $this = $(this);
                            $this.closest("#animateItemText" + animation.id).flip('toggle');
                        });
                }
                break;

            case '3':
                container.find(".panelCustom").on("touchend", function () {
                    $(this).trigger("click");
                });
                container.find(".panelCustom").on('shown.bs.collapse', function (e) {
                    var id = $(e.currentTarget).attr("data-id");
                    var sound = "";
                    $.each(animation["compositeItems"], function (key, underItem) {
                        if (underItem.id == id) {
                            if (underItem.sound != '') sound = underItem.sound;
                            oRef.saveState(underItem, [{"name": "opened", "value": true}]);
                        }
                    });
                    if (sound && sound != "") {
                        oRef._slide.players.playeraudio.actLAP('stop');
                        oRef._slide.players.playeraudio.actLAP('play', {'file': sound});
                    }
                });

                container.find(".panelCustom").on('hidden.bs.collapse', function (e) {
                    var id = $(e.currentTarget).attr("data-id");
                    var sound = "";
                    $.each(animation["compositeItems"], function (key, underItem) {
                        if (underItem.id == id) {
                            if (underItem.sound != '') sound = underItem.sound;
                            oRef.saveState(underItem, [{"name": "opened", "value": false}]);
                        }
                    });
                    if (sound && sound != "") {
                        var info = oRef._slide.players.playeraudio.actLAP('getInfo');
                        if (info && info.file == sound) {
                            oRef._slide.players.playeraudio.actLAP('stop');
                        }

                    }
                });

                break;

            case '4':

                container.find(".validateOptions").click(function () {
                    var listoptions = container.find(".checkOption");
                    $.each(listoptions, function (key, option) {
                        var $option = $(option);
                        $option.attr("disabled", true);
                        if ($option.is(":checked") && $option.attr("data-correct") != $option.attr("data-option")) {
                            $option.closest("td").css({"background-color": "red"});
                        } else if ($option.attr("data-correct") == $option.attr("data-option")) {
                            $option.closest("td").css({"background-color": "green"});
                        }
                    });
                    $btnNext = $("<button  class='btn btn-primary nextAnim btn-sm'>" + oRef._reader.getLabel('continue') + "</button>");
                    $btnNext.click(function () {
                        $(this).hide();
                    });
                    $(this).replaceWith($btnNext);
                });

                container.find(".checkOption").change(function (e) {
                    var displayBtn = "block";
                    container.find(".optionLine").each(function (e) {
                        var $line = $(this);
                        if ($line.find(".checkOption:checked").length == 0) {
                            displayBtn = "none";
                            return false;
                        }
                    });
                    container.find(".validateOptions").css("display", displayBtn);

                });
                break;

            case "6":
                container.find(".epubSlider").css({"width": "100%", "padding": "0px 10px"}).bootstrapSlider();
                break;

            case "7":
                var that = this;

                container.find(".optionSubmit").click(function () {
                    var elementId = animation["id"];
                    var elementType = that.getParameterByName("type", elementId) ;
                    var options = animation["options"];
                    if (options.length == 0) return;
                    var values = [0];
                    for (var i = 0; i < options.length; i++) {
                        values[i + 1] = options[i]["value"];
                    }
                    var moyValues = 0;
                    switch (elementType) {

                        case '1':
                            var showOptionElmnt = null;
                            $.each(that._animation, function(key, elmnt){
                                if(elmnt.compositeType == 21){
                                    showOptionElmnt = elmnt;
                                    return false;
                                }
                            });
                            if(showOptionElmnt == null || showOptionElmnt.compositeItems.length == 0) return;
                            $.each(showOptionElmnt.compositeItems, function (key, composeElement) {
                                var $options = container.find(".optionLine[data-id='"+composeElement.id+"']").find('.checkOption:checked');
                                $.each($options, function (keyOpt, option) {
                                    var $option = $(option);
                                    if($option.is(":checked")) {
                                        moyValues += $.isNumeric($option.attr("data-value")) ? parseFloat($option.attr("data-value")) : 0 ;
                                    }
                                });
                            });

                            moyValues = (moyValues/showOptionElmnt.compositeItems.length);


                            break;
                        default:
                            var sliders = container.find(".min-slider-handle");
                            if (sliders.length <= 0) return;
                            $.each(sliders, function (key, slider) {
                                var selectedValue = $(slider).attr("aria-valuenow");
                                moyValues += $.isNumeric(selectedValue) ? parseFloat(selectedValue) : 0;
                            });
                            moyValues = moyValues / sliders.length;
                            break;
                    }


                    var sound = "";
                    for (var i = 0; i < values.length - 1; i++) {
                        if (moyValues >= values[i] && moyValues <= values[i + 1]) {
                            sound = options[i]["audio"];
                        }

                    }
                    oRef._slide.players.playeraudio.actLAP('stop');
                    if (sound) {

                        oRef._slide.players.playeraudio.actLAP('play', {'file': sound});
                    }
                });
                break;

            case "9":

                var elementId = animation["id"];
                var pauseActivated = this.getParameterByName("notPause", elementId) == 1 ? false : true;
                var options = (animation["options"]) ? animation["options"] : [];
                var isFullScreen = this.getParameterByName("fullScreen") == 1 ? true : false;
                var modalSelector = (isFullScreen) ? "modal-fullscreen" : "myModal";
                if (options.length == 0) return;
                container.find("#animateItem" + elementId).on("touchend click", $.proxy(function () {

                    if (options[0]["text"] != "") $("#" + modalSelector + " .modal-title").html(options[0]["text"]);
                    else $("#" + modalSelector + " .modal-header").css("display", "none");

                    $("#" + modalSelector + " .modal-body").html(options[0]["value"]);
                    var videos = $("#" + modalSelector).find("video");
                    var audios = $("#" + modalSelector).find("audio");
                    oRef._slide._dataCom._slideshow.isModalOpened = true;
                    var infoPlay = oRef._slide.players.playeraudio.actLAP('getInfo');
                    oRef._isPlaying = (infoPlay) ? infoPlay.isPlaying : false;
                    // if(videos.length > 0 || audios.length > 0){
                    // 	  oRef._slide.players.playeraudio.actLAP('stop');
                    // }

                    // if(oRef._slide._dataCom._slideshow._buttonState.play.state != "stop" && oRef._slide.Sound == null){
                    // oRef._slide._dataCom._slideshow.actionPlayStop(this._slide._dataCom._slideshow);
                    if (pauseActivated) {
                        oRef._slide.players.playeraudio.actLAP('stop');
                        oRef._slide._dataCom._slideshow.pause(true);
                    }
                    // }
                    // else{
                    // 	oRef._slide.players.playeraudio.actLAP('stop');
                    // }

                    $("#" + modalSelector).modal('show');
                }, this));

                // to delete the forced height and weight in previous show modal
                $("#myModal").off("show.bs.modal").on('show.bs.modal', function () {
                    $(this).find('.modal-body').css({
                        width: 'auto',
                        height: 'auto',
                        'max-height': '100%'
                    });
                });

                $("#" + modalSelector).off("hidden.bs.modal").on('hidden.bs.modal', $.proxy(function () {
                    $("#" + modalSelector + " .modal-header").css({"display": ""});
                    // test if there is a video inside
                    var videos = $("#" + modalSelector).find("video");
                    var audios = $("#" + modalSelector).find("audio");
                    var iframes = $("#" + modalSelector).find("iframe");
                    oRef._slide._dataCom._slideshow.isModalOpened = false;
                    if (videos.length > 0) {
                        $.each(videos, function (key, vid) {
                            $(vid)[0].pause();
                        });
                    }
                    if (audios.length > 0) {
                        $.each(audios, function (key, aud) {
                            $(aud)[0].pause();
                        });
                    }

                    // if(iframes.length > 0){
                    // 	$(iframes).attr("src", $(iframes).attr("src"));
                    // }

                    // only for detached slide because we don't show the buttom
                    if (this._slide.Animation.getCurrent() != null && this._slide.IsDetached && pauseActivated) {
                        oRef._slide._dataCom._slideshow.actionPlayStop(this._slide._dataCom._slideshow);
                    }
                    // else if(this._slide.Animation.getNext() == null){
                    //        oRef._slide._dataCom._slideshow.changeSlide("forward");
                    // }

                    // test if there is an embeded video
                    if ($("#" + modalSelector).find("iframe").length > 0) {
                        $("#" + modalSelector).find("iframe").attr("src", $("#myModal").find("iframe").attr("src"));
                    }

                    oRef._isPlaying = false;
                }, this));

                break;

            case "11":
            case "15":
                var initialHeight = $(".optionsListContainer").height();
                $(".optionsContainer").css('height', "100%");

                var displayColor = this.getParameterByName("displayColor") == 1 ? true : false;
                var ref = this;
                container.find(".optionsContainerDroppable").each($.proxy(function (key, choice) {
                    $(choice).droppable({
                        accept: '.choiceItemMirror',
                        activeClass: 'hover',
                        hoverClass: 'highlight',
                        drop: function (event, ui) {

                            var dragItem = ui.draggable;
                            var dropZone = $(choice);
                            var correctContainer, $item;
                            dropZone.append(dragItem);
                            dragItem.css({'left': '0px', 'top': '0px', 'z-index': 0});
                            var left = dragItem.css("left");
                            var top = dragItem.css("top");
                            var countItem = $(".optionsListContainer").find(".choiceItem").length;

                            if (countItem == 0 && container.find("#checkdragdropOptions").length == 0 && animation["compositeType"] == 11) {
                                $(".dragDropElement").append($('<tr><td style="text-align:left;"><button id="checkdragdropOptions" class="btn btn-primary">' + ref._reader.getLabel("check") + '</button></td>'));

                                container.find("#checkdragdropOptions").click(function (btn) {

                                    $("#checkdragdropOptions").prop("disabled", true);
                                    $.each(container.find(".choiceItemMirror"), function (key, item) {
                                        var containerOption = $(item).closest(".optionsContainer").attr("data-option");
                                        var itemOption = $(item).attr("data-option");

                                        if (displayColor) {

                                            if (containerOption == itemOption) $(item).find(".choiceItem").css({
                                                "background-color": "green",
                                                "color": "#fefefe"
                                            });
                                            else $(item).find(".choiceItem").css({
                                                "background-color": "red",
                                                "color": "#fefefe"
                                            });
                                        } else {
                                            correctContainer = $(item).closest(".optionsListContainerRow").find(".optionsContainer[data-option=" + itemOption + "]");
                                            $item = $(item).detach();
                                            correctContainer.append($item);

                                        }
                                        $(item).css('opacity', '1');

                                    });


                                });
                            }
                        }
                    });

                }, this));

                container.find(".choiceItemMirror").each($.proxy(function (key, choice) {
                    $(choice).draggable({
                        containment: '.dragDropElement',
                        revert: 'invalid',
                        // cursor     : 'move',
                        stack: '.choiceItem',
                        revert: true,
                        stop: function (event, ui) {
                            $(choice).css({'left': '0px', 'top': '0px', 'z-index': 0});
                        }
                    });

                }, this));

                break;


            case "14":

                var submitType = this.getParameterByName("submitType");
                var displayColor = this.getParameterByName("displayColor");
                var showCorrectAnswers = this.getParameterByName("displayAnswer");
                var displayRadioColor = this.getParameterByName("displayRadioColor");
                animation["isBackFace"] = false;
                $("#animateItem" + animation["id"]).click($.proxy(function (e) {

                    switch (submitType) {

                        case "combo":

                            $("select.comboType").each($.proxy(function (key, combo) {
                                var idAnim = $(combo).attr("data-id");
                                var $combo = $(combo);
                                $combo.removeClass("choiceCorrect").removeClass("choiceError");
                                if (displayColor == 1) {
                                    var choiceClass = $combo.find("option[data-info=1]").prop("selected") ? "choiceCorrect" : "choiceError";
                                    $combo.addClass(choiceClass);
                                }
                                if (showCorrectAnswers == 1) {
                                    $combo.find("option[data-info=1]").prop("selected", true);
                                    $combo.removeClass("choiceError").addClass("choiceCorrect");

                                }
                            }, this));

                            break;

                        case "dragDrop":

                            var dragDrop = this.getPreviousAnimByType(15, animation["id"]);
                            if (dragDrop != null) {
                                var dragDropContainer = $(".dragDropElement[data-id=" + dragDrop.id + "]");
                                $.each(dragDropContainer.find(".choiceItemMirror"), function (key, item) {
                                    var containerOption = $(item).closest(".optionsContainer").attr("data-option");
                                    var itemOption = $(item).attr("data-option");
                                    $(item).find(".choiceItem").removeClass("errorDrop").removeClass("correctDrop");
                                    var correctContainer = $(item).closest(".optionsListContainerRow").find(".optionsContainer[data-option=" + itemOption + "]");
                                    var $listOptionsContainer = $(item).closest(".optionsListContainerRow").find(".optionsListContainer");

                                    if (displayColor == 1) {
                                        // si l'element n'a pas d'option et existe dans la premiere colonne
                                        if (correctContainer.length <= 0 && $(item).parent(".optionsListContainer").length > 0) $(item).find(".choiceItem").addClass("correctDrop");
                                        else if (containerOption == itemOption) $(item).find(".choiceItem").addClass("correctDrop");
                                        else $(item).find(".choiceItem").addClass("errorDrop");
                                    }

                                    if (showCorrectAnswers == 1) {
                                        var $item = $(item).detach();
                                        if (correctContainer.length > 0) {
                                            correctContainer.append($item);
                                            $item.find(".choiceItem").addClass("correctDrop");
                                        } else if ($listOptionsContainer.length > 0) {
                                            $listOptionsContainer.append($item);
                                            $item.find(".choiceItem").removeClass("errorDrop").removeClass("correctDrop");
                                        }

                                    }
                                    $(item).css('opacity', '1');
                                });
                            }

                            break;

                        case "sortBox":

                            var sortBox = this.getPreviousAnimByType(8, animation["id"]);
                            if (sortBox != null) {

                                var $container = $(".sortableContainer[data-animation=" + sortBox.id + "]");


                                //$.each(listSortElements, function(key, container){
                                // var $container =$(listSortElement);
                                var sortedElementId = $container.attr("data-animation");
                                var listItems = null;
                                var content = '';

                                if (displayColor == 1) {
                                    listItems = $container.find(".sortableList_" + sortedElementId + " li").detach();
                                    $.each(listItems, function (key, underItem) {


                                        if (($(underItem).attr("data-sort") == $(underItem).attr("data-order"))) {
                                            var assignedClass = "correctSort";
                                            var icon = "glyphicon-ok";
                                        } else {
                                            var assignedClass = "errorSort";
                                            var icon = "glyphicon-remove";
                                        }
                                        $(underItem).find(".glyphicon").remove();
                                        $(underItem).removeClass("correctSort").removeClass("errorSort");
                                        $(underItem).addClass(assignedClass).prepend("<span  class='glyphicon " + icon + "'></span>");
                                        $container.find(".sortableList_" + sortedElementId).append($(underItem));
                                    });
                                }

                                if (showCorrectAnswers == 1) {
                                    listItems = (listItems == null) ? $container.find(".sortableList_" + sortedElementId + " li").detach() : listItems;
                                    listItems.sort(function (a, b) {
                                        return parseInt($(a).attr("data-order")) - parseInt($(b).attr("data-order"));
                                    });
                                    $.each(listItems, function (key, underItem) {
                                        $underItem = $(underItem);
                                        if (displayColor != 1) {
                                            $(underItem).find(".glyphicon:not(.glyphicon-resize-vertical)").remove();
                                            $(underItem).removeClass("correctSort").removeClass("errorSort");
                                        }
                                        //$underItem.find(".glyphicon-resize-vertical").remove();
                                        $(container).find(".sortableList_" + sortedElementId).append($underItem);
                                    });
                                }
                                //});


                            }

                            break;

                        case "flipCard":

                            var flipCard = this.getPreviousAnimByType(16, animation["id"]);
                            var backSound = '';
                            if (flipCard) {
                                $.each(flipCard["compositeItems"], function (key, underItem) {
                                    if (underItem.compositeType == 2002) {
                                        if (underItem.sound != '') backSound = underItem.sound;
                                    }
                                });
                                $("#animateItemText" + flipCard.id).flip('toggle');
                            }

                            break;


                        case "interactive":

                            var dragDropOpen = this.getPreviousAnimByType(18, animation["id"]);
                            var isReverse = this.getParameterByName("reverseDragDrop", dragDropOpen.id) == 1 ? true : false;
                            if (dragDropOpen != null) {

                                var listDraggableZone = $("#animateItem" + dragDropOpen.id + " .draggableIntractive");
                                $.each(listDraggableZone, function (key, item) {


                                    // var containerInt = $(item).closest(".underInteractiveElt").attr("data-interaction");
                                    // var itemInt = $(item).attr("data-id");
                                    var containerInt = (!isReverse) ? $(item).closest(".underInteractiveElt").attr("data-interaction") : $(item).closest(".underInteractiveElt").attr("data-id");
                                    var itemInt = (!isReverse) ? $(item).attr("data-id") : $(item).attr("data-interaction");

                                    $(item).removeClass("errorDrop").removeClass("correctDrop");
                                    if (displayColor == 1) {
                                        if (containerInt == itemInt) $(item).addClass("correctDrop");
                                        else $(item).addClass("errorDrop");
                                    }

                                    if (showCorrectAnswers == 1) {
                                        var correctContainer = (!isReverse) ? $(item).closest("#animateItem" + dragDropOpen.id).find(".underInteractiveElt[data-interaction=" + itemInt + "]") : $(item).closest("#animateItem" + dragDropOpen.id).find(".underInteractiveElt[data-id=" + itemInt + "]");
                                        //correctContainer = $(item).closest("#animateItem" + dragDropOpen.id).find(".underInteractiveElt[data-interaction="+itemInt+"]");
                                        $item = $(item).detach();
                                        $item.addClass("correctDrop");
                                        correctContainer.append($item);
                                    }
                                    $(item).css('opacity', '1');

                                });


                            }

                            break;

                        case "showoption":
                            /* la logique ici pour afficher resultat est differentes avec le button integre dans la version 4*/
                            var listoptions = container.find(".checkOption");
                            $.each(listoptions, function (key, option) {
                                var $option = $(option);
                                //$option.attr("disabled",true);

                                if (displayColor == 1) {
                                    if ($option.is(":checked") && $option.attr("data-correct") == $option.attr("data-option") ||
                                        !$option.is(":checked") && $option.attr("data-correct") != $option.attr("data-option")
                                    ) {
                                        $option.closest("td").removeClass("incorrectshowopt").addClass("correctshowopt");
                                    } else {
                                        $option.closest("td").removeClass("correctshowopt").addClass("incorrectshowopt");
                                    }
                                }

                                if (displayRadioColor == 1) {
                                    $option.removeClass("correctrbshowopt").removeClass("incorrectrbshowopt");
                                    // if($option.is(":checked")){
                                    // 	if($option.attr("data-correct") ==  $option.attr("data-option") ){
                                    // 		$option.addClass("correctrbshowopt");
                                    // 	}
                                    // 	else{
                                    // 		$option.addClass("incorrectrbshowopt");
                                    // 	}
                                    // }
                                    if ($option.is(":checked") && $option.attr("data-correct") == $option.attr("data-option") ||
                                        !$option.is(":checked") && $option.attr("data-correct") != $option.attr("data-option")
                                    ) {
                                        $option.addClass("correctrbshowopt");
                                    } else {
                                        $option.addClass("incorrectrbshowopt");
                                    }
                                }

                                if (showCorrectAnswers == 1) {
                                    $option.removeClass("incorrectrbshowopt").removeClass("correctrbshowopt");
                                    if ($option.attr("data-correct") == $option.attr("data-option")) {
                                        $option.prop("checked", true);
                                        if (displayRadioColor == 1) $option.removeClass("incorrectrbshowopt").addClass("correctrbshowopt");
                                        if (displayColor == 1) $option.closest("td").removeClass("incorrectshowopt").addClass("correctshowopt");
                                    } else {
                                        $option.prop("checked", false);
                                        if (displayRadioColor == 1) $option.removeClass("correctrbshowopt").addClass("incorrectrbshowopt");
                                        if (displayColor == 1) $option.closest("td").removeClass("incorrectshowopt").removeClass("correctshowopt");
                                    }
                                }
                            });
                            break;

                    }

                    var slideShow = this._slide._dataCom._slideshow;
                    if (this._slide.Animation.getNext() != null) {
                        var nextAnim = this._slide.Animation.getNext();
                        if (nextAnim.compositeType == 14) {
                            this._slide._dataCom._slideshow.actionPlayStop(this._slide._dataCom._slideshow);
                        }
                    }


                }, this));
                break;

        }

        /* Show Last Answer if its the condition */
        this.showLastAnswers(animation, param);

        // add initial CSS data
        var elementText = container.find("#animateItemText" + animation["id"]);
        var initPadding = [elementText.css("padding-top"), elementText.css("padding-right"), elementText.css("padding-bottom"), elementText.css("padding-left")];
        var initMargin = [elementText.css("margin-top"), elementText.css("margin-right"), elementText.css("margin-bottom"), elementText.css("margin-left")];
        var lineHeight = container.find("#animateItemText" + animation["id"]).css("line-height");

        var initCss = {"padding": initPadding, "margin": initMargin, "lineHeight": lineHeight};
        container.find("#animateItemText" + animation["id"]).attr("data-style", JSON.stringify(initCss));
        if (this.escapeResize(animation)) return;
        this.resizeInnerElement(animation.id, param);
        this.affectDataStyle(animation.id, param);


    },

    // getUserResponses: function(animation){
    // 	var interactions =  this._slide._dataCom.readInteraction(animation["id"]);
    // 	var response_details = {"values": [], "forced": false, "retryNbre": 0};
    // 	if(interactions){
    // 		for(i = 0; i < interactions.values.length ; i++){
    // 			if(interactions.values[i].id == "f") response_details.forced    = interactions.values[i].value == 1 ? 1 : 0;
    // 			else if(interactions.values[i].id == "r") response_details.retryNbre = $.isNumeric(interactions.values[i].value) ? parseInt(interactions.values[i].value) : 0 ;
    // 			else response_details.values.push(interactions.values[i]);
    // 		}
    // 	}
    // 	return response_details;
    // },

    // saveUserResponses: function(animation, interactions){
    // 	this._slide._dataCom.saveInteraction(animation, interactions);
    // },

    // getAnimationScore: function(animation){
    //
    // 	/*
    // 	*** get Score dependaing on the type of Elements
    // 	*** score is always between 0 and 100%
    // 	*/
    // 	var score = 0;
    // 	var strict = this.getParameterByName("isStric", animation.id) == 1;
    //
    // 	var responses = this.getUserResponses(animation);
    // 	if(!responses) return score;
    // 	if(responses.forced) return this._slide._dataCom.getMasteryScore();
    // 	if(!responses.values || responses.values.length == 0) return  score;
    //
    // 	switch(animation["compositeType"]){
    //
    // 		case "18":
    // 		default  :
    //
    // 			for(var i = 0; i < responses.values.length; i++){
    // 				score += (responses.values[i].id == responses.values[i].value) ? 1 : 0;
    // 			}
    //
    // 			break;
    // 	}
    //
    // 	return strict ? (score == responses.values.length ? 100 : 0 ) : ( (score/responses.values.length) * 100 );
    //
    //
    // },

    resizeInnerElement: function (id, param) {

        var currentElement = param.container.find("#animateItemText" + id);
        var x = currentElement.html();
        var litsElements = param.container.find("#animateItemText" + id + "  *");
        var ref = this;
        $.each(litsElements, function (key, innerObj) {
            var $innerObj = $(innerObj);
            var newCss = {};
            if ($innerObj.attr("data-style")) {
                var initCss = $innerObj.attr("data-style");
                initCss = JSON.parse(initCss);
                if (initCss && initCss.fontSize) {
                    $innerObj.css({"font-size": parseFloat(initCss.fontSize) * param.ratio + "px"});
                }
            } else {
                if ($innerObj.css("font-size") != $innerObj.parent().css("font-size")) {
                    $innerObj.css({"font-size": parseFloat($innerObj.css("font-size")) * param.ratio + "px"});
                }
            }

            if (initCss && initCss.padding) {
                //$innerObj.css("padding",initCss.padding);
                newCss["padding-top"] = parseInt(initCss.padding[0]) * param.ratio + 'px';
                newCss["padding-right"] = parseInt(initCss.padding[1]) * param.ratio + 'px';
                newCss["padding-bottom"] = parseInt(initCss.padding[2]) * param.ratio + 'px';
                newCss["padding-left"] = parseInt(initCss.padding[3]) * param.ratio + 'px';
            }
            if (initCss && initCss.margin) {
                newCss["margin-top"] = parseInt(initCss.margin[0]) * param.ratio + 'px';
                newCss["margin-right"] = parseInt(initCss.margin[1]) * param.ratio + 'px';
                newCss["margin-bottom"] = parseInt(initCss.margin[2]) * param.ratio + 'px';
                newCss["margin-left"] = parseInt(initCss.margin[3]) * param.ratio + 'px';
            }
            if (newCss) $innerObj.css(newCss);
        });

    },

    recuperateAnimations: function (lastAnimToStop, param) {

        var stop = false;
        var passedAnim = [];
        this._currentAnim = -1;
        for (var i = 0; i < this._animation.length && !stop; i++) {
            var html = "";
            var style = "";
            var picPos = param.refPic.position();
            this._currentAnim++;
            var curAnim = this._animation[i];
            stop = (lastAnimToStop && curAnim.id == lastAnimToStop.id);
            passedAnim.push(curAnim.id);

            if (curAnim["compositeType"] == 2 || curAnim["compositeType"] == 24) {
                var textAnim = this.createUnderElements(curAnim, param);
            } else {

                var textAnim = '<div id="animateItemText' + curAnim["id"] + '" ';

                var iStyle = (curAnim["style"]) ? curAnim["style"] : "";
                iStyle += "animation-duration: 0s !important;";
                if (curAnim.height) {
                    if (!iStyle) iStyle = "";
                    if (iStyle.length > 0 && iStyle[iStyle.length - 1] != ";") iStyle += ';';
                    iStyle += "height:100%";
                }


                if (iStyle.length > 0) textAnim += ' style="' + iStyle + '"';
                if (curAnim["class"]) textAnim += ' class="' + curAnim["class"] + '"';
                // force not playing animations
                textAnim += '>';

                //textAnim += curAnim.text;

                if ((curAnim["compositeItems"]) || (curAnim["options"] && curAnim["options"].length > 0)) {
                    textAnim += this.createUnderElements(curAnim, param);
                    textAnim += '</div>';
                } else {
                    textAnim += curAnim.text + '</div>';
                }

                //textAnim += '</div>';


            }

            style = 'width: ' + (curAnim.width * param.ratio) + 'px; top: ' + (picPos.top + (curAnim.y * param.ratio)) + 'px; left: ' + (picPos.left + (curAnim.x * param.ratio)) + 'px;';
            if (curAnim.height) style += 'height: ' + (curAnim.height * param.ratio) + 'px;';
            if (curAnim.depth) style += 'z-index: ' + (param.isQuiz ? "100" : curAnim.depth) + ';';

            html = '<div id="animateItem' + curAnim["id"] + '" style="' + style + ' font-size: ' + (param.ratio * 100) + '%;" class="epanim ssanimateslide' + this._slide.Index + ' ssanimate' + this._slide.Index + '_' + this._currentAnim + '">' + textAnim + '</div>';

            param.container.append(html);

            //reverse font between animateItemText and animateItem
            var txtFont = param.container.find("#animateItemText" + curAnim["id"]).css("font-size");
            var contFont = (param.ratio * 100) + "%";
            param.container.find("#animateItemText" + curAnim["id"]).css("font-size", contFont);
            param.container.find("#animateItem" + curAnim["id"]).css("font-size", txtFont);


            this.affectEvents(curAnim, param);
            this.recuperateAnimStates(curAnim, param);

        }
        // delete the animations has AnimationOutBefore
        for (var i = 0; i < passedAnim.length; i++) {
            var curAnim = this._animation[i];
            if ($.isNumeric(curAnim.animOutBefore) && curAnim.animOutBefore != -1 && $.inArray(curAnim.animOutBefore, passedAnim) > -1) {
                param.container.find("#animateItem" + curAnim.id).remove();
            } else if (curAnim["compositeItems"] && curAnim["compositeItems"].length > 0) {
                $.each(curAnim["compositeItems"], $.proxy(function (key, underAnim) {
                    if ($.isNumeric(underAnim.animOutBefore) && underAnim.animOutBefore != -1 && $.inArray(underAnim.animOutBefore, passedAnim) > -1) {
                        param.container.find('#animateItemText' + underAnim.id).remove();
                    }
                }, this));
            }
        }

        this.resize(param);
        if ($(".epubSlider").length > 0) $(".epubSlider").bootstrapSlider('refresh');
        param.container.find('.mypopovers').popover({container: 'body'});

    },


    recuperateAnimStates: function (animation, param) {

        switch (animation["compositeType"]) {

            case "12":
                $.each(animation["compositeItems"], function (key, underItem) {
                    if ($.isNumeric(underItem.interaction) && underItem.state && underItem.state.opened) {
                        param.container.find('#animateItemText' + underItem["id"]).css("display", "block");
                    }
                });
                break;

            case "3":
                $.each(animation["compositeItems"], function (key, underItem) {
                    if (underItem.state && underItem.state.opened) {
                        param.container.find('#collapse' + underItem.id).addClass("in");
                    }
                });
                break;

            case "16":
                if (animation.state && animation.state.isFliped) {
                    param.container.find("#animateItemText" + animation.id).flip('toggle');
                }
                break;
        }
    },


    affectDataStyle: function (id, param) {
        var litsElements = param.container.find("#animateItemText" + id + "  *");
        var parentCss = param.container.find("#animateItemText" + id);
        $.each(litsElements, function (key, innerObj) {
            var $innerObj = $(innerObj);
            if (!$innerObj.attr("data-style")) {
                var ratio = (param.ration != 0) ? param.ratio : 1;
                var objCss = $innerObj.is("") ? parentCss : $innerObj;
                var padding = [$innerObj.css("padding-top"), $innerObj.css("padding-right"), $innerObj.css("padding-bottom"), $innerObj.css("padding-left")];
                var margin = [$innerObj.css("margin-top"), $innerObj.css("margin-right"), $innerObj.css("margin-bottom"), $innerObj.css("margin-left")]
                var initCss = {
                    "fontSize": parseFloat($innerObj.css("font-size")) * (1 / ratio) + "px",
                    "padding": padding,
                    "margin": margin
                };
                $innerObj.attr("data-style", JSON.stringify(initCss));
            }

        });
    },

    stopAnimationDuring: function (anim, param) {

        if (anim && anim.animDur) {
            param.container.find("#animateItem" + anim["id"]).removeClass(anim.animDur);
        }

        if (anim["compositeItems"]) {
            for (var j = 0; j < anim["compositeItems"].length; j++) {
                var compoanim = anim["compositeItems"][j];
                if (compoanim && compoanim.animDur) {
                    param.container.find("#animateItemText" + compoanim["id"]).removeClass(anim.animDur);
                }
            }
        }
    },


    endAnimationCallBack: function (animation, param) {

        // we finish the 'animation during' not infinit of previous element only if the current has voice
        if (animation.sound && $.trim(animation.sound) != "") {
            for (var i = 0; i < this._currentAnim; i++) {
                var anim = this._animation[i];
                if (anim && anim.animDur && anim.animInfinite && anim.animInfinite == "0") {
                    param.container.find("#animateItem" + anim["id"]).removeClass(anim.animDur);
                }
                // search for underElements
                if (anim["compositeItems"]) {
                    for (var j = 0; j < anim["compositeItems"].length; j++) {
                        var compoanim = anim["compositeItems"][j];
                        if (compoanim && compoanim.animDur && compoanim.animInfinite && compoanim.animInfinite == "0") {
                            param.container.find("#animateItemText" + compoanim["id"]).removeClass(anim.animDur);
                        }
                    }
                }
            }
        }
        if (animation.animDur && $.trim(animation.animDur) != "") {
            param.container.find("#animateItem" + animation["id"]).addClass(animation.animDur);
        }
        // search for underElements
        if (animation["compositeItems"]) {
            for (var j = 0; j < animation["compositeItems"].length; j++) {
                var compoanim = animation["compositeItems"][j];
                if (compoanim.animDur && $.trim(compoanim.animDur) != "") {
                    param.container.find("#animateItemText" + compoanim["id"]).addClass(compoanim.animDur);
                }
            }
        }

        if (animation.objectComponent) {
            this.startComponent(animation);
        }

    },


    startComponent: function (animation) {

        if (!animation.objectComponent || !animation.objectComponent.ready) {
            if (animation.timer) clearInterval(animation.timer);
            animation.timer = setInterval($.proxy(function () {
                this.startComponent(animation);
            }, this), 100);
            return;
        }
        if (animation.timer) {
            clearInterval(animation.timer);
            delete animation.timer;

        }


        if (animation["splitedParameters"] && animation["splitedParameters"]["Objectives"]) {

            /* read the objectives */
            var interactionsToShow = animation["splitedParameters"]["Objectives"].split(",");
            var data = {};
            var type = (animation["splitedParameters"]["type"]) ? animation["splitedParameters"]["type"] : "20"; // type par defaut (20 Quiz Element)
            switch (type) {
                case "20":
                    /* recuperate all elements by type */
                    if (interactionsToShow.length == 0) return;
                    for (var i = 0; i < interactionsToShow.length; i++) {
                        data[interactionsToShow[i]] = 0;
                    }

                    var interactionsArray = [];
                    var interactions = this._slide._dataCom.readInteractionsByType(type);
                    if (interactions) {
                        for (var i = 0; i < interactions.length; i++) {
                            if (!interactions[i].values) continue;
                            for (var j = 0; j < interactions[i].values.length; j++) {
                                interactionsArray.push(interactions[i].values[j].id);
                            }
                        }
                    }

                    var allslides = Array.isArray(this._reader._detachedSlides) ? this._reader._slides.concat(this._reader._detachedSlides) : this._reader._slides;
                    for (var i = 0; i < allslides.length; i++) {
                        var listAnimations = allslides[i].getAnimations(type);
                        for (var j = 0; j < listAnimations.length; j++) {
                            var options = {};
                            for (var k = 0; k < listAnimations[j]["options"].length; k++) {
                                options[listAnimations[j]["options"][k].id] = listAnimations[j]["options"][k]["text"];
                            }
                            for (var l = 0; l < listAnimations[j]["compositeItems"].length; l++) {
                                if (options.hasOwnProperty(listAnimations[j]["compositeItems"][l].option) &&
                                    $.inArray(listAnimations[j]["compositeItems"][l].id, interactionsArray) != -1 &&
                                    data.hasOwnProperty(options[listAnimations[j]["compositeItems"][l].option])) {
                                    data[options[listAnimations[j]["compositeItems"][l].option]]++;
                                }
                            }

                        }
                    }
                    break;

            }


            animation.objectComponent.setData({
                "chartType": animation["splitedParameters"]["ChartType"] ? animation["splitedParameters"]["ChartType"] : "Spider",
                "chartData": data
            });
        }


        animation.objectComponent.setContainer($("#animateItemText" + animation.id));
        $("#animateItemText" + animation.id).css("background-image", "");
        animation.objectComponent.create();
        setTimeout(function () {
            $("#animateItemText" + animation.id).trigger("epublisher-resize");
        }, 50);


    },

    removeAnimationsOutBefore: function (param, curAnim) {

        var currentThis = this;

        $.each(this._animation, function (key, anim) {

            if (anim.animOut != "-1" && anim.animOut != "" && anim.animOutBefore != "" && anim.animOutBefore != "-1") {

                if (anim.animOutBefore != "" && curAnim.itemRef == anim.animOutBefore) {
                    if (anim.animOut != "-1" && anim.animOut != "" && anim.animOut != "simple") {
                        if (anim.animDur) param.container.find('.ssanimate' + currentThis._slide.Index + '_' + key).removeClass(anim.animDur);
                        param.container.find('.ssanimate' + currentThis._slide.Index + '_' + key).css({"animation-iteration-count": 1}); //to avoid infinit animation-iteration-count and detect the animation end callback
                        param.container.find('.ssanimate' + currentThis._slide.Index + '_' + key).animateCSS(anim.animOut, {
                            duration: parseInt(anim.duration), callback: function () {
                                param.container.find('.ssanimate' + currentThis._slide.Index + '_' + key).css({
                                    "opacity": 0,
                                    "visibility": "hidden"
                                });
                                param.container.find('.ssanimate' + currentThis._slide.Index + '_' + key).remove();
                            }
                        });
                    } else {
                        param.container.find('.ssanimate' + currentThis._slide.Index + '_' + key).css({
                            "opacity": 0,
                            "visibility": "hidden"
                        });
                        param.container.find('.ssanimate' + currentThis._slide.Index + '_' + key).remove();
                    }

                }

            } else if (anim["compositeItems"] && anim["compositeItems"].length > 0) {

                $.each(anim["compositeItems"], $.proxy(function (key, underAnim) {
                    if (underAnim.animOutBefore == curAnim.itemRef) {
                        if (underAnim.animOut != "" && underAnim.animOut != "-1" && underAnim.animOut != "simple") {
                            if (underAnim.animDur) param.container.find('#animateItemText' + underAnim.id).removeClass(anim.animDur);
                            param.container.find('#animateItemText' + underAnim.id).css({"animation-iteration-count": 1});
                            param.container.find('#animateItemText' + underAnim.id).animateCSS(underAnim.animOut, {
                                duration: parseInt(curAnim.duration),
                                callback: function () {
                                    param.container.find('#animateItemText' + underAnim.id).css({
                                        "opacity": 0,
                                        "visibility": "hidden"
                                    });
                                    param.container.find('#animateItemText' + underAnim.id).remove();
                                }
                            });
                        } else {
                            param.container.find('#animateItemText' + underAnim.id).css({
                                "opacity": 0,
                                "visibility": "hidden"
                            });
                            param.container.find('#animateItemText' + underAnim.id).remove();
                        }
                    }
                }, this));

            }
        });

    },

    start: function (param) {

        this._currentAnim++;

        if (this._currentAnim < this._animation.length) {

            var curAnim = this._animation[this._currentAnim];
            this.deleteState(curAnim);

            var html = "";
            var style = "";
            var picPos = param.refPic.position();

            if (curAnim["compositeType"] == 2 || curAnim["compositeType"] == 16 || curAnim["compositeType"] == 24) {
                var textAnim = this.createUnderElements(curAnim, param);
            } else {

                var textAnim = '<div id="animateItemText' + curAnim["id"] + '" ';

                var iStyle = (curAnim["style"]) ? curAnim["style"] : "";
                if (curAnim.height) {
                    if (!iStyle) iStyle = "";
                    if (iStyle.length > 0 && iStyle[iStyle.length - 1] != ";") iStyle += ';';
                    iStyle += "height:100%";
                }


                if (iStyle.length > 0) textAnim += ' style="' + iStyle + '"';
                if (curAnim["class"]) textAnim += ' class="' + curAnim["class"] + '"';

                textAnim += '>';

                //textAnim += curAnim.text;

                if ((curAnim["compositeItems"]) || (curAnim["options"] && curAnim["options"].length > 0)) {
                    //textAnim += curAnim.text;
                    textAnim += this.createUnderElements(curAnim, param);
                    textAnim += '</div>';
                } else if (curAnim["componentItem"]) {
                    textAnim += '<div class="waitDivElement"></div>';
                    textAnim += '</div>';
                } else {
                    textAnim += curAnim.text + '</div>';
                }

                textAnim += '</div>';


            }


            if (curAnim.effect == 0) {

                style = 'width: ' + (curAnim.width * param.ratio) + 'px; top: ' + (picPos.top + (curAnim.y * param.ratio)) + 'px; left: ' + (picPos.left + (curAnim.x * param.ratio)) + 'px;';

                if (curAnim.height) style += 'height: ' + (curAnim.height * param.ratio) + 'px;';
                if (curAnim.depth) style += 'z-index: ' + curAnim.depth + ';';

                html = '<div id="animateItem' + curAnim["id"] + '" style="' + style + ' font-size: ' + (param.ratio * 100) + '%;" class="epanim ssanimateslide' + this._slide.Index + ' ssanimate' + this._slide.Index + '_' + this._currentAnim + '">' + textAnim + '</div>';

                param.container.append(html);


                //reverse font between animateItemText and animateItem
                var txtFont = param.container.find("#animateItemText" + curAnim["id"]).css("font-size");
                var contFont = (param.ratio * 100) + "%";

                this.removeAnimationsOutBefore(param, curAnim);

                param.container.find("#animateItemText" + curAnim["id"]).css("font-size", contFont);
                param.container.find("#animateItem" + curAnim["id"]).css("font-size", txtFont);
                // animation group must be managed differently
                if (curAnim["compositeType"] == 25) {
                    var $item = param.container.find('.ssanimate' + this._slide.Index + '_' + this._currentAnim);
                    $item.css({"opacity": 1, "visibility": "hidden"});
                    curAnim.animGroup = new Slideshow_Group(); //  instantiation  in demande
                    curAnim.animGroup.play({"slideshowAnim": this, "anim": curAnim, "item": $item, "param": param});
                    return true;
                }
                param.callback.call(this, this, param);
                this.endAnimationCallBack(curAnim, param);

            } else {

                style = 'width: ' + (curAnim.width * param.ratio) + 'px; opacity: 0;';

                if (curAnim.height) style += 'height: ' + (curAnim.height * param.ratio) + 'px;';
                if (curAnim.depth) style += 'z-index: ' + curAnim.depth + ';';

                // be sure if the navigator support a Css Animations otherwise use the default one
                curAnim.dir = ((typeof window.Modernizr !== "undefined" && window.Modernizr.cssanimations == true)) ? curAnim.dir : "right";
                if (curAnim.dir == "right" || curAnim.dir == "left" || curAnim.dir == "top" || curAnim.dir == "bottom" || curAnim.dir == "fade") {
                    switch (curAnim.dir) {

                        case 'right':
                            style += 'top: ' + (picPos.top + (curAnim.y * param.ratio)) + 'px; left: ' + (param.container.width()) + 'px;';
                            var paramAnimate = {'left': (picPos.left + (curAnim.x * param.ratio)), 'opacity': 1};
                            simpleAnim = true;
                            break;

                        default:
                            style += 'top: ' + (picPos.top + (curAnim.y * param.ratio)) + 'px; left: ' + (-curAnim.width - 10) + 'px;';
                            var paramAnimate = {'left': (picPos.left + (curAnim.x * param.ratio)), 'opacity': 1};
                            simpleAnim = true;
                            break;
                    }

                    html = '<div id="animateItem' + curAnim["id"] + '" style="' + style + ' font-size: ' + (param.ratio * 100) + '%;" class="epanim ssanimateslide' + this._slide.Index + ' ssanimate' + this._slide.Index + '_' + this._currentAnim + '">' + textAnim + '</div>';
                    param.container.append(html);

                    //reverse font between animateItemText and animateItem
                    var txtFont = param.container.find("#animateItemText" + curAnim["id"]).css("font-size");
                    var contFont = (param.ratio * 100) + "%";
                    param.container.find("#animateItemText" + curAnim["id"]).css("font-size", contFont);
                    param.container.find("#animateItem" + curAnim["id"]).css("font-size", txtFont);
                    this.removeAnimationsOutBefore(param, curAnim);

                    param.container.find('.ssanimate' + this._slide.Index + '_' + this._currentAnim).animate(paramAnimate, curAnim.duration, $.proxy(function (fct, param) {
                        this.endAnimationCallBack(curAnim, param);
                        fct.call(this, this, param);
                    }, this, param.callback, param));


                } else {
                    style += 'top: ' + (picPos.top + (curAnim.y * param.ratio)) + 'px; left: ' + (-curAnim.width - 10) + 'px;';
                    html = '<div id="animateItem' + curAnim["id"] + '" style="' + style + ' font-size: ' + (param.ratio * 100) + '%;" class="epanim ssanimateslide' + this._slide.Index + ' ssanimate' + this._slide.Index + '_' + this._currentAnim + '">' + textAnim + '</div>';
                    param.container.append(html);

                    //reverse font between animateItemText and animateItem
                    var txtFont = param.container.find("#animateItemText" + curAnim["id"]).css("font-size");
                    var contFont = (param.ratio * 100) + "%";

                    param.container.find("#animateItemText" + curAnim["id"]).css("font-size", contFont);
                    param.container.find("#animateItem" + curAnim["id"]).css("font-size", txtFont);

                    // Animation Out synchronisation with before attribut
                    this.removeAnimationsOutBefore(param, curAnim);

                    $item = param.container.find('.ssanimate' + this._slide.Index + '_' + this._currentAnim);
                    $item.css({
                        "left": (picPos.left + (curAnim.x * param.ratio)),
                        "opacity": 1,
                        "visibility": "hidden"
                    });


                    // animation group must be managed differently
                    if (curAnim["compositeType"] == 25) {
                        curAnim.animGroup = new Slideshow_Group(); //  instantiation  in demande
                        curAnim.animGroup.play({"slideshowAnim": this, "anim": curAnim, "item": $item, "param": param});
                        return true;
                    }

                    param.container.find('.ssanimate' + this._slide.Index + '_' + this._currentAnim).animateCSS(curAnim.dir, {
                        duration: parseInt(curAnim.duration),
                        animationClass: "",
                        callback: $.proxy(function (fct, param) {
                            if (curAnim.animOut.trim() != "") {
                                this._lastAnimOutObj = $item;
                                this._lastAnimOut = curAnim.animOut;
                            } else {
                                this._lastAnimOutObj = null;
                                this._lastAnimOut = null;
                            }
                            this.endAnimationCallBack(curAnim, param);
                            fct.call(this, this, param);
                        }, this, param.callback, param)
                    });


                }

            }


            this.affectEvents(curAnim, param);
            this.resize(param);

            if ($(".epubSlider").length > 0) $(".epubSlider").bootstrapSlider('refresh');
            param.container.find('.mypopovers').popover({container: 'body'});

            return true;
        }
        return false;

    },

    stop: function () {
        this._currentAnim = this._animation.length;
    }

});

/**********************
 * Object SlideShow_Note
 **********************/
var SlideShow_Note = $.inherit({

    _slide: null,

    X: 0,
    Y: 0,
    Text: "",
    hAlign: "right",
    vAlign: "bottom",
    Type: "help",
    downloadLink: null,


    __constructor: function ($xml, slide) {


        this._slide = slide;
        var refNote = this;
        $xml.children().each(function () {

            var $noteItem = $(this);
            switch ($noteItem.actTagName()) {
                case "x":
                    refNote.X = $noteItem.text();
                    break;
                case "y":
                    refNote.Y = $noteItem.text();
                    break;
                case "text":
                    refNote.Text = $noteItem.text();
                    if (refNote.Text != "") refNote.Text = refNote.Text.replace(/\r\n|\r|\n/g, '<br/>');
                    break;
                case "halign":
                    refNote.hAlign = $noteItem.text();
                    break;
                case "valign":
                    refNote.vAlign = $noteItem.text();
                    break;
                case "downloadlink":
                    refNote.downloadLink = $noteItem.text();
                    refNote.downloadLink = refNote.downloadLink.replace(/{module.path}/g, refNote._slide._reader._picPath);
                    break;
                case "buttontype":
                    refNote.Type = $noteItem.text();
                    break;
            }

        });

    }

});

/**********************
 * Object SlideShow_Quizz
 **********************/
var SlideShow_Quizz = $.inherit({

    _labels: null,
    _Questions: null,
    _Slide: null,
    _Options: null,

    Ref: null,
    DisplayResultScreen: true,
    DisplayResponse: true,
    DisplayResponseColor: false,
    RandomChoices: true,
    FormatResult: null,

    Sound: null,

    TitlePosX: null,
    TitlePosY: null,
    TitleWidth: null,

    scoreCalculation: false,
    RetryQuizz: false,
    quizRetry: false,
    RetryMaxQuizz: null,
    RetryNbre: 0,


    __constructor: function ($xml, slide) {

        this._Slide = slide;
        this._labels = [];
        this._Questions = [];
        this._QuestionsRef = [];

        var refQuizz = this;
        $xml.find("lib > *").each(function () {

            var $quizzLabel = $(this);
            refQuizz._labels[$quizzLabel.actTagName()] = $quizzLabel.text();

        });

        this.Ref = $xml.find("ref").text();

        var src = $.trim($xml.children("snd").text());
        if (src != "") this.Sound = slide._reader._audioPath + src;

        this.TitlePosX = $xml.find("parm > introPosX").text();
        if ($.trim(this.TitlePosX) == "") this.TitlePosX = null;

        this.TitlePosY = $xml.find("parm > introPosY").text();
        if ($.trim(this.TitlePosY) == "") this.TitlePosY = null;

        this.TitleWidth = $xml.find("parm > introWidth").text();
        if ($.trim(this.TitleWidth) == "") this.TitleWidth = null;

        this.LinkedQuizz = $xml.find("parm > linkedQ").text();

        this.QuizQuestion = $xml.find("parm > quizQuestion").text();
        if ($.trim(this.QuizQuestion) == "") this.QuizQuestion = null;

        this.NombreQuestionMax = $xml.find("parm > quizQuestionMax").text();
        if (!$.isNumeric($.trim(this.NombreQuestionMax))) this.NombreQuestionMax = null;

        this.DisplayResultScreen = $xml.find("parm > displayresult").text();
        this.DisplayResultScreen = ($.trim(this.DisplayResultScreen) == "no") ? false : true;

        this.RetryQuizz = $xml.find("parm > quizRetry").text();
        this.RetryQuizz = ($.trim(this.RetryQuizz) == "no") ? false : true;

        /* Not confirmed yet */
        //this.NotForcePScore = $xml.find("parm > notforceScore").text();
        //this.NotForcePScore = ($.trim(this.NotForcePScore) == "yes") ? true : false;

        this.RetryMaxQuizz = $xml.find("parm > quizRetryMax").text();
        this.RetryMaxQuizz = ($.isNumeric($.trim(this.RetryMaxQuizz))) ? parseInt($.trim(this.RetryMaxQuizz)) : null;

        this.DisplayResponse = $xml.find("parm > displayresponse").text();
        this.DisplayResponse = ($.trim(this.DisplayResponse) == "no") ? false : true;

        this.DisplayResponseColor = this.DisplayResponse;


        this.HideColorResponse = $xml.find("parm > hideColorResponse").text() == "yes" ? true : false;


        this.ShowSelectedAnsColor = $xml.find("parm > showselectedanscolor").text() == "yes" ? true : false;
        //this.ShowSelectedAnsColor = (this.ShowSelectedAnsColor == "1");


        this.ForceDisplayResponse = false;

        this.scoreCalculation = $xml.find("parm > scoreCalculation").text();
        this.scoreCalculation = (this.scoreCalculation == "1");

        this.NotForcePScore = $xml.find("parm > notforcepscore").text();
        this.NotForcePScore = ($.trim(this.NotForcePScore) == "1") ? true : false;

        this.RandomChoices = $xml.find("randomchoices").text();
        this.RandomChoices = (this.RandomChoices == "no") ? false : true;

        this.FormatResult = $xml.find("fmtresult").text();
        this.FormatResult = (this.FormatResult == "") ? "pct" : this.FormatResult;

        this.scoreCalculation = $xml.find("parm > scoreCalculation").text();
        this.scoreCalculation = (this.scoreCalculation == "1");

        this.quizRetry = $xml.find("parm > quizRetry").text();
        this.quizRetry = (this.quizRetry == "1");

        this._Options = {'displayQuestionAnswered': true};
        var opt = $xml.find("dispqanswered").text();
        this._Options.displayQuestionAnswered = (opt != "false")

        var ssQuizzRef = this;
        var indQuestion = 0;
        var nbreQuestion = 0;
        var nbreQuestionMax = this.NombreQuestionMax;


        $xml.find("questions > *").each(function () {

            //if(nbreQuestionMax !== null && nbreQuestion == nbreQuestionMax) return ;
            nbreQuestion++;

            var $quizzQ = $(this);
            var question = {};

            var answers = $quizzQ.find("answer").text().split(";");

            question["quiz"] = refQuizz._Slide.Id;
            question["Index"] = refQuizz._Questions.length;
            question["Id"] = indQuestion++;
            question["Text"] = $quizzQ.find("question").text();
            question["isComment"] = $quizzQ.find("questionCom").text() == "1";
            question["questionCComment"] = $quizzQ.find("questionCComment").text();
            question["questionIComment"] = $quizzQ.find("questionIComment").text();
            question["questionPComment"] = $quizzQ.find("questionPComment").text();
            question["Image"] = $quizzQ.find("img").text();
            question["choices"] = [];
            question["cmiIndex"] = null;
            question["multichoice"] = (answers.length > 1);
            question["isComplex"] = refQuizz._Slide.QuizType == "classificationQ" ? true : false;
            question["type"] = refQuizz._Slide.QuizType;

            question["isCorrect"] = function (id) {
                if (id < 0 && id > this["choices"].length) return false;
                var lC = this["choices"].length;
                for (var indC = 0; indC < lC; indC++) {
                    if (this["choices"][indC].Id == id) return this["choices"][indC].correct;
                }
                return false;
            };

            question["getComment"] = function (id) {
                if (id < 0 && id > this["choices"].length) return "";
                var lC = this["choices"].length;
                for (var indC = 0; indC < lC; indC++) {
                    if (this["choices"][indC].Id == id && this["choices"][indC].Comment) return this["choices"][indC].Comment.replace(/{module.path}/g, ssQuizzRef._Slide._reader._picPath);
                }
                return "";
            }

            question["getAudio"] = function (id) {
                if (id < 0 && id > this["choices"].length) return "";
                var lC = this["choices"].length;
                for (var indC = 0; indC < lC; indC++) {
                    if (this["choices"][indC].Id == id && this["choices"][indC].Audio) return this["choices"][indC].Audio;
                }
                return "";
            }

            question["getCorrect"] = function () {
                var lC = this["choices"].length;
                var retCorrect = [];
                for (var indC = 0; indC < lC; indC++) {
                    if (this["choices"][indC].correct) retCorrect.push(this["choices"][indC]);
                }
                return retCorrect;
            };

            question["getCorrectId"] = function () {
                var lC = this["choices"].length;
                var retCorrect = [];
                for (var indC = 0; indC < lC; indC++) {
                    if (this["choices"][indC].correct) retCorrect.push(this["choices"][indC].Id);
                }
                return retCorrect;
            };

            question["check"] = function (ids) {

                if (!$.isArray(ids)) return false;

                var correctResp = this.getCorrect();
                if (ids.length != correctResp.length) return false;

                var resCheck = true;
                for (var indR = 0; indR < ids.length; indR++) {
                    var find = false;
                    for (var indG = 0; indG < correctResp.length; indG++) {
                        find = (correctResp[indG].Id == ids[indR]);
                        if (find) break; // good response find
                    }
                    resCheck = find;
                    if (!resCheck) break; // if not find stop
                }

                return resCheck;

            };

            question["getScore"] = function () {

                var userResponses = this.userResponses.getDecisions();
                var allChoices = [];
                var notChoosenItems = [];
                var choosenItems = [];
                var correctChoices = [];
                var quizPercent = 0;
                var goodDecision = 0;

                if (this.userResponses.isValidated == false) return 0;
                if (this.isForced && this.forcedScore) return this.forcedScore;
                if (!this.multichoice && this.check(this.userResponses.getDecisions())) return 100;
                if (!this.multichoice && !this.check(this.userResponses.getDecisions())) return 0;

                $(userResponses).each(function (key, item) {
                    var response = parseInt(userResponses[key]);
                    choosenItems.push(response);
                });

                /* All choices */
                $(this.choices).each(function (key, item) {
                    allChoices.push(question.choices[key].Id);
                });


                /* not choosen  choices */
                $(allChoices).each(function (key, item) {
                    if ($.inArray(item, choosenItems) < 0) notChoosenItems.push(item);
                });

                /* Correct choices */
                $(this.getCorrect()).each(function (key, item) {
                    correctChoices.push(item.Id);
                });

                $(choosenItems).each(function (key, item) {
                    if ($.inArray(item, correctChoices) >= 0) {
                        goodDecision++;
                    }
                });

                $(notChoosenItems).each(function (key, item) {
                    if ($.inArray(item, correctChoices) < 0) {
                        goodDecision++;
                    }
                });

                quizPercent = 100 * ((allChoices.length > 0) ? (goodDecision / allChoices.length) : 0);

                if (quizPercent < 0) quizPercent = 0;

                return quizPercent;
            };

            question["randomise"] = function () {
                var choices = this.choices;
                var count = this.choices.length;

                this.choices.sort(function () {
                    return 0.5 - Math.random();
                });
                //Manage keepposition
                var continuee = true;
                var cmpt = 0;
                while (continuee && cmpt < 100) {
                    continuee = false;
                    for (var indItem = 0; indItem < count; indItem++) {

                        var item = this.choices[indItem];
                        if ($.isNumeric(item._keepposition)) {
                            var destpos = parseInt(item._keepposition);
                            if (destpos < 0) destpos = 0;
                            if (destpos > (count - 1)) destpos = count - 1;
                            if (destpos != indItem) {
                                this.choices[indItem] = this.choices[destpos];
                                this.choices[destpos] = item;
                                continuee = true;
                            }
                        }
                    }
                    cmpt++;

                }

            };

            question["getGroups"] = function () {

                var gp = [];
                var lC = this["choices"].length;
                for (var indC = 0; indC < lC; indC++) {
                    var add = true;
                    for (var indGp = 0; indGp < gp.length; indGp++) {
                        if (gp[indGp] == this["choices"][indC].group) {
                            add = false;
                            break;
                        }
                    }
                    if (add) gp.push(this["choices"][indC].group);
                }
                return gp;

            };

            question["getChoice"] = function (id) {
                var lC = this["choices"].length;
                for (var indC = 0; indC < lC; indC++) {
                    if (this["choices"][indC].Id == id) return this["choices"][indC];
                }
            };

            question["getChoicesByGroup"] = function (idgp) {
                var gpC = [];
                var lC = this["choices"].length;
                for (var indC = 0; indC < lC; indC++) {
                    if (this["choices"][indC].group == idgp) gpC.push(this["choices"][indC]);
                }
                return gpC;
            };

            question["getMaxScore"] = function () {
                var maxS = 0;
                var lC = this["choices"].length;
                for (var indC = 0; indC < lC; indC++) {
                    if (this["choices"][indC].score > maxS) maxS = this["choices"][indC].score;
                }
                return maxS;
            };

            question["getMaxScoreByGroup"] = function (idgp) {
                var maxS = 0;
                var lC = this["choices"].length;
                for (var indC = 0; indC < lC; indC++) {
                    if (this["choices"][indC].group == idgp && this["choices"][indC].score)
                        maxS = this["choices"][indC].score > maxS;
                }
                return maxS;
            };

            question["forceCorrect"] = function (scoreToAffect) {

                question.isForced = true;
                question.forcedScore = scoreToAffect;
                //console.log("forced score => ", scoreToAffect, question);

            };


            question["userResponses"] = {

                _uResp: null,
                isValidated: false,

                hasResponse: function () {
                    return (this._uResp !== null && !this.isEmpty());
                },
                addResponse: function (id) {
                    if (this._uResp === null) this._uResp = {};
                    if (question.isComplex) {
                        var keys = id.split("?");
                        if (keys.length == 0) return;
                        this._uResp[keys.shift()] = keys.join("?");
                    } else this._uResp[id] = true;
                },
                isEmpty: function () {
                    if (this._uResp == null) return true;
                    for (var key in this._uResp) {
                        if (this._uResp.hasOwnProperty(key))
                            return false;
                    }
                    return true;
                },
                removeResponse: function (id) {
                    if (this._uResp === null) this._uResp = {};
                    delete this._uResp[id];
                },
                removeAllResponse: function () {
                    this.isValidated = false;
                    this._uResp = {};
                },
                responseExists: function (id) {
                    return (this._uResp !== null && (this._uResp[id] === true || (typeof this._uResp[id] == 'string' && this._uResp[id].trim() != "")));
                },
                getResponses: function () {

                    if (question.isComplex) return this._uResp;
                    else {
                        var tbResp = [];
                        for (var kResp in this._uResp) tbResp.push(kResp);
                        return tbResp;
                    }


                },
                getDecisions: function () {
                    var decisions = this.getResponses();
                    switch (question.type) {
                        case "classificationQ":
                            decisions = [];
                            for (var key in this._uResp) {
                                if (this._uResp.hasOwnProperty(key) && this._uResp[key].indexOf("*") > -1) decisions.push(key);
                            }
                            break;
                    }
                    return decisions;
                }
            };

            var indQ = 0;
            $quizzQ.find("items > i").each(function () {

                var $questionChoice = $(this);
                var choice = {};

                choice["Id"] = indQ++;
                choice["Text"] = $questionChoice.find("text").text().replace(/{module.path}/g, ssQuizzRef._Slide._reader._picPath)

                var tmpComment = $questionChoice.find("comment").text();
                if (tmpComment) choice["Comment"] = tmpComment;

                var tmpAudio = $questionChoice.find("answeraudio").text();
                if (tmpAudio) choice["Audio"] = ssQuizzRef._Slide._reader._audioPath + tmpAudio;

                choice["Image"] = $questionChoice.find("answerimage").text();
                choice["correct"] = false;
                choice["_keepposition"] = $questionChoice.attr("keepposition");
                choice["score"] = $questionChoice.attr("score");
                if (!$.isNumeric(choice["score"])) choice["score"] = 0;
                choice["score"] = parseInt(choice["score"]);

                choice["group"] = $questionChoice.attr("group");
                if (!$.isNumeric(choice["group"])) choice["group"] = null;

                for (var indC = 0; indC < answers.length; indC++) {
                    if (choice.Id == answers[indC]) {
                        choice["correct"] = true;
                        break;
                    }
                }

                question["choices"].push(choice);

            });

            question["background-picture"] = "";
            var bg_picture = $quizzQ.find("background-picture").text();
            if (bg_picture != "") question["background-picture"] = bg_picture;

            question["sound"] = "";
            var snd = $.trim($quizzQ.find("questionaudio").text());
            if (snd != "") question["sound"] = snd;

            question["options"] = {'offsety': $.trim($quizzQ.find("offsetY").text())};
            question.randomise();
            refQuizz._Questions.push(question);

        });
        if (nbreQuestionMax != null) {
            refQuizz._Questions.sort(function () {
                return 0.5 - Math.random()
            });
        }

        refQuizz._QuestionsRef = refQuizz._Questions;

        //console.log(refQuizz._Questions);
    },

    fillListQuestions: function (nbreQuestions, oldQuestions) {

        if (nbreQuestions > this._QuestionsRef.length) return;

        var validatedQuestionsObj = {
            "questions": [],
            "notin": function (q) {
                if (this.questions.length == 0) return true;
                for (var i = 0; i < this.questions.length; i++) {
                    if (this.questions[i].Id == q.Id) return false;
                }
                return true;
            }
        };
        for (var i = 0; i < this._Questions.length; i++) {
            if (this._Questions[i].userResponses.isValidated) validatedQuestionsObj.questions.push(this._Questions[i]);
        }

        this._Questions = [];
        if (oldQuestions) {
            for (var i = 0; i < validatedQuestionsObj.questions.length; i++) {
                this._Questions.push(validatedQuestionsObj.questions[i]);
            }
            ;
        }

        if (this._Questions.length < nbreQuestions) {
            for (var i = 0; i < this._QuestionsRef.length; i++) {
                if (validatedQuestionsObj.notin(this._QuestionsRef[i])) {
                    this._Questions.push(this._QuestionsRef[i]);
                }
                if (this._Questions.length == nbreQuestions) break;
            }
        }


    },

    countQuestion: function () {
        return this._Questions.length;
    },

    getQuestions: function () {
        return this._Questions;
    },

    getQuestionById: function (id) {

        var lQ = this._Questions.length;
        for (var indC = 0; indC < lQ; indC++) {
            if (this._Questions[indC].Id == id) return this._Questions[indC];
        }
        return null;

    },

    getQuestion: function (index) {
        if (index < 0 || index > this._Questions.length) return null;
        return this._Questions[index];
    },

    getLabel: function (name) {

        if (this._labels[name] !== undefined && this._labels[name] !== null) return this._labels[name];
        return "??" + name + "??";

    },


    getQuizzScore: function () {
        var dataCom = this._Slide._dataCom;
        return dataCom.getQuizzCalculationInformation([this._Slide.Id], true);
    },


    forceScore: function (score) {

        for (index = 0; index < this._Questions.length; index++) {
            this._Questions[index].forceCorrect(score);
        }

    },


    getDisplayQuestionAnswered: function () {
        return this._Options.displayQuestionAnswered;
    }

});

/**********************
 * Object SlideShow_Quizz
 **********************/
var SlideShow_QuizzResults = $.inherit({

    _slide: null,
    // _type: null,
    // _ref: null,
    _dataType: null,
    _data: null,
    _options: null,

    useHighCharts: false,

    __constructor: function ($xml, slide) {

        this._slide = slide;
        // this._type = $xml.find("graph").text();
        // this._ref = $xml.find("ref").text();

        this._dataType = $xml.find("data").attr("type").toLowerCase();

        var oRef = this;

        this._options = {};
        $xml.find("data > option").each(function () {
            var $this = $(this);
            oRef._options[$this.attr("id")] = $this.text();
        });

        this._data = [];
        switch (this._dataType) {

            case "scorecalculation":
                break;

            // case "sumserie":

            // var indSerie = 0;
            // $xml.find("data > serie").each(function() {

            // var $this = $(this);

            // var nSerie = {};
            // nSerie["Id"] = indSerie++;
            // nSerie["name"] = $this.attr("name");
            // nSerie["questions"] = [];

            // var qList = $this.attr("questions");
            // qList = (typeof qList != 'undefined') ? qList.split(",") : [];
            // for(var iList = 0; iList < qList.length; iList++)
            // {
            // if ($.isNumeric(qList[iList]))
            // {
            // nSerie["questions"].push(parseInt(qList[iList]) - 1);
            // }
            // else
            // {
            // var sList = qList[iList].split("-");
            // if (sList.length == 2 && $.isNumeric(sList[0]) && $.isNumeric(sList[1]))
            // {
            // for(var siList = parseInt(sList[0]); siList <= sList[1]; siList++) nSerie["questions"].push(siList - 1);
            // }
            // }
            // }

            // oRef._data.push(nSerie);

            // });
            // break;

            // case "linkserie":

            // var indSerie = 0;
            // $xml.find("data > serie").each(function() {

            // var $this = $(this);

            // var nSerie = {};
            // nSerie["Id"] = indSerie++;
            // nSerie["name"] = $this.attr("name");
            // nSerie["questions"] = [];

            // var qList = $this.attr("questions");
            // qList = (typeof qList != 'undefined') ? qList.split(",") : [];
            // for(var iList = 0; iList < qList.length; iList++)
            // {
            // var sList = qList[iList].split("#");
            // if (sList.length == 2 && $.isNumeric(sList[0]) && $.isNumeric(sList[1]))
            // {
            // nSerie["questions"].push( { "Id": sList[0], "Response": sList[1] } )
            // }
            // }

            // oRef._data.push(nSerie);

            // });

            // break;

            // case "summaryhtml":

            // this.useHighCharts = false;

            // break;

        }

    },

    getOption: function (name) {
        if (this._options[name] == undefined) return "";
        return this._options[name];
    },

    genereteCode: function (options) {

        // var refQuizz = this._slide._reader.getSlideQuizByRef(this._ref).Quizz;
        // var hc = {};
        // var colorIsDefined = false;

        // //Calculate data
        // var dataSeries = {};
        // switch(this._dataType)
        // {

        // case "linkserie":

        // for(var iData = 0; iData < this._data.length; iData++)
        // {

        // var totScore = 0;
        // if (refQuizz !== null)
        // {
        // for(var iQ = 0; iQ < this._data[iData].questions.length; iQ++)
        // {
        // var q = refQuizz.getQuestionById(parseInt(this._data[iData].questions[iQ].Id) - 1);
        // if (q !== null)
        // {
        // var qUR = q.userResponses.getResponses();
        // if (qUR.length > 0)
        // {
        // if (parseInt(qUR[0]) == (parseInt(this._data[iData].questions[iQ].Response) - 1)) totScore++;
        // }
        // }
        // }
        // }

        // dataSeries[this._data[iData].Id] = { sumScore: totScore };
        // }

        // break;

        // case "sumserie":

        // for(var iData = 0; iData < this._data.length; iData++)
        // {

        // var totScore = 0;
        // var maxScore = 0;
        // if (refQuizz !== null)
        // {
        // for(var iQ = 0; iQ < this._data[iData].questions.length; iQ++)
        // {
        // var q = refQuizz.getQuestionById(this._data[iData].questions[iQ]);
        // if (q !== null)
        // {
        // var qUR = q.userResponses.getResponses();
        // for (var iUR = 0; iUR < qUR.length; iUR++)
        // {
        // var qURC = q.getChoice(qUR[iUR]);
        // if (qURC !== null) totScore+=qURC.score;
        // }
        // maxScore += q.getMaxScore();
        // }
        // }
        // }

        // var pct = (maxScore > 0) ? totScore / maxScore : 0;
        // dataSeries[this._data[iData].Id] = { sumScore: totScore, maxScore: maxScore, pctScore: pct };
        // }

        // break;

        // case "goodwrong":

        // this._data = [];

        // var correctColor = this.getOption("correctcolor");
        // if (correctColor == "") correctColor = '#47E447';
        // var wrongColor = this.getOption("wrongcolor");
        // if (wrongColor == "") wrongColor = '#FF0000';

        // var listQ = refQuizz.getQuestions();
        // var lQ = listQ.length;
        // for(var indC = 0; indC < lQ; indC++) {
        // var cQ = listQ[indC];
        // var cColor = cQ.check(cQ.userResponses.getResponses()) ? correctColor: wrongColor;
        // this._data.push( { 'Id': cQ.Id, 'name': this.getOption("slidelabel").replace("%1", (cQ.Id + 1)), 'color': cColor } );
        // dataSeries[cQ.Id] = { sumScore: 1 };
        // }
        // colorIsDefined = true;
        // break;
        // }

        // //Draw
        // hc["credits"] = { enabled: false };
        // hc["title"] = { text: null };
        // hc["legend"] = { enabled: (this.getOption("disablelegend") != "true") ? true : false };

        // if (colorIsDefined) {

        // hc["colors"] = [];
        // for(var iData = 0; iData < this._data.length; iData++) {
        // var dtS = this._data[iData];
        // hc["colors"].push((dtS.color !== null) ? dtS.color : '#000000' );
        // }

        // }

        // if (this._type == "bar")
        // {

        // hc["chart"] = {	plotBackgroundColor: null, plotBorderWidth: null, plotShadow: false, type: 'column' };
        // hc["tooltip"] = {
        // headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        // pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td><td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
        // footerFormat: '</table>',
        // shared: false,
        // useHTML: true
        // };
        // hc["plotOptions"] = { };
        // hc["plotOptions"]["column"] = { pointPadding: 0.2, borderWidth: 0 };
        // hc["plotOptions"]["column"]["dataLabels"] = { enabled: true, formatter: function() { return '<b>'+ this.y +'</b>'; } };
        // hc["xAxis"] = { categories: [""] };
        // hc["yAxis"] = { min: 0, title: { text: null} };

        // hc["series"] = [];
        // for(var iData = 0; iData < this._data.length; iData++) {
        // var dtS = this._data[iData];
        // var valS = (typeof dataSeries[dtS.Id] == 'object') ? dataSeries[dtS.Id].sumScore : 0;
        // hc["series"].push({ name: dtS.name, data: [valS] });
        // }

        // }

        // if (this._type == "pie")
        // {

        // var fmtSerie = this.getOption("formatserielegend");
        // if (fmtSerie == "") fmtSerie = "<b>%serie</b>: %pct% (%y)";

        // var fmtTooltip = this.getOption("formattooltip");
        // if (fmtTooltip == "") fmtTooltip = "<b>{point.y}</b>";

        // hc["chart"] = {	plotBackgroundColor: null, plotBorderWidth: null, plotShadow: false };
        // hc["tooltip"] = { pointFormat: fmtTooltip };
        // hc["plotOptions"] = { };
        // hc["plotOptions"]["pie"] = { allowPointSelect: true, cursor: 'pointer', showInLegend: true }
        // hc["plotOptions"]["pie"]["dataLabels"] = { enabled: true, formatter: function() {
        // var lg = fmtSerie.replace("%serie", this.point.name);
        // lg = lg.replace("%pct", Math.round(this.percentage));
        // lg = lg.replace("%y", this.y);
        // return lg;
        // } };
        // hc["series"] = [{ type: 'pie', 'name': null, data: []}];
        // for(var iData = 0; iData < this._data.length; iData++) {
        // var dtS = this._data[iData];
        // var valS = (dataSeries[dtS.Id] != 'object') ? dataSeries[dtS.Id].sumScore : 0;
        // var valP = (dataSeries[dtS.Id] != 'object') ? dataSeries[dtS.Id].pctScore : 0;
        // var sValS = valS;
        // if (this.getOption("slidesize") != "") sValS = parseFloat(this.getOption("slidesize"));
        // var sName = dtS.name + this.getOption("addseriename");
        // sName = sName.replace("%val", valS);
        // sName = sName.replace("%pval", Math.round(valP*100));
        // hc["series"][0].data.push([ sName, sValS ]);
        // }

        // }

        // return hc;

    },

    isValidated: function (options) {

        switch (this._dataType) {
            case "scorecalculation":
                var validateScore = options.com.getMasteryScore();
                var score = options.com.getQuizzCalculationInformation();
                return (score.raw >= validateScore);
                break;
        }

        return false;

    },

    genereteHTML: function (options) {

        var html = "";

        switch (this._dataType) {

            case "scorecalculation":

                var score = options.com.getQuizzCalculationInformation();

                html = '<div class="quizResultScoreCalculation">';

                var txt = this.getOption("title");
                html += '<div class="textToResize" style="margin-left: 30px; padding-top: 30px;"><span style="font-size: 1.5em">' + txt + '</span></div>';

                var txt = this.getOption("lblquizresult").replace("%qc%", score.raw);
                html += '<div class="textToResize" style="margin-left: 60px; padding-top: 30px;" data-width="600"><span style="font-size: 1.2em">' + txt + '</span></div>';

                var validateScore = options.com.getMasteryScore();
                if (score.raw < validateScore) {
                    txt = this.getOption("lblquizresultfailed");
                    html += '<div class="textToResize" style="margin-left: 60px; padding-top: 30px;" data-width="600"><span style="font-size: 1.2em">' + txt + '</span></div>';
                    html += '<div class="textToResize" style="margin-left: 60px; padding-top: 30px;"><button id="btnRestartQuiz" class="btn btn-primary">' + this.getOption("lblquizrestart") + '</button><div>';
                } else {
                    txt = this.getOption("lblquizresultpassed");
                    html += '<div class="textToResize" style="margin-left: 60px; padding-top: 30px;" data-width="600"><span style="font-size: 1.2em">' + txt + '</span></div>';
                }

                html += '</div>';

                var $html = $(html);

                $html.find("#btnRestartQuiz").on("click", $.proxy(function (opt, e) {

                    var i = 10;

                    //Find first slide with Quizz
                    var slides = this._slide._reader.getSlides();
                    for (var islide = 0; islide < slides.length; islide++) {

                        var slide = slides[islide];
                        if (slide.hasQuizz()) {
                            if (slide.Quizz.scoreCalculation) {
                                opt.slideshow.changeSlide(slide.Index + 1);
                            }
                        }
                    }

                }, this, options));

                var css = {
                    'width': '100%',
                    'height': '100%',
                    'background-repeat': 'no-repeat',
                    'background-size': '100% 100%',
                    'background-position': 'center center'
                };

                var bgPicture = this.getOption("background");
                if (bgPicture) css['background-image'] = 'url("' + this._slide._reader._picPath + bgPicture + '")';

                $html.closest(".quizResultScoreCalculation").css(css);

                return $html;

                break;

        }

        // var refQuizz = this._slide._reader.getSlideQuizByRef(this._ref).Quizz;
        // var rHTML = "";

        // rHTML = "<table class=\"summary_res_table\">";

        // var group = this.getOption("group");
        // group = group.split(";");

        // var groupColor = this.getOption("groupcolor");
        // groupColor = groupColor.split(";");

        // rHTML += "<thead><tr>";
        // rHTML += "<th></th>";

        // for(var iGp = 0; iGp < group.length; iGp++)
        // {
        // rHTML += "<th><div class=\"summary_res_gphead\">" + group[iGp] + "</div></th>";
        // }

        // rHTML += "</tr></thead>";

        // rHTML += "<tbody>";

        // var listQ = refQuizz.getQuestions();
        // var lQ = listQ.length;
        // for(var indC = 0; indC < lQ; indC++) {

        // rHTML += "<tr class=\"summary_res_tr_question\">";

        // var cQ = listQ[indC];
        // var uResp = cQ.userResponses.getResponses();

        // rHTML += "<td><div class=\"summary_res_question\">" + cQ.Text + "</div></td>";

        // for(var iGp = 0; iGp < group.length; iGp++)
        // {
        // var gpChoices = cQ.getChoicesByGroup(iGp+1);

        // var isGood = false;
        // for(var iChoice = 0; iChoice < gpChoices.length; iChoice++)
        // {
        // for (var iResp = 0; iResp < uResp.length; iResp++)
        // {
        // if (gpChoices[iChoice].Id == uResp[iResp] && gpChoices[iChoice].correct)
        // {
        // isGood = true; break;
        // }
        // }
        // if (isGood) break;
        // }

        // rHTML += "<th style=\"background-color:" + (isGood ? groupColor[0] : groupColor[1] ) + "\">&nbsp</th>";
        // }

        // rHTML += "</tr>";

        // }

        // rHTML += "</tbody></table>";

        // return rHTML;

    }

});
