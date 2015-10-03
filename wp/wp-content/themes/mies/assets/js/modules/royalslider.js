/* --- Royal Slider Init --- */

function royalSliderInit($container) {
	$container = typeof $container !== 'undefined' ? $container : $('body');

	// Transform Wordpress Galleries to Sliders
	$container.find('.wp-gallery').each(function () {
		sliderMarkupGallery($(this));
	});

	// Find and initialize each slider
	$container.find('.js-pixslider').each(function () {

		sliderInit($(this));

		var $sliderContainer 	= $(this),
			slider 				= $(this).data('royalSlider'),
			lastSlide			= 0,
			// Sir Hackalot
			$sourceContent		= $sliderContainer.closest('.hero__bg').data('source');

		if (!slider.slides.length) {
			return;
		}

		var firstSlide 			= slider.slides[0],
			firstSlideContent 	= $(firstSlide.content),
			$video 				= firstSlideContent.hasClass('video') ? firstSlideContent : firstSlideContent.find('.video'),
			firstSlideAutoPlay 	= typeof $video.data('video_autoplay') !== "undefined";

		if( Modernizr.touch ) firstSlideAutoPlay = false;

		if ( firstSlideAutoPlay ) {
			firstSlide.holder.on('rsAfterContentSet', function () {
				slider.playVideo();
			});
		}

		var $destination 	= $sliderContainer.parent(),
			$source 		= $(slider.currSlide.content).children();

		if ($destination.is('.js-projects-slider')) {
			$destination.removeClass('hero--light hero--shadowed hero--dark');
			$destination.toggleClass('hero--light', $source.hasClass('hero--light'));
			$destination.toggleClass('hero--shadowed', $source.hasClass('hero--shadowed'));
			$destination.toggleClass('hero--dark', $source.hasClass('hero--dark'));
		}

		slider.ev.on('rsBeforeAnimStart', function(event) {
			// transitions
			var $lastSlide 		= $(slider.slides[lastSlide].content),
				$description    = $lastSlide.find('.hero__description'),
				timeline 		= new TimelineMax({ paused: true }),
				lastAbove, lastMain, lastBelow;

			if (typeof $sourceContent !== "undefined" && $sourceContent.siblings('.hero__content').length && slider.currSlideId !== 0) {
				$lastSlide = $sourceContent.siblings('.hero__content');
				$description = $lastSlide.find('.hero__description');

				if (lastSlide != 0) {
					return;
				}
			} else {
				$lastSlide = $container.find('.hero__content');
				$description = $container.find('.hero__description');
			}

			lastMain = $lastSlide.find('.hero__title');

		    if ( ( typeof lastMain == "undefined" || !lastMain.length ) && $description.length ) {
		        lastMain    = $description.find('.hero__title, .huge, .large').first();
		        lastAbove   = lastMain.prevAll().add($description.prevAll());
		        lastBelow   = lastMain.nextAll().add($description.nextAll());

		    }

			if (typeof lastMain !== "undefined" && lastMain.length != 0) {
				lastAbove 	= lastMain.prevAll();
				lastBelow	= lastMain.nextAll();

		        timeline.to(lastMain, .44, {scale: 0.7, z: 0.01, ease: Power3.easeOut});
		        timeline.to(lastAbove, .44, {y: 40, z: 0.01, ease: Quad.easeOut}, '-=.44');
		        timeline.to(lastBelow, .44, {y: -40, z: 0.01, ease: Quad.easeOut}, '-=.44');
		        timeline.to(lastMain, .34, {opacity: 0, ease: Quad.easeOut}, '-=.34');
		        timeline.to(lastAbove, .34, {opacity: 0, ease: Quad.easeOut}, '-=.34');
		        timeline.to(lastBelow, .34, {opacity: 0, ease: Quad.easeOut}, '-=.34');

				timeline.to(lastMain, 0, {scale: 1, z: 0.01});
				timeline.to(lastAbove, 0, {opacity: 0, y: 0, z: 0.01});
				timeline.to(lastBelow, 0, {opacity: 0, y: 0, z: 0.01});
			} else {
				nextBelow = $lastSlide.find('.hero__title, .hero__subtitle, .hero__btn, .hero__description');
				timeline.to(nextBelow, 0, {opacity: 1});
				timeline.fromTo(nextBelow, .45, {y: 0, z: 0.01}, {y: -40, z: 0.01, opacity: 0, ease: Sine.easeOut});
			}

	        timeline.play();

	        lastSlide = slider.currSlideId;
		});

		// auto play video sliders if is set so
		slider.ev.on('rsAfterSlideChange', function(event) {
			var $slide_content 		= $(slider.currSlide.content),
				$video 				= $slide_content.hasClass('video') ? $slide_content : $slide_content.find('.video'),
				rs_videoAutoPlay 	= typeof $video.data('video_autoplay') !== "undefined";

			if (Modernizr.touch) rs_videoAutoPlay = false;

			if ( rs_videoAutoPlay ) {

				setTimeout(function() {
					slider.stopVideo();
					slider.playVideo();
				}, 150);
			}

			$destination 	= $sliderContainer.parent();
			$source 		= $(slider.currSlide.content).children();

			if ($destination.is('.js-projects-slider')) {
				$destination.removeClass('hero--light hero--shadowed hero--dark');
				$destination.toggleClass('hero--light', $source.hasClass('hero--light'));
				$destination.toggleClass('hero--shadowed', $source.hasClass('hero--shadowed'));
				$destination.toggleClass('hero--dark', $source.hasClass('hero--dark'));
			}

			// transitions
			var $nextSlide 		= $(slider.currSlide.content),
				$description    = $nextSlide.find('.hero__description'),
				timeline 		= new TimelineMax({ paused: true }),
				nextAbove, nextMain, nextBelow, letterspacing;

			if (typeof $sourceContent !== "undefined" && $sourceContent.siblings('.hero__content').length && slider.currSlideId == 0) {
				$nextSlide = $sourceContent.siblings('.hero__content');
				$description = $nextSlide.find('.hero__description');
			} else {
				$nextSlide = $container.find('.hero__content');
				$description = $container.find('.hero__description');
			}

			nextMain = $nextSlide.find('.hero__title');

		    if ( ( typeof nextMain == "undefined" || !nextMain.length ) && $description.length ) {
		        nextMain    = $description.find('.hero__title, .huge, .large').first();
		        nextAbove   = nextMain.prevAll().add($description.prevAll());
		        nextBelow   = nextMain.nextAll().add($description.nextAll());
		    }

		    if (typeof nextMain !== "undefined" && nextMain.length != 0) {
				nextAbove 	= nextMain.prevAll();
				nextBelow	= nextMain.nextAll();

				timeline.to(nextMain, 0, {scale: 1, z: 0.01});
				timeline.to(nextAbove, 0, {opacity: 0, y: 0, z: 0.01});
				timeline.to(nextBelow, 0, {opacity: 0, y: 0, z: 0.01});

				// Slides Content Transitions
				// Title
		        timeline.fromTo(nextMain, .25, {opacity: 0}, {opacity: 1});
		        timeline.fromTo(nextMain, .45, {'scale': 1.4, z: 0.01}, {'scale': 1, z: 0.01, opacity: 1, ease: Sine.easeOut}, '-=.24');
		        // Subtitle
		        timeline.fromTo(nextAbove, .45, {y: 40}, {y: 0, z: 0.01, opacity: 1, ease: Back.easeOut}, '-=.25');
		        // Description
		        timeline.fromTo(nextBelow, .45, {y: -40}, {y: 0, z: 0.01, opacity: 1, ease: Back.easeOut}, '-=.45');
			} else {
				nextBelow = $nextSlide.find('.hero__title, .hero__subtitle, .hero__btn, .hero__description');
				timeline.to(nextBelow, 0, {opacity: 0});
				timeline.fromTo(nextBelow, .45, {y: -40, z: 0.01}, {y: 0, z: 0.01, opacity: 1, ease: Sine.easeOut});
			}

	        setTimeout(function () {
				timeline.play();
	        }, 150);
		});

		// after destroying a video remove the autoplay class (this way the image gets visible)
		slider.ev.on('rsOnDestroyVideoElement', function(i ,el){

			var $slide_content 		= $( this.currSlide.content),
				$video 				= $slide_content.hasClass('video') ? $slide_content : $slide_content.find('.video');

			$video.removeClass('video_autoplay');

		});

		if (Modernizr.touch) {
			$window.on('resize', function() {
				setTimeout(function() {
					slider.updateSliderSize(true);
				}, 100);
			});
		}

		if (typeof $sliderContainer.data('animated') == "undefined") {
			$sliderContainer.data('animated', true);
			setTimeout(function() {
				animateIn($(firstSlide.content));
			}, 500);
		}

		$sliderContainer.imagesLoaded(function () {
			setTimeout(function () {
				TweenMax.to($sliderContainer.find('.hero__bg'), .3, {opacity: 1});
			}, 1000);
		});


	});

}

