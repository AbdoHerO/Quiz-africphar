/** @license
 *
 * actlap : Actando Little Audio Player
 * ----------------------------------------------
 * http://www.actando.com
 *
 * Copyright (c) 2012, IT Team. All rights reserved.
 * 
 * 
 *
 * 
 */

(function($){
 
	var methodsALAP = {
		
		_internalALAPId: 0,
		_actAudioVideoDetection: {},
		_version: "1.04.2169",
		
		_playerHTML5Class: "plugin_actLAP_HTML5_player",
		_playerFLASHClass: "plugin_actLAP_FLASH_player",
		
		/************************
		* Get the default options
		************************/
		_getInternalId: function() {
			return "plugin_actLAP_" + this._internalALAPId++;
		},
		
		/************************
		* Get the default options
		************************/
		_getDefaultOptions: function() {
		
			return {
				'id': null,
				'file': null,
				'visible': true,
				'enabled': true, 
				'context': null,
				'loop': false,
				'play': false,
				'onStart': null,
				'onFinish': null,
				'onProgress': null,
				'onWaitUserAction': null,
				'onError': null,
				'onDebug': null,
				'pluginClass': 'plugin-actlap',
				'onClass': 'plugin-actlap-on',
				'offClass': 'plugin-actlap-off',
				'img_on_enable': 'images/sound-on-active@2x.png',
				'img_on_disable': 'images/sound-on-inactive@2x.png',
				'img_off_enable': 'images/sound-off-active@2x.png',
				'img_off_disable': 'images/sound-off-inactive@2x.png',
				'audiovideosettings': { 'isAudio': true, 
										'flash' : { 'folder': 'swf/', 'reversefolder' : '../', 'transformfile' : { "mp3": "flv" }, "version": null },
										'html5' : { 'folder': '', 'reversefolder' : '', 'transformfile' : { "flv" : "mp3" } }
									  },
				'tooltip' : {
					'suspend': { content: 'click to play sound', position: { my: "left+5 center", at: "right center" } },
					'play': { content: 'click to play sound', position: { my: "left+5 center", at: "right center" } },
					'stop': { content: 'click to stop sound', position: { my: "left+5 center", at: "right center" } }
				}
			};
			
		},

		/************************
		* apply picture depending the div status
		************************/		
		_setPicture: function($div) {
			
			var pluginData = $div.data("actlap");
			
			if (!pluginData.settings.visible)
			{
				$div.find("img").remove();
				return;
			}
			
			if (pluginData.status == "play")
				$div.children("img").attr("src", pluginData.settings.img_on_enable);
			else
				$div.children("img").attr("src", pluginData.settings.img_off_enable);
			
		},
		
		/************************
		* get the div element with playerId
		* return null if not found
		************************/				
		_getDiv: function(playerId) {
		
			var $player = $("#" + playerId);
			if ($player.length > 0)
				return $player.parent();
			else
				return null;
		
		},
		
		/************************
		* play a sound
		************************/				
		_play: function($div, options) {
			
			var pluginData = $div.data("actlap");
			var playerId = pluginData.playerId;
			var playerComponentId = playerId + "_component";
			var isIPAD = navigator.userAgent.match(/iPad/i) != null;
		    if (!isIPAD) isIPAD = (navigator.userAgent.match(/iPhone/i) != null) || (navigator.userAgent.match(/iPod/i) != null);
		
			if (pluginData.settings.file != null && pluginData.settings.file != "")
			{
				
				methodsALAP.onDebug(pluginData, "play : " + pluginData.settings.file);
				
				var fileURL = methodsALAP._actAudioVideoDetection[playerId].transformFileName(pluginData.settings.file);
				
				methodsALAP.onDebug(pluginData, "play(2) : " + fileURL);
				
				var checkURI = new actURI(fileURL);
				//get type mime with the file extension
				var fileTM = checkURI.getTypeMimeWithExtension();
				var playerToUse = methodsALAP._actAudioVideoDetection[playerId].usePlayer(fileTM);
				
				pluginData.fileToRead = fileURL;
				
				//which player is currently used
				$player = $("#" + playerId);
				var currentplayer = $player.hasClass(methodsALAP._playerHTML5Class) ? "html5" : ($player.hasClass(methodsALAP._playerFLASHClass) ? "flash" : "");

				methodsALAP.onDebug(pluginData, "use player : " + playerToUse + " / current player : " + currentplayer);
				
				//if it's not the good one
				if (playerToUse != currentplayer)
				{

					//Stop the current sound
					methodsALAP._destroy($div, options);
					
					//Create player
					currentplayer = playerToUse;
					pluginData.currentPlayer = currentplayer;
					pluginData.waitUserAction = false;
					pluginData.playerIsReady = false;
					
					if (currentplayer == "flash")
					{
						
						methodsALAP.onDebug(pluginData, "create player flash");
						
						$player.addClass(methodsALAP._playerFLASHClass);
						$player.append('<div id="' + playerComponentId + '" />');
						
						//Cr�ation de l'object FLASH
						var flashvars = {
							'playerId': playerId,
							refreshInterval: 200,
							onReadyEventName: "$.fn.actLAP",
							onStartEventName: "$.fn.actLAP",
							onFinishEventName: "$.fn.actLAP", 
							onProgressEventName: "$.fn.actLAP",
							onErrorEventName: "$.fn.actLAP"
						};
		
						var params = { menu: "false", wmode: "transparent", quality: "normal", allowScriptAccess: "always" };
						var attributes = { };
						
						var componentswfpath = pluginData.settings.audiovideosettings.flash.folder + "actlap.swf";
						var componentversion = pluginData.settings.audiovideosettings.flash.version;
						
						if (componentversion == "nocache") { componentswfpath += "?_" + (new Date()).getTime(); }
						else if (componentversion != null) { componentswfpath += "?version=" + componentversion; }
						
						swfobject.embedSWF(componentswfpath, playerComponentId, "100%", "100%", "9.0.0","expressInstall.swf", flashvars, params, attributes, function(info) {
																	
							// // $obj = $(info.ref);
							// // $obj.className = methodsALAP._playerFLASHClass;
							// // //if (info.success == true)	
							
						});							
						
					}
					else if (currentplayer == "html5")
					{
						
						methodsALAP.onDebug(pluginData, "create player html5");
						
						//This way is compatible with all html5 browser
						$player.addClass(methodsALAP._playerHTML5Class);
						$player.append('<audio id="' + playerComponentId + '"></audio>');
						
						//Get reference of audio component
						var audio = $("#" + playerComponentId).get(0);
						audio.suspendRaised = false;
			
						audio.addEventListener("ended", function(event) {
							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent();
							var plugData = $div.data("actlap");


							target.noEvent = true;

							if (plugData == null || !target.audioStarted) return;

							
							target.audioStarted = false;
							plugData.status = "stop";
								
							//Reset waitUserAction property							
							plugData.waitUserAction = false;
							
							methodsALAP._setPicture($div);
							
							methodsALAP.onFinish(plugData, true);								
							
						}, false);
						
						audio.addEventListener("timeupdate", function(event) {
							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent();
							var plugData = $div.data("actlap");						
							
							//Reset waitUserAction property														
							if (typeof plugData !== "undefined" && plugData !== null) plugData.waitUserAction = false;
							
							if (plugData == null || target.noEvent) return;
							
							if (!this.audioStarted) {
								this.audioStarted = true;
								methodsALAP.onStart(plugData);								
							}
							
							methodsALAP.onProgress(plugData, methodsALAP._getInfo($div));
							
						}, false);
						
						audio.addEventListener("progress", function(event) {

							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent();
							var plugData = $div.data("actlap");
							if (plugData == null || target.noEvent) return;
							
							//Reset waitUserAction property
							plugData.waitUserAction = false;
							
							methodsALAP.onProgress(plugData, methodsALAP._getInfo($div));
							
						}, false);
						
						audio.addEventListener("loadeddata", function(event) {

							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent();
							var plugData = $div.data("actlap");
							
							if (plugData == null || target.noEvent) return;
							
							//Reset waitUserAction property
							plugData.waitUserAction = false;
							
							methodsALAP.onDebug(plugData, "loadeddata event");
							
						}, false);						
						
						audio.addEventListener("suspend", function(event) { 
		                    //var isIPAD = navigator.userAgent.match(/iPad/i) != null;
		                    //if (!isIPAD) isIPAD = (navigator.userAgent.match(/iPhone/i) != null) || (navigator.userAgent.match(/iPod/i) != null);
							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent();
							var plugData = $div.data("actlap");
							
							if (plugData == null) return;

							methodsALAP.onDebug(plugData, "suspend event");
							
							//Try to check if safari/IPAD wait an user action to play
							plugData.waitUserAction = true;

							// setTimeout($.proxy(function(pData, tgt) {

							// 	//if (pData.waitUserAction && tgt.readyState == 0 && !tgt.suspendRaised) {

							// 	// if (pData.waitUserAction && !tgt.suspendRaised && isIPAD) {
							// 	if (!tgt.suspendRaised && isIPAD) {
							// 		tgt.suspendRaised = true;
							// 		//console.log("show Start image");
							// 		methodsALAP.onSuspend(pData);

							// 	}
							// }, this, plugData, target), 500);

						
						}, false);
						
						audio.addEventListener("error", function(event) {
							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent();
							var plugData = $div.data("actlap");
							
							if (plugData == null) return;

							var err = target.error;
							var codeErr = "";
														
							if (err.code == 4) codeErr = "NOT_FOUND";
							methodsALAP.onError(plugData, { errorId: codeErr, internalError: err.code, text: "an error occurred during playing file : `" + plugData.fileToRead + "`"} );
						
						}, false);
						
						pluginData.playerIsReady = true;
						audio.noEvent = false;
						audio.audioStarted = false;
						audio.src = pluginData.fileToRead;
						audio.load();
						var promise = audio.play();
						if (promise !== undefined) {
                          promise.then(function() {
                              // console.info("Autoplay started!");
                          }).catch(function(error) {
                               console.info("Info => Show a 'Play' button so that user can start playback! ", error);
                               if(error.name == "NotAllowedError") methodsALAP.onSuspend(pluginData);
                         });
                        }
						
						methodsALAP.onDebug(pluginData, "html5.play()");
						
					}
					else 
					{
						methodsALAP.onError(pluginData, { errorId: "PLAYER_NOT_FOUND", internalError: -1, text: "player not found to play file : `" + pluginData.fileToRead + "`"} );
					}
					
				}
				else
				{
					
					methodsALAP.onDebug(pluginData, "use current player");
					
					//Stop the current sound if there is an audio file in progress
					methodsALAP._stop($div, options);
				
					if (playerToUse == "flash")
					{
						methodsALAP.onDebug(pluginData, "flash.play()");					
						if (pluginData.playerIsReady)
						{
							var audio = $("#" + playerComponentId).get(0);
							var fileU = new actURI(pluginData.fileToRead);
							audio.playSound({ 'file' : fileU.transformURI(pluginData.settings.audiovideosettings.flash.reversefolder) });
						}
					}
					else if (playerToUse == "html5")
					{
						methodsALAP.onDebug(pluginData, "html5.play()");
						var audio = $("#" + playerComponentId).get(0);
						audio.noEvent = false;
						audio.audioStarted = false;					
						audio.src = pluginData.fileToRead;
						audio.load();
						promise = audio.play();
			            if (promise !== undefined) {
                          promise.then(function() {
                               //console.info("Autoplay started!");
                          }).catch(function(error) {
                               console.info("Info => Show a 'Play' button so that user can start playback! ");
                               if(error.name == "NotAllowedError") methodsALAP.onSuspend(pluginData);
                         });
                        }
					}
				
				}
								
			}
		
		},
		
		/************************
		* stop sound
		************************/		
		_stop: function($div, options) {
			
			var getInfo = methodsALAP._getInfo($div);
			var pluginData = $div.data("actlap");

			var audio = $("#" + pluginData.playerId + "_component").get(0);			
			
			if (pluginData.currentPlayer == "html5")
			{
				methodsALAP.onDebug(pluginData, "html5.pause()");
				audio.noEvent = true;
				try {
					audio.pause(); //stop doesn't exist :-)
					audio.currentTime = 0;
				}
				catch(err) { }
				audio.audioStarted = false;
			}
			else if (pluginData.currentPlayer == "flash")
			{
				this.onDebug(pluginData, "flash.stop()");			
				if (pluginData.playerIsReady) audio.stopSound({ 'raiseFinishEvent' : false });
			}
			
			//if sound is playing => call onFinish
			if (getInfo.isPlaying) 
			{
				this.onDebug(pluginData, "playing in progress, call onFinish");
				this.onFinish(pluginData, false);
			}

		},
		
		/************************
		* remove player
		************************/		
		_destroy: function($div, options) {
			
			methodsALAP._stop($div, options);
			
			//get information about sound
			var pluginData = $div.data("actlap");
			
			//delete component
			var $player = $("#" + pluginData.playerId);
			
			$player.removeClass(methodsALAP._playerHTML5Class + " " + methodsALAP._playerFLASHClass);
			$player.html("");
						
			//no player
			pluginData.currentPlayer = "";
		
		},
		
		/************************
		* return information about current sound
		* { file, isPlaying, duration, position, nodata = true/false }
		************************/			
		_getInfo: function($div) {

			var pluginData = $div.data("actlap");
			var isIPAD = navigator.userAgent.match(/iPad/i) != null;
			
			var info = { file: '', isPlaying: false, 'buffer': 0, 'duration': 0, 'position': 0, 'nodata' : true };
			
			if (!pluginData.hasOwnProperty("currentPlayer")) return info;
			
			info.file = pluginData.fileToRead;			
			if (pluginData.currentPlayer == "flash")
			{
				if (pluginData.playerIsReady)
				{
					var audio = $div.find("#" + pluginData.playerId + "_component").get(0);
					var playerInfo = audio.infoSound();
					info.status = playerInfo.status;
					info.isPlaying = !playerInfo.isStopped;
					info.duration = playerInfo.duration;
					info.position = playerInfo.position;
					info.buffer = playerInfo.buffer / 100;
					info.nodata = false;
				}
			}
			else if (pluginData.currentPlayer == "html5")
			{
				var audio = $div.find("#" + pluginData.playerId + "_component").get(0);
				info.isPlaying = (pluginData.status == "play");
				info.status = pluginData.status;
				if (!isNaN(audio.duration))
				{
					info.duration = audio.duration;
					info.position = audio.currentTime;
					info.buffer = (!isIPAD && audio.buffered.length > 0) ? (audio.buffered.end(audio.buffered.length-1)) / info.duration : 0;
					info.nodata = false;					
				}
			}
			
			return info;
			
		},
		
		/****************************************************************************************************
		* events methodsALAP
		*****************************************************************************************************/
		
		onFlashEvents: function(event, param) {
			
			var pluginData = $("#" + param.playerId).parent().data("actlap");
						
			var fPlayer = $('#' + pluginData.playerId + "_component").get(0);			
			if (fPlayer === null) 
			{
				methodsALAP.onDebug(pluginData, "flash not found");
				return;
			}

			if (event == "onReady")
			{
				pluginData.playerIsReady = true;
				methodsALAP.onDebug(pluginData, "flash is ready");
				var fileU = new actURI(pluginData.fileToRead);
				fPlayer.playSound({ 'file' : fileU.transformURI(pluginData.settings.audiovideosettings.flash.reversefolder) });
			}
			else if (event == "onStart")
			{
				methodsALAP.onDebug(pluginData, "flash start");
				methodsALAP.onStart(pluginData);
			}
			else if (event == "onFinish")
			{
				methodsALAP.onDebug(pluginData, "flash finish");
				methodsALAP.onFinish(pluginData, true);
			}
			else if (event == "onProgress")
			{
				methodsALAP.onProgress(pluginData, { 'status': param.status, 'position': param.position, 'duration': param.duration, 'buffer' : param.buffer, 'isStopped': param.isStopped } );
			}
			else if (event == "onError")
			{
				methodsALAP.onDebug(pluginData, "flash error");
				methodsALAP.onError(pluginData, { "errorId": param.errorId, "internalError": param.internalCodeError, "text" : param.errorDescription });
			}
						
		},
	
		onStart: function(pdata) {
		
			if (pdata.currentPlayer == "") return;
		
			pdata.status = "play";
			
			var $div = methodsALAP._getDiv(pdata.playerId);
			if ($div !== null)
			{
				//change picture			
				methodsALAP._setPicture($div);
				//update tooltip text
				if (pdata.settings.visible && pdata.settings.enabled) $div.tooltip("option", pdata.settings.tooltip.stop);
			}
		
			if (typeof pdata.settings.onStart === "function")
				pdata.settings.onStart.call(this, { 'playerId': pdata.playerId, 'file': pdata.settings.file, 'filereaded': pdata.fileToRead, 'context': pdata.settings.context } );
		
		},

		onProgress: function(pdata, info) {
		
			if (pdata.currentPlayer == "") return;
		
			//if (info.nodata) return;
		
			var eventdata = { "playerId": pdata.status, 'file': pdata.settings.file, 'filereaded': pdata.fileToRead};
			
			eventdata["position"] = info.position;
			eventdata["duration"] = info.duration;
			eventdata["buffer"]   = info.buffer;
			eventdata["context"]  = pdata.settings.context
		
			if (typeof pdata.settings.onProgress === "function") pdata.settings.onProgress.call(this, eventdata);
		
		},
		
		onFinish: function(pdata, endOfSound) {
			
			//change picture
			if (pdata.currentPlayer == "") return;
		
			pdata.status = "stop";
			var $div = methodsALAP._getDiv(pdata.playerId);
			if ($div !== null) 
			{
				//change picture			
				methodsALAP._setPicture($div);
				//update tooltip text
				if (pdata.settings.visible && pdata.settings.enabled) $div.tooltip("option", pdata.settings.tooltip.play );
			}
			
			if (typeof pdata.settings.onFinish === "function")
				pdata.settings.onFinish.call(this, { 'playerId': pdata.playerId, 'EOS': (endOfSound === true), 'file': pdata.settings.file, 'filereaded': pdata.fileToRead, 'context': pdata.settings.context } );

		},
		
		onSuspend: function(pdata) {

			if (pdata.currentPlayer == "") return;
			
			var dispToolTip = true;
			
			if (typeof pdata.settings.onWaitUserAction === "function")
			{
				var ret = pdata.settings.onWaitUserAction.call(this, { 'playerId': pdata.playerId, 'file': pdata.settings.file, 'filereaded': pdata.fileToRead, 'context': pdata.settings.context } );
				dispToolTip = (ret !== true);
			}
			
			if (dispToolTip && pdata.settings.visible && pdata.settings.enabled)
			{
				var $div = methodsALAP._getDiv(pdata.playerId);
				if ($div !== null)
				{
					$div.tooltip("option", pdata.settings.tooltip.suspend );
					$div.tooltip("open");
				}
			}
			if (typeof pdata.settings.onSuspend === "function")
				pdata.settings.onSuspend.call(this, {'context': pdata.settings.context } );
			
		},

		onDebug: function(pdata, msg) {

			if (typeof pdata.settings.onDebug === "function")
				pdata.settings.onDebug.call(this, { 'playerId': pdata.playerId, 'message': msg, 'context': pdata.settings.context } );
		
		},
		
		onError: function(pdata, error) {
			
			if (pdata.currentPlayer == "") return;
			
			if (typeof pdata.settings.onError === "function")
				pdata.settings.onError.call(this, { 'playerId' : pdata.playerId, 'file': pdata.settings.file, 'filereaded': pdata.fileToRead, 'info' : error, 'context': pdata.settings.context} );
			
		},
		
		_onClickEvent: function(event) {
			
			var $div = $(this);
			var pluginData = $div.data("actlap");
			
			//close tooltip (ipad)
			if (pluginData.settings.visible && pluginData.settings.enabled)
			{
				setTimeout($.proxy(function() {
					$(this).tooltip("close");
				}, this), 1000);
			}
			
			if (pluginData.status != "play")
			{
				methodsALAP.onDebug(pluginData, "click play");
				methodsALAP._play($div, {});
			}
			else
			{
				methodsALAP.onDebug(pluginData, "click stop");
				methodsALAP._stop($div, {});
			}
		
		},

		/****************************************************************************************************
		* public methods methodsALAP
		*****************************************************************************************************/
		
		init: function(options) {
			
			var settings = $.extend(true, methodsALAP._getDefaultOptions(), options);
			//console.log("methodsALAP ");
			//console.log(options)
			return this.each(function() {        
				
				var $this = $(this);
				if ($this.is("div") && ($this.data("actlap") === undefined))
				{
				
					//Create component ID
					var pluginId = methodsALAP._getInternalId();					
					
					//Create and store the plugin data
					if (settings.id === null) settings.id = pluginId;
					var pluginData = { 'playerId': pluginId, 'currentPlayer': "", 'playerIsReady': false, 'properties': {}, 'status': "stop", 'savDiv': $this.html(), 'settings': settings }; 
					
					$this.data("actlap", pluginData);

					//Create audiovideo detection object
					methodsALAP._actAudioVideoDetection[pluginId] = new actAudioVideoDetection(settings.audiovideosettings);
					
					//Initialisation class
					$this.addClass(settings.pluginClass + ' ' + settings.onClass);
				
					//Attach event click
					if (settings.enabled) {
						$this.on("click", methodsALAP._onClickEvent);
					}
					
					//Ajoute une div
					$this.html("<div id=\"" + pluginId + "\"></div><img src=\"\" />");
					
					//initialize picture
					methodsALAP._setPicture($this);
										
					//display component
					if (settings.visible != true)
					{
						$this.css( { width: '0px', height: '0px' } );
					}
					
					if (!settings.enabled) {
						$this.css( { cursor: 'default' } );
					}
					
					//add tooltip
					if (settings.visible && settings.enabled)
					{
						$this.attr("title", "");
						$this.tooltip();
					}
					
					//if autoplay
					if (settings.play) methodsALAP._play($this);
								
				}
				
			});		
	
		},
		
		getInfo: function() {
			
			var info = null;
			
			this.each(function() {
				
				var $this = $(this);
				
				if ($this.is("div") && $this.data("actlap"))
				{
					info = methodsALAP._getInfo($this);
					return false;
				}
				
			});
			
			return info;
			
		},
		
		play: function(options) {
	
			return this.each(function() {
				
				var $this = $(this);
				
				if ($this.is("div") && $this.data("actlap"))
				{
					var pluginData = $this.data("actlap");
					pluginData.settings = $.extend(true, pluginData.settings , options);										
					methodsALAP._play($this, options);
				}
				
			});
		
		},
		
		stop: function(options) {
		
			return this.each(function() {
				
				var $this = $(this);
				
				if ($this.is("div") && $this.data("actlap"))
				{
					methodsALAP._stop($this, options);
				}
				
			});
		
		},
		
		pause: function(options) {
			alert("not implemented !");
		},
		
		destroy: function() {
		
			return this.each(function() {
				
				var $this = $(this);
				
				if ($this.is("div") && $this.data("actlap"))
				{
					
					var pluginData = $this.data("actlap");
					
					methodsALAP._destroy($this, null);

					//Destroy tooltip
					if (pluginData.settings.visible) $this.tooltip("destroy");
					
					$this.off("click", methodsALAP._onClickEvent);
					$this.removeClass(pluginData.settings.pluginClass + ' ' + pluginData.settings.onClass + ' ' + pluginData.settings.offClass);
					$this.html(pluginData.savDiv);
					
					if (methodsALAP._actAudioVideoDetection.hasOwnProperty(pluginData.playerId))
						delete methodsALAP._actAudioVideoDetection[pluginData.playerId];
								
					$this.removeAttr("title");					
					
					//CSS Properties
					if (pluginData.properties.hasOwnProperty('width')) this.css("width", pluginData.properties.width); else $this.css("width", '');
					if (pluginData.properties.hasOwnProperty('height')) this.css("height", pluginData.properties.height); else $this.css("height", '');
					if (pluginData.properties.hasOwnProperty('cursor')) this.css("cursor", pluginData.properties.cursor); else $this.css("cursor", '');
					
					$this.removeData("actlap");
					
				}
				
			});
			
		},
		
		version: function() {
			return methodsALAP._version; 
		}
					
	};
		
	$.fn.actLAP = function (method) {
		
		if (methodsALAP[method]) 
		{   
			
			return methodsALAP[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if ( typeof method === 'object' && typeof method.eventSource === 'string')
		{
			//Brige flash object => jQuery plugin
			methodsALAP.onFlashEvents(method.eventName, method);
		}		
		else if ( typeof method === 'object' || ! method ) 
		{   

			return methodsALAP.init.apply(this, arguments);
		} 
		else 
		{
			$.error( 'Method ' +  method + ' does not exist on jQuery.actLAP' );
		}    	
	
	};
 
})( jQuery );
