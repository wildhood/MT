var $window             = $(window),
    $document           = $(document),
    $html               = $('html'),
    $body               = $('body'),
    // needed for browserSize
    windowWidth         = $window.width(),
    windowHeight        = $window.height(),
    documentHeight      = $document.height(),
    aspectRatio         = windowWidth / windowHeight,
    orientation         = windowWidth > windowHeight ? 'landscape' : 'portrait',
    orientationChanged  = false,
    headerHeight        = $('.panel--logo').outerHeight(),
    // needed for requestAnimationFrame
    latestKnownScrollY  = window.scrollY,
    lastKnownScrollY    = latestKnownScrollY,
    scrollDirection     = 'down',
    ticking             = false;

function browserSize() {
    var newOrientation;

    windowWidth         = $window.outerWidth();
    windowHeight        = $window.outerHeight();
    documentHeight      = $document.height();
    aspectRatio         = windowWidth / windowHeight;
    newOrientation      = windowWidth > windowHeight ? 'landscape' : 'portrait';

    if (newOrientation !== orientation) {
        orientationChanged = true;
    }

    orientation         = newOrientation;
}

function onOrientationChange(firstTime) {

    firstTime = firstTime || false;

    if (!orientationChanged) {
        return;
    }

    if (orientationChanged || !!firstTime) {

        if (Modernizr.touch) {

            var $hero = $('#djaxHero, .hero-slider');

            $hero.removeAttr('style');
            $hero.attr('style', 'height: ' + $hero.outerHeight() + 'px !important');

            // trigger resize to let royal slider relayout
            $(window).trigger('resize');

        }

        Parallax.initialize();
        Chameleon.prepare();
    }

    orientationChanged = false;

}

function reload(firstTime) {
    if (globalDebug) {console.group("global::reload")}
    browserSize();
    resizeVideos();
    onOrientationChange(firstTime);

    if(!Modernizr.touch)
        VideoBackground.fill();

    function reloadUpdate() {
        browserSize();
        Parallax.initialize();
        Chameleon.prepare();
        onOrientationChange(firstTime);
    }

    function reloadCondition() {
        if ($('.masonry').length) {
            $('.masonry').isotope( 'once', 'layoutComplete', function() {
                reloadUpdate();
            });
            isotopeUpdateLayout();
        } else {
            reloadUpdate();
        }
    }

    if (firstTime === true) {
        reloadCondition();
        if (globalDebug) {console.groupEnd()}
        return;
    }

    if (!Modernizr.touch) {
        reloadCondition();
    }

    if (globalDebug) {console.groupEnd()}
}

$window.smartresize(reload);

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(update);
    }
    ticking = true;
}

function update() {
    ticking = false;

    Parallax.update();
    Chameleon.update();
}

/* ====== INTERNAL FUNCTIONS END ====== */


/* ====== ONE TIME INIT ====== */

function init() {
    if (globalDebug) {console.group("global::init");}

    //  GET BROWSER DIMENSIONS
    browserSize();

    // /* DETECT PLATFORM */
    platformDetect();

    loadAddThisScript();

    navigationInit();

    /* ONE TIME EVENT HANDLERS */
    eventHandlersOnce();

    /* INSTANTIATE EVENT HANDLERS */
    eventHandlers();

    if (globalDebug) {console.groupEnd();}
}



/* ====== CONDITIONAL LOADING ====== */

function loadUp() {
    if (globalDebug) {console.group("global::loadup");}

    resizeVideos();
    magnificPopupInit();
    isotopeInit();

    if(!Modernizr.touch)
        VideoBackground.init();

    $('.pixcode--tabs').organicTabs();

    $('body').imagesLoaded(function () {
        royalSliderInit($('.hero__content'));
        royalSliderInit($('.content'));

        setTimeout(function() {
            reload(true);
        }, 60);
    });

	/*
	 * Woocommerce Events support
	 * */

	if (typeof woocommerce_events_handlers == 'function') {
		woocommerce_events_handlers();
	}

    if (globalDebug) {console.groupEnd();}
}

/* ====== EVENT HANDLERS ====== */