/*
 * Slider Initialization
 */
function sliderInit($slider) {
	if (globalDebug) {
		console.log("Royal Slider Init");
	}

	$slider.find('img').removeClass('invisible');

	var $children                   = $(this).children(),
		rs_arrows                   = typeof $slider.data('arrows') !== "undefined",
		rs_bullets                  = typeof $slider.data('bullets') !== "undefined" ? "bullets" : "none",
		rs_autoheight               = typeof $slider.data('autoheight') !== "undefined",
		rs_autoScaleSlider          = false,
		rs_autoScaleSliderWidth     = typeof $slider.data('autoscalesliderwidth') !== "undefined" && $slider.data('autoscalesliderwidth') != '' ? $slider.data('autoscalesliderwidth') : false,
		rs_autoScaleSliderHeight    = typeof $slider.data('autoscalesliderheight') !== "undefined" && $slider.data('autoscalesliderheight') != '' ? $slider.data('autoscalesliderheight') : false,
		rs_customArrows             = typeof $slider.data('customarrows') !== "undefined",
		rs_slidesSpacing            = typeof $slider.data('slidesspacing') !== "undefined" ? parseInt($slider.data('slidesspacing')) : 0,
		rs_keyboardNav              = typeof $slider.data('fullscreen') !== "undefined",
		rs_imageScale               = $slider.data('imagescale') || "fill",
		rs_visibleNearby            = typeof $slider.data('visiblenearby') !== "undefined",
		rs_imageAlignCenter         = typeof $slider.data('imagealigncenter') !== "undefined",
		//rs_imageAlignCenter = false,
		rs_transition               = typeof $slider.data('slidertransition') !== "undefined" && $slider.data('slidertransition') != '' ? $slider.data('slidertransition') : 'fade',
		rs_transitionSpeed          = 500,
		rs_autoPlay                 = typeof $slider.data('sliderautoplay') !== "undefined",
		rs_delay                    = typeof $slider.data('sliderdelay') !== "undefined" && $slider.data('sliderdelay') != '' ? $slider.data('sliderdelay') : '1000',
		rs_drag                     = true,
		rs_globalCaption            = typeof $slider.data('showcaptions') !== "undefined",
		is_headerSlider             = $slider.hasClass('hero-slider') ? true : false,
		hoverArrows                 = typeof $slider.data('hoverarrows') !== "undefined";

	if (rs_autoheight) {
		rs_autoScaleSlider = false;
	} else {
		rs_autoScaleSlider = true;
	}

	if( Modernizr.touch ) rs_autoPlay = false;

	// Single slide case
	if ($children.length == 1) {
		rs_arrows = false;
		rs_bullets = 'none';
		rs_keyboardNav = false;
		rs_drag = false;
		rs_transition = 'fade';
		rs_customArrows = false;
	}

	// make sure default arrows won't appear if customArrows is set
	if (rs_customArrows) rs_arrows = false;

	//the main params for Royal Slider

	var royalSliderParams = {
		autoHeight: rs_autoheight,
		autoScaleSlider: rs_autoScaleSlider,
		loop: true,
		autoScaleSliderWidth: rs_autoScaleSliderWidth,
		autoScaleSliderHeight: rs_autoScaleSliderHeight,
		imageScaleMode: rs_imageScale,
		imageAlignCenter: rs_imageAlignCenter,
		slidesSpacing: rs_slidesSpacing,
		arrowsNav: rs_arrows,
		controlNavigation: rs_bullets,
		keyboardNavEnabled: rs_keyboardNav,
		arrowsNavAutoHide: false,
		sliderDrag: rs_drag,
		transitionType: rs_transition,
		transitionSpeed: rs_transitionSpeed,
		imageScalePadding: 0,
		autoPlay: {
			enabled: rs_autoPlay,
			stopAtAction: true,
			pauseOnHover: true,
			delay: rs_delay
		},
		globalCaption: rs_globalCaption,
		numImagesToPreload: 2
	};

	if (rs_visibleNearby) {
		royalSliderParams['visibleNearby'] = {
			enabled: true,
			//centerArea: 0.8,
			center: true,
			breakpoint: 0,
			//breakpointCenterArea: 0.64,
			navigateByCenterClick: false,
			addActiveClass: true
		}
	}

	// lets fire it up
	$slider.royalSlider(royalSliderParams);

	var royalSlider 	= $slider.data('royalSlider' ),
		slidesNumber 	= royalSlider.numSlides,
		$arrows 		= $slider.find('.rsArrows');

	if (typeof $arrows !== "undefined" || !$arrows.length) {
		$arrows.remove();
	}

	// create the markup for the customArrows
	// it's not necessary it if we have only one slide
	if (royalSlider && rs_arrows && slidesNumber > 1 ) {

		var $gallery_control = $(
			'<div class="rsArrows">' +
			'<div class="rsArrow rsArrowLeft js-arrow-left"></div>' +
			'<div class="rsArrow rsArrowRight js-arrow-right"></div>' +
			'</div>'
		);


		$('.js-arrows-templates .svg-arrow--left').clone().appendTo($gallery_control.find('.js-arrow-left'));
		$('.js-arrows-templates .svg-arrow--right').clone().appendTo($gallery_control.find('.js-arrow-right'));

		$slider.find('.rsArrows').remove();
		$slider.nextAll('.rsArrows').remove();

		if ($slider.closest('.hero__bg').length) {
			$gallery_control.insertAfter($slider);
			$slider.find('.rsBullets').insertAfter($slider);
		} else {
			$gallery_control.appendTo($slider);
		}

		var timeline = new TimelineMax({ paused: true }),
			$left = $gallery_control.find('.svg-arrow--left'),
			$right = $gallery_control.find('.svg-arrow--right');

		timeline.fromTo($left, .5, {x: 50, opacity: 0}, {x: 0, opacity: 1, ease: Back.easeOut});
		timeline.fromTo($right, .5, {x: -50, opacity: 0}, {x: 0, opacity: 1, ease: Back.easeOut}, '-=.5');

		setTimeout(function() {
			timeline.play();
		}, 900);

		$left.parent().on('mouseenter', function () {
			TweenMax.to($left, .2, {x: -6});
		}).on('mouseleave', function () {
			TweenMax.to($left, .2, {x: 0})
		});

		$right.parent().on('mouseenter', function () {
			TweenMax.to($right, .2, {x: 6});
		}).on('mouseleave', function () {
			TweenMax.to($right, .2, {x: 0})
		});

		$gallery_control.on('click', '.js-arrow-left', function (event) {
			event.preventDefault();
			if ($('body').hasClass('rtl')) {
				royalSlider.next();
			} else {
				royalSlider.prev();
			}
		});

		$gallery_control.on('click', '.js-arrow-right', function (event) {
			event.preventDefault();
			if ($('body').hasClass('rtl')) {
				royalSlider.prev();
			} else {
				royalSlider.next();
			}
		});

	}

	if (slidesNumber == 1) {
		$slider.addClass('single-slide');
	}

	$slider.addClass('slider--loaded');
}

