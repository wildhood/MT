//global isotope variables
var $isotope_container,
	max_isotope_pages,
	is_everything_loaded,
	isotope_page_counter,
	isotope_ready_to_filter, /* will use this variable to determine if we can filter */
	$isotope_pending_filter = null;

/* --- Isotope Init --- */

function isotopeInit() {
	if (globalDebug) {console.group("IsotopeInit");console.log("Isotope Init");}

	//initialize global variables
	$isotope_container = $('.masonry');

	if ( !empty($isotope_container)) {
		max_isotope_pages = $isotope_container.data('maxpages');
		is_everything_loaded = false;

		isotopeRun();

		//force the infinite scroll to wait for the first images to lead before doing it's thing
		if ($isotope_container.hasClass('infinite_scroll')) {
			$isotope_container.imagesLoaded(function(){
				isotopeInfiniteScrollingInit();
			});
		}

		isotopeFilteringInit();
	}

	if (globalDebug) {console.groupEnd();}
} //end isotopeInit

/* --- Isotope Update --- */

function isotopeUpdateLayout() {
	if (globalDebug) {console.log("Isotope Update Layout");}

	if ( !empty($isotope_container) && $isotope_container.length ) {
		$isotope_container.isotope( 'layout' );
	}
}

/* --- Isotope Destroy --- */

function isotopeDestroy() {
	if (globalDebug) {console.log("Isotope Destroy");}

	if ( !empty($isotope_container) && $isotope_container.length ) {
		$isotope_container.isotope( 'destroy');
	}
}


/* --- Layout Refresh --- */

function layoutRefresh() {
	if (globalDebug) {console.log("Isotope Layout Refresh");}

    isotopeUpdateLayout();
}

/* --- Isotope Run --- */

function isotopeRun() {
	if (!empty($isotope_container) && $isotope_container.length) {
		if (globalDebug) {console.log("Isotope Initialization (isotopeRun)");}

		// Isotope init
		var isOriginLeft = ! $('body').hasClass('rtl');
		$isotope_container.isotope({
			speed: 200,
			easing: 'ease-out',
			itemSelector: '.masonry__item',
			layoutMode: 'masonry',
			isOriginLeft: isOriginLeft,
			// control here the style for hiding and showing, see http://isotope.metafizzy.co/beta/options.html
			transitionDuration: '0.4s',
			hiddenStyle: {
				opacity: 0,
				transform: 'scale(0.5)'
			},
			visibleStyle: {
				opacity: 1,
				transform: 'scale(1)'
			}
		});

		$isotope_container.isotope('on', 'arrangeComplete', function() {
			// Parallax.initialize();
		});

		$isotope_container.isotope('on', 'layoutComplete', function() {
			// Parallax.initialize();
			$('.archive-blog').addClass('loaded');
			$('.filter, .filter__tags-container').addClass('usable');

		});

	}
}

/* -- Isotope Infinite Scrolling Initialization --- */

function isotopeInfiniteScrollingInit() {
	if (globalDebug) {console.log("Isotope Infinite Scroll Init");}

	isotope_page_counter = 1;

	// if all projects are already loaded, no infinite scroll is required
	if( $('.projects--grid').data('projects-per-page') >= $('.projects--grid').data('total-posts') ) {
		$('.load-more__container').hide();
	}

	$isotope_container.infinitescroll({
			navSelector  : 'ol.pagination',    // selector for the paged navigation
			nextSelector : 'ol.pagination a.next',  // selector for the NEXT link
			itemSelector : 'article.project',     // selector for all items you'll retrieve
			loading: {
				finished: undefined,
				finishedMsg: objectl10n.infscrReachedEnd,
				img: "",
				msg: null,
				msgText: objectl10n.infscrLoadingText,
				selector: null,
				speed: 'fast',
				start: undefined
			},
			debug: globalDebug,
			//animate      : true,
			//extraScrollPx: 500,
			prefill: false,
			maxPage: max_isotope_pages,
			errorCallback: function(){}
			// called when a requested page 404's or when there is no more content
			// new in 1.2
		},
		// trigger Isotope as a callback
		function( newElements, data, url ) {

			newElements.forEach(function(e){
				$(e).css('opacity', 0);
			});

			var $newElems = $( newElements );

			isotope_ready_to_filter = false;

			infiniteScrollingRefreshComponents($isotope_container);

			if (globalDebug) {console.log("Infinite Scroll - Adding new "+$newElems.length+" items to the DOM");}

			// ensure that images load before adding to masonry layout
			$newElems.imagesLoaded(function(){

				$isotope_container.isotope( 'appended', $newElems );

				if (globalDebug) {console.log("Isotope Infinite Scroll Loaded Next Page");}

				//refresh all there is to refresh
				//layoutRefresh();

				isotope_ready_to_filter = true;

				isotope_page_counter++;

				if (isotope_page_counter == max_isotope_pages) {
					$('.load-more__container').fadeOut('slow');

					//we've pretty much finished with the infiniteScroll
					infiniteScrollingDestroy();
				} else {
					//remove the loading class as we have finished
					$('.load-more__container .btn').removeClass('loading');
				}

				//check if we have a pending filter - fire it if that is the case
				if ( ! empty( $isotope_pending_filter ) ) {
					$isotope_pending_filter.trigger('click');
				}
			});

			// rebind animations on hover events
			bindProjectsHover();
		});

	if ($isotope_container.hasClass('infinite_scroll_with_button')) {
		infiniteScrollingOnClick($isotope_container);
	}
}