function eventHandlersOnce() {
    if (globalDebug) {console.group("eventHandlers::once");}

    $('a[href="#top"]').on('click', function(e) {
        e.preventDefault();
        smoothScrollTo(0);
    });

    //copyrightOverlayInit();

    if (globalDebug) {console.groupEnd();}

}

function eventHandlers() {
    if (globalDebug) {console.group("eventHandlers");}

    bindShareClick();

    $(window).on("organicTabsChange", function(e) {
        browserSize();
        Parallax.initialize();
    });

    $('.js-arrow-down').on('click', function(e) {

        e.preventDefault();

        var height = $(this).closest('.hero').outerHeight();

        TweenMax.to('html, body', Math.abs(height) / 1500, {
            scrollTop: height,
            ease: Power2.easeOut
        });
    });

    $('.mies-item').not('.mies-share, .post').each(function (i, item) {

        var $item       = $(this).find('.mies-item-wrap'),
            $border     = $item.find('.mies-item-border'),
            $image      = $item.find('img'),
            $content    = $item.find('.mies-item-content'),
            $title      = $item.find('.mies-item-title'),
            $meta = $item.find('.mies-item-meta'),
            itemHeight  = $item.outerHeight(),
            itemWidth   = $item.outerWidth();

        $(this).hover(function () {
            TweenMax.to($border, .2, {
                borderTopWidth: 18,
                borderRightWidth: 18,
                borderBottomWidth: 18,
                borderLeftWidth: 18,
                'ease': Power3.easeOut
            });

            TweenMax.to($content, .2, {
                opacity: 1,
                'ease': Power3.easeOut
            }, '-=.2');

            TweenMax.fromTo($title, .2, {
                y: -20
            }, {
                y: 0
            }, '-=.2');

            TweenMax.fromTo($meta, .2, {
                y: 20
            }, {
                y: 0
            }, '-=.2');

            TweenMax.to($image, .2, {
                'opacity': .35,
                'ease': Power3.easeOut
            });

        }, function () {

            TweenMax.to($border, .2, {
                borderTopWidth: 0,
                borderRightWidth: 0,
                borderBottomWidth: 0,
                borderLeftWidth: 0,
                'ease': Power3.easeOut
            });

            TweenMax.to($content, .2, {
                opacity: 0,
                'ease': Power3.easeIn
            }, '-=.2');

            TweenMax.fromTo($title, .2, {
                y: 0
            }, {
                y: -20
            }, '-=.2');

            TweenMax.fromTo($meta, .2, {
                y: 0
            }, {
                y: 20
            }, '-=.2');

            TweenMax.to($image, .2, {
                'opacity': 1,
                'ease': Power3.easeIn
            });
        });

    });

    bindProjectsHover();
    bindGalleryImagesHover();

    // Scroll Down Arrows on Full Height Hero
    $('.hero-scroll-down').on('click', function(e){
        smoothScrollTo(windowHeight);
    });

    // whenever a category is selected, make sure the "All" button is on
    $(document).on( 'click', '.filter__fields li', function( e ){
        var target = $( this ).children('a' ).attr('href');
        $( target + ' li:first-child button' ).trigger('click');
    });

    if (globalDebug) {console.groupEnd();}
}

function bindProjectsHover() {

    $('.masonry__item')
        .off('mouseenter')
        .on('mouseenter', function (e) {
            var $image = $(this).find('.masonry__item-image');
            TweenMax.to($image, 0.5, {
                opacity: 0.5,
                ease: Power4.easeOut
            });
        })
        .off('mouseleave')
        .on('mouseleave', function (e) {
            var $image = $(this).find('.masonry__item-image');
            TweenMax.to($image, 0.5, {
                opacity: 1,
                ease: Power4.easeOut
            });
        });

}

function bindGalleryImagesHover() {
    $('.gallery-icon')
        .off('mouseenter')
        .on('mouseenter', function (e) {
            var $image = $(this).find('img');
            TweenMax.to($image, 0.5, {
                opacity: 0.5,
                ease: Power4.easeOut
            });
        })
        .off('mouseleave')
        .on('mouseleave', function (e) {
            var $image = $(this).find('img');
            TweenMax.to($image, 0.5, {
                opacity: 1,
                ease: Power4.easeOut
            });
        });
}


