// /* ====== HELPER FUNCTIONS ====== */

//similar to PHP's empty function
function empty(data)
{
	if(typeof(data) == 'number' || typeof(data) == 'boolean')
	{
		return false;
	}
	if(typeof(data) == 'undefined' || data === null)
	{
		return true;
	}
	if(typeof(data.length) != 'undefined')
	{
		return data.length === 0;
	}
	var count = 0;
	for(var i in data)
	{
		// if(data.hasOwnProperty(i))
		//
		// This doesn't work in ie8/ie9 due the fact that hasOwnProperty works only on native objects.
		// http://stackoverflow.com/questions/8157700/object-has-no-hasownproperty-method-i-e-its-undefined-ie8
		//
		// for hosts objects we do this
		if(Object.prototype.hasOwnProperty.call(data,i))
		{
			count ++;
		}
	}
	return count === 0;
}

/* --- Set Query Parameter--- */
function setQueryParameter(uri, key, value) {
	var re = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
	separator = uri.indexOf('?') !== -1 ? "&" : "?";
	if (uri.match(re)) {
		return uri.replace(re, '$1' + key + "=" + value + '$2');
	}
	else {
		return uri + separator + key + "=" + value;
	}
}

function makeid() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 5; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function tryParseJSON (jsonString){
	try {
		var o = JSON.parse(jsonString);

		// Handle non-exception-throwing cases:
		// Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
		// but... JSON.parse(null) returns 'null', and typeof null === "object",
		// so we must check for that, too.
		if (o && typeof o === "object" && o !== null) {
			return o;
		}
	}
	catch (e) {
		if (globalDebug) {console.log(e);}
	}

	return false;
};




// Background videos player

var vimeoPlayersList = Array(),
	ytPlayersList = Array();

// this function must be unwrapped / public
// because it is called by YT API
function onYouTubeIframeAPIReady() {

	ytPlayersList.forEach(function(element, index, array){
		// for each YouTube player, create a player object
		var ytPlayer = new YT.Player( array[index][0].id , {
			events: {
				'onReady': onPlayerReady,
				'onStateChange': "onPlayerStateChange"
			},
			playerVars: {
				'controls' : 0
			}
		});

		// replace the iframe in the list with the player object
		array[index] = ytPlayer;
	});
}

// this function must be unwrapped / public
// because it is called by YT API
function onPlayerReady(event) {
	// play and mute each YT video

	if(!Modernizr.touch) {
		event.target.playVideo();
	}
	event.target.mute();
}

function onPlayerStateChange(event) {
	event.target.mute();

	if(event.data === YT.PlayerState.ENDED){
		event.target.playVideo();
	}
}



// Vimeo business
function onVimeoMessageReceived(e) {
	$ = jQuery;
	var data = tryParseJSON(e.data);

	if ( data !== false ) {
		switch ( data.event ) {
			case 'ready':
				var data = {method: 'setVolume', value: '0'};

				// for each vimeo player, set volume to 0
				vimeoPlayersList.forEach( function( element, index, array ) {
					array[index].vimeoIframe[0].contentWindow.postMessage( JSON.stringify( data ), array[index].vimeoURL );
				} );

				if(!Modernizr.touch) {

					data = {method: 'play'};

					// for each vimeo player, let it play
					vimeoPlayersList.forEach(function (element, index, array) {
						array[index].vimeoIframe[0].contentWindow.postMessage(JSON.stringify(data), array[index].vimeoURL);
					});

				}

				break;
		}
	}
}

function youtube_parser(url){
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
	var match = url.match(regExp);
	if (match&&match[7].length==11){
		return match[7];
	} else {
		console.log("Incorrect Youtube Video URL");
	}
}

function vimeo_parser(url){
	var regExp = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
	var match = url.match(regExp);
	if (match){
		return match[3];
	} else {
		console.log("Incorrect Vimeo Video URL");
	}
}

