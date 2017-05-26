function navigationInit() {

	var showingNav      = false,
		$trigger        = $('.navigation__trigger, .navigation__menu-label'),
		$navTrigger     = $('.navigation__trigger'),
		$triggerTop     = $navTrigger.children('.trigger__top'),
		$triggerMiddle  = $navTrigger.children('.trigger__middle'),
		$triggerBottom = $navTrigger.children('.trigger__bottom'),
		$nav            = $('.overlay--navigation'),
		$current        = $('.menu--main-menu').children('[class*="current-menu"]').children('a'),
		isOpen          = false,
		$horMenu		= $('.js-horizontal-menu');

	$current.wrapInner('<span class="menu__item--current"></span>');
	/**
	 * This is not such a good idea since the class "current-menu" is added also on parents and ancestors which
	 * cannot be accessed anymore if we disable the click
	 */
	//$current.on('click', function (e) {
	//	e.preventDefault();
	//	e.stopPropagation();
	//});

	$trigger.on('mouseenter', function (e) {

		if (isOpen) {
			TweenMax.to($navTrigger, 0.15, {
				scale: 0.8
			});
		} else {
			TweenMax.to($triggerTop, 0.15, {
				y: -3,
				ease: Quad.easeOut
			});
			TweenMax.to($triggerBottom, 0.15, {
				y: 3,
				ease: Quad.easeOut
			});
		}

	});

	$trigger.on('mouseleave', function (e) {

		if (isOpen) {
			TweenMax.to($navTrigger, 0.15, {
				scale: 1
			});
		} else {
			TweenMax.to($triggerTop, 0.15, {
				y: 0,
				ease: Power4.easeOut
			});
			TweenMax.to($triggerBottom, 0.15, {
				y: 0,
				ease: Power4.easeOut
			});
		}

	});

	$('.navigation__links-trigger').on('click', function() {
		$(this).toggleClass('active');
	});

	// Toggle navigation on click
	$trigger.on('click', navToggle);

	// Close menu with ESC key
	$(document).on('keydown' ,function(e) {
		if (e.keyCode == 27 && isOpen ) {
			navToggle(e);
		}
	});

	function navToggle(e) {
		e.preventDefault();
		e.stopPropagation();

		var $label  = $('.navigation__menu-label'),
			$open   = $label.find('.label--open'),
			$close  = $label.find('.label--close'),
			tl1,
			tl2;

		showingNav = !showingNav;

		if (showingNav) {

			$nav.css('left', 0);

			TweenMax.to($nav, 0.3, {
				opacity: 1
			});

			$('html').css('overflow', 'hidden');

			$('.header').addClass('header--inverse-important');
			$label.addClass('is--toggled');
			$horMenu.addClass('is--toggled');

			tl1 = new TimelineMax({ paused: true });

			tl1.to($triggerTop, 0.2, {rotation: 45, y: 7, force3D: true});
			tl1.to($triggerMiddle, 0.2, {opacity: 0}, '-=0.2');
			tl1.to($triggerBottom, 0.2, {rotation: -45, y: -7, force3D: true}, '-=0.2');

			tl1.to($navTrigger, 0.2, {scale: 0.8}, '-=0.1');
			tl1.to($navTrigger, 0.2, {scale: 1, ease: Quad.easeOut});

			showMenuLabel();

			tl1.play();

			isOpen = true;

		} else {

			if ( latestKnownScrollY > 60 ) showMenuLinks(true);

			TweenMax.to($nav, 0.3, {
				opacity: 0,
				onComplete: function () {
					$nav.css('left', '100%');
					$('.js-main-menu > li').removeClass('open');
				}
			});

			$('html').css('overflow', '');

			$('.header').removeClass('header--inverse-important');
			$label.removeClass('is--toggled');
			$horMenu.removeClass('is--toggled');

			tl2 = new TimelineMax({ paused: true });

			tl2.to($triggerTop, 0.2, {rotation: 0, y: 0, force3D: true});
			tl2.to($triggerMiddle, 0.2, {opacity: 1}, '-=0.2');
			tl2.to($triggerBottom, 0.2, {rotation: 0, y: 0, force3D: true}, '-=0.2');

			tl2.to($navTrigger, 0.2, {scale: 1, force3D: true});

			tl2.play();

			isOpen = false;
		}
	}

	(function(){
		if(Modernizr.touch) {
			$('.site-navigation .menu-item-has-children > a').on('touchstart', function(e) {
				e.preventDefault();
				e.stopPropagation();

				$('.js-main-menu > li').removeClass('open');
				$(this).parent().addClass('open');
			});
		}
	})();

	// double tab link problem in iOS
	// http://davidwalsh.name/ios-hover-menu-fix
	// http://stackoverflow.com/questions/25731106/ios-requires-double-tap-for-a-simple-link-element
	$('.menu-item > a').on('touchstart mouseenter focus', function(e) {
		if (e.type == 'touchstart') {
			// Don't trigger mouseenter even if they hold
			e.stopImmediatePropagation();
		}
	})

	var latestKnownScrollY = 0,
		lastKnownScrollY = 0,
		scrollDirection = 'down',
		$label = $('.navigation__menu-label'),
		$links = $('.navigation__links'),
		$hasNavLinks = $links.find('ul').children().length,
		duration = 0.3,
		timeline = new TimelineMax({ paused: true });


	function showMenuLinks(forced) {
		if( $hasNavLinks && $horMenu.length ) {
			TweenMax.to( $horMenu, duration, {y: -40, opacity: 0});
		} else {
			TweenMax.to( $label, duration, {y: -40, opacity: 0});
		}

		if (forced) {
			if( $hasNavLinks && $horMenu.length ) {
				TweenMax.to( $horMenu, 0, {y: -40, opacity: 0});
			} else {
				TweenMax.to( $label, 0, {y: -40, opacity: 0});
			}
		}

		TweenMax.to($links, duration, {y: 0, opacity: 1, pointerEvents: 'auto'});
	}

	function showMenuLabel() {
		if( $hasNavLinks && $horMenu.length ) {
			TweenMax.to( $horMenu, duration, {y: 0, opacity: 1});
		} else {
			TweenMax.to( $label, duration, {y: 0, opacity: 1});
		}

		$('.navigation__links-trigger').removeClass('active');

		TweenMax.to($links, duration, {y: 40, opacity: 0, pointerEvents: 'none'});
	}

	$(window).on('scroll', function () {
		latestKnownScrollY = window.scrollY;

		scrollDirection = latestKnownScrollY > lastKnownScrollY ? 'down' : 'up';

		if (latestKnownScrollY < 40 && scrollDirection == 'up') {
			showMenuLabel();
		}

		if (latestKnownScrollY > 60 && scrollDirection == 'down') {
			showMenuLinks();
		}

		lastKnownScrollY = latestKnownScrollY;
	});


	// Horizontal menu logic for mobiles
	if($horMenu.length) {
		// Clone elements from horizontal menu and mark them
		var $menuItems = $horMenu.children().clone();
		$menuItems.each(function(index, element) {
			$(this).addClass('item--is-adopted');
		})

		// If there is no main maiu selected, remove "Please select a menu" message
		$('.js-main-menu').find('.placeholder').remove();

		// Append horizontal menu items
		$('.js-main-menu').append($menuItems);
	}
}