/* --- GLOBAL EVENT HANDLERS --- */


/* ====== ON DOCUMENT READY ====== */

$(document).ready(function () {
    if (globalDebug) {console.group("document::ready");}

    init();
    initVideos();

    if (isSafari) {
        $('html').css('opacity', 0);
    }

    if (globalDebug) {console.groupEnd();}
});


$window.load(function () {
    if (globalDebug) {console.group("window::load");}

    loadUp();
    niceScrollInit();
    isotopeUpdateLayout();

    var sliders = $('.js-projects-slider').parent();

    $('.hero').not(sliders).each(function (i, obj) {
        $(obj).imagesLoaded(function () {
            setTimeout(function () {
                animateIn($(obj));
            }, 300);
        });
    });

    $('.pixcode--tabs').organicTabs();

    if (isSafari) {
        setTimeout(function() {
            reload();
            TweenMax.to('html', .3, {opacity: 1});
        }, 300);
    } else {

    }

    if (globalDebug) {console.groupEnd();}
});

function animateIn($hero) {

    var $bg             = $hero.find('.hero__bg'),
        timeline        = new TimelineMax({ paused: true }),
        $description    = $hero.find('.hero__description'),
        above,
        main,
        below,
        arrowLeft       = $('.hero').find('.arrow--left'),
        arrowRight      = $('.hero').find('.arrow--right'),
        arrowDown       = $('.hero').find('.arrow--down'),
        other;

    main = $hero.find('.hero__content-wrap').children('.hero__title').first();

    if ( ( typeof main == "undefined" || !main.length ) && $description.length ) {
        main    = $description.find('.hero__title, .huge, .large').first();
        above   = main.prevAll().add($description.prevAll());
        below   = main.nextAll().add($description.nextAll());
    }

    // Background Intro
    // timeline.to($bg, .3, {opacity: 1, ease: Quint.easeIn});

    if (typeof main !== "undefined" && main.length != 0) {
        above = main.prevAll();
        below = main.nextAll();

        above.css({opacity: 0});
        main.css({opacity: 0});
        below.css({opacity: 0});
        $description.css({opacity: 1});


        // Title
        timeline.fromTo(main, .25, {opacity: 0}, {opacity: 1}, '-=.15');
        timeline.fromTo(main, .45, {'scale': 1.4}, {'scale': 1, opacity: 1, ease: Sine.easeOut}, '-=.20');

        // Subtitle
        timeline.fromTo(above, .45, {y: '+=40'}, {y: '-=40', opacity: 1, ease: Back.easeOut}, '-=.25');

        // Description
        timeline.fromTo(below, .45, {y: '-=40'}, {y: '+=40', opacity: 1, ease: Back.easeOut}, '-=.45');

    } else {

        below = $hero.find('.hero__title, .hero__subtitle, .hero__btn, .hero__description');

        // Description
        timeline.fromTo(below, .45, {y: '-=40'}, {y: '+=40', opacity: 1, ease: Sine.easeOut});
    }

    if (arrowDown.length) {
        timeline.fromTo(arrowDown, .25, {y: -20}, {y: 0, opacity: 1, ease: Quad.easeOut});
    }

    timeline.play();
}

/* ====== ON JETPACK POST LOAD ====== */

$(document).on('post-load', function () {
	if (globalDebug) {console.log("Jetpack Post load");}

    initVideos();
    resizeVideos();

});

/* ====== ON SCROLL ====== */

$window.on('scroll', onScroll);

function onScroll() {
    latestKnownScrollY = $(document).scrollTop();
    scrollDirection = lastKnownScrollY > latestKnownScrollY ? 'up' : 'down';
    lastKnownScrollY = latestKnownScrollY;
    requestTick();
}

// smooth scrolling to anchors
$(function() {

    $('.overlay--navigation a[href*=#]:not([href=#])').click(function() {

        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {

            if ($('.overlay--navigation').length && parseInt($('.overlay--navigation').css('left'), 10) == 0) {
                $('.navigation__trigger').trigger('click');
            }

            var target = $(this.hash);

            target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
            if (target.length) {
                smoothScrollTo(target.offset().top);
                return false;
            }
        }

    });
});