/*
 * Wordpress Galleries to Sliders
 * Create the markup for the slider from the gallery shortcode
 * take all the images and insert them in the .gallery <div>
 */
function sliderMarkupGallery($gallery) {
	var $old_gallery = $gallery,
		gallery_data = $gallery.data(),
		$images = $old_gallery.find('img'),
		$new_gallery = $('<div class="pixslider js-pixslider">');

	$images.prependTo($new_gallery).addClass('rsImg');

	//add the data attributes
	$.each(gallery_data, function (key, value) {
		$new_gallery.attr('data-' + key, value);
	})

	$old_gallery.replaceWith($new_gallery);
}

/*
 Get slider arrows to hover, following the cursor
 */

function hoverArrow($arrow) {
	var $mouseX = 0, $mouseY = 0;
	var $arrowH = 35, $arrowW = 35;

	$arrow.mouseenter(function (e) {
		$(this).addClass('visible');

		moveArrow($(this));
	});

	var $loop;

	function moveArrow($arrow) {
		var $mouseX;
		var $mouseY;

		$arrow.mousemove(function (e) {
			$mouseX = e.pageX - $arrow.offset().left - 40;
			$mouseY = e.pageY - $arrow.offset().top - 40;

			var $arrowIcn = $arrow.find('.rsArrowIcn');
			TweenMax.to($arrowIcn, 0, {x: $mouseX, y: $mouseY, z: 0.01});
		});

		$arrow.mouseleave(function (e) {
			$(this).removeClass('visible').removeClass('is--scrolled');
			clearInterval($loop);
		});

		$(window).scroll(function() {
			if($arrow.hasClass('visible')){

				$arrow.addClass('is--scrolled');

				clearTimeout($.data(this, 'scrollTimer'));
				$.data(this, 'scrollTimer', setTimeout(function() {
					$arrow.removeClass('is--scrolled');
				}, 100));
			}
		});
	}
}