var VideoBackground = {
	init: function() {
		$ = jQuery;

		$('.video-iframe-holder').each(function() {

			// don't play the video if we're in a slider
			if ( !!$(this).closest('.projects--slider').length ) {
				return;
			}

			$(this).parent().appendTo($(this).closest('.hero'));

			// Get the video URL
			var videoURL = $(this).data('url');

			var initialHeight = null,
				initialWidth = null;

			if( videoURL.indexOf('youtube') >= 0 ) {
				// we have a YT video

				// Inject the Youtube API Script in page
				var tag = document.createElement('script');
				tag.src = "https://www.youtube.com/iframe_api";
				var firstScriptTag = document.getElementsByTagName('script')[0];
				firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

				// Get Youtube video ID
				var youtubeVideoID = youtube_parser(videoURL);

				// Compose iframe src
				// playlist=' + youtubeVideoID +' - this is needed for the video to repeat itself
				var youtubeVideoSrc = '//www.youtube.com/embed/' + youtubeVideoID + '?enablejsapi=1&amp;rel=0&amp;controls=0&amp;showinfo=0&amp;loop=1&amp;playlist=PL' + youtubeVideoID +'&amp;iv_load_policy=3';

				// Create YT iframe Object and push it to the players list
				ytPlayersList.push( $('<iframe/>',{
					'class' 	 : 'video-bg  video--youtube',
					'id'		 : 'video-bg-player-' + makeid(),
					'src'		 : youtubeVideoSrc,
					'frameborder': 0,
					'width'		 : 853,
					'height'	 : 510
				}).appendTo($(this)) ); // and append it to .video-iframe-holder

			} else if( videoURL.indexOf('vimeo') >= 0 ) {
				// we have a Vimeo video

				// Get Vimeo video ID
				var vimeoVideoID = vimeo_parser(videoURL);

				// Compose iframe src
				var vimeoVideoSrc = 'https://player.vimeo.com/video/' + vimeoVideoID + '?title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;color=383737&amp;loop=1&amp;api=1';

				// Create the object that will be pushed into the videos list
				var vimeoObject = {
					vimeoIframe : null,
					vimeoURL	: null
				}

				// Create Vimeo iframe Object
				vimeoObject.vimeoIframe =
					$('<iframe/>',{
						'class' 	 : 'video-bg  video--vimeo',
						'id'		 : 'video-bg-player-' + makeid(),
						'src'		 : vimeoVideoSrc,
						'frameborder': 0
					}).appendTo($(this)) ;

				vimeoObject.vimeoURL = vimeoVideoSrc.split('?')[0];

				// pushing the object into the Vimeo players list
				vimeoPlayersList.push(vimeoObject);

				initialWidth = 16;
				initialHeight = 9;
			}

			if ( initialHeight == null && initialWidth == null ) {
				initialHeight = $(this).find('iframe').height();
				initialWidth = $(this).find('iframe').width();
			}

			// setting and aspect ration on each iframe holder
			// based on the iframes
			$(this).attr('data-ar', initialWidth/initialHeight );

		});

		// adding event listeners for Vimeo videos
		if (window.addEventListener)
			window.addEventListener('message', onVimeoMessageReceived, false);
		else
			window.attachEvent('onmessage', onVimeoMessageReceived, false);

		// calling an initial fill() on videos
		this.fill();
	},

	fill: function() {
		$('.video-iframe-holder').each(function () {

			// don't play the video if we're in a slider
			if ( !!$(this).closest('.projects--slider').length ) {
				return;
			}

			// getting the parent of the iframe holder - the .hero
			var $parent = $(this).parent();

			// getting .hero's width and height
			var parentHeight = $parent.height(),
				parentWidth  = $parent.width();

			var aspectRatio = $(this).attr('data-ar');

			// calc. .hero aspect ratio
			var parentRatio = parentWidth / parentHeight;

			//console.log(aspectRatio + ' ' + parentRatio);

			if ( parentRatio >= aspectRatio ) {
				//console.log('fill landscape');
				fillLandscape($(this), parentWidth, parentHeight, aspectRatio);
			}
			else if( parentRatio < aspectRatio ) {
				//console.log('fill portr');
				fillPortrait($(this), parentWidth, parentHeight, aspectRatio);
			}

			$(this).addClass('filled');

		});

		function fillPortrait(element, width, height, ratio) {
			element.height(height);
			element.width(height * ratio + 400);
			element.css('left', (width - element.width()) / 2);
			element.css('top', 0);
		}

		function fillLandscape(element, width, height, ratio) {
			element.width(width);
			element.height(width / ratio + 400);
			element.css('top', (height - element.height()) / 2);
			element.css('left', 0);
		}
	}
};

(function() {
	var lastTime = 0;
	var vendors = ['webkit', 'moz'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame =
			window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); },
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());