function infiniteScrollingOnClick($container) {
	if (globalDebug) {console.log("Infinite Scroll Init - ON CLICK");}

	// unbind normal behavior. needs to occur after normal infinite scroll setup.
	$(window).unbind('.infscr');

	$('.load-more__container .btn').click(function(){

		$(this).addClass('loading');
		$container.infinitescroll('retrieve');

		return false;
	});

	// remove the paginator when we're done.
	$(document).ajaxError(function(e,xhr,opt){
		if (xhr.status == 404) {
			$('.load-more__container').fadeOut('slow');
		}
	});
}

//in case you need to control infinitescroll
function infiniteScrollingPause() {
	if (globalDebug) {console.log("Isotope Infinite Scroll Pause");}

	$isotope_container.infinitescroll('pause');
}
function infiniteScrollingResume() {
	if (globalDebug) {console.log("Isotope Infinite Scroll Resume");}

	$isotope_container.infinitescroll('resume');
}
function infiniteScrollingDestroy() {
	if (globalDebug) {console.log("Isotope Infinite Scroll Destroy");}

	$isotope_container.infinitescroll('destroy');
}

function infiniteScrollingRefreshComponents($container) {
	if (globalDebug) {console.log("Infinite Scroll - Refresh Components");}

	//royalSliderInit($container);
	//niceScrollInit();
	//initVideos();
	//resizeVideos();
}

/* --- Portfolio filtering --- */

function isotopeFilteringInit() {
	if (globalDebug) {console.log("Isotope Filtering Init");}

	isotope_ready_to_filter = true;

	// bind filter buttons on click
	$('#filters').on( 'click', 'button', function(e){
		e.preventDefault();

		//make sure that we reset the pending filter
		$isotope_pending_filter = null;

		if (isotope_ready_to_filter === true) { //only proceed if we are in a ready state

			var filterValue = $(this).attr('data-filter');

			//make sure the current filter is marked as selected
			$('.filter__tags.current button').removeClass('selected');
			$(this).addClass('selected');

			//some checks
			if (max_isotope_pages == isotope_page_counter) {
				//we have already loaded all the pages
				is_everything_loaded = true;
			}

			if (globalDebug) {console.log("Isotope Page Counter = " + isotope_page_counter + " | Max Pages = " + max_isotope_pages);}

			if ( !is_everything_loaded ) { //we need to do some loading
				if (globalDebug) {console.log("Isotope Filtering - Loading the rest of the pages so we can start filtering");}

				//we need to force the loading of the next page
				//first we need to remember this filter button
				$isotope_pending_filter = $(this);
				//now fire up the infiniteScroll
				$(this).addClass('loading');
				$isotope_container.infinitescroll('retrieve');

			} else { //all is good, just filter
				if (globalDebug) {console.log("Isotope Filtering - Filter by " + filterValue);}

				$isotope_container.isotope({ filter: filterValue });
			}

		} else {
			if (globalDebug) {console.log("Isotope Filtering - NOT READY TO FILTER");}
		}

		return false;

	}); //end filtering on click
}