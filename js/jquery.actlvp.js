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
 
	var methodsALVP = {
		
		_internalALVPId: 0,
		_actAudioVideoDetection: {},
		_version: "1.02.4519",
		
		_playerHTML5Class: "plugin_actLVP_HTML5_player",
		_playerFLASHClass: "plugin_actLVP_FLASH_player",

		ControlerDisplayOption : { never: 'never', always: 'always', mouse: 'mouse' },
		ControlerState : { play: 'play', pause: 'pause', replay: 'replay' },
		
		/************************
		* Get the default options
		************************/
		_getInternalId: function() {
			return "plugin_actLVP_" + this._internalALVPId++;
		},
		
		/************************
		* Get the default options
		************************/
		_getDefaultOptions: function() {
		
			return {
				'id': null,
				'file': null,
				'loop': false,
				'play': false,
				'context': null,
				'onStart': null,
				'onFinish': null,
				'onProgress': null,
				'onWaitUserAction': null,
				'onError': null,
				'onDebug': null,
				'pluginClass': 'plugin-actlvp',
				'audiovideosettings': { 'isVideo': true, 
										'flash' : { 'folder': 'swf/', 'reversefolder' : '../', 'transformfile' : { }, "version": null },
										'html5' : { 'folder': '', 'reversefolder' : '', 'transformfile' : { } }
									  },
				'width': "500px",
				'height': "240px",
				'poster': null,
				'stretch': false,
				'smoothing': false,
				'showControler': methodsALVP.ControlerDisplayOption.mouse
				
			};
			
		},

		_displayControler: function($div) {
		
			var pluginData = $div.data("actlvp");
			
			var $player = $div.find("." + pluginData.settings.pluginClass + "_playercontainer");			
			
			if (pluginData.settings.showControler == methodsALVP.ControlerDisplayOption.mouse)
			{
				
				$player.mouseenter(function() {
					var $controler = $(this).find("." + pluginData.settings.pluginClass + "_playercontroler");
					$controler.css({"display": "block", "top": $(this).height()});
					$controler.animate({top: $(this).height() - $controler.height()}, 100);						
				})
				.mouseleave(function() {  
					var $controler = $(this).find("." + pluginData.settings.pluginClass + "_playercontroler");
					$controler.css("display", "none");
				});
				
			}
			else if (pluginData.settings.showControler == methodsALVP.ControlerDisplayOption.always)
			{
				$player.css("display", "block");
			}
						
		},
		
		_updateStateControler: function($div, $state) {
		
		
		
		},
		
		/************************
		* get the div element with playerId
		* return null if not found
		************************/				
		_getDiv: function(playerId) {
		
			var $player = $("#" + playerId);
			if ($player.length > 0)
				return $player.parent().parent();
			else
				return null;
		
		},
		
		/************************
		* play a sound
		************************/				
		_play: function($div, options) {
			
			var pluginData = $div.data("actlvp");
			var playerId = pluginData.playerId;
			var playerComponentId = playerId + "_component";
			
			if (pluginData.settings.file != null && pluginData.settings.file != "")
			{
				
				methodsALVP.onDebug(pluginData, "play : " + pluginData.settings.file);

				var fileURL = methodsALVP._actAudioVideoDetection[playerId].transformFileName(pluginData.settings.file);
				
				methodsALVP.onDebug(pluginData, "play(2) : " + fileURL);
				
				var checkURI = new actURI(fileURL);
				//get type mime with the file extension
				var fileTM = checkURI.getTypeMimeWithExtension();
				var playerToUse = methodsALVP._actAudioVideoDetection[playerId].usePlayer(fileTM);
				
				pluginData.fileToRead = fileURL;
				
				methodsALVP.onDebug(pluginData, "play(2) : " + fileURL);

				//which player is currently used
				$player = $("#" + playerId);
				var currentplayer = $player.hasClass(methodsALVP._playerHTML5Class) ? "html5" : ($player.hasClass(methodsALVP._playerFLASHClass) ? "flash" : "");

				methodsALVP.onDebug(pluginData, "use player : " + playerToUse + " / current player : " + currentplayer);
				
				//if it's not the good one
				if (playerToUse != currentplayer)
				{

					//Stop the current video
					methodsALVP._destroy($div, options);
					
					//Create player
					currentplayer = playerToUse;
					pluginData.currentPlayer = currentplayer;
					pluginData.waitUserAction = false;
					pluginData.playerIsReady = false;
					
					if (currentplayer == "flash")
					{
						
						methodsALVP.onDebug(pluginData, "create player flash");

						$player.addClass(methodsALVP._playerFLASHClass);
						$player.append('<div id="' + playerComponentId + '" />');
						
						//Création de l'object FLASH
						var flashvars = {
							'playerId': playerId,
							refreshInterval: 200,
							videoSmoothing: pluginData.settings.smoothing,
							videoStretch: pluginData.settings.stretch,
							onReadyEventName: "$.fn.actLVP",
							onStartEventName: "$.fn.actLVP",
							onFinishEventName: "$.fn.actLVP", 
							onProgressEventName: "$.fn.actLVP",
							onErrorEventName: "$.fn.actLVP"
						};
		
						var params = { menu: "false", wmode: "transparent", quality: "normal", allowScriptAccess: "always" };
						var attributes = { };
						
						var componentswfpath = pluginData.settings.audiovideosettings.flash.folder + "actlvp.swf";
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
						
						methodsALVP.onDebug(pluginData, "create player html5");
						
						//This way is compatible with all html5 browser
						$player.addClass(methodsALVP._playerHTML5Class);
						$player.append('<video style="width:100%;height:100%;" id="' + playerComponentId + '" class="' + pluginData.settings.pluginClass + '_html5player" ></video>');
						
						//Get reference of component
						var vid = $("#" + playerComponentId).get(0);
						vid.suspendRaised = false;

						vid.addEventListener("ended", function(event) {
							
							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent().parent();
							var plugData = $div.data("actlvp");
							
							target.noEvent = true;
							
							if (plugData == null) return;

							plugData.status = "stop";
							
							//Reset waitUserAction property
							plugData.waitUserAction = false;
							methodsALVP.onFinish(plugData, true);								
							
						}, false);
						
						vid.addEventListener("timeupdate", function(event) {
							
							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent().parent();
							var plugData = $div.data("actlvp");						
							
							//Reset waitUserAction property														
							if (plugData !== null) plugData.waitUserAction = false;
							
							if (plugData == null || target.noEvent) return;
							
							if (!this.videoStarted) {
								this.videoStarted = true;
								methodsALVP.onStart(plugData);								
							}
							
							methodsALVP.onProgress(plugData, methodsALVP._getInfo($div));
							
						}, false);
						
						vid.addEventListener("progress", function(event) {
							
							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent().parent();
							var plugData = $div.data("actlvp");

							//Reset waitUserAction property
							if (plugData !== null) plugData.waitUserAction = false;
							
							if (plugData == null || target.noEvent) return;
							
							methodsALVP.onProgress(plugData, methodsALVP._getInfo($div));
							
						}, false);
						
						vid.addEventListener("loadeddata", function(event) {
							
							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent().parent();
							var plugData = $div.data("actlvp");
							
							if (plugData == null || target.noEvent) return;
							
							//Reset waitUserAction property
							plugData.waitUserAction = false;
							
							methodsALVP.onDebug(plugData, "loadeddata event");
							
						}, false);				
						
						vid.addEventListener("suspend", function(event) { 
							
							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent().parent();
							var plugData = $div.data("actlvp");
							
							if (plugData == null) return;

							methodsALVP.onDebug(plugData, "suspend event");
							
							//Try to check if safari/IPAD wait an user action to play
							plugData.waitUserAction = true;
							
							setTimeout($.proxy(function(pData, tgt) {
								if (pData.waitUserAction && tgt.readyState == 0 && !tgt.suspendRaised) {
									tgt.suspendRaised = true;
									methodsALVP.onSuspend(pData);
								}
							}, this, plugData, target), 1000);
						
						}, false);			
				
						vid.addEventListener("error", function(event) {

							var target = event.target || event.srcElement;
							var $div = $(target).parent().parent().parent();
							var plugData = $div.data("actlap");
							
							if (plugData == null) return;
							
							var err = target.error;
							var codeErr = "";
							if (err.code == 4) codeErr = "NOT_FOUND";
							methodsALVP.onError(plugData, { errorId: codeErr, internalError: err.code, text: "an error occurred during playing file : `" + plugData.fileToRead + "`"} );
						
						}, false);
						
						pluginData.playerIsReady = true;
						vid.noEvent = false;
						vid.videoStarted = false;
						vid.src = pluginData.fileToRead;
						vid.load();
						vid.play();
						
						methodsALVP.onDebug(pluginData, "html5.play()");
						
					}
					else 
					{
						methodsALVP.onError(pluginData, { errorId: "PLAYER_NOT_FOUND", internalError: -1, text: "player not found to play file : `" + pluginData.fileToRead + "`"} );
					}
					
				}
				else
				{
					
					methodsALVP.onDebug(pluginData, "use current player");
					
					//Stop the current video if there is an video file in progress
					methodsALVP._stop($div, options);
				
					if (playerToUse == "flash")
					{
						methodsALVP.onDebug(pluginData, "flash.play()");
						if (pluginData.playerIsReady)
						{
							var vid = $("#" + playerComponentId).get(0);
							var fileU = new actURI(pluginData.fileToRead);
							vid.playVideo({ 'file' : fileU.transformURI(pluginData.settings.audiovideosettings.flash.reversefolder) });
						}
					}
					else if (playerToUse == "html5")
					{
						methodsALVP.onDebug(pluginData, "html5.play()");
						var vid = $("#" + playerComponentId).get(0);
						vid.noEvent = false;
						vid.videoStarted = false;											
						vid.src = pluginData.fileToRead;
						vid.load();
						vid.play();
					}
				
				}
								
			}
		
		},
		
		/************************
		* stop sound
		************************/		
		_stop: function($div, options) {
			
			var getInfo = methodsALVP._getInfo($div);
			var pluginData = $div.data("actlvp");

			var vid = $("#" + pluginData.playerId + "_component").get(0);			
			if (pluginData.currentPlayer == "html5" && getInfo.isPlaying)
			{
				methodsALVP.onDebug(pluginData, "html5.pause()");
				vid.noEvent = true;
				try {				
					vid.pause(); //stop doesn't exist :-)
					vid.currentTime = 0;
				}
				catch(err) { }				
				vid.videoStarted = false;
			}
			else if (pluginData.currentPlayer == "flash")
			{
				this.onDebug(pluginData, "flash.stop()");
				if (pluginData.playerIsReady) vid.stopVideo({ 'raiseFinishEvent' : false });
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
			
			methodsALVP._stop($div, options);
			
			//get information about sound
			var pluginData = $div.data("actlvp");
			
			//delete component
			var $player = $("#" + pluginData.playerId);
			
			$player.removeClass(methodsALVP._playerHTML5Class + " " + methodsALVP._playerFLASHClass);
			$player.html("");
						
			//no player
			pluginData.currentPlayer = "";
		
		},
		
		/************************
		* return information about current sound
		* { file, isPlaying, duration, position, nodata = true/false }
		************************/			
		_getInfo: function($div) {

			var pluginData = $div.data("actlvp");
			
			var info = { file: '', isPlaying: false, 'buffer': 0, 'duration': 0, 'position': 0, 'nodata' : true };
			
			if (!pluginData.hasOwnProperty("currentPlayer")) return info;
			
			info.file = pluginData.fileToRead;			
			var vid = $div.find("#" + pluginData.playerId + "_component").get(0);
				
			if (pluginData.currentPlayer == "flash")
			{
				if (pluginData.playerIsReady)
				{
					var playerInfo = vid.infoVideo();
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
				info.isPlaying = (pluginData.status == "play");
				info.status = pluginData.status;
				if (!isNaN(vid.duration))
				{
					info.duration = vid.duration;
					info.position = vid.currentTime;
					info.buffer = (vid.buffered.end(vid.buffered.length-1)) / info.duration;					
					info.nodata = false;					
				}
			}
			
			return info;
			
		},
		
		/****************************************************************************************************
		* events methodsALVP
		*****************************************************************************************************/
		
		onFlashEvents: function(event, param) {
			
			var pluginData = $("#" + param.playerId).parent().parent().data("actlvp");
			var fPlayer = $('#' + pluginData.playerId + "_component").get(0);			
			
			if (fPlayer === null) 
			{
				methodsALVP.onDebug(pluginData, "flash not found");
				return;
			}

			if (event == "onReady")
			{
				pluginData.playerIsReady = true;
				methodsALVP.onDebug(pluginData, "flash is ready");
				var fileU = new actURI(pluginData.fileToRead);
				fPlayer.playVideo({ 'file' : fileU.transformURI(pluginData.settings.audiovideosettings.flash.reversefolder) });
				
			}
			else if (event == "onStart")
			{
				methodsALVP.onDebug(pluginData, "flash start");
				methodsALVP.onStart(pluginData);
			}
			else if (event == "onFinish")
			{
				methodsALVP.onDebug(pluginData, "flash finish");
				methodsALVP.onFinish(pluginData, true);
			}
			else if (event == "onProgress")
			{
				methodsALVP.onProgress(pluginData, { 'status': param.status, 'position': param.position, 'duration': param.duration, 'buffer' : param.buffer, 'isStopped': param.isStopped } );
			}
			else if (event == "onError")
			{
				methodsALVP.onDebug(pluginData, "flash error");
				methodsALVP.onError(pluginData, { "errorId": param.errorId, "internalError": param.internalCodeError, "text" : param.errorDescription });
			}
						
		},
	
		onStart: function(pdata) {
		
			if (pdata.currentPlayer == "") return;
		
			pdata.status = "play";
			
			var $div = methodsALVP._getDiv(pdata.playerId);
			if ($div !== null)
			{
				//change picture		
				//methodsALVP._updateStateControler($div, methodsALVP.ControlerState
				// methodsALAP._setPicture($div);
				// //update tooltip text
				// if (pdata.settings.visible) $div.tooltip("option", pdata.settings.tooltip.stop);
			}
		
			if (typeof pdata.settings.onStart === "function")
				pdata.settings.onStart.call(this, { 'playerId': pdata.playerId, 'file': pdata.settings.file, 'filereaded': pdata.fileToRead, 'context': pdata.settings.context } );
		
		},

		onProgress: function(pdata, info) {
		
			if (pdata.currentPlayer == "") return;
		
			//if (info.nodata) return;
		
			var eventdata = { "playerId": pdata.playerId, 'file': pdata.settings.file, 'filereaded': pdata.fileToRead, 'context': pdata.settings.context };
			
			eventdata["position"] = info.position;
			eventdata["duration"] = info.duration;
			eventdata["buffer"] = info.buffer;

			if (typeof pdata.settings.onProgress === "function") pdata.settings.onProgress.call(this, eventdata);
		
		},
		
		onFinish: function(pdata, endOfVideo) {
			
			//change picture
			if (pdata.currentPlayer == "") return;
		
			pdata.status = "stop";
			var $div = methodsALVP._getDiv(pdata.playerId);
			if ($div !== null) 
			{
				//change picture			
				//methodsALAP._setPicture($div);
				// //update tooltip text
			}
			
			if (typeof pdata.settings.onFinish === "function")
				pdata.settings.onFinish.call(this, { 'playerId': pdata.playerId, 'EOV': (endOfVideo === true), 'file': pdata.settings.file, 'filereaded': pdata.fileToRead, 'context': pdata.settings.context } );

		},
		
		onSuspend: function(pdata) {

			if (pdata.currentPlayer == "") return;
			
			var dispSuspendPicture = true;
			
			if (typeof pdata.settings.onWaitUserAction === "function")
			{
				var ret = pdata.settings.onWaitUserAction.call(this, { 'playerId': pdata.playerId, 'file': pdata.settings.file, 'filereaded': pdata.fileToRead, 'context': pdata.settings.context } );
				dispSuspendPicture = (ret !== true);
			}
			
			if (dispSuspendPicture)
			{
				var $div = methodsALVP._getDiv(pdata.playerId);
				$div.find(".plugin-actlvp_waituseraction").css({"display": "block"});
				
				// var $div = methodsALAP._getDiv(pdata.playerId);
				// if ($div !== null)
				// {
					// $div.tooltip("option", pdata.settings.tooltip.suspend );
					// $div.tooltip("open");
				// }
			}
			
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
		
		// _onClickEvent: function(event) {
			
			// var $div = $(this);
			// var pluginData = $div.data("actlap");
			
			// //close tooltip (ipad)
			// if (pluginData.settings.visible)
			// {
				// setTimeout($.proxy(function() {
					// $(this).tooltip("close");
				// }, this), 1000);
			// }
			
			// if (pluginData.status != "play")
			// {
				// methodsALAP.onDebug(pluginData, "click play");
				// methodsALAP._play($div, {});
			// }
			// else
			// {
				// methodsALAP.onDebug(pluginData, "click stop");
				// methodsALAP._stop($div, {});
			// }
		
		// },

		/****************************************************************************************************
		* public methods methodsALVP
		*****************************************************************************************************/
		
		init: function(options) {
			
			var settings = $.extend(true, methodsALVP._getDefaultOptions(), options);
			return this.each(function() {        
				
				var $this = $(this);
				if ($this.is("div") && ($this.data("actlvp") === undefined))
				{
				
					//Create component ID
					var pluginId = methodsALVP._getInternalId();					
					
					//Create and store the plugin data
					if (settings.id === null) settings.id = pluginId;
					var pluginData = { 'playerId': pluginId, 'currentPlayer': "", 'playerIsReady': false, 'properties': {}, 'status': "stop", 'savDiv': $this.html(), 'settings': settings }; 
					
					$this.data("actlvp", pluginData);

					//Create audiovideo detection object
					methodsALVP._actAudioVideoDetection[pluginId] = new actAudioVideoDetection(settings.audiovideosettings);
					
					//Initialisation class
					$this.addClass(settings.pluginClass);
				
					var divContainer = '<div class="' + settings.pluginClass + '_playercontainer" >';
							
							divContainer += '<div id="' + pluginId + '" class="' + settings.pluginClass + '_player"></div>';
							
							divContainer += '<div class="' + settings.pluginClass + '_waituseraction" >';
								divContainer += '<div class="' + settings.pluginClass + '_waituseraction_play" ></div>';
							divContainer += '</div>';
					
							divContainer += '<div class="' + settings.pluginClass + '_playercontroler" >';
								divContainer += '<div class="' + settings.pluginClass + '_playercontroler_progress">';
									divContainer += '<div class="' + settings.pluginClass + '_playercontroler_progress_buffer"></div>';
									divContainer += '<div class="' + settings.pluginClass + '_playercontroler_progress_read"></div>';
								divContainer += '</div>';
								divContainer += '<div class="' + settings.pluginClass + '_playercontroler_buttons">';
									divContainer += '<div class="' + settings.pluginClass + '_playercontroler_buttonssep"></div>';
									divContainer += '<div class="' + settings.pluginClass + '_ppr ' + settings.pluginClass + '_playercontroler_buttonsplay"></div>';
									divContainer += '<div class="' + settings.pluginClass + '_playercontroler_buttonssep"></div>';
									divContainer += '<div class="' + settings.pluginClass + '_ppt">';
										divContainer += '<span class="' + settings.pluginClass + '_currenttime">00:00</span>';
										divContainer += '<span class="' + settings.pluginClass + '_duration"> / 00:00</span>';
									divContainer += '</div>';
									divContainer += '<div class="' + settings.pluginClass + '_playercontroler_logocontainer">';
										divContainer += '<div class="' + settings.pluginClass + '_playercontroler_buttonssep"></div>';
										divContainer += '<div class="' + settings.pluginClass + '_playercontroler_logo"></div>';
									divContainer += '</div>';
								divContainer += '</div>';
							divContainer += '</div>';
					
					divContainer += '</div>';
					$this.html(divContainer);
					
					$this.children().css({"width" : settings.width, "height" : settings.height});
					
					//Events
					methodsALVP._displayControler($this);
					
					$this.find("." + settings.pluginClass + '_waituseraction').on("click", function() {
						
						var $this = $(this);
						$this.css("display", '');						
						$this.parent().find("." + pluginData.settings.pluginClass + "_playercontroler").css("display", "none");
						methodsALVP._play($this.parent().parent());
						
					});
					
					//if autoplay
					if (settings.play) methodsALVP._play($this);
								
				}
				
			});		
	
		},
		
		getInfo: function() {
			
			var info = null;
			
			this.each(function() {
				
				var $this = $(this);
				
				if ($this.is("div") && $this.data("actlvp"))
				{
					info = methodsALVP._getInfo($this);
					return false;
				}
				
			});
			
			return info;
			
		},
		
		play: function(options) {
		
			return this.each(function() {
				
				var $this = $(this);
				
				if ($this.is("div") && $this.data("actlvp"))
				{
					var pluginData = $this.data("actlvp");
					pluginData.settings = $.extend(true, pluginData.settings , options);										
					methodsALVP._play($this, options);
				}
				
			});
		
		},
		
		stop: function(options) {
		
			return this.each(function() {
				
				var $this = $(this);
				
				if ($this.is("div") && $this.data("actlvp"))
				{
					methodsALVP._stop($this, options);
				}
				
			});
		
		},
		
		pause: function(options) {
			alert("not implemented !");
		},
		
		destroy: function() {
		
			return this.each(function() {
				
				var $this = $(this);
				
				if ($this.is("div") && $this.data("actlvp"))
				{
					
					var pluginData = $this.data("actlvp");
					
					methodsALVP._destroy($this, null);
					
					// $this.off("click", methodsALAP._onClickEvent);
					$this.removeClass(pluginData.settings.pluginClass);
					$this.html(pluginData.savDiv);
					
					if (methodsALVP._actAudioVideoDetection.hasOwnProperty(pluginData.playerId))
						delete methodsALVP._actAudioVideoDetection[pluginData.playerId];
													
					$this.removeData("actlvp");
					
				}
				
			});
			
		},
		
		version: function() {
			return methodsALVP._version; 
		}
					
	};
		
	$.fn.actLVP = function (method) {
		
		if (methodsALVP[method]) 
		{
			return methodsALVP[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if ( typeof method === 'object' && typeof method.eventSource === 'string')
		{
			//Brige flash object => jQuery plugin
			methodsALVP.onFlashEvents(method.eventName, method);
		}		
		else if ( typeof method === 'object' || ! method ) 
		{
			return methodsALVP.init.apply(this, arguments);
		} 
		else 
		{
			$.error( 'Method ' +  method + ' does not exist on jQuery.actLVP' );
		}    	
	
	};
 
})( jQuery );