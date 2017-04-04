/* ====== SHARED VARS ====== */

var ua = navigator.userAgent,
    isiPhone = false,
    isiPod = false,
    isAndroidPhone = false,
    android = false,
    iOS = false,
    is_ie = false,
    ieMobile = false,
    isSafari = false,
    isMac = false,


    // useful logs in the console
    globalDebug = false;

(function ($, window, undefined) {

  var Chameleon = {
    prepared: false,
    color: null,
    offset: 0,

    prepare: function () {

      var that = this;

      this.offset = parseInt($('.logo').css('top'));
      this.header = $('.header');
      this.sections = $('body').children('.hero, .content, .footer').not('.hero--missing');

      this.sections.each(function (i, section) {

        var $section = $(section);

        if ($section.is('.content')) {
          $section.data('top', $section.offset().top - parseInt($section.css('marginTop')));
        } else {
          $section.data('top', $section.offset().top);
        }

        if ($section.is('.content, .hero--dark, .hero--shadowed')) {
          $section.data('textColor', 'dark');
        } else {
          $section.data('textColor', 'light');
        }

        if (i == 0) {
          that.color = $section.data('textColor');
        }

      });

      this.prepared = true;
      this.update();

    },

    update: function () {

      var that = this;

      if (!this.prepared) {
        this.prepare();
        return;
      }

      this.sections.each(function (i, section) {
        var $section = $(section);

        if (latestKnownScrollY + that.offset >= $section.data('top')) {
          that.color = $section.data('textColor');
        }
      });

      if (this.color == 'light') {
        this.header.addClass('header--inverse');
      } else {
        this.header.removeClass('header--inverse');
      }

    }
  };
  ///*
  //Firefox super responsive scroll (c) Keith Clark - MIT Licensed
  //*/
  //(function(doc) {
  //
  //    var root = doc.documentElement,
  //        scrollbarWidth, scrollEvent;
  //
  //    // Not ideal, but better than UA sniffing.
  //    if ("MozAppearance" in root.style) {
  //
  //        $('.body').addClass('firefox');
  //
  //        // determine the vertical scrollbar width
  //        scrollbarWidth = root.clientWidth;
  //        root.style.overflow = "scroll";
  //        scrollbarWidth -= root.clientWidth;
  //        root.style.overflow = "";
  //
  //        // create a synthetic scroll event
  //        scrollEvent = doc.createEvent("UIEvent");
  //        scrollEvent.initEvent("scroll", true, true);
  //
  //        // event dispatcher
  //        function scrollHandler() {
  //            doc.dispatchEvent(scrollEvent);
  //        }
  //
  //        // detect mouse events in the document scrollbar track
  //        doc.addEventListener("mousedown", function(e) {
  //            if (e.clientX > root.clientWidth - scrollbarWidth) {
  //                doc.addEventListener("mousemove", scrollHandler, false);
  //                doc.addEventListener("mouseup", function() {
  //                    doc.removeEventListener("mouseup", arguments.callee, false);
  //                    doc.removeEventListener("mousemove", scrollHandler, false);
  //                }, false)
  //            }
  //        }, false);
  //
  //        // override mouse wheel behaviour.
  //        doc.addEventListener("DOMMouseScroll", function(e) {
  //            // Don't disable hot key behaviours
  //            if (!e.ctrlKey && !e.shiftKey) {
  //                root.scrollTop += e.detail * 16;
  //                scrollHandler.call(this, e);
  //                e.preventDefault()
  //            }
  //        }, false);
  //
  //    }
  //})(document);
  /* --- GMAP Init --- */

  // Overwrite Math.log to accept a second optional parameter as base for logarithm
  Math.log = (function () {
    var log = Math.log;
    return function (n, base) {
      return log(n) / (base ? log(base) : 1);
    };
  })();

  function get_url_parameter(needed_param, gmap_url) {
    var sURLVariables = (gmap_url.split('?'))[1];
    if (typeof sURLVariables === "undefined") {
      return sURLVariables;
    }
    sURLVariables = sURLVariables.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
      var sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] == needed_param) {
        return sParameterName[1];
      }
    }
  }

  function get_newMap_oldUrl_coordinates(url) {
    var coordinates = {},
        split, distance;

    split = url.split('!3d');
    coordinates.latitude = split[1];
    split = split[0].split('!2d');
    coordinates.longitude = split[1];
    split = split[0].split('!1d');
    distance = split[1];
    coordinates.zoom = 21 - Math.round(Math.log(Math.round(distance / 218), 2));

    return coordinates;
  }

  function get_newMap_newUrl_coordinates(url) {
    var coordinates = {};

    url = url.split('@')[1];
    url = url.split('z/')[0];
    url = url.split(',');

    coordinates.latitude = url[0];
    coordinates.longitude = url[1];
    coordinates.zoom = url[2];

    if (coordinates.zoom.indexOf('z') >= 0) {
      coordinates.zoom = coordinates.zoom.substring(0, coordinates.zoom.length - 1);
    }

    return coordinates;
  }

  function get_oldMap_coordinates(url) {
    var coordinates = {},
        variables;

    variables = get_url_parameter('ll', url);
    if (typeof variables == "undefined") {
      variables = get_url_parameter('sll', url);
    }

    if (typeof variables == "undefined") {
      return variables;
    }

    variables = variables.split(',');
    coordinates.latitude = variables[0];
    coordinates.longitude = variables[1];

    coordinates.zoom = get_url_parameter('z', url);
    if (typeof coordinates.zoom === "undefined") {
      coordinates.zoom = 10;
    }

    return coordinates;
  }

  var gmapInit = function ($element) {

    var $gmaps = $element.find('.gmap'),
        $imageMarkup = $('.js-map-pin').html();

    if ($gmaps.length && typeof google !== 'undefined') {
      if (globalDebug) {
        console.log("GMap Init");
      }

      $gmaps.each(function () {

        var $gmap = $(this),
            links = {},
            gmap_style = typeof $gmap.data('customstyle') !== "undefined" ? "style1" : google.maps.MapTypeId.ROADMAP,
            pins = [],
            zoom = 11,
            linksNumber = 0;

        links = $gmap.data('pins');

        $.each(links, function (label, url) {
          var coordinates;
          if (url) {
            coordinates = get_oldMap_coordinates(url);
            if (typeof variables == "undefined") {
              coordinates = url.split('!3d')[0] !== url ? get_newMap_oldUrl_coordinates(url) : get_newMap_newUrl_coordinates(url);
            }
            if (typeof coordinates !== "undefined" && coordinates.latitude && coordinates.longitude) {
              pins.push({
                latLng: [coordinates.latitude, coordinates.longitude],
                options: {
                  content: '<div class="gmap__marker"><div class="gmap__marker__btn">' + label + '</div>' + $imageMarkup + '</div>'
                }
              });
              if (coordinates.zoom !== "undefined" && ++linksNumber === 1) {
                zoom = parseInt(coordinates.zoom);
              }
            }
          }
        });

        // if there were no pins we could handle get out
        if (!pins.length) {
          return;
        }

        $gmap.gmap3({
          map: {
            options: {
              zoom: zoom,
              mapTypeId: gmap_style,
              mapTypeControl: false,
              panControl: true,
              panControlOptions: {
                position: google.maps.ControlPosition.LEFT_CENTER
              },
              zoomControl: true,
              zoomControlOptions: {
                style: google.maps.ZoomControlStyle.LARGE,
                position: google.maps.ControlPosition.LEFT_CENTER
              },
              scaleControl: true,
              streetViewControl: true,
              streetViewControlOptions: {
                position: google.maps.ControlPosition.LEFT_CENTER
              },
              scrollwheel: false
            }
          },
          overlay: {
            values: pins
          },
          styledmaptype: {
            id: "style1",
            styles: [{
              "stylers": [{
                "saturation": -100
              },
              {
                "gamma": 0.8
              },
              {
                "contrast": 1.35
              },
              {
                "visibility": "simplified"
              }]
            },
            {
              "featureType": "administrative",
              "stylers": [{
                "visibility": "on"
              }]
            }]
          }
        }, "autofit");

        var map = $gmap.gmap3("get");

        google.maps.event.addListenerOnce(map, 'idle', function () {
          if (typeof map == "undefined") return;

          if (1 < pins.length) {
            map.setZoom(map.getZoom() - 1);
          } else {
            map.setZoom(zoom);
          }
        });

      });

    }
  };

  //global isotope variables
  var $isotope_container, max_isotope_pages, is_everything_loaded, isotope_page_counter, isotope_ready_to_filter, /* will use this variable to determine if we can filter */
  $isotope_pending_filter = null;

  /* --- Isotope Init --- */

  function isotopeInit() {
    if (globalDebug) {
      console.group("IsotopeInit");
      console.log("Isotope Init");
    }

    //initialize global variables
    $isotope_container = $('.masonry');

    if (!empty($isotope_container)) {
      max_isotope_pages = $isotope_container.data('maxpages');
      is_everything_loaded = false;

      isotopeRun();

      //force the infinite scroll to wait for the first images to lead before doing it's thing
      if ($isotope_container.hasClass('infinite_scroll')) {
        $isotope_container.imagesLoaded(function () {
          isotopeInfiniteScrollingInit();
        });
      }

      isotopeFilteringInit();
    }

    if (globalDebug) {
      console.groupEnd();
    }
  } //end isotopeInit
  /* --- Isotope Update --- */

  function isotopeUpdateLayout() {
    if (globalDebug) {
      console.log("Isotope Update Layout");
    }

    if (!empty($isotope_container) && $isotope_container.length) {
      $isotope_container.isotope('layout');
    }
  }

  /* --- Isotope Destroy --- */

  function isotopeDestroy() {
    if (globalDebug) {
      console.log("Isotope Destroy");
    }

    if (!empty($isotope_container) && $isotope_container.length) {
      $isotope_container.isotope('destroy');
    }
  }


  /* --- Layout Refresh --- */

  function layoutRefresh() {
    if (globalDebug) {
      console.log("Isotope Layout Refresh");
    }

    isotopeUpdateLayout();
  }

  /* --- Isotope Run --- */

  function isotopeRun() {
    if (!empty($isotope_container) && $isotope_container.length) {
      if (globalDebug) {
        console.log("Isotope Initialization (isotopeRun)");
      }

      // Isotope init
      var isOriginLeft = !$('body').hasClass('rtl');
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

      $isotope_container.isotope('on', 'arrangeComplete', function () {
        // Parallax.initialize();
      });

      $isotope_container.isotope('on', 'layoutComplete', function () {
        // Parallax.initialize();
        $('.archive-blog').addClass('loaded');
        $('.filter, .filter__tags-container').addClass('usable');

      });

    }
  }

  /* -- Isotope Infinite Scrolling Initialization --- */

  function isotopeInfiniteScrollingInit() {
    if (globalDebug) {
      console.log("Isotope Infinite Scroll Init");
    }

    isotope_page_counter = 1;

    // if all projects are already loaded, no infinite scroll is required
    if ($('.projects--grid').data('projects-per-page') >= $('.projects--grid').data('total-posts')) {
      $('.load-more__container').hide();
    }

    $isotope_container.infinitescroll({
      navSelector: 'ol.pagination',
      // selector for the paged navigation
      nextSelector: 'ol.pagination a.next',
      // selector for the NEXT link
      itemSelector: 'article.project',
      // selector for all items you'll retrieve
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
      errorCallback: function () {}
      // called when a requested page 404's or when there is no more content
      // new in 1.2
    },
    // trigger Isotope as a callback


    function (newElements, data, url) {

      newElements.forEach(function (e) {
        $(e).css('opacity', 0);
      });

      var $newElems = $(newElements);

      isotope_ready_to_filter = false;

      infiniteScrollingRefreshComponents($isotope_container);

      if (globalDebug) {
        console.log("Infinite Scroll - Adding new " + $newElems.length + " items to the DOM");
      }

      // ensure that images load before adding to masonry layout
      $newElems.imagesLoaded(function () {

        $isotope_container.isotope('appended', $newElems);

        if (globalDebug) {
          console.log("Isotope Infinite Scroll Loaded Next Page");
        }

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
        if (!empty($isotope_pending_filter)) {
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
    if (globalDebug) {
      console.log("Infinite Scroll Init - ON CLICK");
    }

    // unbind normal behavior. needs to occur after normal infinite scroll setup.
    $(window).unbind('.infscr');

    $('.load-more__container .btn').click(function () {

      $(this).addClass('loading');
      $container.infinitescroll('retrieve');

      return false;
    });

    // remove the paginator when we're done.
    $(document).ajaxError(function (e, xhr, opt) {
      if (xhr.status == 404) {
        $('.load-more__container').fadeOut('slow');
      }
    });
  }

  //in case you need to control infinitescroll


  function infiniteScrollingPause() {
    if (globalDebug) {
      console.log("Isotope Infinite Scroll Pause");
    }

    $isotope_container.infinitescroll('pause');
  }

  function infiniteScrollingResume() {
    if (globalDebug) {
      console.log("Isotope Infinite Scroll Resume");
    }

    $isotope_container.infinitescroll('resume');
  }

  function infiniteScrollingDestroy() {
    if (globalDebug) {
      console.log("Isotope Infinite Scroll Destroy");
    }

    $isotope_container.infinitescroll('destroy');
  }

  function infiniteScrollingRefreshComponents($container) {
    if (globalDebug) {
      console.log("Infinite Scroll - Refresh Components");
    }

    //royalSliderInit($container);
    //niceScrollInit();
    //initVideos();
    //resizeVideos();
  }

  /* --- Portfolio filtering --- */

  function isotopeFilteringInit() {
    if (globalDebug) {
      console.log("Isotope Filtering Init");
    }

    isotope_ready_to_filter = true;

    // bind filter buttons on click
    $('#filters').on('click', 'button', function (e) {
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

        if (globalDebug) {
          console.log("Isotope Page Counter = " + isotope_page_counter + " | Max Pages = " + max_isotope_pages);
        }

        if (!is_everything_loaded) { //we need to do some loading
          if (globalDebug) {
            console.log("Isotope Filtering - Loading the rest of the pages so we can start filtering");
          }

          //we need to force the loading of the next page
          //first we need to remember this filter button
          $isotope_pending_filter = $(this);
          //now fire up the infiniteScroll
          $(this).addClass('loading');
          $isotope_container.infinitescroll('retrieve');

        } else { //all is good, just filter
          if (globalDebug) {
            console.log("Isotope Filtering - Filter by " + filterValue);
          }

          $isotope_container.isotope({
            filter: filterValue
          });
        }

      } else {
        if (globalDebug) {
          console.log("Isotope Filtering - NOT READY TO FILTER");
        }
      }

      return false;

    }); //end filtering on click
  } /* --- Magnific Popup Initialization --- */

  function magnificPopupInit() {
    if (globalDebug) {
      console.log("Magnific Popup - Init");
    }

    $('.content').each(function () { // the containers for all your galleries should have the class gallery
      $(this).magnificPopup({
        delegate: 'a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".gif"]',
        // the container for each your gallery items
        type: 'image',
        closeOnContentClick: false,
        closeBtnInside: false,
        removalDelay: 500,
        mainClass: 'mfp-fade',
        image: {
          markup: '<div class="mfp-figure">' + '<div class="mfp-img"></div>' + '<div class="mfp-bottom-bar">' + '<div class="mfp-counter"></div>' + '<div class="mfp-title"></div>' + '</div>' + '</div>',
          titleSrc: function (item) {
            var output = '';
            if (typeof item.el.attr('data-alt') !== "undefined" && item.el.attr('data-alt') !== "") {
              output += '<small>' + item.el.attr('data-alt') + '</small>';
            }
            return output;
          }
        },
        gallery: {
          enabled: true,
          navigateByImgClick: true,
          //arrowMarkup: '<a href="#" class="gallery-arrow gallery-arrow--%dir% control-item arrow-button arrow-button--%dir%">%dir%</a>'
          tCounter: '%curr% ' + objectl10n.tCounter + ' %total%'
        },
        callbacks: {
          elementParse: function (item) {

            if (this.currItem != undefined) {
              item = this.currItem;
            }

            var output = '';
            if (typeof item.el.attr('data-alt') !== "undefined" && item.el.attr('data-alt') !== "") {
              output += '<small>' + item.el.attr('data-alt') + '</small>';
            }

            $('.mfp-title').html(output);
          },
          change: function (item) {
            var output = '';
            if (typeof item.el.attr('data-alt') !== "undefined" && item.el.attr('data-alt') !== "") {
              output += '<small>' + item.el.attr('data-alt') + '</small>';
            }

            $('.mfp-title').html(output);
          },
          open: function () {
            $('html').addClass('mfp--is-open');

            $('html').bind('touchmove', function (e) {
              e.preventDefault()
            })
          },
          close: function () {
            $('html').removeClass('mfp--is-open');

            $('html').unbind('touchmove');
          }
        }
      });
    });

    $('.js-gallery').each(function () { // the containers for all your galleries should have the class gallery
      $(this).magnificPopup({
        delegate: '.mfp-image, .mfp-video',
        // the container for each your gallery items
        mainClass: 'mfp-fade',
        closeOnBgClick: true,
        closeBtnInside: false,
        image: {
          markup: '<div class="mfp-figure">' + '<div class="mfp-img"></div>' + '<div class="mfp-bottom-bar">' + '<div class="mfp-counter"></div>' + '<div class="mfp-title"></div>' + '</div>' + '</div>'
        },
        iframe: {
          markup: '<div class="mfp-figure">' + '<div class="mfp-iframe-scaler">' + '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>' + '</div>' + '<div class="mfp-bottom-bar">' + '<div class="mfp-counter"></div>' + '<div class="mfp-title mfp-title--video"></div>' + '</div>' + '</div>',
          patterns: {
            youtube: {
              index: 'youtube.com/',
              // String that detects type of video (in this case YouTube). Simply via url.indexOf(index).
              id: function (url) {
                var video_id = url.split('v=')[1];
                var ampersandPosition = video_id.indexOf('&');
                if (ampersandPosition != -1) {
                  video_id = video_id.substring(0, ampersandPosition);
                }

                return video_id;
              },
              // String that splits URL in a two parts, second part should be %id%
              // Or null - full URL will be returned
              // Or a function that should return %id%, for example:
              // id: function(url) { return 'parsed id'; }
              src: '//www.youtube.com/embed/%id%' // URL that will be set as a source for iframe.
            },
            youtu_be: {
              index: 'youtu.be/',
              // String that detects type of video (in this case YouTube). Simply via url.indexOf(index).
              id: '.be/',
              // String that splits URL in a two parts, second part should be %id%
              // Or null - full URL will be returned
              // Or a function that should return %id%, for example:
              // id: function(url) { return 'parsed id'; }
              src: '//www.youtube.com/embed/%id%' // URL that will be set as a source for iframe.
            },

            vimeo: {
              index: 'vimeo.com/',
              id: '/',
              src: '//player.vimeo.com/video/%id%'
            },
            gmaps: {
              index: '//maps.google.',
              src: '%id%&output=embed'
            }
            // you may add here more sources
          },
          srcAction: 'iframe_src' // Templating object key. First part defines CSS selector, second attribute. "iframe_src" means: find "iframe" and set attribute "src".
        },
        gallery: {
          enabled: true,
          navigateByImgClick: true,
          tCounter: '%curr% ' + objectl10n.tCounter + ' %total%'
        },
        callbacks: {
          change: function (item) {
            $(this.content).find('iframe').each(function () {
              var url = $(this).attr("src");
              $(this).attr("src", setQueryParameter(url, "wmode", "transparent"));
            });
          },
          elementParse: function (item) {
            if (globalDebug) {
              console.log("Magnific Popup - Parse Element");
            }

            $(item).find('iframe').each(function () {
              var url = $(this).attr("src");
              $(this).attr("src", url + "?wmode=transparent");
            });
          },
          markupParse: function (template, values, item) {
            values.title = '<span class="title">' + item.el.attr('data-title') + '</span>' + '<span class="description">' + item.el.attr('data-caption') + '</span>';
          },
          open: function () {
            $('html').addClass('mfp--is-open');

            $('html').bind('touchmove', function (e) {
              e.preventDefault()
            })
          },
          close: function () {
            $('html').removeClass('mfp--is-open');

            $('html').unbind('touchmove');
          }
        }
      });
    });

  }

  function navigationInit() {

    var showingNav = false,
        $trigger = $('.navigation__trigger, .navigation__menu-label'),
        $navTrigger = $('.navigation__trigger'),
        $triggerTop = $navTrigger.children('.trigger__top'),
        $triggerMiddle = $navTrigger.children('.trigger__middle'),
        $triggerBottom = $navTrigger.children('.trigger__bottom'),
        $nav = $('.overlay--navigation'),
        $current = $('.menu--main-menu').children('[class*="current-menu"]').children('a'),
        isOpen = false,
        $horMenu = $('.js-horizontal-menu');

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

    $('.navigation__links-trigger').on('click', function () {
      $(this).toggleClass('active');
    });

    // Toggle navigation on click
    $trigger.on('click', navToggle);

    // Close menu with ESC key
    $(document).on('keydown', function (e) {
      if (e.keyCode == 27 && isOpen) {
        navToggle(e);
      }
    });

    function navToggle(e) {
      e.preventDefault();
      e.stopPropagation();

      var $label = $('.navigation__menu-label'),
          $open = $label.find('.label--open'),
          $close = $label.find('.label--close'),
          tl1, tl2;

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

        tl1 = new TimelineMax({
          paused: true
        });

        tl1.to($triggerTop, 0.2, {
          rotation: 45,
          y: 7,
          force3D: true
        });
        tl1.to($triggerMiddle, 0.2, {
          opacity: 0
        }, '-=0.2');
        tl1.to($triggerBottom, 0.2, {
          rotation: -45,
          y: -7,
          force3D: true
        }, '-=0.2');

        tl1.to($navTrigger, 0.2, {
          scale: 0.8
        }, '-=0.1');
        tl1.to($navTrigger, 0.2, {
          scale: 1,
          ease: Quad.easeOut
        });

        showMenuLabel();

        tl1.play();

        isOpen = true;

      } else {

        if (latestKnownScrollY > 60) showMenuLinks(true);

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

        tl2 = new TimelineMax({
          paused: true
        });

        tl2.to($triggerTop, 0.2, {
          rotation: 0,
          y: 0,
          force3D: true
        });
        tl2.to($triggerMiddle, 0.2, {
          opacity: 1
        }, '-=0.2');
        tl2.to($triggerBottom, 0.2, {
          rotation: 0,
          y: 0,
          force3D: true
        }, '-=0.2');

        tl2.to($navTrigger, 0.2, {
          scale: 1,
          force3D: true
        });

        tl2.play();

        isOpen = false;
      }
    }

    (function () {
      if (Modernizr.touch) {
        $('.site-navigation .menu-item-has-children > a').on('touchstart', function (e) {
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
    $('.menu-item > a').on('touchstart mouseenter focus', function (e) {
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
        timeline = new TimelineMax({
        paused: true
      });


    function showMenuLinks(forced) {
      if ($hasNavLinks && $horMenu.length) {
        TweenMax.to($horMenu, duration, {
          y: -40,
          opacity: 0
        });
      } else {
        TweenMax.to($label, duration, {
          y: -40,
          opacity: 0
        });
      }

      if (forced) {
        if ($hasNavLinks && $horMenu.length) {
          TweenMax.to($horMenu, 0, {
            y: -40,
            opacity: 0
          });
        } else {
          TweenMax.to($label, 0, {
            y: -40,
            opacity: 0
          });
        }
      }

      TweenMax.to($links, duration, {
        y: 0,
        opacity: 1,
        pointerEvents: 'auto'
      });
    }

    function showMenuLabel() {
      if ($hasNavLinks && $horMenu.length) {
        TweenMax.to($horMenu, duration, {
          y: 0,
          opacity: 1
        });
      } else {
        TweenMax.to($label, duration, {
          y: 0,
          opacity: 1
        });
      }

      $('.navigation__links-trigger').removeClass('active');

      TweenMax.to($links, duration, {
        y: 40,
        opacity: 0,
        pointerEvents: 'none'
      });
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
    if ($horMenu.length) {
      // Clone elements from horizontal menu and mark them
      var $menuItems = $horMenu.children().clone();
      $menuItems.each(function (index, element) {
        $(this).addClass('item--is-adopted');
      })

      // If there is no main maiu selected, remove "Please select a menu" message
      $('.js-main-menu').find('.placeholder').remove();

      // Append horizontal menu items
      $('.js-main-menu').append($menuItems);
    }
  }

  function niceScrollInit() {

    var smoothScroll = $('body').data('smoothscrolling') !== undefined;

    if (smoothScroll && !Modernizr.touch && !ieMobile && !iOS && !isMac) {

      var $window = $window || $(window); // Window object
      $window.on("mousewheel DOMMouseScroll", function (event) {

        var scrollTo, scrollDistance = 400,
            delta;

        if (event.type == 'mousewheel') {
          delta = event.originalEvent.wheelDelta / 120;
        }
        else if (event.type == 'DOMMouseScroll') {
          delta = -event.originalEvent.detail / 3;
        }

        scrollTo = latestKnownScrollY - delta * scrollDistance;

        if ($(event.target).closest('.overlay--navigation').length) {
          return;
        }

        if (scrollTo) {

          event.preventDefault();

          TweenMax.to($window, .6, {
            scrollTo: {
              y: scrollTo,
              autoKill: true
            },
            ease: Power1.easeOut,
            // For more easing functions see http://api.greensock.com/js/com/greensock/easing/package-detail.html
            autoKill: true,
            overwrite: 5
          });

        }

      });

    }

  }


  var Parallax = {
    selector: '.js-hero-bg',
    covers: $([]),
    amount: 0,
    initialized: false,
    start: 0,
    stop: 0,

    initialize: function () {
      var that = this;

      // if this is a touch device initialize the slider and skip the complicated part
      if ((Modernizr.touch || is_ie) && !this.initialized) {

        $('.hero').each(function (i, hero) {

          var $hero = $(hero),
              $cover = $hero.children('.hero__bg'),
              $image = $cover.find('img').not('.gmap img');

          $hero.find('.hero__bg').show();

          if (!$image.length) {
            $image = $cover.children('picture').children('img');
          }

          if ($image.length) {

            var imageWidth = $image.css('width', 'auto').outerWidth(),
                imageHeight = $image.outerHeight(),
                heroHeight = $hero.outerHeight(),
                scaleX = windowWidth / imageWidth;
            scaleY = windowHeight / imageHeight;
            scale = Math.max(scaleX, scaleY);
            newWidth = parseInt(imageWidth * scale);

            $image.css('width', newWidth);
          }

          if (is_ie) {
            $hero.css('min-height', windowHeight);
          }

          gmapInit($hero);

          // $hero.find('.hero__slider').data('imagescale', 'fill');
          royalSliderInit($hero);
        });

        return;
      }

      this.stop = documentHeight - windowHeight;
      this.amount = $body.data('parallax-speed');
      this.initialized = true;

      // clean up
      $('.covers').empty();

      $('.js-hero-bg').each(function (i, cover) {

        // grab all the variables we need
        var $cover = $(cover),
            opacity = $cover.css('opacity'),
            $target = $cover.children().not('span'),
            $image = $target.filter('img'),
            $slider = $target.not('img'),
            $clone = $cover.clone(),
            $cloneTarget = $clone.children().not('span'),
            $cloneImage = $cloneTarget.filter('img'),
            $cloneSlider = $cloneTarget.not('img'),
            imageWidth = $image.outerWidth(),
            imageHeight = $image.outerHeight(),
            $hero = $cover.parent(),
            heroHeight = $hero.outerHeight(),
            heroOffset = $hero.offset(),
            adminBar = parseInt($html.css('marginTop')),
            amount = that.amount,




            // we may need to scale the image up or down
             // so we need to find the max scale of both X and Y axis
            scaleX, scaleY, scale, newWidth, distance, speeds = {
            static: 0,
            slow: 0.25,
            medium: 0.5,
            fast: 0.75,
            fixed: 1
            };

        $cover.removeAttr('style');
        $clone.data('source', $cover).appendTo('.covers').show();
        $clone.css('height', heroHeight);

        // let's see if the user wants different speed for different whateva'
        if (typeof parallax_speeds !== "undefined") {
          $.each(speeds, function (speed, value) {
            if (typeof parallax_speeds[speed] !== "undefined") {
              if ($hero.is(parallax_speeds[speed])) {
                amount = value;
              }
            }
          });
        }

        scaleX = windowWidth / imageWidth;
        scaleY = (heroHeight + (windowHeight - heroHeight) * amount) / imageHeight;
        scale = Math.max(scaleX, scaleY);
        newWidth = parseInt(imageWidth * scale);
        distance = (windowHeight - heroHeight) * amount;

        // set the new width, the image should have height: auto to scale properly
        $cloneImage.css('width', newWidth);

        // if there's a slider we are working with we may have to set the height
        $cloneSlider.css('height', heroHeight + distance);

        // align the clone to its surrogate
        // we use TweenMax cause it'll take care of the vendor prefixes
        TweenMax.to($clone, 0, {
          y: heroOffset.top - adminBar
        });

        // prepare image / slider timeline
        var parallax = {
          start: heroOffset.top - windowHeight - distance,
          end: heroOffset.top + heroHeight + distance,
          timeline: new TimelineMax({
            paused: true
          })
        },


            // the container timeline
            parallax2 = {
            start: 0,
            end: documentHeight,
            timeline: new TimelineMax({
              paused: true
            })
            };

        // move the image for a parallax effect
        parallax.timeline.fromTo($cloneTarget, 1, {
          y: '-=' + (windowHeight + heroHeight + 2 * distance) * amount / 2
        }, {
          y: '+=' + (windowHeight + heroHeight + 2 * distance) * amount,
          ease: Linear.easeNone,
          force3D: true
        });

        parallax.timeline.fromTo($cloneSlider.find('.hero__content, .hero__caption'), 1, {
          y: '+=' + windowHeight * amount
        }, {
          y: '-=' + windowHeight * amount * 2,
          ease: Linear.easeNone,
          force3D: true
        }, '-=1');

        // move the container to match scrolling
        parallax2.timeline.fromTo($clone, 1, {
          y: heroOffset.top
        }, {
          y: heroOffset.top - documentHeight,
          ease: Linear.easeNone,
          force3D: true
        });

        // set the parallax info as data attributes on the clone to be used on update
        $clone.data('parallax', parallax).data('parallax2', parallax2);

        // update progress on the timelines to match current scroll position
        that.update();

        // or the slider
        royalSliderInit($clone);
        gmapInit($clone);

        if (that.initialized) {
          TweenMax.to($clone, .3, {
            'opacity': 1
          });
        }

      });

    },

    update: function () {

      if (Modernizr.touch || is_ie || latestKnownScrollY > this.stop || latestKnownScrollY < this.start) {
        return;
      }

      $('.covers .js-hero-bg').each(function (i, cover) {
        var $cover = $(cover),
            parallax = $cover.data('parallax'),
            parallax2 = $cover.data('parallax2'),
            progress = (latestKnownScrollY - parallax.start) / (parallax.end - parallax.start),
            progress2 = (latestKnownScrollY - parallax2.start) / (parallax2.end - parallax2.start);

        progress = 0 > progress ? 0 : progress;
        progress = 1 < progress ? 1 : progress;

        progress2 = 0 > progress2 ? 0 : progress2;
        progress2 = 1 < progress2 ? 1 : progress2;

        parallax.timeline.progress(progress);
        parallax2.timeline.progress(progress2);
      });

    }
  };
  // Platform Detection


  function getIOSVersion(ua) {
    ua = ua || navigator.userAgent;
    return parseFloat(('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(ua) || [0, ''])[1]).replace('undefined', '3_2').replace('_', '.').replace('_', '')) || false;
  }

  function getAndroidVersion(ua) {
    var matches;
    ua = ua || navigator.userAgent;
    matches = ua.match(/[A|a]ndroid\s([0-9\.]*)/);
    return matches ? matches[1] : false;
  }

  function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
      // IE 11 => return version number
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
      // IE 12 => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
  }

  function platformDetect() {

    var navUA = navigator.userAgent.toLowerCase(),
        navPlat = navigator.platform.toLowerCase();

    var nua = navigator.userAgent;

    isiPhone = navPlat.indexOf("iphone");
    isiPod = navPlat.indexOf("ipod");
    isAndroidPhone = ((nua.indexOf('Mozilla/5.0') !== -1 && nua.indexOf('Android ') !== -1 && nua.indexOf('AppleWebKit') !== -1) && nua.indexOf('Chrome') === -1);
    isSafari = navUA.indexOf('safari') != -1 && navUA.indexOf('chrome') == -1;
    ieMobile = ua.match(/Windows Phone/i) ? true : false;
    iOS = getIOSVersion();
    android = getAndroidVersion();
    isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    is_ie = detectIE();

    if (Modernizr.touch) {
      $html.addClass('touch');
    }

    if (iOS && iOS < 8) {
      $html.addClass('no-scroll-fx')
    }

    if (is_ie) {
      $body.addClass('is--IE');
    }

    if (ieMobile) {
      $html.addClass('is--ie-mobile');
    }

    if (isAndroidPhone) $html.addClass('is--ancient-android');
  } /* --- $VIDEOS --- */

  // function used to resize videos to fit their containers by keeping the original aspect ratio


  function initVideos() {
    if (globalDebug) {
      console.group("videos::init");
    }

    var videos = $('.youtube-player, .entry-media iframe, .entry-media video, .entry-media embed, .entry-media object, iframe[width][height]');

    // Figure out and save aspect ratio for each video
    videos.each(function () {
      $(this).attr('data-aspectRatio', this.width / this.height)
      // and remove the hard coded width/height
      .removeAttr('height').removeAttr('width');
    });

    resizeVideos();

    // Firefox Opacity Video Hack
    $('iframe').each(function () {
      var url = $(this).attr("src");
      if (!empty(url)) $(this).attr("src", setQueryParameter(url, "wmode", "transparent"));
    });

    if (globalDebug) {
      console.groupEnd();
    }
  }

  function resizeVideos() {
    if (globalDebug) {
      console.group("videos::resize");
    }

    var videos = $('.youtube-player, .entry-media iframe, .entry-media video, .entry-media embed, .entry-media object, iframe[data-aspectRatio]');

    videos.each(function () {
      var video = $(this),
          ratio = video.attr('data-aspectRatio'),
          w = video.css('width', '100%').width(),
          h = w / ratio;

      video.height(h);
    });

    if (globalDebug) {
      console.groupEnd();
    }
  } /* --- Royal Slider Init --- */

  function royalSliderInit($container) {
    $container = typeof $container !== 'undefined' ? $container : $('body');

    // Transform Wordpress Galleries to Sliders
    $container.find('.wp-gallery').each(function () {
      sliderMarkupGallery($(this));
    });

    // Find and initialize each slider
    $container.find('.js-pixslider').each(function () {

      sliderInit($(this));

      var $sliderContainer = $(this),
          slider = $(this).data('royalSlider'),
          lastSlide = 0,


          // Sir Hackalot
          $sourceContent = $sliderContainer.closest('.hero__bg').data('source');

      if (!slider.slides.length) {
        return;
      }

      var firstSlide = slider.slides[0],
          firstSlideContent = $(firstSlide.content),
          $video = firstSlideContent.hasClass('video') ? firstSlideContent : firstSlideContent.find('.video'),
          firstSlideAutoPlay = typeof $video.data('video_autoplay') !== "undefined";

      if (Modernizr.touch) firstSlideAutoPlay = false;

      if (firstSlideAutoPlay) {
        firstSlide.holder.on('rsAfterContentSet', function () {
          slider.playVideo();
        });
      }

      var $destination = $sliderContainer.parent(),
          $source = $(slider.currSlide.content).children();

      if ($destination.is('.js-projects-slider')) {
        $destination.removeClass('hero--light hero--shadowed hero--dark');
        $destination.toggleClass('hero--light', $source.hasClass('hero--light'));
        $destination.toggleClass('hero--shadowed', $source.hasClass('hero--shadowed'));
        $destination.toggleClass('hero--dark', $source.hasClass('hero--dark'));
      }

      slider.ev.on('rsBeforeAnimStart', function (event) {
        // transitions
        var $lastSlide = $(slider.slides[lastSlide].content),
            $description = $lastSlide.find('.hero__description'),
            timeline = new TimelineMax({
            paused: true
          }),
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

        if ((typeof lastMain == "undefined" || !lastMain.length) && $description.length) {
          lastMain = $description.find('.hero__title, .huge, .large').first();
          lastAbove = lastMain.prevAll().add($description.prevAll());
          lastBelow = lastMain.nextAll().add($description.nextAll());

        }

        if (typeof lastMain !== "undefined" && lastMain.length != 0) {
          lastAbove = lastMain.prevAll();
          lastBelow = lastMain.nextAll();

          timeline.to(lastMain, .44, {
            scale: 0.7,
            z: 0.01,
            ease: Power3.easeOut
          });
          timeline.to(lastAbove, .44, {
            y: 40,
            z: 0.01,
            ease: Quad.easeOut
          }, '-=.44');
          timeline.to(lastBelow, .44, {
            y: -40,
            z: 0.01,
            ease: Quad.easeOut
          }, '-=.44');
          timeline.to(lastMain, .34, {
            opacity: 0,
            ease: Quad.easeOut
          }, '-=.34');
          timeline.to(lastAbove, .34, {
            opacity: 0,
            ease: Quad.easeOut
          }, '-=.34');
          timeline.to(lastBelow, .34, {
            opacity: 0,
            ease: Quad.easeOut
          }, '-=.34');

          timeline.to(lastMain, 0, {
            scale: 1,
            z: 0.01
          });
          timeline.to(lastAbove, 0, {
            opacity: 0,
            y: 0,
            z: 0.01
          });
          timeline.to(lastBelow, 0, {
            opacity: 0,
            y: 0,
            z: 0.01
          });
        } else {
          nextBelow = $lastSlide.find('.hero__title, .hero__subtitle, .hero__btn, .hero__description');
          timeline.to(nextBelow, 0, {
            opacity: 1
          });
          timeline.fromTo(nextBelow, .45, {
            y: 0,
            z: 0.01
          }, {
            y: -40,
            z: 0.01,
            opacity: 0,
            ease: Sine.easeOut
          });
        }

        timeline.play();

        lastSlide = slider.currSlideId;
      });

      // auto play video sliders if is set so
      slider.ev.on('rsAfterSlideChange', function (event) {
        var $slide_content = $(slider.currSlide.content),
            $video = $slide_content.hasClass('video') ? $slide_content : $slide_content.find('.video'),
            rs_videoAutoPlay = typeof $video.data('video_autoplay') !== "undefined";

        if (Modernizr.touch) rs_videoAutoPlay = false;

        if (rs_videoAutoPlay) {

          setTimeout(function () {
            slider.stopVideo();
            slider.playVideo();
          }, 150);
        }

        $destination = $sliderContainer.parent();
        $source = $(slider.currSlide.content).children();

        if ($destination.is('.js-projects-slider')) {
          $destination.removeClass('hero--light hero--shadowed hero--dark');
          $destination.toggleClass('hero--light', $source.hasClass('hero--light'));
          $destination.toggleClass('hero--shadowed', $source.hasClass('hero--shadowed'));
          $destination.toggleClass('hero--dark', $source.hasClass('hero--dark'));
        }

        // transitions
        var $nextSlide = $(slider.currSlide.content),
            $description = $nextSlide.find('.hero__description'),
            timeline = new TimelineMax({
            paused: true
          }),
            nextAbove, nextMain, nextBelow, letterspacing;

        if (typeof $sourceContent !== "undefined" && $sourceContent.siblings('.hero__content').length && slider.currSlideId == 0) {
          $nextSlide = $sourceContent.siblings('.hero__content');
          $description = $nextSlide.find('.hero__description');
        } else {
          $nextSlide = $container.find('.hero__content');
          $description = $container.find('.hero__description');
        }

        nextMain = $nextSlide.find('.hero__title');

        if ((typeof nextMain == "undefined" || !nextMain.length) && $description.length) {
          nextMain = $description.find('.hero__title, .huge, .large').first();
          nextAbove = nextMain.prevAll().add($description.prevAll());
          nextBelow = nextMain.nextAll().add($description.nextAll());
        }

        if (typeof nextMain !== "undefined" && nextMain.length != 0) {
          nextAbove = nextMain.prevAll();
          nextBelow = nextMain.nextAll();

          timeline.to(nextMain, 0, {
            scale: 1,
            z: 0.01
          });
          timeline.to(nextAbove, 0, {
            opacity: 0,
            y: 0,
            z: 0.01
          });
          timeline.to(nextBelow, 0, {
            opacity: 0,
            y: 0,
            z: 0.01
          });

          // Slides Content Transitions
          // Title
          timeline.fromTo(nextMain, .25, {
            opacity: 0
          }, {
            opacity: 1
          });
          timeline.fromTo(nextMain, .45, {
            'scale': 1.4,
            z: 0.01
          }, {
            'scale': 1,
            z: 0.01,
            opacity: 1,
            ease: Sine.easeOut
          }, '-=.24');
          // Subtitle
          timeline.fromTo(nextAbove, .45, {
            y: 40
          }, {
            y: 0,
            z: 0.01,
            opacity: 1,
            ease: Back.easeOut
          }, '-=.25');
          // Description
          timeline.fromTo(nextBelow, .45, {
            y: -40
          }, {
            y: 0,
            z: 0.01,
            opacity: 1,
            ease: Back.easeOut
          }, '-=.45');
        } else {
          nextBelow = $nextSlide.find('.hero__title, .hero__subtitle, .hero__btn, .hero__description');
          timeline.to(nextBelow, 0, {
            opacity: 0
          });
          timeline.fromTo(nextBelow, .45, {
            y: -40,
            z: 0.01
          }, {
            y: 0,
            z: 0.01,
            opacity: 1,
            ease: Sine.easeOut
          });
        }

        setTimeout(function () {
          timeline.play();
        }, 150);
      });

      // after destroying a video remove the autoplay class (this way the image gets visible)
      slider.ev.on('rsOnDestroyVideoElement', function (i, el) {

        var $slide_content = $(this.currSlide.content),
            $video = $slide_content.hasClass('video') ? $slide_content : $slide_content.find('.video');

        $video.removeClass('video_autoplay');

      });

      if (Modernizr.touch) {
        $window.on('resize', function () {
          setTimeout(function () {
            slider.updateSliderSize(true);
          }, 100);
        });
      }

      if (typeof $sliderContainer.data('animated') == "undefined") {
        $sliderContainer.data('animated', true);
        setTimeout(function () {
          animateIn($(firstSlide.content));
        }, 500);
      }

      $sliderContainer.imagesLoaded(function () {
        setTimeout(function () {
          TweenMax.to($sliderContainer.find('.hero__bg'), .3, {
            opacity: 1
          });
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

    var $children = $(this).children(),
        rs_arrows = typeof $slider.data('arrows') !== "undefined",
        rs_bullets = typeof $slider.data('bullets') !== "undefined" ? "bullets" : "none",
        rs_autoheight = typeof $slider.data('autoheight') !== "undefined",
        rs_autoScaleSlider = false,
        rs_autoScaleSliderWidth = typeof $slider.data('autoscalesliderwidth') !== "undefined" && $slider.data('autoscalesliderwidth') != '' ? $slider.data('autoscalesliderwidth') : false,
        rs_autoScaleSliderHeight = typeof $slider.data('autoscalesliderheight') !== "undefined" && $slider.data('autoscalesliderheight') != '' ? $slider.data('autoscalesliderheight') : false,
        rs_customArrows = typeof $slider.data('customarrows') !== "undefined",
        rs_slidesSpacing = typeof $slider.data('slidesspacing') !== "undefined" ? parseInt($slider.data('slidesspacing')) : 0,
        rs_keyboardNav = typeof $slider.data('fullscreen') !== "undefined",
        rs_imageScale = $slider.data('imagescale') || "fill",
        rs_visibleNearby = typeof $slider.data('visiblenearby') !== "undefined",
        rs_imageAlignCenter = typeof $slider.data('imagealigncenter') !== "undefined",


        //rs_imageAlignCenter = false,
        rs_transition = typeof $slider.data('slidertransition') !== "undefined" && $slider.data('slidertransition') != '' ? $slider.data('slidertransition') : 'fade',
        rs_transitionSpeed = 500,
        rs_autoPlay = typeof $slider.data('sliderautoplay') !== "undefined",
        rs_delay = typeof $slider.data('sliderdelay') !== "undefined" && $slider.data('sliderdelay') != '' ? $slider.data('sliderdelay') : '1000',
        rs_drag = true,
        rs_globalCaption = typeof $slider.data('showcaptions') !== "undefined",
        is_headerSlider = $slider.hasClass('hero-slider') ? true : false,
        hoverArrows = typeof $slider.data('hoverarrows') !== "undefined";

    if (rs_autoheight) {
      rs_autoScaleSlider = false;
    } else {
      rs_autoScaleSlider = true;
    }

    if (Modernizr.touch) rs_autoPlay = false;

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

    var royalSlider = $slider.data('royalSlider'),
        slidesNumber = royalSlider.numSlides,
        $arrows = $slider.find('.rsArrows');

    if (typeof $arrows !== "undefined" || !$arrows.length) {
      $arrows.remove();
    }

    // create the markup for the customArrows
    // it's not necessary it if we have only one slide
    if (royalSlider && rs_arrows && slidesNumber > 1) {

      var $gallery_control = $('<div class="rsArrows">' + '<div class="rsArrow rsArrowLeft js-arrow-left"></div>' + '<div class="rsArrow rsArrowRight js-arrow-right"></div>' + '</div>');


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

      var timeline = new TimelineMax({
        paused: true
      }),
          $left = $gallery_control.find('.svg-arrow--left'),
          $right = $gallery_control.find('.svg-arrow--right');

      timeline.fromTo($left, .5, {
        x: 50,
        opacity: 0
      }, {
        x: 0,
        opacity: 1,
        ease: Back.easeOut
      });
      timeline.fromTo($right, .5, {
        x: -50,
        opacity: 0
      }, {
        x: 0,
        opacity: 1,
        ease: Back.easeOut
      }, '-=.5');

      setTimeout(function () {
        timeline.play();
      }, 900);

      $left.parent().on('mouseenter', function () {
        TweenMax.to($left, .2, {
          x: -6
        });
      }).on('mouseleave', function () {
        TweenMax.to($left, .2, {
          x: 0
        })
      });

      $right.parent().on('mouseenter', function () {
        TweenMax.to($right, .2, {
          x: 6
        });
      }).on('mouseleave', function () {
        TweenMax.to($right, .2, {
          x: 0
        })
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
* Resize page so that map repaints for new page DIMENSIONS
*/

/*if
$(window).trigger('resize')
*/

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
    var $mouseX = 0,
        $mouseY = 0;
    var $arrowH = 35,
        $arrowW = 35;

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
        TweenMax.to($arrowIcn, 0, {
          x: $mouseX,
          y: $mouseY,
          z: 0.01
        });
      });

      $arrow.mouseleave(function (e) {
        $(this).removeClass('visible').removeClass('is--scrolled');
        clearInterval($loop);
      });

      $(window).scroll(function () {
        if ($arrow.hasClass('visible')) {

          $arrow.addClass('is--scrolled');

          clearTimeout($.data(this, 'scrollTimer'));
          $.data(this, 'scrollTimer', setTimeout(function () {
            $arrow.removeClass('is--scrolled');
          }, 100));
        }
      });
    }
  }

  function bindShareClick() {
    var tl = new TimelineLite({
      paused: true
    }),
        elements = $(".share-icons > li"),
        randomGap = .4;

    tl.to($('.overlay--share'), 0, {
      'left': 0
    });

    tl.to($('.overlay--share'), .2, {
      opacity: 1,
      pointerEvents: 'auto'
    });

    tl.fromTo('.share-title', .3, {
      y: 40,
      opacity: 0,
    }, {
      y: 0,
      opacity: 1,
      ease: Power4.easeOut
    });

    for (var i = 0; i < elements.length; i++) {
      tl.to(elements[i], .3, {
        y: 0,
        opacity: 1,
        ease: Back.easeOut
      }, 0.2 + Math.random() * randomGap);
    }

    $('.js-popup-share').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      TweenMax.to($('.overlay--share'), 0, {
        'display': 'table'
      });

      tl.play();
      $('html').css('overflow', 'hidden');
      $('.header').addClass('header--inverse-important');

      $('.navigation__links-trigger').removeClass('active');

      $(document).on('keyup', bindToEscape);
    });

    $('.share-icons').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    function animateOut() {
      tl.reverse();
      $(document).off('keyup', bindToEscape);
      $('html').css('overflow', '');

      setTimeout(function () {
        $('.header').removeClass('header--inverse-important');
      }, 300);
    }

    function bindToEscape(e) {
      if (e.keyCode == 27) {
        animateOut();
      }
    }

    $('.overlay--share').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      animateOut();
    });
  }(function ($, sr) {

    // debouncing function from John Hann
    // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
    var debounce = function (func, threshold, execAsap) {
      var timeout;

      return function debounced() {
        var obj = this,
            args = arguments;

        function delayed() {
          if (!execAsap) func.apply(obj, args);
          timeout = null;
        };

        if (timeout) clearTimeout(timeout);
        else if (execAsap) func.apply(obj, args);

        timeout = setTimeout(delayed, threshold || 200);
      };
    };

    jQuery.fn[sr] = function (fn) {
      return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr);
    };

  })(jQuery, 'smartresize');

  function smoothScrollTo(y, speed) {

    speed = typeof speed == "undefined" ? 1 : speed;

    var distance = Math.abs(latestKnownScrollY - y),
        time = speed * distance / 2000;

    TweenMax.to($(window), time, {
      scrollTo: {
        y: y,
        autoKill: true,
        ease: Quint.easeInOut
      }
    });
  }

  (function () {
    if (window.location.hash) {
      var hash = window.location.hash,
          target = jQuery(hash),
          distance;

      if (!target.length) {
        return;
      }

      distance = target.offset().top

      setTimeout(function () {
        jQuery(window).scrollTop(0);
      }, 1);

      setTimeout(function () {
        smoothScrollTo(distance);
      }, 1200);
    }
  })();
  var $window = $(window),
      $document = $(document),
      $html = $('html'),
      $body = $('body'),


      // needed for browserSize
      windowWidth = $window.width(),
      windowHeight = $window.height(),
      documentHeight = $document.height(),
      aspectRatio = windowWidth / windowHeight,
      orientation = windowWidth > windowHeight ? 'landscape' : 'portrait',
      orientationChanged = false,
      headerHeight = $('.panel--logo').outerHeight(),


      // needed for requestAnimationFrame
      latestKnownScrollY = window.scrollY,
      lastKnownScrollY = latestKnownScrollY,
      scrollDirection = 'down',
      ticking = false;

  function browserSize() {
    var newOrientation;

    windowWidth = $window.outerWidth();
    windowHeight = $window.outerHeight();
    documentHeight = $document.height();
    aspectRatio = windowWidth / windowHeight;
    newOrientation = windowWidth > windowHeight ? 'landscape' : 'portrait';

    if (newOrientation !== orientation) {
      orientationChanged = true;
    }

    orientation = newOrientation;
  }

  function onOrientationChange(firstTime) {

    firstTime = firstTime || false;

    if (!orientationChanged) {
      return;
    }

    if (orientationChanged || !! firstTime) {

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
    if (globalDebug) {
      console.group("global::reload")
    }
    browserSize();
    resizeVideos();
    onOrientationChange(firstTime);

    if (!Modernizr.touch) VideoBackground.fill();

    function reloadUpdate() {
      browserSize();
      Parallax.initialize();
      Chameleon.prepare();
      onOrientationChange(firstTime);
    }

    function reloadCondition() {
      if ($('.masonry').length) {
        $('.masonry').isotope('once', 'layoutComplete', function () {
          reloadUpdate();
        });
        isotopeUpdateLayout();
      } else {
        reloadUpdate();
      }
    }

    if (firstTime === true) {
      reloadCondition();
      if (globalDebug) {
        console.groupEnd()
      }
      return;
    }

    if (!Modernizr.touch) {
      reloadCondition();
    }

    if (globalDebug) {
      console.groupEnd()
    }
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
    if (globalDebug) {
      console.group("global::init");
    }

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

    if (globalDebug) {
      console.groupEnd();
    }
  }



  /* ====== CONDITIONAL LOADING ====== */

  function loadUp() {
    if (globalDebug) {
      console.group("global::loadup");
    }

    resizeVideos();
    magnificPopupInit();
    isotopeInit();

    if (!Modernizr.touch) VideoBackground.init();

    $('.pixcode--tabs').organicTabs();

    $('body').imagesLoaded(function () {
      royalSliderInit($('.hero__content'));
      royalSliderInit($('.content'));

      setTimeout(function () {
        reload(true);
      }, 60);
    });

/*
	 * Woocommerce Events support
	 * */

    if (typeof woocommerce_events_handlers == 'function') {
      woocommerce_events_handlers();
    }

    if (globalDebug) {
      console.groupEnd();
    }
  }

  /* ====== EVENT HANDLERS ====== */

  function eventHandlersOnce() {
    if (globalDebug) {
      console.group("eventHandlers::once");
    }

    $('a[href="#top"]').on('click', function (e) {
      e.preventDefault();
      smoothScrollTo(0);
    });

    //copyrightOverlayInit();
    if (globalDebug) {
      console.groupEnd();
    }

  }

  function eventHandlers() {
    if (globalDebug) {
      console.group("eventHandlers");
    }

    bindShareClick();

    $(window).on("organicTabsChange", function (e) {
      browserSize();
      Parallax.initialize();
    });

    $('.js-arrow-down').on('click', function (e) {

      e.preventDefault();

      var height = $(this).closest('.hero').outerHeight();

      TweenMax.to('html, body', Math.abs(height) / 1500, {
        scrollTop: height,
        ease: Power2.easeOut
      });
    });

    $('.mies-item').not('.mies-share, .post').each(function (i, item) {

      var $item = $(this).find('.mies-item-wrap'),
          $border = $item.find('.mies-item-border'),
          $image = $item.find('img'),
          $content = $item.find('.mies-item-content'),
          $title = $item.find('.mies-item-title'),
          $meta = $item.find('.mies-item-meta'),
          itemHeight = $item.outerHeight(),
          itemWidth = $item.outerWidth();

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
    $('.hero-scroll-down').on('click', function (e) {
      smoothScrollTo(windowHeight);
    });

    // whenever a category is selected, make sure the "All" button is on
    $(document).on('click', '.filter__fields li', function (e) {
      var target = $(this).children('a').attr('href');
      $(target + ' li:first-child button').trigger('click');
    });

    if (globalDebug) {
      console.groupEnd();
    }
  }

  function bindProjectsHover() {

    $('.masonry__item').off('mouseenter').on('mouseenter', function (e) {
      var $image = $(this).find('.masonry__item-image');
      TweenMax.to($image, 0.5, {
        opacity: 0.5,
        ease: Power4.easeOut
      });
    }).off('mouseleave').on('mouseleave', function (e) {
      var $image = $(this).find('.masonry__item-image');
      TweenMax.to($image, 0.5, {
        opacity: 1,
        ease: Power4.easeOut
      });
    });

  }

  function bindGalleryImagesHover() {
    $('.gallery-icon').off('mouseenter').on('mouseenter', function (e) {
      var $image = $(this).find('img');
      TweenMax.to($image, 0.5, {
        opacity: 0.5,
        ease: Power4.easeOut
      });
    }).off('mouseleave').on('mouseleave', function (e) {
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
    if (globalDebug) {
      console.group("document::ready");
    }

    init();
    initVideos();

    if (isSafari) {
      $('html').css('opacity', 0);
    }

    if (globalDebug) {
      console.groupEnd();
    }
  });


  $window.load(function () {
    if (globalDebug) {
      console.group("window::load");
    }

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
      setTimeout(function () {
        reload();
        TweenMax.to('html', .3, {
          opacity: 1
        });
      }, 300);
    } else {

    }

    if (globalDebug) {
      console.groupEnd();
    }
  });

  function animateIn($hero) {

    var $bg = $hero.find('.hero__bg'),
        timeline = new TimelineMax({
        paused: true
      }),
        $description = $hero.find('.hero__description'),
        above, main, below, arrowLeft = $('.hero').find('.arrow--left'),
        arrowRight = $('.hero').find('.arrow--right'),
        arrowDown = $('.hero').find('.arrow--down'),
        other;

    main = $hero.find('.hero__content-wrap').children('.hero__title').first();

    if ((typeof main == "undefined" || !main.length) && $description.length) {
      main = $description.find('.hero__title, .huge, .large').first();
      above = main.prevAll().add($description.prevAll());
      below = main.nextAll().add($description.nextAll());
    }

    // Background Intro
    // timeline.to($bg, .3, {opacity: 1, ease: Quint.easeIn});
    if (typeof main !== "undefined" && main.length != 0) {
      above = main.prevAll();
      below = main.nextAll();

      above.css({
        opacity: 0
      });
      main.css({
        opacity: 0
      });
      below.css({
        opacity: 0
      });
      $description.css({
        opacity: 1
      });


      // Title
      timeline.fromTo(main, .25, {
        opacity: 0
      }, {
        opacity: 1
      }, '-=.15');
      timeline.fromTo(main, .45, {
        'scale': 1.4
      }, {
        'scale': 1,
        opacity: 1,
        ease: Sine.easeOut
      }, '-=.20');

      // Subtitle
      timeline.fromTo(above, .45, {
        y: '+=40'
      }, {
        y: '-=40',
        opacity: 1,
        ease: Back.easeOut
      }, '-=.25');

      // Description
      timeline.fromTo(below, .45, {
        y: '-=40'
      }, {
        y: '+=40',
        opacity: 1,
        ease: Back.easeOut
      }, '-=.45');

    } else {

      below = $hero.find('.hero__title, .hero__subtitle, .hero__btn, .hero__description');

      // Description
      timeline.fromTo(below, .45, {
        y: '-=40'
      }, {
        y: '+=40',
        opacity: 1,
        ease: Sine.easeOut
      });
    }

    if (arrowDown.length) {
      timeline.fromTo(arrowDown, .25, {
        y: -20
      }, {
        y: 0,
        opacity: 1,
        ease: Quad.easeOut
      });
    }

    timeline.play();
  }

  /* ====== ON JETPACK POST LOAD ====== */

  $(document).on('post-load', function () {
    if (globalDebug) {
      console.log("Jetpack Post load");
    }

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
  $(function () {

    $('.overlay--navigation a[href*=#]:not([href=#])').click(function () {

      if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {

        if ($('.overlay--navigation').length && parseInt($('.overlay--navigation').css('left'), 10) == 0) {
          $('.navigation__trigger').trigger('click');
        }

        var target = $(this.hash);

        target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
        if (target.length) {
          smoothScrollTo(target.offset().top);
          return false;
        }
      }

    });
  });
  // here we change the link of the Edit button in the Admin Bar
  // to make sure it reflects the current page


  function adminBarEditFix(id, editString, taxonomy) {
    //get the admin ajax url and clean it
    var baseEditURL = ajaxurl.replace('admin-ajax.php', 'post.php'),
        baseExitTaxURL = ajaxurl.replace('admin-ajax.php', 'edit-tags.php'),
        $editButton = $('#wp-admin-bar-edit a');

    if (!empty($editButton)) {
      if (id !== undefined && editString !== undefined) { //modify the current Edit button
        if (!empty(taxonomy)) { //it seems we need to edit a taxonomy
          $editButton.attr('href', baseExitTaxURL + '?tag_ID=' + id + '&taxonomy=' + taxonomy + '&action=edit');
        } else {
          $editButton.attr('href', baseEditURL + '?post=' + id + '&action=edit');
        }
        $editButton.html(editString);
      } else { //we have found an edit button but right now we don't need it anymore since we have no id
        $('#wp-admin-bar-edit').remove();
      }
    } else { //upss ... no edit button
      //lets see if we need one
      if (id !== undefined && editString !== undefined) { //we do need one after all
        //locate the New button because we need to add stuff after it
        var $newButton = $('#wp-admin-bar-new-content');

        if (!empty($newButton)) {
          if (!empty(taxonomy)) { //it seems we need to generate a taxonomy edit thingy
            $newButton.after('<li id="wp-admin-bar-edit"><a class="ab-item dJAX_internal" href="' + baseExitTaxURL + '?tag_ID=' + id + '&taxonomy=' + taxonomy + '&action=edit">' + editString + '</a></li>');
          } else { //just a regular edit
            $newButton.after('<li id="wp-admin-bar-edit"><a class="ab-item dJAX_internal" href="' + baseEditURL + '?post=' + id + '&action=edit">' + editString + '</a></li>');
          }
        }
      }
    }
  }

  /* --- Load AddThis Async --- */

  function loadAddThisScript() {
    if (window.addthis) {
      if (globalDebug) {
        console.log("addthis::Load Script");
      }
      // Listen for the ready event
      addthis.addEventListener('addthis.ready', addthisReady);
      addthis.init();
    }
  }

  /* --- AddThis On Ready - The API is fully loaded --- */
  //only fire this the first time we load the AddThis API - even when using ajax


  function addthisReady() {
    if (globalDebug) {
      console.log("addthis::Ready");
    }
    addThisInit();
  }

  /* --- AddThis Init --- */

  function addThisInit() {
    if (window.addthis) {
      if (globalDebug) {
        console.log("addthis::Toolbox INIT");
      }

      addthis.toolbox('.addthis_toolbox');
    }
  }

  /* --- Do all the cleanup that is needed when going to another page with dJax --- */

  function cleanupBeforeDJax() {
    if (globalDebug) {
      console.group("djax::Cleanup Before dJax");
    }

    /* --- KILL ROYALSLIDER ---*/
    var sliders = $('.js-pixslider');
    if (!empty(sliders)) {
      sliders.each(function () {
        var slider = $(this).data('royalSlider');
        if (!empty(slider)) {
          slider.destroy();
        }
      });
    }

    /* --- KILL MAGNIFIC POPUP ---*/
    //when hitting back or forward we need to make sure that there is no rezidual Magnific Popup
    $.magnificPopup.close(); // Close popup that is currently opened (shorthand)
    if (globalDebug) {
      console.groupEnd();
    }

  }

  function loadUpDJaxOnly(data) {
    if (globalDebug) {
      console.group("djax::loadup - dJaxOnly");
    }

    //reevaluate PictureFill if present
    if (typeof picturefill == 'function') {
      picturefill();
    }

    //fire the AddThis reinitialization separate from loadUp()
    //because on normal load we want to fire it only after the API is fully loaded - addthisReady()
    addThisInit();

    //bgCheckInit();
    //find and initialize Tiled Galleries via Jetpack
    if (typeof tiledGalleries !== "undefined") {
      if (globalDebug) {
        console.log("Find and setup new galleries - Jetpack");
      }
      tiledGalleries.findAndSetupNewGalleries();
    }

    //lets do some Google Analytics Tracking
    if (window._gaq) {
      _gaq.push(['_trackPageview']);
    }

    if (globalDebug) {
      console.groupEnd();
    }
  }
})(jQuery, window);
/*!
 * VERSION: 1.7.4
 * DATE: 2014-07-17
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2014, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 **/
var _gsScope = "undefined" != typeof module && module.exports && "undefined" != typeof global ? global : this || window;
(_gsScope._gsQueue || (_gsScope._gsQueue = [])).push(function () {
  "use strict";
  var t = document.documentElement,
      e = window,
      i = function (i, r) {
      var s = "x" === r ? "Width" : "Height",
          n = "scroll" + s,
          o = "client" + s,
          a = document.body;
      return i === e || i === t || i === a ? Math.max(t[n], a[n]) - (e["inner" + s] || Math.max(t[o], a[o])) : i[n] - i["offset" + s]
      },
      r = _gsScope._gsDefine.plugin({
      propName: "scrollTo",
      API: 2,
      version: "1.7.4",
      init: function (t, r, s) {
        return this._wdw = t === e, this._target = t, this._tween = s, "object" != typeof r && (r = {
          y: r
        }), this.vars = r, this._autoKill = r.autoKill !== !1, this.x = this.xPrev = this.getX(), this.y = this.yPrev = this.getY(), null != r.x ? (this._addTween(this, "x", this.x, "max" === r.x ? i(t, "x") : r.x, "scrollTo_x", !0), this._overwriteProps.push("scrollTo_x")) : this.skipX = !0, null != r.y ? (this._addTween(this, "y", this.y, "max" === r.y ? i(t, "y") : r.y, "scrollTo_y", !0), this._overwriteProps.push("scrollTo_y")) : this.skipY = !0, !0
      },
      set: function (t) {
        this._super.setRatio.call(this, t);
        var r = this._wdw || !this.skipX ? this.getX() : this.xPrev,
            s = this._wdw || !this.skipY ? this.getY() : this.yPrev,
            n = s - this.yPrev,
            o = r - this.xPrev;
        this._autoKill && (!this.skipX && (o > 7 || -7 > o) && i(this._target, "x") > r && (this.skipX = !0), !this.skipY && (n > 7 || -7 > n) && i(this._target, "y") > s && (this.skipY = !0), this.skipX && this.skipY && (this._tween.kill(), this.vars.onAutoKill && this.vars.onAutoKill.apply(this.vars.onAutoKillScope || this._tween, this.vars.onAutoKillParams || []))), this._wdw ? e.scrollTo(this.skipX ? r : this.x, this.skipY ? s : this.y) : (this.skipY || (this._target.scrollTop = this.y), this.skipX || (this._target.scrollLeft = this.x)), this.xPrev = this.x, this.yPrev = this.y
      }
    }),
      s = r.prototype;
  r.max = i, s.getX = function () {
    return this._wdw ? null != e.pageXOffset ? e.pageXOffset : null != t.scrollLeft ? t.scrollLeft : document.body.scrollLeft : this._target.scrollLeft
  }, s.getY = function () {
    return this._wdw ? null != e.pageYOffset ? e.pageYOffset : null != t.scrollTop ? t.scrollTop : document.body.scrollTop : this._target.scrollTop
  }, s._kill = function (t) {
    return t.scrollTo_x && (this.skipX = !0), t.scrollTo_y && (this.skipY = !0), this._super._kill.call(this, t)
  }
}), _gsScope._gsDefine && _gsScope._gsQueue.pop()();
/*!
 * VERSION: 1.12.1
 * DATE: 2014-06-26
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * Includes all of the following: TweenLite, TweenMax, TimelineLite, TimelineMax, EasePack, CSSPlugin, RoundPropsPlugin, BezierPlugin, AttrPlugin, DirectionalRotationPlugin
 *
 * @license Copyright (c) 2008-2014, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 **/
(window._gsQueue || (window._gsQueue = [])).push(function () {
  "use strict";
  window._gsDefine("TweenMax", ["core.Animation", "core.SimpleTimeline", "TweenLite"], function (t, e, i) {
    var s = [].slice,
        r = function (t, e, s) {
        i.call(this, t, e, s), this._cycle = 0, this._yoyo = this.vars.yoyo === !0, this._repeat = this.vars.repeat || 0, this._repeatDelay = this.vars.repeatDelay || 0, this._dirty = !0, this.render = r.prototype.render
        },
        n = 1e-10,
        a = i._internals,
        o = a.isSelector,
        h = a.isArray,
        l = r.prototype = i.to({}, .1, {}),
        _ = [];
    r.version = "1.12.1", l.constructor = r, l.kill()._gc = !1, r.killTweensOf = r.killDelayedCallsTo = i.killTweensOf, r.getTweensOf = i.getTweensOf, r.lagSmoothing = i.lagSmoothing, r.ticker = i.ticker, r.render = i.render, l.invalidate = function () {
      return this._yoyo = this.vars.yoyo === !0, this._repeat = this.vars.repeat || 0, this._repeatDelay = this.vars.repeatDelay || 0, this._uncache(!0), i.prototype.invalidate.call(this)
    }, l.updateTo = function (t, e) {
      var s, r = this.ratio;
      e && this._startTime < this._timeline._time && (this._startTime = this._timeline._time, this._uncache(!1), this._gc ? this._enabled(!0, !1) : this._timeline.insert(this, this._startTime - this._delay));
      for (s in t) this.vars[s] = t[s];
      if (this._initted) if (e) this._initted = !1;
      else if (this._gc && this._enabled(!0, !1), this._notifyPluginsOfEnabled && this._firstPT && i._onPluginEvent("_onDisable", this), this._time / this._duration > .998) {
        var n = this._time;
        this.render(0, !0, !1), this._initted = !1, this.render(n, !0, !1)
      } else if (this._time > 0) {
        this._initted = !1, this._init();
        for (var a, o = 1 / (1 - r), h = this._firstPT; h;) a = h.s + h.c, h.c *= o, h.s = a - h.c, h = h._next
      }
      return this
    }, l.render = function (t, e, i) {
      this._initted || 0 === this._duration && this.vars.repeat && this.invalidate();
      var s, r, o, h, l, u, p, f, c = this._dirty ? this.totalDuration() : this._totalDuration,
          m = this._time,
          d = this._totalTime,
          g = this._cycle,
          v = this._duration,
          y = this._rawPrevTime;
      if (t >= c ? (this._totalTime = c, this._cycle = this._repeat, this._yoyo && 0 !== (1 & this._cycle) ? (this._time = 0, this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0) : (this._time = v, this.ratio = this._ease._calcEnd ? this._ease.getRatio(1) : 1), this._reversed || (s = !0, r = "onComplete"), 0 === v && (this._initted || !this.vars.lazy || i) && (this._startTime === this._timeline._duration && (t = 0), (0 === t || 0 > y || y === n) && y !== t && (i = !0, y > n && (r = "onReverseComplete")), this._rawPrevTime = f = !e || t || y === t ? t : n)) : 1e-7 > t ? (this._totalTime = this._time = this._cycle = 0, this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0, (0 !== d || 0 === v && y > 0 && y !== n) && (r = "onReverseComplete", s = this._reversed), 0 > t ? (this._active = !1, 0 === v && (this._initted || !this.vars.lazy || i) && (y >= 0 && (i = !0), this._rawPrevTime = f = !e || t || y === t ? t : n)) : this._initted || (i = !0)) : (this._totalTime = this._time = t, 0 !== this._repeat && (h = v + this._repeatDelay, this._cycle = this._totalTime / h >> 0, 0 !== this._cycle && this._cycle === this._totalTime / h && this._cycle--, this._time = this._totalTime - this._cycle * h, this._yoyo && 0 !== (1 & this._cycle) && (this._time = v - this._time), this._time > v ? this._time = v : 0 > this._time && (this._time = 0)), this._easeType ? (l = this._time / v, u = this._easeType, p = this._easePower, (1 === u || 3 === u && l >= .5) && (l = 1 - l), 3 === u && (l *= 2), 1 === p ? l *= l : 2 === p ? l *= l * l : 3 === p ? l *= l * l * l : 4 === p && (l *= l * l * l * l), this.ratio = 1 === u ? 1 - l : 2 === u ? l : .5 > this._time / v ? l / 2 : 1 - l / 2) : this.ratio = this._ease.getRatio(this._time / v)), m === this._time && !i && g === this._cycle) return d !== this._totalTime && this._onUpdate && (e || this._onUpdate.apply(this.vars.onUpdateScope || this, this.vars.onUpdateParams || _)), void 0;
      if (!this._initted) {
        if (this._init(), !this._initted || this._gc) return;
        if (!i && this._firstPT && (this.vars.lazy !== !1 && this._duration || this.vars.lazy && !this._duration)) return this._time = m, this._totalTime = d, this._rawPrevTime = y, this._cycle = g, a.lazyTweens.push(this), this._lazy = t, void 0;
        this._time && !s ? this.ratio = this._ease.getRatio(this._time / v) : s && this._ease._calcEnd && (this.ratio = this._ease.getRatio(0 === this._time ? 0 : 1))
      }
      for (this._lazy !== !1 && (this._lazy = !1), this._active || !this._paused && this._time !== m && t >= 0 && (this._active = !0), 0 === d && (2 === this._initted && t > 0 && this._init(), this._startAt && (t >= 0 ? this._startAt.render(t, e, i) : r || (r = "_dummyGS")), this.vars.onStart && (0 !== this._totalTime || 0 === v) && (e || this.vars.onStart.apply(this.vars.onStartScope || this, this.vars.onStartParams || _))), o = this._firstPT; o;) o.f ? o.t[o.p](o.c * this.ratio + o.s) : o.t[o.p] = o.c * this.ratio + o.s, o = o._next;
      this._onUpdate && (0 > t && this._startAt && this._startTime && this._startAt.render(t, e, i), e || (this._totalTime !== d || s) && this._onUpdate.apply(this.vars.onUpdateScope || this, this.vars.onUpdateParams || _)), this._cycle !== g && (e || this._gc || this.vars.onRepeat && this.vars.onRepeat.apply(this.vars.onRepeatScope || this, this.vars.onRepeatParams || _)), r && (this._gc || (0 > t && this._startAt && !this._onUpdate && this._startTime && this._startAt.render(t, e, i), s && (this._timeline.autoRemoveChildren && this._enabled(!1, !1), this._active = !1), !e && this.vars[r] && this.vars[r].apply(this.vars[r + "Scope"] || this, this.vars[r + "Params"] || _), 0 === v && this._rawPrevTime === n && f !== n && (this._rawPrevTime = 0)))
    }, r.to = function (t, e, i) {
      return new r(t, e, i)
    }, r.from = function (t, e, i) {
      return i.runBackwards = !0, i.immediateRender = 0 != i.immediateRender, new r(t, e, i)
    }, r.fromTo = function (t, e, i, s) {
      return s.startAt = i, s.immediateRender = 0 != s.immediateRender && 0 != i.immediateRender, new r(t, e, s)
    }, r.staggerTo = r.allTo = function (t, e, n, a, l, u, p) {
      a = a || 0;
      var f, c, m, d, g = n.delay || 0,
          v = [],
          y = function () {
          n.onComplete && n.onComplete.apply(n.onCompleteScope || this, arguments), l.apply(p || this, u || _)
          };
      for (h(t) || ("string" == typeof t && (t = i.selector(t) || t), o(t) && (t = s.call(t, 0))), f = t.length, m = 0; f > m; m++) {
        c = {};
        for (d in n) c[d] = n[d];
        c.delay = g, m === f - 1 && l && (c.onComplete = y), v[m] = new r(t[m], e, c), g += a
      }
      return v
    }, r.staggerFrom = r.allFrom = function (t, e, i, s, n, a, o) {
      return i.runBackwards = !0, i.immediateRender = 0 != i.immediateRender, r.staggerTo(t, e, i, s, n, a, o)
    }, r.staggerFromTo = r.allFromTo = function (t, e, i, s, n, a, o, h) {
      return s.startAt = i, s.immediateRender = 0 != s.immediateRender && 0 != i.immediateRender, r.staggerTo(t, e, s, n, a, o, h)
    }, r.delayedCall = function (t, e, i, s, n) {
      return new r(e, 0, {
        delay: t,
        onComplete: e,
        onCompleteParams: i,
        onCompleteScope: s,
        onReverseComplete: e,
        onReverseCompleteParams: i,
        onReverseCompleteScope: s,
        immediateRender: !1,
        useFrames: n,
        overwrite: 0
      })
    }, r.set = function (t, e) {
      return new r(t, 0, e)
    }, r.isTweening = function (t) {
      return i.getTweensOf(t, !0).length > 0
    };
    var u = function (t, e) {
      for (var s = [], r = 0, n = t._first; n;) n instanceof i ? s[r++] = n : (e && (s[r++] = n), s = s.concat(u(n, e)), r = s.length), n = n._next;
      return s
    },
        p = r.getAllTweens = function (e) {
        return u(t._rootTimeline, e).concat(u(t._rootFramesTimeline, e))
        };
    r.killAll = function (t, i, s, r) {
      null == i && (i = !0), null == s && (s = !0);
      var n, a, o, h = p(0 != r),
          l = h.length,
          _ = i && s && r;
      for (o = 0; l > o; o++) a = h[o], (_ || a instanceof e || (n = a.target === a.vars.onComplete) && s || i && !n) && (t ? a.totalTime(a._reversed ? 0 : a.totalDuration()) : a._enabled(!1, !1))
    }, r.killChildTweensOf = function (t, e) {
      if (null != t) {
        var n, l, _, u, p, f = a.tweenLookup;
        if ("string" == typeof t && (t = i.selector(t) || t), o(t) && (t = s.call(t, 0)), h(t)) for (u = t.length; --u > -1;) r.killChildTweensOf(t[u], e);
        else {
          n = [];
          for (_ in f) for (l = f[_].target.parentNode; l;) l === t && (n = n.concat(f[_].tweens)), l = l.parentNode;
          for (p = n.length, u = 0; p > u; u++) e && n[u].totalTime(n[u].totalDuration()), n[u]._enabled(!1, !1)
        }
      }
    };
    var f = function (t, i, s, r) {
      i = i !== !1, s = s !== !1, r = r !== !1;
      for (var n, a, o = p(r), h = i && s && r, l = o.length; --l > -1;) a = o[l], (h || a instanceof e || (n = a.target === a.vars.onComplete) && s || i && !n) && a.paused(t)
    };
    return r.pauseAll = function (t, e, i) {
      f(!0, t, e, i)
    }, r.resumeAll = function (t, e, i) {
      f(!1, t, e, i)
    }, r.globalTimeScale = function (e) {
      var s = t._rootTimeline,
          r = i.ticker.time;
      return arguments.length ? (e = e || n, s._startTime = r - (r - s._startTime) * s._timeScale / e, s = t._rootFramesTimeline, r = i.ticker.frame, s._startTime = r - (r - s._startTime) * s._timeScale / e, s._timeScale = t._rootTimeline._timeScale = e, e) : s._timeScale
    }, l.progress = function (t) {
      return arguments.length ? this.totalTime(this.duration() * (this._yoyo && 0 !== (1 & this._cycle) ? 1 - t : t) + this._cycle * (this._duration + this._repeatDelay), !1) : this._time / this.duration()
    }, l.totalProgress = function (t) {
      return arguments.length ? this.totalTime(this.totalDuration() * t, !1) : this._totalTime / this.totalDuration()
    }, l.time = function (t, e) {
      return arguments.length ? (this._dirty && this.totalDuration(), t > this._duration && (t = this._duration), this._yoyo && 0 !== (1 & this._cycle) ? t = this._duration - t + this._cycle * (this._duration + this._repeatDelay) : 0 !== this._repeat && (t += this._cycle * (this._duration + this._repeatDelay)), this.totalTime(t, e)) : this._time
    }, l.duration = function (e) {
      return arguments.length ? t.prototype.duration.call(this, e) : this._duration
    }, l.totalDuration = function (t) {
      return arguments.length ? -1 === this._repeat ? this : this.duration((t - this._repeat * this._repeatDelay) / (this._repeat + 1)) : (this._dirty && (this._totalDuration = -1 === this._repeat ? 999999999999 : this._duration * (this._repeat + 1) + this._repeatDelay * this._repeat, this._dirty = !1), this._totalDuration)
    }, l.repeat = function (t) {
      return arguments.length ? (this._repeat = t, this._uncache(!0)) : this._repeat
    }, l.repeatDelay = function (t) {
      return arguments.length ? (this._repeatDelay = t, this._uncache(!0)) : this._repeatDelay
    }, l.yoyo = function (t) {
      return arguments.length ? (this._yoyo = t, this) : this._yoyo
    }, r
  }, !0), window._gsDefine("TimelineLite", ["core.Animation", "core.SimpleTimeline", "TweenLite"], function (t, e, i) {
    var s = function (t) {
      e.call(this, t), this._labels = {}, this.autoRemoveChildren = this.vars.autoRemoveChildren === !0, this.smoothChildTiming = this.vars.smoothChildTiming === !0, this._sortChildren = !0, this._onUpdate = this.vars.onUpdate;
      var i, s, r = this.vars;
      for (s in r) i = r[s], a(i) && -1 !== i.join("").indexOf("{self}") && (r[s] = this._swapSelfInParams(i));
      a(r.tweens) && this.add(r.tweens, 0, r.align, r.stagger)
    },
        r = 1e-10,
        n = i._internals.isSelector,
        a = i._internals.isArray,
        o = [],
        h = window._gsDefine.globals,
        l = function (t) {
        var e, i = {};
        for (e in t) i[e] = t[e];
        return i
        },
        _ = function (t, e, i, s) {
        t._timeline.pause(t._startTime), e && e.apply(s || t._timeline, i || o)
        },
        u = o.slice,
        p = s.prototype = new e;
    return s.version = "1.12.1", p.constructor = s, p.kill()._gc = !1, p.to = function (t, e, s, r) {
      var n = s.repeat && h.TweenMax || i;
      return e ? this.add(new n(t, e, s), r) : this.set(t, s, r)
    }, p.from = function (t, e, s, r) {
      return this.add((s.repeat && h.TweenMax || i).from(t, e, s), r)
    }, p.fromTo = function (t, e, s, r, n) {
      var a = r.repeat && h.TweenMax || i;
      return e ? this.add(a.fromTo(t, e, s, r), n) : this.set(t, r, n)
    }, p.staggerTo = function (t, e, r, a, o, h, _, p) {
      var f, c = new s({
        onComplete: h,
        onCompleteParams: _,
        onCompleteScope: p,
        smoothChildTiming: this.smoothChildTiming
      });
      for ("string" == typeof t && (t = i.selector(t) || t), n(t) && (t = u.call(t, 0)), a = a || 0, f = 0; t.length > f; f++) r.startAt && (r.startAt = l(r.startAt)), c.to(t[f], e, l(r), f * a);
      return this.add(c, o)
    }, p.staggerFrom = function (t, e, i, s, r, n, a, o) {
      return i.immediateRender = 0 != i.immediateRender, i.runBackwards = !0, this.staggerTo(t, e, i, s, r, n, a, o)
    }, p.staggerFromTo = function (t, e, i, s, r, n, a, o, h) {
      return s.startAt = i, s.immediateRender = 0 != s.immediateRender && 0 != i.immediateRender, this.staggerTo(t, e, s, r, n, a, o, h)
    }, p.call = function (t, e, s, r) {
      return this.add(i.delayedCall(0, t, e, s), r)
    }, p.set = function (t, e, s) {
      return s = this._parseTimeOrLabel(s, 0, !0), null == e.immediateRender && (e.immediateRender = s === this._time && !this._paused), this.add(new i(t, 0, e), s)
    }, s.exportRoot = function (t, e) {
      t = t || {}, null == t.smoothChildTiming && (t.smoothChildTiming = !0);
      var r, n, a = new s(t),
          o = a._timeline;
      for (null == e && (e = !0), o._remove(a, !0), a._startTime = 0, a._rawPrevTime = a._time = a._totalTime = o._time, r = o._first; r;) n = r._next, e && r instanceof i && r.target === r.vars.onComplete || a.add(r, r._startTime - r._delay), r = n;
      return o.add(a, 0), a
    }, p.add = function (r, n, o, h) {
      var l, _, u, p, f, c;
      if ("number" != typeof n && (n = this._parseTimeOrLabel(n, 0, !0, r)), !(r instanceof t)) {
        if (r instanceof Array || r && r.push && a(r)) {
          for (o = o || "normal", h = h || 0, l = n, _ = r.length, u = 0; _ > u; u++) a(p = r[u]) && (p = new s({
            tweens: p
          })), this.add(p, l), "string" != typeof p && "function" != typeof p && ("sequence" === o ? l = p._startTime + p.totalDuration() / p._timeScale : "start" === o && (p._startTime -= p.delay())), l += h;
          return this._uncache(!0)
        }
        if ("string" == typeof r) return this.addLabel(r, n);
        if ("function" != typeof r) throw "Cannot add " + r + " into the timeline; it is not a tween, timeline, function, or string.";
        r = i.delayedCall(0, r)
      }
      if (e.prototype.add.call(this, r, n), (this._gc || this._time === this._duration) && !this._paused && this._duration < this.duration()) for (f = this, c = f.rawTime() > r._startTime; f._timeline;) c && f._timeline.smoothChildTiming ? f.totalTime(f._totalTime, !0) : f._gc && f._enabled(!0, !1), f = f._timeline;
      return this
    }, p.remove = function (e) {
      if (e instanceof t) return this._remove(e, !1);
      if (e instanceof Array || e && e.push && a(e)) {
        for (var i = e.length; --i > -1;) this.remove(e[i]);
        return this
      }
      return "string" == typeof e ? this.removeLabel(e) : this.kill(null, e)
    }, p._remove = function (t, i) {
      e.prototype._remove.call(this, t, i);
      var s = this._last;
      return s ? this._time > s._startTime + s._totalDuration / s._timeScale && (this._time = this.duration(), this._totalTime = this._totalDuration) : this._time = this._totalTime = this._duration = this._totalDuration = 0, this
    }, p.append = function (t, e) {
      return this.add(t, this._parseTimeOrLabel(null, e, !0, t))
    }, p.insert = p.insertMultiple = function (t, e, i, s) {
      return this.add(t, e || 0, i, s)
    }, p.appendMultiple = function (t, e, i, s) {
      return this.add(t, this._parseTimeOrLabel(null, e, !0, t), i, s)
    }, p.addLabel = function (t, e) {
      return this._labels[t] = this._parseTimeOrLabel(e), this
    }, p.addPause = function (t, e, i, s) {
      return this.call(_, ["{self}", e, i, s], this, t)
    }, p.removeLabel = function (t) {
      return delete this._labels[t], this
    }, p.getLabelTime = function (t) {
      return null != this._labels[t] ? this._labels[t] : -1
    }, p._parseTimeOrLabel = function (e, i, s, r) {
      var n;
      if (r instanceof t && r.timeline === this) this.remove(r);
      else if (r && (r instanceof Array || r.push && a(r))) for (n = r.length; --n > -1;) r[n] instanceof t && r[n].timeline === this && this.remove(r[n]);
      if ("string" == typeof i) return this._parseTimeOrLabel(i, s && "number" == typeof e && null == this._labels[i] ? e - this.duration() : 0, s);
      if (i = i || 0, "string" != typeof e || !isNaN(e) && null == this._labels[e]) null == e && (e = this.duration());
      else {
        if (n = e.indexOf("="), -1 === n) return null == this._labels[e] ? s ? this._labels[e] = this.duration() + i : i : this._labels[e] + i;
        i = parseInt(e.charAt(n - 1) + "1", 10) * Number(e.substr(n + 1)), e = n > 1 ? this._parseTimeOrLabel(e.substr(0, n - 1), 0, s) : this.duration()
      }
      return Number(e) + i
    }, p.seek = function (t, e) {
      return this.totalTime("number" == typeof t ? t : this._parseTimeOrLabel(t), e !== !1)
    }, p.stop = function () {
      return this.paused(!0)
    }, p.gotoAndPlay = function (t, e) {
      return this.play(t, e)
    }, p.gotoAndStop = function (t, e) {
      return this.pause(t, e)
    }, p.render = function (t, e, i) {
      this._gc && this._enabled(!0, !1);
      var s, n, a, h, l, _ = this._dirty ? this.totalDuration() : this._totalDuration,
          u = this._time,
          p = this._startTime,
          f = this._timeScale,
          c = this._paused;
      if (t >= _ ? (this._totalTime = this._time = _, this._reversed || this._hasPausedChild() || (n = !0, h = "onComplete", 0 === this._duration && (0 === t || 0 > this._rawPrevTime || this._rawPrevTime === r) && this._rawPrevTime !== t && this._first && (l = !0, this._rawPrevTime > r && (h = "onReverseComplete"))), this._rawPrevTime = this._duration || !e || t || this._rawPrevTime === t ? t : r, t = _ + 1e-4) : 1e-7 > t ? (this._totalTime = this._time = 0, (0 !== u || 0 === this._duration && this._rawPrevTime !== r && (this._rawPrevTime > 0 || 0 > t && this._rawPrevTime >= 0)) && (h = "onReverseComplete", n = this._reversed), 0 > t ? (this._active = !1, 0 === this._duration && this._rawPrevTime >= 0 && this._first && (l = !0), this._rawPrevTime = t) : (this._rawPrevTime = this._duration || !e || t || this._rawPrevTime === t ? t : r, t = 0, this._initted || (l = !0))) : this._totalTime = this._time = this._rawPrevTime = t, this._time !== u && this._first || i || l) {
        if (this._initted || (this._initted = !0), this._active || !this._paused && this._time !== u && t > 0 && (this._active = !0), 0 === u && this.vars.onStart && 0 !== this._time && (e || this.vars.onStart.apply(this.vars.onStartScope || this, this.vars.onStartParams || o)), this._time >= u) for (s = this._first; s && (a = s._next, !this._paused || c);)(s._active || s._startTime <= this._time && !s._paused && !s._gc) && (s._reversed ? s.render((s._dirty ? s.totalDuration() : s._totalDuration) - (t - s._startTime) * s._timeScale, e, i) : s.render((t - s._startTime) * s._timeScale, e, i)), s = a;
        else for (s = this._last; s && (a = s._prev, !this._paused || c);)(s._active || u >= s._startTime && !s._paused && !s._gc) && (s._reversed ? s.render((s._dirty ? s.totalDuration() : s._totalDuration) - (t - s._startTime) * s._timeScale, e, i) : s.render((t - s._startTime) * s._timeScale, e, i)), s = a;
        this._onUpdate && (e || this._onUpdate.apply(this.vars.onUpdateScope || this, this.vars.onUpdateParams || o)), h && (this._gc || (p === this._startTime || f !== this._timeScale) && (0 === this._time || _ >= this.totalDuration()) && (n && (this._timeline.autoRemoveChildren && this._enabled(!1, !1), this._active = !1), !e && this.vars[h] && this.vars[h].apply(this.vars[h + "Scope"] || this, this.vars[h + "Params"] || o)))
      }
    }, p._hasPausedChild = function () {
      for (var t = this._first; t;) {
        if (t._paused || t instanceof s && t._hasPausedChild()) return !0;
        t = t._next
      }
      return !1
    }, p.getChildren = function (t, e, s, r) {
      r = r || -9999999999;
      for (var n = [], a = this._first, o = 0; a;) r > a._startTime || (a instanceof i ? e !== !1 && (n[o++] = a) : (s !== !1 && (n[o++] = a), t !== !1 && (n = n.concat(a.getChildren(!0, e, s)), o = n.length))), a = a._next;
      return n
    }, p.getTweensOf = function (t, e) {
      var s, r, n = this._gc,
          a = [],
          o = 0;
      for (n && this._enabled(!0, !0), s = i.getTweensOf(t), r = s.length; --r > -1;)(s[r].timeline === this || e && this._contains(s[r])) && (a[o++] = s[r]);
      return n && this._enabled(!1, !0), a
    }, p._contains = function (t) {
      for (var e = t.timeline; e;) {
        if (e === this) return !0;
        e = e.timeline
      }
      return !1
    }, p.shiftChildren = function (t, e, i) {
      i = i || 0;
      for (var s, r = this._first, n = this._labels; r;) r._startTime >= i && (r._startTime += t), r = r._next;
      if (e) for (s in n) n[s] >= i && (n[s] += t);
      return this._uncache(!0)
    }, p._kill = function (t, e) {
      if (!t && !e) return this._enabled(!1, !1);
      for (var i = e ? this.getTweensOf(e) : this.getChildren(!0, !0, !1), s = i.length, r = !1; --s > -1;) i[s]._kill(t, e) && (r = !0);
      return r
    }, p.clear = function (t) {
      var e = this.getChildren(!1, !0, !0),
          i = e.length;
      for (this._time = this._totalTime = 0; --i > -1;) e[i]._enabled(!1, !1);
      return t !== !1 && (this._labels = {}), this._uncache(!0)
    }, p.invalidate = function () {
      for (var t = this._first; t;) t.invalidate(), t = t._next;
      return this
    }, p._enabled = function (t, i) {
      if (t === this._gc) for (var s = this._first; s;) s._enabled(t, !0), s = s._next;
      return e.prototype._enabled.call(this, t, i)
    }, p.duration = function (t) {
      return arguments.length ? (0 !== this.duration() && 0 !== t && this.timeScale(this._duration / t), this) : (this._dirty && this.totalDuration(), this._duration)
    }, p.totalDuration = function (t) {
      if (!arguments.length) {
        if (this._dirty) {
          for (var e, i, s = 0, r = this._last, n = 999999999999; r;) e = r._prev, r._dirty && r.totalDuration(), r._startTime > n && this._sortChildren && !r._paused ? this.add(r, r._startTime - r._delay) : n = r._startTime, 0 > r._startTime && !r._paused && (s -= r._startTime, this._timeline.smoothChildTiming && (this._startTime += r._startTime / this._timeScale), this.shiftChildren(-r._startTime, !1, -9999999999), n = 0), i = r._startTime + r._totalDuration / r._timeScale, i > s && (s = i), r = e;
          this._duration = this._totalDuration = s, this._dirty = !1
        }
        return this._totalDuration
      }
      return 0 !== this.totalDuration() && 0 !== t && this.timeScale(this._totalDuration / t), this
    }, p.usesFrames = function () {
      for (var e = this._timeline; e._timeline;) e = e._timeline;
      return e === t._rootFramesTimeline
    }, p.rawTime = function () {
      return this._paused ? this._totalTime : (this._timeline.rawTime() - this._startTime) * this._timeScale
    }, s
  }, !0), window._gsDefine("TimelineMax", ["TimelineLite", "TweenLite", "easing.Ease"], function (t, e, i) {
    var s = function (e) {
      t.call(this, e), this._repeat = this.vars.repeat || 0, this._repeatDelay = this.vars.repeatDelay || 0, this._cycle = 0, this._yoyo = this.vars.yoyo === !0, this._dirty = !0
    },
        r = 1e-10,
        n = [],
        a = new i(null, null, 1, 0),
        o = s.prototype = new t;
    return o.constructor = s, o.kill()._gc = !1, s.version = "1.12.1", o.invalidate = function () {
      return this._yoyo = this.vars.yoyo === !0, this._repeat = this.vars.repeat || 0, this._repeatDelay = this.vars.repeatDelay || 0, this._uncache(!0), t.prototype.invalidate.call(this)
    }, o.addCallback = function (t, i, s, r) {
      return this.add(e.delayedCall(0, t, s, r), i)
    }, o.removeCallback = function (t, e) {
      if (t) if (null == e) this._kill(null, t);
      else for (var i = this.getTweensOf(t, !1), s = i.length, r = this._parseTimeOrLabel(e); --s > -1;) i[s]._startTime === r && i[s]._enabled(!1, !1);
      return this
    }, o.tweenTo = function (t, i) {
      i = i || {};
      var s, r, o, h = {
        ease: a,
        overwrite: i.delay ? 2 : 1,
        useFrames: this.usesFrames(),
        immediateRender: !1
      };
      for (r in i) h[r] = i[r];
      return h.time = this._parseTimeOrLabel(t), s = Math.abs(Number(h.time) - this._time) / this._timeScale || .001, o = new e(this, s, h), h.onStart = function () {
        o.target.paused(!0), o.vars.time !== o.target.time() && s === o.duration() && o.duration(Math.abs(o.vars.time - o.target.time()) / o.target._timeScale), i.onStart && i.onStart.apply(i.onStartScope || o, i.onStartParams || n)
      }, o
    }, o.tweenFromTo = function (t, e, i) {
      i = i || {}, t = this._parseTimeOrLabel(t), i.startAt = {
        onComplete: this.seek,
        onCompleteParams: [t],
        onCompleteScope: this
      }, i.immediateRender = i.immediateRender !== !1;
      var s = this.tweenTo(e, i);
      return s.duration(Math.abs(s.vars.time - t) / this._timeScale || .001)
    }, o.render = function (t, e, i) {
      this._gc && this._enabled(!0, !1);
      var s, a, o, h, l, _, u = this._dirty ? this.totalDuration() : this._totalDuration,
          p = this._duration,
          f = this._time,
          c = this._totalTime,
          m = this._startTime,
          d = this._timeScale,
          g = this._rawPrevTime,
          v = this._paused,
          y = this._cycle;
      if (t >= u ? (this._locked || (this._totalTime = u, this._cycle = this._repeat), this._reversed || this._hasPausedChild() || (a = !0, h = "onComplete", 0 === this._duration && (0 === t || 0 > g || g === r) && g !== t && this._first && (l = !0, g > r && (h = "onReverseComplete"))), this._rawPrevTime = this._duration || !e || t || this._rawPrevTime === t ? t : r, this._yoyo && 0 !== (1 & this._cycle) ? this._time = t = 0 : (this._time = p, t = p + 1e-4)) : 1e-7 > t ? (this._locked || (this._totalTime = this._cycle = 0), this._time = 0, (0 !== f || 0 === p && g !== r && (g > 0 || 0 > t && g >= 0) && !this._locked) && (h = "onReverseComplete", a = this._reversed), 0 > t ? (this._active = !1, 0 === p && g >= 0 && this._first && (l = !0), this._rawPrevTime = t) : (this._rawPrevTime = p || !e || t || this._rawPrevTime === t ? t : r, t = 0, this._initted || (l = !0))) : (0 === p && 0 > g && (l = !0), this._time = this._rawPrevTime = t, this._locked || (this._totalTime = t, 0 !== this._repeat && (_ = p + this._repeatDelay, this._cycle = this._totalTime / _ >> 0, 0 !== this._cycle && this._cycle === this._totalTime / _ && this._cycle--, this._time = this._totalTime - this._cycle * _, this._yoyo && 0 !== (1 & this._cycle) && (this._time = p - this._time), this._time > p ? (this._time = p, t = p + 1e-4) : 0 > this._time ? this._time = t = 0 : t = this._time))), this._cycle !== y && !this._locked) {
        var T = this._yoyo && 0 !== (1 & y),
            w = T === (this._yoyo && 0 !== (1 & this._cycle)),
            x = this._totalTime,
            b = this._cycle,
            P = this._rawPrevTime,
            S = this._time;
        if (this._totalTime = y * p, y > this._cycle ? T = !T : this._totalTime += p, this._time = f, this._rawPrevTime = 0 === p ? g - 1e-4 : g, this._cycle = y, this._locked = !0, f = T ? 0 : p, this.render(f, e, 0 === p), e || this._gc || this.vars.onRepeat && this.vars.onRepeat.apply(this.vars.onRepeatScope || this, this.vars.onRepeatParams || n), w && (f = T ? p + 1e-4 : -1e-4, this.render(f, !0, !1)), this._locked = !1, this._paused && !v) return;
        this._time = S, this._totalTime = x, this._cycle = b, this._rawPrevTime = P
      }
      if (!(this._time !== f && this._first || i || l)) return c !== this._totalTime && this._onUpdate && (e || this._onUpdate.apply(this.vars.onUpdateScope || this, this.vars.onUpdateParams || n)), void 0;
      if (this._initted || (this._initted = !0), this._active || !this._paused && this._totalTime !== c && t > 0 && (this._active = !0), 0 === c && this.vars.onStart && 0 !== this._totalTime && (e || this.vars.onStart.apply(this.vars.onStartScope || this, this.vars.onStartParams || n)), this._time >= f) for (s = this._first; s && (o = s._next, !this._paused || v);)(s._active || s._startTime <= this._time && !s._paused && !s._gc) && (s._reversed ? s.render((s._dirty ? s.totalDuration() : s._totalDuration) - (t - s._startTime) * s._timeScale, e, i) : s.render((t - s._startTime) * s._timeScale, e, i)), s = o;
      else for (s = this._last; s && (o = s._prev, !this._paused || v);)(s._active || f >= s._startTime && !s._paused && !s._gc) && (s._reversed ? s.render((s._dirty ? s.totalDuration() : s._totalDuration) - (t - s._startTime) * s._timeScale, e, i) : s.render((t - s._startTime) * s._timeScale, e, i)), s = o;
      this._onUpdate && (e || this._onUpdate.apply(this.vars.onUpdateScope || this, this.vars.onUpdateParams || n)), h && (this._locked || this._gc || (m === this._startTime || d !== this._timeScale) && (0 === this._time || u >= this.totalDuration()) && (a && (this._timeline.autoRemoveChildren && this._enabled(!1, !1), this._active = !1), !e && this.vars[h] && this.vars[h].apply(this.vars[h + "Scope"] || this, this.vars[h + "Params"] || n)))
    }, o.getActive = function (t, e, i) {
      null == t && (t = !0), null == e && (e = !0), null == i && (i = !1);
      var s, r, n = [],
          a = this.getChildren(t, e, i),
          o = 0,
          h = a.length;
      for (s = 0; h > s; s++) r = a[s], r.isActive() && (n[o++] = r);
      return n
    }, o.getLabelAfter = function (t) {
      t || 0 !== t && (t = this._time);
      var e, i = this.getLabelsArray(),
          s = i.length;
      for (e = 0; s > e; e++) if (i[e].time > t) return i[e].name;
      return null
    }, o.getLabelBefore = function (t) {
      null == t && (t = this._time);
      for (var e = this.getLabelsArray(), i = e.length; --i > -1;) if (t > e[i].time) return e[i].name;
      return null
    }, o.getLabelsArray = function () {
      var t, e = [],
          i = 0;
      for (t in this._labels) e[i++] = {
        time: this._labels[t],
        name: t
      };
      return e.sort(function (t, e) {
        return t.time - e.time
      }), e
    }, o.progress = function (t) {
      return arguments.length ? this.totalTime(this.duration() * (this._yoyo && 0 !== (1 & this._cycle) ? 1 - t : t) + this._cycle * (this._duration + this._repeatDelay), !1) : this._time / this.duration()
    }, o.totalProgress = function (t) {
      return arguments.length ? this.totalTime(this.totalDuration() * t, !1) : this._totalTime / this.totalDuration()
    }, o.totalDuration = function (e) {
      return arguments.length ? -1 === this._repeat ? this : this.duration((e - this._repeat * this._repeatDelay) / (this._repeat + 1)) : (this._dirty && (t.prototype.totalDuration.call(this), this._totalDuration = -1 === this._repeat ? 999999999999 : this._duration * (this._repeat + 1) + this._repeatDelay * this._repeat), this._totalDuration)
    }, o.time = function (t, e) {
      return arguments.length ? (this._dirty && this.totalDuration(), t > this._duration && (t = this._duration), this._yoyo && 0 !== (1 & this._cycle) ? t = this._duration - t + this._cycle * (this._duration + this._repeatDelay) : 0 !== this._repeat && (t += this._cycle * (this._duration + this._repeatDelay)), this.totalTime(t, e)) : this._time
    }, o.repeat = function (t) {
      return arguments.length ? (this._repeat = t, this._uncache(!0)) : this._repeat
    }, o.repeatDelay = function (t) {
      return arguments.length ? (this._repeatDelay = t, this._uncache(!0)) : this._repeatDelay
    }, o.yoyo = function (t) {
      return arguments.length ? (this._yoyo = t, this) : this._yoyo
    }, o.currentLabel = function (t) {
      return arguments.length ? this.seek(t, !0) : this.getLabelBefore(this._time + 1e-8)
    }, s
  }, !0), function () {
    var t = 180 / Math.PI,
        e = [],
        i = [],
        s = [],
        r = {},
        n = function (t, e, i, s) {
        this.a = t, this.b = e, this.c = i, this.d = s, this.da = s - t, this.ca = i - t, this.ba = e - t
        },
        a = ",x,y,z,left,top,right,bottom,marginTop,marginLeft,marginRight,marginBottom,paddingLeft,paddingTop,paddingRight,paddingBottom,backgroundPosition,backgroundPosition_y,",
        o = function (t, e, i, s) {
        var r = {
          a: t
        },
            n = {},
            a = {},
            o = {
            c: s
            },
            h = (t + e) / 2,
            l = (e + i) / 2,
            _ = (i + s) / 2,
            u = (h + l) / 2,
            p = (l + _) / 2,
            f = (p - u) / 8;
        return r.b = h + (t - h) / 4, n.b = u + f, r.c = n.a = (r.b + n.b) / 2, n.c = a.a = (u + p) / 2, a.b = p - f, o.b = _ + (s - _) / 4, a.c = o.a = (a.b + o.b) / 2, [r, n, a, o]
        },
        h = function (t, r, n, a, h) {
        var l, _, u, p, f, c, m, d, g, v, y, T, w, x = t.length - 1,
            b = 0,
            P = t[0].a;
        for (l = 0; x > l; l++) f = t[b], _ = f.a, u = f.d, p = t[b + 1].d, h ? (y = e[l], T = i[l], w = .25 * (T + y) * r / (a ? .5 : s[l] || .5), c = u - (u - _) * (a ? .5 * r : 0 !== y ? w / y : 0), m = u + (p - u) * (a ? .5 * r : 0 !== T ? w / T : 0), d = u - (c + ((m - c) * (3 * y / (y + T) + .5) / 4 || 0))) : (c = u - .5 * (u - _) * r, m = u + .5 * (p - u) * r, d = u - (c + m) / 2), c += d, m += d, f.c = g = c, f.b = 0 !== l ? P : P = f.a + .6 * (f.c - f.a), f.da = u - _, f.ca = g - _, f.ba = P - _, n ? (v = o(_, P, g, u), t.splice(b, 1, v[0], v[1], v[2], v[3]), b += 4) : b++, P = m;
        f = t[b], f.b = P, f.c = P + .4 * (f.d - P), f.da = f.d - f.a, f.ca = f.c - f.a, f.ba = P - f.a, n && (v = o(f.a, P, f.c, f.d), t.splice(b, 1, v[0], v[1], v[2], v[3]))
        },
        l = function (t, s, r, a) {
        var o, h, l, _, u, p, f = [];
        if (a) for (t = [a].concat(t), h = t.length; --h > -1;)"string" == typeof(p = t[h][s]) && "=" === p.charAt(1) && (t[h][s] = a[s] + Number(p.charAt(0) + p.substr(2)));
        if (o = t.length - 2, 0 > o) return f[0] = new n(t[0][s], 0, 0, t[-1 > o ? 0 : 1][s]), f;
        for (h = 0; o > h; h++) l = t[h][s], _ = t[h + 1][s], f[h] = new n(l, 0, 0, _), r && (u = t[h + 2][s], e[h] = (e[h] || 0) + (_ - l) * (_ - l), i[h] = (i[h] || 0) + (u - _) * (u - _));
        return f[h] = new n(t[h][s], 0, 0, t[h + 1][s]), f
        },
        _ = function (t, n, o, _, u, p) {
        var f, c, m, d, g, v, y, T, w = {},
            x = [],
            b = p || t[0];
        u = "string" == typeof u ? "," + u + "," : a, null == n && (n = 1);
        for (c in t[0]) x.push(c);
        if (t.length > 1) {
          for (T = t[t.length - 1], y = !0, f = x.length; --f > -1;) if (c = x[f], Math.abs(b[c] - T[c]) > .05) {
            y = !1;
            break
          }
          y && (t = t.concat(), p && t.unshift(p), t.push(t[1]), p = t[t.length - 3])
        }
        for (e.length = i.length = s.length = 0, f = x.length; --f > -1;) c = x[f], r[c] = -1 !== u.indexOf("," + c + ","), w[c] = l(t, c, r[c], p);
        for (f = e.length; --f > -1;) e[f] = Math.sqrt(e[f]), i[f] = Math.sqrt(i[f]);
        if (!_) {
          for (f = x.length; --f > -1;) if (r[c]) for (m = w[x[f]], v = m.length - 1, d = 0; v > d; d++) g = m[d + 1].da / i[d] + m[d].da / e[d], s[d] = (s[d] || 0) + g * g;
          for (f = s.length; --f > -1;) s[f] = Math.sqrt(s[f])
        }
        for (f = x.length, d = o ? 4 : 1; --f > -1;) c = x[f], m = w[c], h(m, n, o, _, r[c]), y && (m.splice(0, d), m.splice(m.length - d, d));
        return w
        },
        u = function (t, e, i) {
        e = e || "soft";
        var s, r, a, o, h, l, _, u, p, f, c, m = {},
            d = "cubic" === e ? 3 : 2,
            g = "soft" === e,
            v = [];
        if (g && i && (t = [i].concat(t)), null == t || d + 1 > t.length) throw "invalid Bezier data";
        for (p in t[0]) v.push(p);
        for (l = v.length; --l > -1;) {
          for (p = v[l], m[p] = h = [], f = 0, u = t.length, _ = 0; u > _; _++) s = null == i ? t[_][p] : "string" == typeof(c = t[_][p]) && "=" === c.charAt(1) ? i[p] + Number(c.charAt(0) + c.substr(2)) : Number(c), g && _ > 1 && u - 1 > _ && (h[f++] = (s + h[f - 2]) / 2), h[f++] = s;
          for (u = f - d + 1, f = 0, _ = 0; u > _; _ += d) s = h[_], r = h[_ + 1], a = h[_ + 2], o = 2 === d ? 0 : h[_ + 3], h[f++] = c = 3 === d ? new n(s, r, a, o) : new n(s, (2 * r + s) / 3, (2 * r + a) / 3, a);
          h.length = f
        }
        return m
        },
        p = function (t, e, i) {
        for (var s, r, n, a, o, h, l, _, u, p, f, c = 1 / i, m = t.length; --m > -1;) for (p = t[m], n = p.a, a = p.d - n, o = p.c - n, h = p.b - n, s = r = 0, _ = 1; i >= _; _++) l = c * _, u = 1 - l, s = r - (r = (l * l * a + 3 * u * (l * o + u * h)) * l), f = m * i + _ - 1, e[f] = (e[f] || 0) + s * s
        },
        f = function (t, e) {
        e = e >> 0 || 6;
        var i, s, r, n, a = [],
            o = [],
            h = 0,
            l = 0,
            _ = e - 1,
            u = [],
            f = [];
        for (i in t) p(t[i], a, e);
        for (r = a.length, s = 0; r > s; s++) h += Math.sqrt(a[s]), n = s % e, f[n] = h, n === _ && (l += h, n = s / e >> 0, u[n] = f, o[n] = l, h = 0, f = []);
        return {
          length: l,
          lengths: o,
          segments: u
        }
        },
        c = window._gsDefine.plugin({
        propName: "bezier",
        priority: -1,
        version: "1.3.2",
        API: 2,
        global: !0,
        init: function (t, e, i) {
          this._target = t, e instanceof Array && (e = {
            values: e
          }), this._func = {}, this._round = {}, this._props = [], this._timeRes = null == e.timeResolution ? 6 : parseInt(e.timeResolution, 10);
          var s, r, n, a, o, h = e.values || [],
              l = {},
              p = h[0],
              c = e.autoRotate || i.vars.orientToBezier;
          this._autoRotate = c ? c instanceof Array ? c : [
            ["x", "y", "rotation", c === !0 ? 0 : Number(c) || 0]
          ] : null;
          for (s in p) this._props.push(s);
          for (n = this._props.length; --n > -1;) s = this._props[n], this._overwriteProps.push(s), r = this._func[s] = "function" == typeof t[s], l[s] = r ? t[s.indexOf("set") || "function" != typeof t["get" + s.substr(3)] ? s : "get" + s.substr(3)]() : parseFloat(t[s]), o || l[s] !== h[0][s] && (o = l);
          if (this._beziers = "cubic" !== e.type && "quadratic" !== e.type && "soft" !== e.type ? _(h, isNaN(e.curviness) ? 1 : e.curviness, !1, "thruBasic" === e.type, e.correlate, o) : u(h, e.type, l), this._segCount = this._beziers[s].length, this._timeRes) {
            var m = f(this._beziers, this._timeRes);
            this._length = m.length, this._lengths = m.lengths, this._segments = m.segments, this._l1 = this._li = this._s1 = this._si = 0, this._l2 = this._lengths[0], this._curSeg = this._segments[0], this._s2 = this._curSeg[0], this._prec = 1 / this._curSeg.length
          }
          if (c = this._autoRotate) for (this._initialRotations = [], c[0] instanceof Array || (this._autoRotate = c = [c]), n = c.length; --n > -1;) {
            for (a = 0; 3 > a; a++) s = c[n][a], this._func[s] = "function" == typeof t[s] ? t[s.indexOf("set") || "function" != typeof t["get" + s.substr(3)] ? s : "get" + s.substr(3)] : !1;
            s = c[n][2], this._initialRotations[n] = this._func[s] ? this._func[s].call(this._target) : this._target[s]
          }
          return this._startRatio = i.vars.runBackwards ? 1 : 0, !0
        },
        set: function (e) {
          var i, s, r, n, a, o, h, l, _, u, p = this._segCount,
              f = this._func,
              c = this._target,
              m = e !== this._startRatio;
          if (this._timeRes) {
            if (_ = this._lengths, u = this._curSeg, e *= this._length, r = this._li, e > this._l2 && p - 1 > r) {
              for (l = p - 1; l > r && e >= (this._l2 = _[++r]););
              this._l1 = _[r - 1], this._li = r, this._curSeg = u = this._segments[r], this._s2 = u[this._s1 = this._si = 0]
            } else if (this._l1 > e && r > 0) {
              for (; r > 0 && (this._l1 = _[--r]) >= e;);
              0 === r && this._l1 > e ? this._l1 = 0 : r++, this._l2 = _[r], this._li = r, this._curSeg = u = this._segments[r], this._s1 = u[(this._si = u.length - 1) - 1] || 0, this._s2 = u[this._si]
            }
            if (i = r, e -= this._l1, r = this._si, e > this._s2 && u.length - 1 > r) {
              for (l = u.length - 1; l > r && e >= (this._s2 = u[++r]););
              this._s1 = u[r - 1], this._si = r
            } else if (this._s1 > e && r > 0) {
              for (; r > 0 && (this._s1 = u[--r]) >= e;);
              0 === r && this._s1 > e ? this._s1 = 0 : r++, this._s2 = u[r], this._si = r
            }
            o = (r + (e - this._s1) / (this._s2 - this._s1)) * this._prec
          } else i = 0 > e ? 0 : e >= 1 ? p - 1 : p * e >> 0, o = (e - i * (1 / p)) * p;
          for (s = 1 - o, r = this._props.length; --r > -1;) n = this._props[r], a = this._beziers[n][i], h = (o * o * a.da + 3 * s * (o * a.ca + s * a.ba)) * o + a.a, this._round[n] && (h = Math.round(h)), f[n] ? c[n](h) : c[n] = h;
          if (this._autoRotate) {
            var d, g, v, y, T, w, x, b = this._autoRotate;
            for (r = b.length; --r > -1;) n = b[r][2], w = b[r][3] || 0, x = b[r][4] === !0 ? 1 : t, a = this._beziers[b[r][0]], d = this._beziers[b[r][1]], a && d && (a = a[i], d = d[i], g = a.a + (a.b - a.a) * o, y = a.b + (a.c - a.b) * o, g += (y - g) * o, y += (a.c + (a.d - a.c) * o - y) * o, v = d.a + (d.b - d.a) * o, T = d.b + (d.c - d.b) * o, v += (T - v) * o, T += (d.c + (d.d - d.c) * o - T) * o, h = m ? Math.atan2(T - v, y - g) * x + w : this._initialRotations[r], f[n] ? c[n](h) : c[n] = h)
          }
        }
      }),
        m = c.prototype;
    c.bezierThrough = _, c.cubicToQuadratic = o, c._autoCSS = !0, c.quadraticToCubic = function (t, e, i) {
      return new n(t, (2 * e + t) / 3, (2 * e + i) / 3, i)
    }, c._cssRegister = function () {
      var t = window._gsDefine.globals.CSSPlugin;
      if (t) {
        var e = t._internals,
            i = e._parseToProxy,
            s = e._setPluginRatio,
            r = e.CSSPropTween;
        e._registerComplexSpecialProp("bezier", {
          parser: function (t, e, n, a, o, h) {
            e instanceof Array && (e = {
              values: e
            }), h = new c;
            var l, _, u, p = e.values,
                f = p.length - 1,
                m = [],
                d = {};
            if (0 > f) return o;
            for (l = 0; f >= l; l++) u = i(t, p[l], a, o, h, f !== l), m[l] = u.end;
            for (_ in e) d[_] = e[_];
            return d.values = m, o = new r(t, "bezier", 0, 0, u.pt, 2), o.data = u, o.plugin = h, o.setRatio = s, 0 === d.autoRotate && (d.autoRotate = !0), !d.autoRotate || d.autoRotate instanceof Array || (l = d.autoRotate === !0 ? 0 : Number(d.autoRotate), d.autoRotate = null != u.end.left ? [
              ["left", "top", "rotation", l, !1]
            ] : null != u.end.x ? [
              ["x", "y", "rotation", l, !1]
            ] : !1), d.autoRotate && (a._transform || a._enableTransforms(!1), u.autoRotate = a._target._gsTransform), h._onInitTween(u.proxy, d, a._tween), o
          }
        })
      }
    }, m._roundProps = function (t, e) {
      for (var i = this._overwriteProps, s = i.length; --s > -1;)(t[i[s]] || t.bezier || t.bezierThrough) && (this._round[i[s]] = e)
    }, m._kill = function (t) {
      var e, i, s = this._props;
      for (e in this._beziers) if (e in t) for (delete this._beziers[e], delete this._func[e], i = s.length; --i > -1;) s[i] === e && s.splice(i, 1);
      return this._super._kill.call(this, t)
    }
  }(), window._gsDefine("plugins.CSSPlugin", ["plugins.TweenPlugin", "TweenLite"], function (t, e) {
    var i, s, r, n, a = function () {
      t.call(this, "css"), this._overwriteProps.length = 0, this.setRatio = a.prototype.setRatio
    },
        o = {},
        h = a.prototype = new t("css");
    h.constructor = a, a.version = "1.12.1", a.API = 2, a.defaultTransformPerspective = 0, a.defaultSkewType = "compensated", h = "px", a.suffixMap = {
      top: h,
      right: h,
      bottom: h,
      left: h,
      width: h,
      height: h,
      fontSize: h,
      padding: h,
      margin: h,
      perspective: h,
      lineHeight: ""
    };
    var l, _, u, p, f, c, m = /(?:\d|\-\d|\.\d|\-\.\d)+/g,
        d = /(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g,
        g = /(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi,
        v = /[^\d\-\.]/g,
        y = /(?:\d|\-|\+|=|#|\.)*/g,
        T = /opacity *= *([^)]*)/i,
        w = /opacity:([^;]*)/i,
        x = /alpha\(opacity *=.+?\)/i,
        b = /^(rgb|hsl)/,
        P = /([A-Z])/g,
        S = /-([a-z])/gi,
        k = /(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi,
        R = function (t, e) {
        return e.toUpperCase()
        },
        A = /(?:Left|Right|Width)/i,
        C = /(M11|M12|M21|M22)=[\d\-\.e]+/gi,
        O = /progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i,
        D = /,(?=[^\)]*(?:\(|$))/gi,
        M = Math.PI / 180,
        z = 180 / Math.PI,
        I = {},
        E = document,
        L = E.createElement("div"),
        F = E.createElement("img"),
        N = a._internals = {
        _specialProps: o
        },
        X = navigator.userAgent,
        U = function () {
        var t, e = X.indexOf("Android"),
            i = E.createElement("div");
        return u = -1 !== X.indexOf("Safari") && -1 === X.indexOf("Chrome") && (-1 === e || Number(X.substr(e + 8, 1)) > 3), f = u && 6 > Number(X.substr(X.indexOf("Version/") + 8, 1)), p = -1 !== X.indexOf("Firefox"), /MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(X) && (c = parseFloat(RegExp.$1)), i.innerHTML = "<a style='top:1px;opacity:.55;'>a</a>", t = i.getElementsByTagName("a")[0], t ? /^0.55/.test(t.style.opacity) : !1
        }(),
        Y = function (t) {
        return T.test("string" == typeof t ? t : (t.currentStyle ? t.currentStyle.filter : t.style.filter) || "") ? parseFloat(RegExp.$1) / 100 : 1
        },
        j = function (t) {
        window.console && console.log(t)
        },
        B = "",
        q = "",
        V = function (t, e) {
        e = e || L;
        var i, s, r = e.style;
        if (void 0 !== r[t]) return t;
        for (t = t.charAt(0).toUpperCase() + t.substr(1), i = ["O", "Moz", "ms", "Ms", "Webkit"], s = 5; --s > -1 && void 0 === r[i[s] + t];);
        return s >= 0 ? (q = 3 === s ? "ms" : i[s], B = "-" + q.toLowerCase() + "-", q + t) : null
        },
        W = E.defaultView ? E.defaultView.getComputedStyle : function () {},
        G = a.getStyle = function (t, e, i, s, r) {
        var n;
        return U || "opacity" !== e ? (!s && t.style[e] ? n = t.style[e] : (i = i || W(t)) ? n = i[e] || i.getPropertyValue(e) || i.getPropertyValue(e.replace(P, "-$1").toLowerCase()) : t.currentStyle && (n = t.currentStyle[e]), null == r || n && "none" !== n && "auto" !== n && "auto auto" !== n ? n : r) : Y(t)
        },
        $ = N.convertToPixels = function (t, i, s, r, n) {
        if ("px" === r || !r) return s;
        if ("auto" === r || !s) return 0;
        var o, h, l, _ = A.test(i),
            u = t,
            p = L.style,
            f = 0 > s;
        if (f && (s = -s), "%" === r && -1 !== i.indexOf("border")) o = s / 100 * (_ ? t.clientWidth : t.clientHeight);
        else {
          if (p.cssText = "border:0 solid red;position:" + G(t, "position") + ";line-height:0;", "%" !== r && u.appendChild) p[_ ? "borderLeftWidth" : "borderTopWidth"] = s + r;
          else {
            if (u = t.parentNode || E.body, h = u._gsCache, l = e.ticker.frame, h && _ && h.time === l) return h.width * s / 100;
            p[_ ? "width" : "height"] = s + r
          }
          u.appendChild(L), o = parseFloat(L[_ ? "offsetWidth" : "offsetHeight"]), u.removeChild(L), _ && "%" === r && a.cacheWidths !== !1 && (h = u._gsCache = u._gsCache || {}, h.time = l, h.width = 100 * (o / s)), 0 !== o || n || (o = $(t, i, s, r, !0))
        }
        return f ? -o : o
        },
        Z = N.calculateOffset = function (t, e, i) {
        if ("absolute" !== G(t, "position", i)) return 0;
        var s = "left" === e ? "Left" : "Top",
            r = G(t, "margin" + s, i);
        return t["offset" + s] - ($(t, e, parseFloat(r), r.replace(y, "")) || 0)
        },
        Q = function (t, e) {
        var i, s, r = {};
        if (e = e || W(t, null)) if (i = e.length) for (; --i > -1;) r[e[i].replace(S, R)] = e.getPropertyValue(e[i]);
        else for (i in e) r[i] = e[i];
        else if (e = t.currentStyle || t.style) for (i in e)"string" == typeof i && void 0 === r[i] && (r[i.replace(S, R)] = e[i]);
        return U || (r.opacity = Y(t)), s = Pe(t, e, !1), r.rotation = s.rotation, r.skewX = s.skewX, r.scaleX = s.scaleX, r.scaleY = s.scaleY, r.x = s.x, r.y = s.y, xe && (r.z = s.z, r.rotationX = s.rotationX, r.rotationY = s.rotationY, r.scaleZ = s.scaleZ), r.filters && delete r.filters, r
        },
        H = function (t, e, i, s, r) {
        var n, a, o, h = {},
            l = t.style;
        for (a in i)"cssText" !== a && "length" !== a && isNaN(a) && (e[a] !== (n = i[a]) || r && r[a]) && -1 === a.indexOf("Origin") && ("number" == typeof n || "string" == typeof n) && (h[a] = "auto" !== n || "left" !== a && "top" !== a ? "" !== n && "auto" !== n && "none" !== n || "string" != typeof e[a] || "" === e[a].replace(v, "") ? n : 0 : Z(t, a), void 0 !== l[a] && (o = new ue(l, a, l[a], o)));
        if (s) for (a in s)"className" !== a && (h[a] = s[a]);
        return {
          difs: h,
          firstMPT: o
        }
        },
        K = {
        width: ["Left", "Right"],
        height: ["Top", "Bottom"]
        },
        J = ["marginLeft", "marginRight", "marginTop", "marginBottom"],
        te = function (t, e, i) {
        var s = parseFloat("width" === e ? t.offsetWidth : t.offsetHeight),
            r = K[e],
            n = r.length;
        for (i = i || W(t, null); --n > -1;) s -= parseFloat(G(t, "padding" + r[n], i, !0)) || 0, s -= parseFloat(G(t, "border" + r[n] + "Width", i, !0)) || 0;
        return s
        },
        ee = function (t, e) {
        (null == t || "" === t || "auto" === t || "auto auto" === t) && (t = "0 0");
        var i = t.split(" "),
            s = -1 !== t.indexOf("left") ? "0%" : -1 !== t.indexOf("right") ? "100%" : i[0],
            r = -1 !== t.indexOf("top") ? "0%" : -1 !== t.indexOf("bottom") ? "100%" : i[1];
        return null == r ? r = "0" : "center" === r && (r = "50%"), ("center" === s || isNaN(parseFloat(s)) && -1 === (s + "").indexOf("=")) && (s = "50%"), e && (e.oxp = -1 !== s.indexOf("%"), e.oyp = -1 !== r.indexOf("%"), e.oxr = "=" === s.charAt(1), e.oyr = "=" === r.charAt(1), e.ox = parseFloat(s.replace(v, "")), e.oy = parseFloat(r.replace(v, ""))), s + " " + r + (i.length > 2 ? " " + i[2] : "")
        },
        ie = function (t, e) {
        return "string" == typeof t && "=" === t.charAt(1) ? parseInt(t.charAt(0) + "1", 10) * parseFloat(t.substr(2)) : parseFloat(t) - parseFloat(e)
        },
        se = function (t, e) {
        return null == t ? e : "string" == typeof t && "=" === t.charAt(1) ? parseInt(t.charAt(0) + "1", 10) * Number(t.substr(2)) + e : parseFloat(t)
        },
        re = function (t, e, i, s) {
        var r, n, a, o, h = 1e-6;
        return null == t ? o = e : "number" == typeof t ? o = t : (r = 360, n = t.split("_"), a = Number(n[0].replace(v, "")) * (-1 === t.indexOf("rad") ? 1 : z) - ("=" === t.charAt(1) ? 0 : e), n.length && (s && (s[i] = e + a), -1 !== t.indexOf("short") && (a %= r, a !== a % (r / 2) && (a = 0 > a ? a + r : a - r)), -1 !== t.indexOf("_cw") && 0 > a ? a = (a + 9999999999 * r) % r - (0 | a / r) * r : -1 !== t.indexOf("ccw") && a > 0 && (a = (a - 9999999999 * r) % r - (0 | a / r) * r)), o = e + a), h > o && o > -h && (o = 0), o
        },
        ne = {
        aqua: [0, 255, 255],
        lime: [0, 255, 0],
        silver: [192, 192, 192],
        black: [0, 0, 0],
        maroon: [128, 0, 0],
        teal: [0, 128, 128],
        blue: [0, 0, 255],
        navy: [0, 0, 128],
        white: [255, 255, 255],
        fuchsia: [255, 0, 255],
        olive: [128, 128, 0],
        yellow: [255, 255, 0],
        orange: [255, 165, 0],
        gray: [128, 128, 128],
        purple: [128, 0, 128],
        green: [0, 128, 0],
        red: [255, 0, 0],
        pink: [255, 192, 203],
        cyan: [0, 255, 255],
        transparent: [255, 255, 255, 0]
        },
        ae = function (t, e, i) {
        return t = 0 > t ? t + 1 : t > 1 ? t - 1 : t, 0 | 255 * (1 > 6 * t ? e + 6 * (i - e) * t : .5 > t ? i : 2 > 3 * t ? e + 6 * (i - e) * (2 / 3 - t) : e) + .5
        },
        oe = function (t) {
        var e, i, s, r, n, a;
        return t && "" !== t ? "number" == typeof t ? [t >> 16, 255 & t >> 8, 255 & t] : ("," === t.charAt(t.length - 1) && (t = t.substr(0, t.length - 1)), ne[t] ? ne[t] : "#" === t.charAt(0) ? (4 === t.length && (e = t.charAt(1), i = t.charAt(2), s = t.charAt(3), t = "#" + e + e + i + i + s + s), t = parseInt(t.substr(1), 16), [t >> 16, 255 & t >> 8, 255 & t]) : "hsl" === t.substr(0, 3) ? (t = t.match(m), r = Number(t[0]) % 360 / 360, n = Number(t[1]) / 100, a = Number(t[2]) / 100, i = .5 >= a ? a * (n + 1) : a + n - a * n, e = 2 * a - i, t.length > 3 && (t[3] = Number(t[3])), t[0] = ae(r + 1 / 3, e, i), t[1] = ae(r, e, i), t[2] = ae(r - 1 / 3, e, i), t) : (t = t.match(m) || ne.transparent, t[0] = Number(t[0]), t[1] = Number(t[1]), t[2] = Number(t[2]), t.length > 3 && (t[3] = Number(t[3])), t)) : ne.black
        },
        he = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#.+?\\b";
    for (h in ne) he += "|" + h + "\\b";
    he = RegExp(he + ")", "gi");
    var le = function (t, e, i, s) {
      if (null == t) return function (t) {
        return t
      };
      var r, n = e ? (t.match(he) || [""])[0] : "",
          a = t.split(n).join("").match(g) || [],
          o = t.substr(0, t.indexOf(a[0])),
          h = ")" === t.charAt(t.length - 1) ? ")" : "",
          l = -1 !== t.indexOf(" ") ? " " : ",",
          _ = a.length,
          u = _ > 0 ? a[0].replace(m, "") : "";
      return _ ? r = e ?
      function (t) {
        var e, p, f, c;
        if ("number" == typeof t) t += u;
        else if (s && D.test(t)) {
          for (c = t.replace(D, "|").split("|"), f = 0; c.length > f; f++) c[f] = r(c[f]);
          return c.join(",")
        }
        if (e = (t.match(he) || [n])[0], p = t.split(e).join("").match(g) || [], f = p.length, _ > f--) for (; _ > ++f;) p[f] = i ? p[0 | (f - 1) / 2] : a[f];
        return o + p.join(l) + l + e + h + (-1 !== t.indexOf("inset") ? " inset" : "")
      } : function (t) {
        var e, n, p;
        if ("number" == typeof t) t += u;
        else if (s && D.test(t)) {
          for (n = t.replace(D, "|").split("|"), p = 0; n.length > p; p++) n[p] = r(n[p]);
          return n.join(",")
        }
        if (e = t.match(g) || [], p = e.length, _ > p--) for (; _ > ++p;) e[p] = i ? e[0 | (p - 1) / 2] : a[p];
        return o + e.join(l) + h
      } : function (t) {
        return t
      }
    },
        _e = function (t) {
        return t = t.split(","), function (e, i, s, r, n, a, o) {
          var h, l = (i + "").split(" ");
          for (o = {}, h = 0; 4 > h; h++) o[t[h]] = l[h] = l[h] || l[(h - 1) / 2 >> 0];
          return r.parse(e, o, n, a)
        }
        },
        ue = (N._setPluginRatio = function (t) {
        this.plugin.setRatio(t);
        for (var e, i, s, r, n = this.data, a = n.proxy, o = n.firstMPT, h = 1e-6; o;) e = a[o.v], o.r ? e = Math.round(e) : h > e && e > -h && (e = 0), o.t[o.p] = e, o = o._next;
        if (n.autoRotate && (n.autoRotate.rotation = a.rotation), 1 === t) for (o = n.firstMPT; o;) {
          if (i = o.t, i.type) {
            if (1 === i.type) {
              for (r = i.xs0 + i.s + i.xs1, s = 1; i.l > s; s++) r += i["xn" + s] + i["xs" + (s + 1)];
              i.e = r
            }
          } else i.e = i.s + i.xs0;
          o = o._next
        }
      }, function (t, e, i, s, r) {
        this.t = t, this.p = e, this.v = i, this.r = r, s && (s._prev = this, this._next = s)
      }),
        pe = (N._parseToProxy = function (t, e, i, s, r, n) {
        var a, o, h, l, _, u = s,
            p = {},
            f = {},
            c = i._transform,
            m = I;
        for (i._transform = null, I = e, s = _ = i.parse(t, e, s, r), I = m, n && (i._transform = c, u && (u._prev = null, u._prev && (u._prev._next = null))); s && s !== u;) {
          if (1 >= s.type && (o = s.p, f[o] = s.s + s.c, p[o] = s.s, n || (l = new ue(s, "s", o, l, s.r), s.c = 0), 1 === s.type)) for (a = s.l; --a > 0;) h = "xn" + a, o = s.p + "_" + h, f[o] = s.data[h], p[o] = s[h], n || (l = new ue(s, h, o, l, s.rxp[h]));
          s = s._next
        }
        return {
          proxy: p,
          end: f,
          firstMPT: l,
          pt: _
        }
      }, N.CSSPropTween = function (t, e, s, r, a, o, h, l, _, u, p) {
        this.t = t, this.p = e, this.s = s, this.c = r, this.n = h || e, t instanceof pe || n.push(this.n), this.r = l, this.type = o || 0, _ && (this.pr = _, i = !0), this.b = void 0 === u ? s : u, this.e = void 0 === p ? s + r : p, a && (this._next = a, a._prev = this)
      }),
        fe = a.parseComplex = function (t, e, i, s, r, n, a, o, h, _) {
        i = i || n || "", a = new pe(t, e, 0, 0, a, _ ? 2 : 1, null, !1, o, i, s), s += "";
        var u, p, f, c, g, v, y, T, w, x, P, S, k = i.split(", ").join(",").split(" "),
            R = s.split(", ").join(",").split(" "),
            A = k.length,
            C = l !== !1;
        for ((-1 !== s.indexOf(",") || -1 !== i.indexOf(",")) && (k = k.join(" ").replace(D, ", ").split(" "), R = R.join(" ").replace(D, ", ").split(" "), A = k.length), A !== R.length && (k = (n || "").split(" "), A = k.length), a.plugin = h, a.setRatio = _, u = 0; A > u; u++) if (c = k[u], g = R[u], T = parseFloat(c), T || 0 === T) a.appendXtra("", T, ie(g, T), g.replace(d, ""), C && -1 !== g.indexOf("px"), !0);
        else if (r && ("#" === c.charAt(0) || ne[c] || b.test(c))) S = "," === g.charAt(g.length - 1) ? ")," : ")", c = oe(c), g = oe(g), w = c.length + g.length > 6, w && !U && 0 === g[3] ? (a["xs" + a.l] += a.l ? " transparent" : "transparent", a.e = a.e.split(R[u]).join("transparent")) : (U || (w = !1), a.appendXtra(w ? "rgba(" : "rgb(", c[0], g[0] - c[0], ",", !0, !0).appendXtra("", c[1], g[1] - c[1], ",", !0).appendXtra("", c[2], g[2] - c[2], w ? "," : S, !0), w && (c = 4 > c.length ? 1 : c[3], a.appendXtra("", c, (4 > g.length ? 1 : g[3]) - c, S, !1)));
        else if (v = c.match(m)) {
          if (y = g.match(d), !y || y.length !== v.length) return a;
          for (f = 0, p = 0; v.length > p; p++) P = v[p], x = c.indexOf(P, f), a.appendXtra(c.substr(f, x - f), Number(P), ie(y[p], P), "", C && "px" === c.substr(x + P.length, 2), 0 === p), f = x + P.length;
          a["xs" + a.l] += c.substr(f)
        } else a["xs" + a.l] += a.l ? " " + c : c;
        if (-1 !== s.indexOf("=") && a.data) {
          for (S = a.xs0 + a.data.s, u = 1; a.l > u; u++) S += a["xs" + u] + a.data["xn" + u];
          a.e = S + a["xs" + u]
        }
        return a.l || (a.type = -1, a.xs0 = a.e), a.xfirst || a
        },
        ce = 9;
    for (h = pe.prototype, h.l = h.pr = 0; --ce > 0;) h["xn" + ce] = 0, h["xs" + ce] = "";
    h.xs0 = "", h._next = h._prev = h.xfirst = h.data = h.plugin = h.setRatio = h.rxp = null, h.appendXtra = function (t, e, i, s, r, n) {
      var a = this,
          o = a.l;
      return a["xs" + o] += n && o ? " " + t : t || "", i || 0 === o || a.plugin ? (a.l++, a.type = a.setRatio ? 2 : 1, a["xs" + a.l] = s || "", o > 0 ? (a.data["xn" + o] = e + i, a.rxp["xn" + o] = r, a["xn" + o] = e, a.plugin || (a.xfirst = new pe(a, "xn" + o, e, i, a.xfirst || a, 0, a.n, r, a.pr), a.xfirst.xs0 = 0), a) : (a.data = {
        s: e + i
      }, a.rxp = {}, a.s = e, a.c = i, a.r = r, a)) : (a["xs" + o] += e + (s || ""), a)
    };
    var me = function (t, e) {
      e = e || {}, this.p = e.prefix ? V(t) || t : t, o[t] = o[this.p] = this, this.format = e.formatter || le(e.defaultValue, e.color, e.collapsible, e.multi), e.parser && (this.parse = e.parser), this.clrs = e.color, this.multi = e.multi, this.keyword = e.keyword, this.dflt = e.defaultValue, this.pr = e.priority || 0
    },
        de = N._registerComplexSpecialProp = function (t, e, i) {
        "object" != typeof e && (e = {
          parser: i
        });
        var s, r, n = t.split(","),
            a = e.defaultValue;
        for (i = i || [a], s = 0; n.length > s; s++) e.prefix = 0 === s && e.prefix, e.defaultValue = i[s] || a, r = new me(n[s], e)
        },
        ge = function (t) {
        if (!o[t]) {
          var e = t.charAt(0).toUpperCase() + t.substr(1) + "Plugin";
          de(t, {
            parser: function (t, i, s, r, n, a, h) {
              var l = (window.GreenSockGlobals || window).com.greensock.plugins[e];
              return l ? (l._cssRegister(), o[s].parse(t, i, s, r, n, a, h)) : (j("Error: " + e + " js file not loaded."), n)
            }
          })
        }
        };
    h = me.prototype, h.parseComplex = function (t, e, i, s, r, n) {
      var a, o, h, l, _, u, p = this.keyword;
      if (this.multi && (D.test(i) || D.test(e) ? (o = e.replace(D, "|").split("|"), h = i.replace(D, "|").split("|")) : p && (o = [e], h = [i])), h) {
        for (l = h.length > o.length ? h.length : o.length, a = 0; l > a; a++) e = o[a] = o[a] || this.dflt, i = h[a] = h[a] || this.dflt, p && (_ = e.indexOf(p), u = i.indexOf(p), _ !== u && (i = -1 === u ? h : o, i[a] += " " + p));
        e = o.join(", "), i = h.join(", ")
      }
      return fe(t, this.p, e, i, this.clrs, this.dflt, s, this.pr, r, n)
    }, h.parse = function (t, e, i, s, n, a) {
      return this.parseComplex(t.style, this.format(G(t, this.p, r, !1, this.dflt)), this.format(e), n, a)
    }, a.registerSpecialProp = function (t, e, i) {
      de(t, {
        parser: function (t, s, r, n, a, o) {
          var h = new pe(t, r, 0, 0, a, 2, r, !1, i);
          return h.plugin = o, h.setRatio = e(t, s, n._tween, r), h
        },
        priority: i
      })
    };
    var ve = "scaleX,scaleY,scaleZ,x,y,z,skewX,skewY,rotation,rotationX,rotationY,perspective".split(","),
        ye = V("transform"),
        Te = B + "transform",
        we = V("transformOrigin"),
        xe = null !== V("perspective"),
        be = N.Transform = function () {
        this.skewY = 0
        },
        Pe = N.getTransform = function (t, e, i, s) {
        if (t._gsTransform && i && !s) return t._gsTransform;
        var r, n, o, h, l, _, u, p, f, c, m, d, g, v = i ? t._gsTransform || new be : new be,
            y = 0 > v.scaleX,
            T = 2e-5,
            w = 1e5,
            x = 179.99,
            b = x * M,
            P = xe ? parseFloat(G(t, we, e, !1, "0 0 0").split(" ")[2]) || v.zOrigin || 0 : 0;
        for (ye ? r = G(t, Te, e, !0) : t.currentStyle && (r = t.currentStyle.filter.match(C), r = r && 4 === r.length ? [r[0].substr(4), Number(r[2].substr(4)), Number(r[1].substr(4)), r[3].substr(4), v.x || 0, v.y || 0].join(",") : ""), n = (r || "").match(/(?:\-|\b)[\d\-\.e]+\b/gi) || [], o = n.length; --o > -1;) h = Number(n[o]), n[o] = (l = h - (h |= 0)) ? (0 | l * w + (0 > l ? -.5 : .5)) / w + h : h;
        if (16 === n.length) {
          var S = n[8],
              k = n[9],
              R = n[10],
              A = n[12],
              O = n[13],
              D = n[14];
          if (v.zOrigin && (D = -v.zOrigin, A = S * D - n[12], O = k * D - n[13], D = R * D + v.zOrigin - n[14]), !i || s || null == v.rotationX) {
            var I, E, L, F, N, X, U, Y = n[0],
                j = n[1],
                B = n[2],
                q = n[3],
                V = n[4],
                W = n[5],
                $ = n[6],
                Z = n[7],
                Q = n[11],
                H = Math.atan2($, R),
                K = -b > H || H > b;
            v.rotationX = H * z, H && (F = Math.cos(-H), N = Math.sin(-H), I = V * F + S * N, E = W * F + k * N, L = $ * F + R * N, S = V * -N + S * F, k = W * -N + k * F, R = $ * -N + R * F, Q = Z * -N + Q * F, V = I, W = E, $ = L), H = Math.atan2(S, Y), v.rotationY = H * z, H && (X = -b > H || H > b, F = Math.cos(-H), N = Math.sin(-H), I = Y * F - S * N, E = j * F - k * N, L = B * F - R * N, k = j * N + k * F, R = B * N + R * F, Q = q * N + Q * F, Y = I, j = E, B = L), H = Math.atan2(j, W), v.rotation = H * z, H && (U = -b > H || H > b, F = Math.cos(-H), N = Math.sin(-H), Y = Y * F + V * N, E = j * F + W * N, W = j * -N + W * F, $ = B * -N + $ * F, j = E), U && K ? v.rotation = v.rotationX = 0 : U && X ? v.rotation = v.rotationY = 0 : X && K && (v.rotationY = v.rotationX = 0), v.scaleX = (0 | Math.sqrt(Y * Y + j * j) * w + .5) / w, v.scaleY = (0 | Math.sqrt(W * W + k * k) * w + .5) / w, v.scaleZ = (0 | Math.sqrt($ * $ + R * R) * w + .5) / w, v.skewX = 0, v.perspective = Q ? 1 / (0 > Q ? -Q : Q) : 0, v.x = A, v.y = O, v.z = D
          }
        } else if (!(xe && !s && n.length && v.x === n[4] && v.y === n[5] && (v.rotationX || v.rotationY) || void 0 !== v.x && "none" === G(t, "display", e))) {
          var J = n.length >= 6,
              te = J ? n[0] : 1,
              ee = n[1] || 0,
              ie = n[2] || 0,
              se = J ? n[3] : 1;
          v.x = n[4] || 0, v.y = n[5] || 0, _ = Math.sqrt(te * te + ee * ee), u = Math.sqrt(se * se + ie * ie), p = te || ee ? Math.atan2(ee, te) * z : v.rotation || 0, f = ie || se ? Math.atan2(ie, se) * z + p : v.skewX || 0, c = _ - Math.abs(v.scaleX || 0), m = u - Math.abs(v.scaleY || 0), Math.abs(f) > 90 && 270 > Math.abs(f) && (y ? (_ *= -1, f += 0 >= p ? 180 : -180, p += 0 >= p ? 180 : -180) : (u *= -1, f += 0 >= f ? 180 : -180)), d = (p - v.rotation) % 180, g = (f - v.skewX) % 180, (void 0 === v.skewX || c > T || -T > c || m > T || -T > m || d > -x && x > d && false | d * w || g > -x && x > g && false | g * w) && (v.scaleX = _, v.scaleY = u, v.rotation = p, v.skewX = f), xe && (v.rotationX = v.rotationY = v.z = 0, v.perspective = parseFloat(a.defaultTransformPerspective) || 0, v.scaleZ = 1)
        }
        v.zOrigin = P;
        for (o in v) T > v[o] && v[o] > -T && (v[o] = 0);
        return i && (t._gsTransform = v), v
        },
        Se = function (t) {
        var e, i, s = this.data,
            r = -s.rotation * M,
            n = r + s.skewX * M,
            a = 1e5,
            o = (0 | Math.cos(r) * s.scaleX * a) / a,
            h = (0 | Math.sin(r) * s.scaleX * a) / a,
            l = (0 | Math.sin(n) * -s.scaleY * a) / a,
            _ = (0 | Math.cos(n) * s.scaleY * a) / a,
            u = this.t.style,
            p = this.t.currentStyle;
        if (p) {
          i = h, h = -l, l = -i, e = p.filter, u.filter = "";
          var f, m, d = this.t.offsetWidth,
              g = this.t.offsetHeight,
              v = "absolute" !== p.position,
              w = "progid:DXImageTransform.Microsoft.Matrix(M11=" + o + ", M12=" + h + ", M21=" + l + ", M22=" + _,
              x = s.x,
              b = s.y;
          if (null != s.ox && (f = (s.oxp ? .01 * d * s.ox : s.ox) - d / 2, m = (s.oyp ? .01 * g * s.oy : s.oy) - g / 2, x += f - (f * o + m * h), b += m - (f * l + m * _)), v ? (f = d / 2, m = g / 2, w += ", Dx=" + (f - (f * o + m * h) + x) + ", Dy=" + (m - (f * l + m * _) + b) + ")") : w += ", sizingMethod='auto expand')", u.filter = -1 !== e.indexOf("DXImageTransform.Microsoft.Matrix(") ? e.replace(O, w) : w + " " + e, (0 === t || 1 === t) && 1 === o && 0 === h && 0 === l && 1 === _ && (v && -1 === w.indexOf("Dx=0, Dy=0") || T.test(e) && 100 !== parseFloat(RegExp.$1) || -1 === e.indexOf("gradient(" && e.indexOf("Alpha")) && u.removeAttribute("filter")), !v) {
            var P, S, k, R = 8 > c ? 1 : -1;
            for (f = s.ieOffsetX || 0, m = s.ieOffsetY || 0, s.ieOffsetX = Math.round((d - ((0 > o ? -o : o) * d + (0 > h ? -h : h) * g)) / 2 + x), s.ieOffsetY = Math.round((g - ((0 > _ ? -_ : _) * g + (0 > l ? -l : l) * d)) / 2 + b), ce = 0; 4 > ce; ce++) S = J[ce], P = p[S], i = -1 !== P.indexOf("px") ? parseFloat(P) : $(this.t, S, parseFloat(P), P.replace(y, "")) || 0, k = i !== s[S] ? 2 > ce ? -s.ieOffsetX : -s.ieOffsetY : 2 > ce ? f - s.ieOffsetX : m - s.ieOffsetY, u[S] = (s[S] = Math.round(i - k * (0 === ce || 2 === ce ? 1 : R))) + "px"
          }
        }
        },
        ke = N.set3DTransformRatio = function (t) {
        var e, i, s, r, n, a, o, h, l, _, u, f, c, m, d, g, v, y, T, w, x, b, P, S = this.data,
            k = this.t.style,
            R = S.rotation * M,
            A = S.scaleX,
            C = S.scaleY,
            O = S.scaleZ,
            D = S.perspective;
        if (!(1 !== t && 0 !== t || "auto" !== S.force3D || S.rotationY || S.rotationX || 1 !== O || D || S.z)) return Re.call(this, t), void 0;
        if (p) {
          var z = 1e-4;
          z > A && A > -z && (A = O = 2e-5), z > C && C > -z && (C = O = 2e-5), !D || S.z || S.rotationX || S.rotationY || (D = 0)
        }
        if (R || S.skewX) y = Math.cos(R), T = Math.sin(R), e = y, n = T, S.skewX && (R -= S.skewX * M, y = Math.cos(R), T = Math.sin(R), "simple" === S.skewType && (w = Math.tan(S.skewX * M), w = Math.sqrt(1 + w * w), y *= w, T *= w)), i = -T, a = y;
        else {
          if (!(S.rotationY || S.rotationX || 1 !== O || D)) return k[ye] = "translate3d(" + S.x + "px," + S.y + "px," + S.z + "px)" + (1 !== A || 1 !== C ? " scale(" + A + "," + C + ")" : ""), void 0;
          e = a = 1, i = n = 0
        }
        u = 1, s = r = o = h = l = _ = f = c = m = 0, d = D ? -1 / D : 0, g = S.zOrigin, v = 1e5, R = S.rotationY * M, R && (y = Math.cos(R), T = Math.sin(R), l = u * -T, c = d * -T, s = e * T, o = n * T, u *= y, d *= y, e *= y, n *= y), R = S.rotationX * M, R && (y = Math.cos(R), T = Math.sin(R), w = i * y + s * T, x = a * y + o * T, b = _ * y + u * T, P = m * y + d * T, s = i * -T + s * y, o = a * -T + o * y, u = _ * -T + u * y, d = m * -T + d * y, i = w, a = x, _ = b, m = P), 1 !== O && (s *= O, o *= O, u *= O, d *= O), 1 !== C && (i *= C, a *= C, _ *= C, m *= C), 1 !== A && (e *= A, n *= A, l *= A, c *= A), g && (f -= g, r = s * f, h = o * f, f = u * f + g), r = (w = (r += S.x) - (r |= 0)) ? (0 | w * v + (0 > w ? -.5 : .5)) / v + r : r, h = (w = (h += S.y) - (h |= 0)) ? (0 | w * v + (0 > w ? -.5 : .5)) / v + h : h, f = (w = (f += S.z) - (f |= 0)) ? (0 | w * v + (0 > w ? -.5 : .5)) / v + f : f, k[ye] = "matrix3d(" + [(0 | e * v) / v, (0 | n * v) / v, (0 | l * v) / v, (0 | c * v) / v, (0 | i * v) / v, (0 | a * v) / v, (0 | _ * v) / v, (0 | m * v) / v, (0 | s * v) / v, (0 | o * v) / v, (0 | u * v) / v, (0 | d * v) / v, r, h, f, D ? 1 + -f / D : 1].join(",") + ")"
        },
        Re = N.set2DTransformRatio = function (t) {
        var e, i, s, r, n, a = this.data,
            o = this.t,
            h = o.style;
        return a.rotationX || a.rotationY || a.z || a.force3D === !0 || "auto" === a.force3D && 1 !== t && 0 !== t ? (this.setRatio = ke, ke.call(this, t), void 0) : (a.rotation || a.skewX ? (e = a.rotation * M, i = e - a.skewX * M, s = 1e5, r = a.scaleX * s, n = a.scaleY * s, h[ye] = "matrix(" + (0 | Math.cos(e) * r) / s + "," + (0 | Math.sin(e) * r) / s + "," + (0 | Math.sin(i) * -n) / s + "," + (0 | Math.cos(i) * n) / s + "," + a.x + "," + a.y + ")") : h[ye] = "matrix(" + a.scaleX + ",0,0," + a.scaleY + "," + a.x + "," + a.y + ")", void 0)
        };
    de("transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,transformPerspective,directionalRotation,parseTransform,force3D,skewType", {
      parser: function (t, e, i, s, n, o, h) {
        if (s._transform) return n;
        var l, _, u, p, f, c, m, d = s._transform = Pe(t, r, !0, h.parseTransform),
            g = t.style,
            v = 1e-6,
            y = ve.length,
            T = h,
            w = {};
        if ("string" == typeof T.transform && ye) u = L.style, u[ye] = T.transform, u.display = "block", u.position = "absolute", E.body.appendChild(L), l = Pe(L, null, !1), E.body.removeChild(L);
        else if ("object" == typeof T) {
          if (l = {
            scaleX: se(null != T.scaleX ? T.scaleX : T.scale, d.scaleX),
            scaleY: se(null != T.scaleY ? T.scaleY : T.scale, d.scaleY),
            scaleZ: se(T.scaleZ, d.scaleZ),
            x: se(T.x, d.x),
            y: se(T.y, d.y),
            z: se(T.z, d.z),
            perspective: se(T.transformPerspective, d.perspective)
          }, m = T.directionalRotation, null != m) if ("object" == typeof m) for (u in m) T[u] = m[u];
          else T.rotation = m;
          l.rotation = re("rotation" in T ? T.rotation : "shortRotation" in T ? T.shortRotation + "_short" : "rotationZ" in T ? T.rotationZ : d.rotation, d.rotation, "rotation", w), xe && (l.rotationX = re("rotationX" in T ? T.rotationX : "shortRotationX" in T ? T.shortRotationX + "_short" : d.rotationX || 0, d.rotationX, "rotationX", w), l.rotationY = re("rotationY" in T ? T.rotationY : "shortRotationY" in T ? T.shortRotationY + "_short" : d.rotationY || 0, d.rotationY, "rotationY", w)), l.skewX = null == T.skewX ? d.skewX : re(T.skewX, d.skewX), l.skewY = null == T.skewY ? d.skewY : re(T.skewY, d.skewY), (_ = l.skewY - d.skewY) && (l.skewX += _, l.rotation += _)
        }
        for (xe && null != T.force3D && (d.force3D = T.force3D, c = !0), d.skewType = T.skewType || d.skewType || a.defaultSkewType, f = d.force3D || d.z || d.rotationX || d.rotationY || l.z || l.rotationX || l.rotationY || l.perspective, f || null == T.scale || (l.scaleZ = 1); --y > -1;) i = ve[y], p = l[i] - d[i], (p > v || -v > p || null != I[i]) && (c = !0, n = new pe(d, i, d[i], p, n), i in w && (n.e = w[i]), n.xs0 = 0, n.plugin = o, s._overwriteProps.push(n.n));
        return p = T.transformOrigin, (p || xe && f && d.zOrigin) && (ye ? (c = !0, i = we, p = (p || G(t, i, r, !1, "50% 50%")) + "", n = new pe(g, i, 0, 0, n, -1, "transformOrigin"), n.b = g[i], n.plugin = o, xe ? (u = d.zOrigin, p = p.split(" "), d.zOrigin = (p.length > 2 && (0 === u || "0px" !== p[2]) ? parseFloat(p[2]) : u) || 0, n.xs0 = n.e = p[0] + " " + (p[1] || "50%") + " 0px", n = new pe(d, "zOrigin", 0, 0, n, -1, n.n), n.b = u, n.xs0 = n.e = d.zOrigin) : n.xs0 = n.e = p) : ee(p + "", d)), c && (s._transformType = f || 3 === this._transformType ? 3 : 2), n
      },
      prefix: !0
    }), de("boxShadow", {
      defaultValue: "0px 0px 0px 0px #999",
      prefix: !0,
      color: !0,
      multi: !0,
      keyword: "inset"
    }), de("borderRadius", {
      defaultValue: "0px",
      parser: function (t, e, i, n, a) {
        e = this.format(e);
        var o, h, l, _, u, p, f, c, m, d, g, v, y, T, w, x, b = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"],
            P = t.style;
        for (m = parseFloat(t.offsetWidth), d = parseFloat(t.offsetHeight), o = e.split(" "), h = 0; b.length > h; h++) this.p.indexOf("border") && (b[h] = V(b[h])), u = _ = G(t, b[h], r, !1, "0px"), -1 !== u.indexOf(" ") && (_ = u.split(" "), u = _[0], _ = _[1]), p = l = o[h], f = parseFloat(u), v = u.substr((f + "").length), y = "=" === p.charAt(1), y ? (c = parseInt(p.charAt(0) + "1", 10), p = p.substr(2), c *= parseFloat(p), g = p.substr((c + "").length - (0 > c ? 1 : 0)) || "") : (c = parseFloat(p), g = p.substr((c + "").length)), "" === g && (g = s[i] || v), g !== v && (T = $(t, "borderLeft", f, v), w = $(t, "borderTop", f, v), "%" === g ? (u = 100 * (T / m) + "%", _ = 100 * (w / d) + "%") : "em" === g ? (x = $(t, "borderLeft", 1, "em"), u = T / x + "em", _ = w / x + "em") : (u = T + "px", _ = w + "px"), y && (p = parseFloat(u) + c + g, l = parseFloat(_) + c + g)), a = fe(P, b[h], u + " " + _, p + " " + l, !1, "0px", a);
        return a
      },
      prefix: !0,
      formatter: le("0px 0px 0px 0px", !1, !0)
    }), de("backgroundPosition", {
      defaultValue: "0 0",
      parser: function (t, e, i, s, n, a) {
        var o, h, l, _, u, p, f = "background-position",
            m = r || W(t, null),
            d = this.format((m ? c ? m.getPropertyValue(f + "-x") + " " + m.getPropertyValue(f + "-y") : m.getPropertyValue(f) : t.currentStyle.backgroundPositionX + " " + t.currentStyle.backgroundPositionY) || "0 0"),
            g = this.format(e);
        if (-1 !== d.indexOf("%") != (-1 !== g.indexOf("%")) && (p = G(t, "backgroundImage").replace(k, ""), p && "none" !== p)) {
          for (o = d.split(" "), h = g.split(" "), F.setAttribute("src", p), l = 2; --l > -1;) d = o[l], _ = -1 !== d.indexOf("%"), _ !== (-1 !== h[l].indexOf("%")) && (u = 0 === l ? t.offsetWidth - F.width : t.offsetHeight - F.height, o[l] = _ ? parseFloat(d) / 100 * u + "px" : 100 * (parseFloat(d) / u) + "%");
          d = o.join(" ")
        }
        return this.parseComplex(t.style, d, g, n, a)
      },
      formatter: ee
    }), de("backgroundSize", {
      defaultValue: "0 0",
      formatter: ee
    }), de("perspective", {
      defaultValue: "0px",
      prefix: !0
    }), de("perspectiveOrigin", {
      defaultValue: "50% 50%",
      prefix: !0
    }), de("transformStyle", {
      prefix: !0
    }), de("backfaceVisibility", {
      prefix: !0
    }), de("userSelect", {
      prefix: !0
    }), de("margin", {
      parser: _e("marginTop,marginRight,marginBottom,marginLeft")
    }), de("padding", {
      parser: _e("paddingTop,paddingRight,paddingBottom,paddingLeft")
    }), de("clip", {
      defaultValue: "rect(0px,0px,0px,0px)",
      parser: function (t, e, i, s, n, a) {
        var o, h, l;
        return 9 > c ? (h = t.currentStyle, l = 8 > c ? " " : ",", o = "rect(" + h.clipTop + l + h.clipRight + l + h.clipBottom + l + h.clipLeft + ")", e = this.format(e).split(",").join(l)) : (o = this.format(G(t, this.p, r, !1, this.dflt)), e = this.format(e)), this.parseComplex(t.style, o, e, n, a)
      }
    }), de("textShadow", {
      defaultValue: "0px 0px 0px #999",
      color: !0,
      multi: !0
    }), de("autoRound,strictUnits", {
      parser: function (t, e, i, s, r) {
        return r
      }
    }), de("border", {
      defaultValue: "0px solid #000",
      parser: function (t, e, i, s, n, a) {
        return this.parseComplex(t.style, this.format(G(t, "borderTopWidth", r, !1, "0px") + " " + G(t, "borderTopStyle", r, !1, "solid") + " " + G(t, "borderTopColor", r, !1, "#000")), this.format(e), n, a)
      },
      color: !0,
      formatter: function (t) {
        var e = t.split(" ");
        return e[0] + " " + (e[1] || "solid") + " " + (t.match(he) || ["#000"])[0]
      }
    }), de("borderWidth", {
      parser: _e("borderTopWidth,borderRightWidth,borderBottomWidth,borderLeftWidth")
    }), de("float,cssFloat,styleFloat", {
      parser: function (t, e, i, s, r) {
        var n = t.style,
            a = "cssFloat" in n ? "cssFloat" : "styleFloat";
        return new pe(n, a, 0, 0, r, -1, i, !1, 0, n[a], e)
      }
    });
    var Ae = function (t) {
      var e, i = this.t,
          s = i.filter || G(this.data, "filter"),
          r = 0 | this.s + this.c * t;
      100 === r && (-1 === s.indexOf("atrix(") && -1 === s.indexOf("radient(") && -1 === s.indexOf("oader(") ? (i.removeAttribute("filter"), e = !G(this.data, "filter")) : (i.filter = s.replace(x, ""), e = !0)), e || (this.xn1 && (i.filter = s = s || "alpha(opacity=" + r + ")"), -1 === s.indexOf("pacity") ? 0 === r && this.xn1 || (i.filter = s + " alpha(opacity=" + r + ")") : i.filter = s.replace(T, "opacity=" + r))
    };
    de("opacity,alpha,autoAlpha", {
      defaultValue: "1",
      parser: function (t, e, i, s, n, a) {
        var o = parseFloat(G(t, "opacity", r, !1, "1")),
            h = t.style,
            l = "autoAlpha" === i;
        return "string" == typeof e && "=" === e.charAt(1) && (e = ("-" === e.charAt(0) ? -1 : 1) * parseFloat(e.substr(2)) + o), l && 1 === o && "hidden" === G(t, "visibility", r) && 0 !== e && (o = 0), U ? n = new pe(h, "opacity", o, e - o, n) : (n = new pe(h, "opacity", 100 * o, 100 * (e - o), n), n.xn1 = l ? 1 : 0, h.zoom = 1, n.type = 2, n.b = "alpha(opacity=" + n.s + ")", n.e = "alpha(opacity=" + (n.s + n.c) + ")", n.data = t, n.plugin = a, n.setRatio = Ae), l && (n = new pe(h, "visibility", 0, 0, n, -1, null, !1, 0, 0 !== o ? "inherit" : "hidden", 0 === e ? "hidden" : "inherit"), n.xs0 = "inherit", s._overwriteProps.push(n.n), s._overwriteProps.push(i)), n
      }
    });
    var Ce = function (t, e) {
      e && (t.removeProperty ? ("ms" === e.substr(0, 2) && (e = "M" + e.substr(1)), t.removeProperty(e.replace(P, "-$1").toLowerCase())) : t.removeAttribute(e))
    },
        Oe = function (t) {
        if (this.t._gsClassPT = this, 1 === t || 0 === t) {
          this.t.setAttribute("class", 0 === t ? this.b : this.e);
          for (var e = this.data, i = this.t.style; e;) e.v ? i[e.p] = e.v : Ce(i, e.p), e = e._next;
          1 === t && this.t._gsClassPT === this && (this.t._gsClassPT = null)
        } else this.t.getAttribute("class") !== this.e && this.t.setAttribute("class", this.e)
        };
    de("className", {
      parser: function (t, e, s, n, a, o, h) {
        var l, _, u, p, f, c = t.getAttribute("class") || "",
            m = t.style.cssText;
        if (a = n._classNamePT = new pe(t, s, 0, 0, a, 2), a.setRatio = Oe, a.pr = -11, i = !0, a.b = c, _ = Q(t, r), u = t._gsClassPT) {
          for (p = {}, f = u.data; f;) p[f.p] = 1, f = f._next;
          u.setRatio(1)
        }
        return t._gsClassPT = a, a.e = "=" !== e.charAt(1) ? e : c.replace(RegExp("\\s*\\b" + e.substr(2) + "\\b"), "") + ("+" === e.charAt(0) ? " " + e.substr(2) : ""), n._tween._duration && (t.setAttribute("class", a.e), l = H(t, _, Q(t), h, p), t.setAttribute("class", c), a.data = l.firstMPT, t.style.cssText = m, a = a.xfirst = n.parse(t, l.difs, a, o)), a
      }
    });
    var De = function (t) {
      if ((1 === t || 0 === t) && this.data._totalTime === this.data._totalDuration && "isFromStart" !== this.data.data) {
        var e, i, s, r, n = this.t.style,
            a = o.transform.parse;
        if ("all" === this.e) n.cssText = "", r = !0;
        else for (e = this.e.split(","), s = e.length; --s > -1;) i = e[s], o[i] && (o[i].parse === a ? r = !0 : i = "transformOrigin" === i ? we : o[i].p), Ce(n, i);
        r && (Ce(n, ye), this.t._gsTransform && delete this.t._gsTransform)
      }
    };
    for (de("clearProps", {
      parser: function (t, e, s, r, n) {
        return n = new pe(t, s, 0, 0, n, 2), n.setRatio = De, n.e = e, n.pr = -10, n.data = r._tween, i = !0, n
      }
    }), h = "bezier,throwProps,physicsProps,physics2D".split(","), ce = h.length; ce--;) ge(h[ce]);
    h = a.prototype, h._firstPT = null, h._onInitTween = function (t, e, o) {
      if (!t.nodeType) return !1;
      this._target = t, this._tween = o, this._vars = e, l = e.autoRound, i = !1, s = e.suffixMap || a.suffixMap, r = W(t, ""), n = this._overwriteProps;
      var h, p, c, m, d, g, v, y, T, x = t.style;
      if (_ && "" === x.zIndex && (h = G(t, "zIndex", r), ("auto" === h || "" === h) && this._addLazySet(x, "zIndex", 0)), "string" == typeof e && (m = x.cssText, h = Q(t, r), x.cssText = m + ";" + e, h = H(t, h, Q(t)).difs, !U && w.test(e) && (h.opacity = parseFloat(RegExp.$1)), e = h, x.cssText = m), this._firstPT = p = this.parse(t, e, null), this._transformType) {
        for (T = 3 === this._transformType, ye ? u && (_ = !0, "" === x.zIndex && (v = G(t, "zIndex", r), ("auto" === v || "" === v) && this._addLazySet(x, "zIndex", 0)), f && this._addLazySet(x, "WebkitBackfaceVisibility", this._vars.WebkitBackfaceVisibility || (T ? "visible" : "hidden"))) : x.zoom = 1, c = p; c && c._next;) c = c._next;
        y = new pe(t, "transform", 0, 0, null, 2), this._linkCSSP(y, null, c), y.setRatio = T && xe ? ke : ye ? Re : Se, y.data = this._transform || Pe(t, r, !0), n.pop()
      }
      if (i) {
        for (; p;) {
          for (g = p._next, c = m; c && c.pr > p.pr;) c = c._next;
          (p._prev = c ? c._prev : d) ? p._prev._next = p : m = p, (p._next = c) ? c._prev = p : d = p, p = g
        }
        this._firstPT = m
      }
      return !0
    }, h.parse = function (t, e, i, n) {
      var a, h, _, u, p, f, c, m, d, g, v = t.style;
      for (a in e) f = e[a], h = o[a], h ? i = h.parse(t, f, a, this, i, n, e) : (p = G(t, a, r) + "", d = "string" == typeof f, "color" === a || "fill" === a || "stroke" === a || -1 !== a.indexOf("Color") || d && b.test(f) ? (d || (f = oe(f), f = (f.length > 3 ? "rgba(" : "rgb(") + f.join(",") + ")"), i = fe(v, a, p, f, !0, "transparent", i, 0, n)) : !d || -1 === f.indexOf(" ") && -1 === f.indexOf(",") ? (_ = parseFloat(p), c = _ || 0 === _ ? p.substr((_ + "").length) : "", ("" === p || "auto" === p) && ("width" === a || "height" === a ? (_ = te(t, a, r), c = "px") : "left" === a || "top" === a ? (_ = Z(t, a, r), c = "px") : (_ = "opacity" !== a ? 0 : 1, c = "")), g = d && "=" === f.charAt(1), g ? (u = parseInt(f.charAt(0) + "1", 10), f = f.substr(2), u *= parseFloat(f), m = f.replace(y, "")) : (u = parseFloat(f), m = d ? f.substr((u + "").length) || "" : ""), "" === m && (m = a in s ? s[a] : c), f = u || 0 === u ? (g ? u + _ : u) + m : e[a], c !== m && "" !== m && (u || 0 === u) && _ && (_ = $(t, a, _, c), "%" === m ? (_ /= $(t, a, 100, "%") / 100, e.strictUnits !== !0 && (p = _ + "%")) : "em" === m ? _ /= $(t, a, 1, "em") : "px" !== m && (u = $(t, a, u, m), m = "px"), g && (u || 0 === u) && (f = u + _ + m)), g && (u += _), !_ && 0 !== _ || !u && 0 !== u ? void 0 !== v[a] && (f || "NaN" != f + "" && null != f) ? (i = new pe(v, a, u || _ || 0, 0, i, -1, a, !1, 0, p, f), i.xs0 = "none" !== f || "display" !== a && -1 === a.indexOf("Style") ? f : p) : j("invalid " + a + " tween value: " + e[a]) : (i = new pe(v, a, _, u - _, i, 0, a, l !== !1 && ("px" === m || "zIndex" === a), 0, p, f), i.xs0 = m)) : i = fe(v, a, p, f, !0, null, i, 0, n)), n && i && !i.plugin && (i.plugin = n);
      return i
    }, h.setRatio = function (t) {
      var e, i, s, r = this._firstPT,
          n = 1e-6;
      if (1 !== t || this._tween._time !== this._tween._duration && 0 !== this._tween._time) if (t || this._tween._time !== this._tween._duration && 0 !== this._tween._time || this._tween._rawPrevTime === -1e-6) for (; r;) {
        if (e = r.c * t + r.s, r.r ? e = Math.round(e) : n > e && e > -n && (e = 0), r.type) if (1 === r.type) if (s = r.l, 2 === s) r.t[r.p] = r.xs0 + e + r.xs1 + r.xn1 + r.xs2;
        else if (3 === s) r.t[r.p] = r.xs0 + e + r.xs1 + r.xn1 + r.xs2 + r.xn2 + r.xs3;
        else if (4 === s) r.t[r.p] = r.xs0 + e + r.xs1 + r.xn1 + r.xs2 + r.xn2 + r.xs3 + r.xn3 + r.xs4;
        else if (5 === s) r.t[r.p] = r.xs0 + e + r.xs1 + r.xn1 + r.xs2 + r.xn2 + r.xs3 + r.xn3 + r.xs4 + r.xn4 + r.xs5;
        else {
          for (i = r.xs0 + e + r.xs1, s = 1; r.l > s; s++) i += r["xn" + s] + r["xs" + (s + 1)];
          r.t[r.p] = i
        } else - 1 === r.type ? r.t[r.p] = r.xs0 : r.setRatio && r.setRatio(t);
        else r.t[r.p] = e + r.xs0;
        r = r._next
      } else for (; r;) 2 !== r.type ? r.t[r.p] = r.b : r.setRatio(t), r = r._next;
      else for (; r;) 2 !== r.type ? r.t[r.p] = r.e : r.setRatio(t), r = r._next
    }, h._enableTransforms = function (t) {
      this._transformType = t || 3 === this._transformType ? 3 : 2, this._transform = this._transform || Pe(this._target, r, !0)
    };
    var Me = function () {
      this.t[this.p] = this.e, this.data._linkCSSP(this, this._next, null, !0)
    };
    h._addLazySet = function (t, e, i) {
      var s = this._firstPT = new pe(t, e, 0, 0, this._firstPT, 2);
      s.e = i, s.setRatio = Me, s.data = this
    }, h._linkCSSP = function (t, e, i, s) {
      return t && (e && (e._prev = t), t._next && (t._next._prev = t._prev), t._prev ? t._prev._next = t._next : this._firstPT === t && (this._firstPT = t._next, s = !0), i ? i._next = t : s || null !== this._firstPT || (this._firstPT = t), t._next = e, t._prev = i), t
    }, h._kill = function (e) {
      var i, s, r, n = e;
      if (e.autoAlpha || e.alpha) {
        n = {};
        for (s in e) n[s] = e[s];
        n.opacity = 1, n.autoAlpha && (n.visibility = 1)
      }
      return e.className && (i = this._classNamePT) && (r = i.xfirst, r && r._prev ? this._linkCSSP(r._prev, i._next, r._prev._prev) : r === this._firstPT && (this._firstPT = i._next), i._next && this._linkCSSP(i._next, i._next._next, r._prev), this._classNamePT = null), t.prototype._kill.call(this, n)
    };
    var ze = function (t, e, i) {
      var s, r, n, a;
      if (t.slice) for (r = t.length; --r > -1;) ze(t[r], e, i);
      else for (s = t.childNodes, r = s.length; --r > -1;) n = s[r], a = n.type, n.style && (e.push(Q(n)), i && i.push(n)), 1 !== a && 9 !== a && 11 !== a || !n.childNodes.length || ze(n, e, i)
    };
    return a.cascadeTo = function (t, i, s) {
      var r, n, a, o = e.to(t, i, s),
          h = [o],
          l = [],
          _ = [],
          u = [],
          p = e._internals.reservedProps;
      for (t = o._targets || o.target, ze(t, l, u), o.render(i, !0), ze(t, _), o.render(0, !0), o._enabled(!0), r = u.length; --r > -1;) if (n = H(u[r], l[r], _[r]), n.firstMPT) {
        n = n.difs;
        for (a in s) p[a] && (n[a] = s[a]);
        h.push(e.to(u[r], i, n))
      }
      return h
    }, t.activate([a]), a
  }, !0), function () {
    var t = window._gsDefine.plugin({
      propName: "roundProps",
      priority: -1,
      API: 2,
      init: function (t, e, i) {
        return this._tween = i, !0
      }
    }),
        e = t.prototype;
    e._onInitAllProps = function () {
      for (var t, e, i, s = this._tween, r = s.vars.roundProps instanceof Array ? s.vars.roundProps : s.vars.roundProps.split(","), n = r.length, a = {}, o = s._propLookup.roundProps; --n > -1;) a[r[n]] = 1;
      for (n = r.length; --n > -1;) for (t = r[n], e = s._firstPT; e;) i = e._next, e.pg ? e.t._roundProps(a, !0) : e.n === t && (this._add(e.t, t, e.s, e.c), i && (i._prev = e._prev), e._prev ? e._prev._next = i : s._firstPT === e && (s._firstPT = i), e._next = e._prev = null, s._propLookup[t] = o), e = i;
      return !1
    }, e._add = function (t, e, i, s) {
      this._addTween(t, e, i, i + s, e, !0), this._overwriteProps.push(e)
    }
  }(), window._gsDefine.plugin({
    propName: "attr",
    API: 2,
    version: "0.3.2",
    init: function (t, e) {
      var i, s, r;
      if ("function" != typeof t.setAttribute) return !1;
      this._target = t, this._proxy = {}, this._start = {}, this._end = {};
      for (i in e) this._start[i] = this._proxy[i] = s = t.getAttribute(i), r = this._addTween(this._proxy, i, parseFloat(s), e[i], i), this._end[i] = r ? r.s + r.c : e[i], this._overwriteProps.push(i);
      return !0
    },
    set: function (t) {
      this._super.setRatio.call(this, t);
      for (var e, i = this._overwriteProps, s = i.length, r = 1 === t ? this._end : t ? this._proxy : this._start; --s > -1;) e = i[s], this._target.setAttribute(e, r[e] + "")
    }
  }), window._gsDefine.plugin({
    propName: "directionalRotation",
    API: 2,
    version: "0.2.0",
    init: function (t, e) {
      "object" != typeof e && (e = {
        rotation: e
      }), this.finals = {};
      var i, s, r, n, a, o, h = e.useRadians === !0 ? 2 * Math.PI : 360,
          l = 1e-6;
      for (i in e)"useRadians" !== i && (o = (e[i] + "").split("_"), s = o[0], r = parseFloat("function" != typeof t[i] ? t[i] : t[i.indexOf("set") || "function" != typeof t["get" + i.substr(3)] ? i : "get" + i.substr(3)]()), n = this.finals[i] = "string" == typeof s && "=" === s.charAt(1) ? r + parseInt(s.charAt(0) + "1", 10) * Number(s.substr(2)) : Number(s) || 0, a = n - r, o.length && (s = o.join("_"), -1 !== s.indexOf("short") && (a %= h, a !== a % (h / 2) && (a = 0 > a ? a + h : a - h)), -1 !== s.indexOf("_cw") && 0 > a ? a = (a + 9999999999 * h) % h - (0 | a / h) * h : -1 !== s.indexOf("ccw") && a > 0 && (a = (a - 9999999999 * h) % h - (0 | a / h) * h)), (a > l || -l > a) && (this._addTween(t, i, r, r + a, i), this._overwriteProps.push(i)));
      return !0
    },
    set: function (t) {
      var e;
      if (1 !== t) this._super.setRatio.call(this, t);
      else for (e = this._firstPT; e;) e.f ? e.t[e.p](this.finals[e.p]) : e.t[e.p] = this.finals[e.p], e = e._next
    }
  })._autoCSS = !0, window._gsDefine("easing.Back", ["easing.Ease"], function (t) {
    var e, i, s, r = window.GreenSockGlobals || window,
        n = r.com.greensock,
        a = 2 * Math.PI,
        o = Math.PI / 2,
        h = n._class,
        l = function (e, i) {
        var s = h("easing." + e, function () {}, !0),
            r = s.prototype = new t;
        return r.constructor = s, r.getRatio = i, s
        },
        _ = t.register ||
        function () {},
        u = function (t, e, i, s) {
        var r = h("easing." + t, {
          easeOut: new e,
          easeIn: new i,
          easeInOut: new s
        }, !0);
        return _(r, t), r
        },
        p = function (t, e, i) {
        this.t = t, this.v = e, i && (this.next = i, i.prev = this, this.c = i.v - e, this.gap = i.t - t)
        },
        f = function (e, i) {
        var s = h("easing." + e, function (t) {
          this._p1 = t || 0 === t ? t : 1.70158, this._p2 = 1.525 * this._p1
        }, !0),
            r = s.prototype = new t;
        return r.constructor = s, r.getRatio = i, r.config = function (t) {
          return new s(t)
        }, s
        },
        c = u("Back", f("BackOut", function (t) {
        return (t -= 1) * t * ((this._p1 + 1) * t + this._p1) + 1
      }), f("BackIn", function (t) {
        return t * t * ((this._p1 + 1) * t - this._p1)
      }), f("BackInOut", function (t) {
        return 1 > (t *= 2) ? .5 * t * t * ((this._p2 + 1) * t - this._p2) : .5 * ((t -= 2) * t * ((this._p2 + 1) * t + this._p2) + 2)
      })),
        m = h("easing.SlowMo", function (t, e, i) {
        e = e || 0 === e ? e : .7, null == t ? t = .7 : t > 1 && (t = 1), this._p = 1 !== t ? e : 0, this._p1 = (1 - t) / 2, this._p2 = t, this._p3 = this._p1 + this._p2, this._calcEnd = i === !0
      }, !0),
        d = m.prototype = new t;
    return d.constructor = m, d.getRatio = function (t) {
      var e = t + (.5 - t) * this._p;
      return this._p1 > t ? this._calcEnd ? 1 - (t = 1 - t / this._p1) * t : e - (t = 1 - t / this._p1) * t * t * t * e : t > this._p3 ? this._calcEnd ? 1 - (t = (t - this._p3) / this._p1) * t : e + (t - e) * (t = (t - this._p3) / this._p1) * t * t * t : this._calcEnd ? 1 : e
    }, m.ease = new m(.7, .7), d.config = m.config = function (t, e, i) {
      return new m(t, e, i)
    }, e = h("easing.SteppedEase", function (t) {
      t = t || 1, this._p1 = 1 / t, this._p2 = t + 1
    }, !0), d = e.prototype = new t, d.constructor = e, d.getRatio = function (t) {
      return 0 > t ? t = 0 : t >= 1 && (t = .999999999), (this._p2 * t >> 0) * this._p1
    }, d.config = e.config = function (t) {
      return new e(t)
    }, i = h("easing.RoughEase", function (e) {
      e = e || {};
      for (var i, s, r, n, a, o, h = e.taper || "none", l = [], _ = 0, u = 0 | (e.points || 20), f = u, c = e.randomize !== !1, m = e.clamp === !0, d = e.template instanceof t ? e.template : null, g = "number" == typeof e.strength ? .4 * e.strength : .4; --f > -1;) i = c ? Math.random() : 1 / u * f, s = d ? d.getRatio(i) : i, "none" === h ? r = g : "out" === h ? (n = 1 - i, r = n * n * g) : "in" === h ? r = i * i * g : .5 > i ? (n = 2 * i, r = .5 * n * n * g) : (n = 2 * (1 - i), r = .5 * n * n * g), c ? s += Math.random() * r - .5 * r : f % 2 ? s += .5 * r : s -= .5 * r, m && (s > 1 ? s = 1 : 0 > s && (s = 0)), l[_++] = {
        x: i,
        y: s
      };
      for (l.sort(function (t, e) {
        return t.x - e.x
      }), o = new p(1, 1, null), f = u; --f > -1;) a = l[f], o = new p(a.x, a.y, o);
      this._prev = new p(0, 0, 0 !== o.t ? o : o.next)
    }, !0), d = i.prototype = new t, d.constructor = i, d.getRatio = function (t) {
      var e = this._prev;
      if (t > e.t) {
        for (; e.next && t >= e.t;) e = e.next;
        e = e.prev
      } else for (; e.prev && e.t >= t;) e = e.prev;
      return this._prev = e, e.v + (t - e.t) / e.gap * e.c
    }, d.config = function (t) {
      return new i(t)
    }, i.ease = new i, u("Bounce", l("BounceOut", function (t) {
      return 1 / 2.75 > t ? 7.5625 * t * t : 2 / 2.75 > t ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : 2.5 / 2.75 > t ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375
    }), l("BounceIn", function (t) {
      return 1 / 2.75 > (t = 1 - t) ? 1 - 7.5625 * t * t : 2 / 2.75 > t ? 1 - (7.5625 * (t -= 1.5 / 2.75) * t + .75) : 2.5 / 2.75 > t ? 1 - (7.5625 * (t -= 2.25 / 2.75) * t + .9375) : 1 - (7.5625 * (t -= 2.625 / 2.75) * t + .984375)
    }), l("BounceInOut", function (t) {
      var e = .5 > t;
      return t = e ? 1 - 2 * t : 2 * t - 1, t = 1 / 2.75 > t ? 7.5625 * t * t : 2 / 2.75 > t ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : 2.5 / 2.75 > t ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375, e ? .5 * (1 - t) : .5 * t + .5
    })), u("Circ", l("CircOut", function (t) {
      return Math.sqrt(1 - (t -= 1) * t)
    }), l("CircIn", function (t) {
      return -(Math.sqrt(1 - t * t) - 1)
    }), l("CircInOut", function (t) {
      return 1 > (t *= 2) ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - (t -= 2) * t) + 1)
    })), s = function (e, i, s) {
      var r = h("easing." + e, function (t, e) {
        this._p1 = t || 1, this._p2 = e || s, this._p3 = this._p2 / a * (Math.asin(1 / this._p1) || 0)
      }, !0),
          n = r.prototype = new t;
      return n.constructor = r, n.getRatio = i, n.config = function (t, e) {
        return new r(t, e)
      }, r
    }, u("Elastic", s("ElasticOut", function (t) {
      return this._p1 * Math.pow(2, -10 * t) * Math.sin((t - this._p3) * a / this._p2) + 1
    }, .3), s("ElasticIn", function (t) {
      return -(this._p1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - this._p3) * a / this._p2))
    }, .3), s("ElasticInOut", function (t) {
      return 1 > (t *= 2) ? -.5 * this._p1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - this._p3) * a / this._p2) : .5 * this._p1 * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - this._p3) * a / this._p2) + 1
    }, .45)), u("Expo", l("ExpoOut", function (t) {
      return 1 - Math.pow(2, -10 * t)
    }), l("ExpoIn", function (t) {
      return Math.pow(2, 10 * (t - 1)) - .001
    }), l("ExpoInOut", function (t) {
      return 1 > (t *= 2) ? .5 * Math.pow(2, 10 * (t - 1)) : .5 * (2 - Math.pow(2, -10 * (t - 1)))
    })), u("Sine", l("SineOut", function (t) {
      return Math.sin(t * o)
    }), l("SineIn", function (t) {
      return -Math.cos(t * o) + 1
    }), l("SineInOut", function (t) {
      return -.5 * (Math.cos(Math.PI * t) - 1)
    })), h("easing.EaseLookup", {
      find: function (e) {
        return t.map[e]
      }
    }, !0), _(r.SlowMo, "SlowMo", "ease,"), _(i, "RoughEase", "ease,"), _(e, "SteppedEase", "ease,"), c
  }, !0)
}), function (t) {
  "use strict";
  var e = t.GreenSockGlobals || t;
  if (!e.TweenLite) {
    var i, s, r, n, a, o = function (t) {
      var i, s = t.split("."),
          r = e;
      for (i = 0; s.length > i; i++) r[s[i]] = r = r[s[i]] || {};
      return r
    },
        h = o("com.greensock"),
        l = 1e-10,
        _ = [].slice,
        u = function () {},
        p = function () {
        var t = Object.prototype.toString,
            e = t.call([]);
        return function (i) {
          return null != i && (i instanceof Array || "object" == typeof i && !! i.push && t.call(i) === e)
        }
        }(),
        f = {},
        c = function (i, s, r, n) {
        this.sc = f[i] ? f[i].sc : [], f[i] = this, this.gsClass = null, this.func = r;
        var a = [];
        this.check = function (h) {
          for (var l, _, u, p, m = s.length, d = m; --m > -1;)(l = f[s[m]] || new c(s[m], [])).gsClass ? (a[m] = l.gsClass, d--) : h && l.sc.push(this);
          if (0 === d && r) for (_ = ("com.greensock." + i).split("."), u = _.pop(), p = o(_.join("."))[u] = this.gsClass = r.apply(r, a), n && (e[u] = p, "function" == typeof define && define.amd ? define((t.GreenSockAMDPath ? t.GreenSockAMDPath + "/" : "") + i.split(".").join("/"), [], function () {
            return p
          }) : "undefined" != typeof module && module.exports && (module.exports = p)), m = 0; this.sc.length > m; m++) this.sc[m].check()
        }, this.check(!0)
        },
        m = t._gsDefine = function (t, e, i, s) {
        return new c(t, e, i, s)
        },
        d = h._class = function (t, e, i) {
        return e = e ||
        function () {}, m(t, [], function () {
          return e
        }, i), e
        };
    m.globals = e;
    var g = [0, 0, 1, 1],
        v = [],
        y = d("easing.Ease", function (t, e, i, s) {
        this._func = t, this._type = i || 0, this._power = s || 0, this._params = e ? g.concat(e) : g
      }, !0),
        T = y.map = {},
        w = y.register = function (t, e, i, s) {
        for (var r, n, a, o, l = e.split(","), _ = l.length, u = (i || "easeIn,easeOut,easeInOut").split(","); --_ > -1;) for (n = l[_], r = s ? d("easing." + n, null, !0) : h.easing[n] || {}, a = u.length; --a > -1;) o = u[a], T[n + "." + o] = T[o + n] = r[o] = t.getRatio ? t : t[o] || new t
        };
    for (r = y.prototype, r._calcEnd = !1, r.getRatio = function (t) {
      if (this._func) return this._params[0] = t, this._func.apply(null, this._params);
      var e = this._type,
          i = this._power,
          s = 1 === e ? 1 - t : 2 === e ? t : .5 > t ? 2 * t : 2 * (1 - t);
      return 1 === i ? s *= s : 2 === i ? s *= s * s : 3 === i ? s *= s * s * s : 4 === i && (s *= s * s * s * s), 1 === e ? 1 - s : 2 === e ? s : .5 > t ? s / 2 : 1 - s / 2
    }, i = ["Linear", "Quad", "Cubic", "Quart", "Quint,Strong"], s = i.length; --s > -1;) r = i[s] + ",Power" + s, w(new y(null, null, 1, s), r, "easeOut", !0), w(new y(null, null, 2, s), r, "easeIn" + (0 === s ? ",easeNone" : "")), w(new y(null, null, 3, s), r, "easeInOut");
    T.linear = h.easing.Linear.easeIn, T.swing = h.easing.Quad.easeInOut;
    var x = d("events.EventDispatcher", function (t) {
      this._listeners = {}, this._eventTarget = t || this
    });
    r = x.prototype, r.addEventListener = function (t, e, i, s, r) {
      r = r || 0;
      var o, h, l = this._listeners[t],
          _ = 0;
      for (null == l && (this._listeners[t] = l = []), h = l.length; --h > -1;) o = l[h], o.c === e && o.s === i ? l.splice(h, 1) : 0 === _ && r > o.pr && (_ = h + 1);
      l.splice(_, 0, {
        c: e,
        s: i,
        up: s,
        pr: r
      }), this !== n || a || n.wake()
    }, r.removeEventListener = function (t, e) {
      var i, s = this._listeners[t];
      if (s) for (i = s.length; --i > -1;) if (s[i].c === e) return s.splice(i, 1), void 0
    }, r.dispatchEvent = function (t) {
      var e, i, s, r = this._listeners[t];
      if (r) for (e = r.length, i = this._eventTarget; --e > -1;) s = r[e], s.up ? s.c.call(s.s || i, {
        type: t,
        target: i
      }) : s.c.call(s.s || i)
    };
    var b = t.requestAnimationFrame,
        P = t.cancelAnimationFrame,
        S = Date.now ||
        function () {
        return (new Date).getTime()
        },
        k = S();
    for (i = ["ms", "moz", "webkit", "o"], s = i.length; --s > -1 && !b;) b = t[i[s] + "RequestAnimationFrame"], P = t[i[s] + "CancelAnimationFrame"] || t[i[s] + "CancelRequestAnimationFrame"];
    d("Ticker", function (t, e) {
      var i, s, r, o, h, _ = this,
          p = S(),
          f = e !== !1 && b,
          c = 500,
          m = 33,
          d = function (t) {
          var e, n, a = S() - k;
          a > c && (p += a - m), k += a, _.time = (k - p) / 1e3, e = _.time - h, (!i || e > 0 || t === !0) && (_.frame++, h += e + (e >= o ? .004 : o - e), n = !0), t !== !0 && (r = s(d)), n && _.dispatchEvent("tick")
          };
      x.call(_), _.time = _.frame = 0, _.tick = function () {
        d(!0)
      }, _.lagSmoothing = function (t, e) {
        c = t || 1 / l, m = Math.min(e, c, 0)
      }, _.sleep = function () {
        null != r && (f && P ? P(r) : clearTimeout(r), s = u, r = null, _ === n && (a = !1))
      }, _.wake = function () {
        null !== r ? _.sleep() : _.frame > 10 && (k = S() - c + 5), s = 0 === i ? u : f && b ? b : function (t) {
          return setTimeout(t, 0 | 1e3 * (h - _.time) + 1)
        }, _ === n && (a = !0), d(2)
      }, _.fps = function (t) {
        return arguments.length ? (i = t, o = 1 / (i || 60), h = this.time + o, _.wake(), void 0) : i
      }, _.useRAF = function (t) {
        return arguments.length ? (_.sleep(), f = t, _.fps(i), void 0) : f
      }, _.fps(t), setTimeout(function () {
        f && (!r || 5 > _.frame) && _.useRAF(!1)
      }, 1500)
    }), r = h.Ticker.prototype = new h.events.EventDispatcher, r.constructor = h.Ticker;
    var R = d("core.Animation", function (t, e) {
      if (this.vars = e = e || {}, this._duration = this._totalDuration = t || 0, this._delay = Number(e.delay) || 0, this._timeScale = 1, this._active = e.immediateRender === !0, this.data = e.data, this._reversed = e.reversed === !0, j) {
        a || n.wake();
        var i = this.vars.useFrames ? Y : j;
        i.add(this, i._time), this.vars.paused && this.paused(!0)
      }
    });
    n = R.ticker = new h.Ticker, r = R.prototype, r._dirty = r._gc = r._initted = r._paused = !1, r._totalTime = r._time = 0, r._rawPrevTime = -1, r._next = r._last = r._onUpdate = r._timeline = r.timeline = null, r._paused = !1;
    var A = function () {
      a && S() - k > 2e3 && n.wake(), setTimeout(A, 2e3)
    };
    A(), r.play = function (t, e) {
      return null != t && this.seek(t, e), this.reversed(!1).paused(!1)
    }, r.pause = function (t, e) {
      return null != t && this.seek(t, e), this.paused(!0)
    }, r.resume = function (t, e) {
      return null != t && this.seek(t, e), this.paused(!1)
    }, r.seek = function (t, e) {
      return this.totalTime(Number(t), e !== !1)
    }, r.restart = function (t, e) {
      return this.reversed(!1).paused(!1).totalTime(t ? -this._delay : 0, e !== !1, !0)
    }, r.reverse = function (t, e) {
      return null != t && this.seek(t || this.totalDuration(), e), this.reversed(!0).paused(!1)
    }, r.render = function () {}, r.invalidate = function () {
      return this
    }, r.isActive = function () {
      var t, e = this._timeline,
          i = this._startTime;
      return !e || !this._gc && !this._paused && e.isActive() && (t = e.rawTime()) >= i && i + this.totalDuration() / this._timeScale > t
    }, r._enabled = function (t, e) {
      return a || n.wake(), this._gc = !t, this._active = this.isActive(), e !== !0 && (t && !this.timeline ? this._timeline.add(this, this._startTime - this._delay) : !t && this.timeline && this._timeline._remove(this, !0)), !1
    }, r._kill = function () {
      return this._enabled(!1, !1)
    }, r.kill = function (t, e) {
      return this._kill(t, e), this
    }, r._uncache = function (t) {
      for (var e = t ? this : this.timeline; e;) e._dirty = !0, e = e.timeline;
      return this
    }, r._swapSelfInParams = function (t) {
      for (var e = t.length, i = t.concat(); --e > -1;)"{self}" === t[e] && (i[e] = this);
      return i
    }, r.eventCallback = function (t, e, i, s) {
      if ("on" === (t || "").substr(0, 2)) {
        var r = this.vars;
        if (1 === arguments.length) return r[t];
        null == e ? delete r[t] : (r[t] = e, r[t + "Params"] = p(i) && -1 !== i.join("").indexOf("{self}") ? this._swapSelfInParams(i) : i, r[t + "Scope"] = s), "onUpdate" === t && (this._onUpdate = e)
      }
      return this
    }, r.delay = function (t) {
      return arguments.length ? (this._timeline.smoothChildTiming && this.startTime(this._startTime + t - this._delay), this._delay = t, this) : this._delay
    }, r.duration = function (t) {
      return arguments.length ? (this._duration = this._totalDuration = t, this._uncache(!0), this._timeline.smoothChildTiming && this._time > 0 && this._time < this._duration && 0 !== t && this.totalTime(this._totalTime * (t / this._duration), !0), this) : (this._dirty = !1, this._duration)
    }, r.totalDuration = function (t) {
      return this._dirty = !1, arguments.length ? this.duration(t) : this._totalDuration
    }, r.time = function (t, e) {
      return arguments.length ? (this._dirty && this.totalDuration(), this.totalTime(t > this._duration ? this._duration : t, e)) : this._time
    }, r.totalTime = function (t, e, i) {
      if (a || n.wake(), !arguments.length) return this._totalTime;
      if (this._timeline) {
        if (0 > t && !i && (t += this.totalDuration()), this._timeline.smoothChildTiming) {
          this._dirty && this.totalDuration();
          var s = this._totalDuration,
              r = this._timeline;
          if (t > s && !i && (t = s), this._startTime = (this._paused ? this._pauseTime : r._time) - (this._reversed ? s - t : t) / this._timeScale, r._dirty || this._uncache(!1), r._timeline) for (; r._timeline;) r._timeline._time !== (r._startTime + r._totalTime) / r._timeScale && r.totalTime(r._totalTime, !0), r = r._timeline
        }
        this._gc && this._enabled(!0, !1), (this._totalTime !== t || 0 === this._duration) && (this.render(t, e, !1), z.length && B())
      }
      return this
    }, r.progress = r.totalProgress = function (t, e) {
      return arguments.length ? this.totalTime(this.duration() * t, e) : this._time / this.duration()
    }, r.startTime = function (t) {
      return arguments.length ? (t !== this._startTime && (this._startTime = t, this.timeline && this.timeline._sortChildren && this.timeline.add(this, t - this._delay)), this) : this._startTime
    }, r.timeScale = function (t) {
      if (!arguments.length) return this._timeScale;
      if (t = t || l, this._timeline && this._timeline.smoothChildTiming) {
        var e = this._pauseTime,
            i = e || 0 === e ? e : this._timeline.totalTime();
        this._startTime = i - (i - this._startTime) * this._timeScale / t
      }
      return this._timeScale = t, this._uncache(!1)
    }, r.reversed = function (t) {
      return arguments.length ? (t != this._reversed && (this._reversed = t, this.totalTime(this._timeline && !this._timeline.smoothChildTiming ? this.totalDuration() - this._totalTime : this._totalTime, !0)), this) : this._reversed
    }, r.paused = function (t) {
      if (!arguments.length) return this._paused;
      if (t != this._paused && this._timeline) {
        a || t || n.wake();
        var e = this._timeline,
            i = e.rawTime(),
            s = i - this._pauseTime;
        !t && e.smoothChildTiming && (this._startTime += s, this._uncache(!1)), this._pauseTime = t ? i : null, this._paused = t, this._active = this.isActive(), !t && 0 !== s && this._initted && this.duration() && this.render(e.smoothChildTiming ? this._totalTime : (i - this._startTime) / this._timeScale, !0, !0)
      }
      return this._gc && !t && this._enabled(!0, !1), this
    };
    var C = d("core.SimpleTimeline", function (t) {
      R.call(this, 0, t), this.autoRemoveChildren = this.smoothChildTiming = !0
    });
    r = C.prototype = new R, r.constructor = C, r.kill()._gc = !1, r._first = r._last = null, r._sortChildren = !1, r.add = r.insert = function (t, e) {
      var i, s;
      if (t._startTime = Number(e || 0) + t._delay, t._paused && this !== t._timeline && (t._pauseTime = t._startTime + (this.rawTime() - t._startTime) / t._timeScale), t.timeline && t.timeline._remove(t, !0), t.timeline = t._timeline = this, t._gc && t._enabled(!0, !0), i = this._last, this._sortChildren) for (s = t._startTime; i && i._startTime > s;) i = i._prev;
      return i ? (t._next = i._next, i._next = t) : (t._next = this._first, this._first = t), t._next ? t._next._prev = t : this._last = t, t._prev = i, this._timeline && this._uncache(!0), this
    }, r._remove = function (t, e) {
      return t.timeline === this && (e || t._enabled(!1, !0), t.timeline = null, t._prev ? t._prev._next = t._next : this._first === t && (this._first = t._next), t._next ? t._next._prev = t._prev : this._last === t && (this._last = t._prev), this._timeline && this._uncache(!0)), this
    }, r.render = function (t, e, i) {
      var s, r = this._first;
      for (this._totalTime = this._time = this._rawPrevTime = t; r;) s = r._next, (r._active || t >= r._startTime && !r._paused) && (r._reversed ? r.render((r._dirty ? r.totalDuration() : r._totalDuration) - (t - r._startTime) * r._timeScale, e, i) : r.render((t - r._startTime) * r._timeScale, e, i)), r = s
    }, r.rawTime = function () {
      return a || n.wake(), this._totalTime
    };
    var O = d("TweenLite", function (e, i, s) {
      if (R.call(this, i, s), this.render = O.prototype.render, null == e) throw "Cannot tween a null target.";
      this.target = e = "string" != typeof e ? e : O.selector(e) || e;
      var r, n, a, o = e.jquery || e.length && e !== t && e[0] && (e[0] === t || e[0].nodeType && e[0].style && !e.nodeType),
          h = this.vars.overwrite;
      if (this._overwrite = h = null == h ? U[O.defaultOverwrite] : "number" == typeof h ? h >> 0 : U[h], (o || e instanceof Array || e.push && p(e)) && "number" != typeof e[0]) for (this._targets = a = _.call(e, 0), this._propLookup = [], this._siblings = [], r = 0; a.length > r; r++) n = a[r], n ? "string" != typeof n ? n.length && n !== t && n[0] && (n[0] === t || n[0].nodeType && n[0].style && !n.nodeType) ? (a.splice(r--, 1), this._targets = a = a.concat(_.call(n, 0))) : (this._siblings[r] = q(n, this, !1), 1 === h && this._siblings[r].length > 1 && V(n, this, null, 1, this._siblings[r])) : (n = a[r--] = O.selector(n), "string" == typeof n && a.splice(r + 1, 1)) : a.splice(r--, 1);
      else this._propLookup = {}, this._siblings = q(e, this, !1), 1 === h && this._siblings.length > 1 && V(e, this, null, 1, this._siblings);
      (this.vars.immediateRender || 0 === i && 0 === this._delay && this.vars.immediateRender !== !1) && (this._time = -l, this.render(-this._delay))
    }, !0),
        D = function (e) {
        return e.length && e !== t && e[0] && (e[0] === t || e[0].nodeType && e[0].style && !e.nodeType)
        },
        M = function (t, e) {
        var i, s = {};
        for (i in t) X[i] || i in e && "transform" !== i && "x" !== i && "y" !== i && "width" !== i && "height" !== i && "className" !== i && "border" !== i || !(!L[i] || L[i] && L[i]._autoCSS) || (s[i] = t[i], delete t[i]);
        t.css = s
        };
    r = O.prototype = new R, r.constructor = O, r.kill()._gc = !1, r.ratio = 0, r._firstPT = r._targets = r._overwrittenProps = r._startAt = null, r._notifyPluginsOfEnabled = r._lazy = !1, O.version = "1.12.1", O.defaultEase = r._ease = new y(null, null, 1, 1), O.defaultOverwrite = "auto", O.ticker = n, O.autoSleep = !0, O.lagSmoothing = function (t, e) {
      n.lagSmoothing(t, e)
    }, O.selector = t.$ || t.jQuery ||
    function (e) {
      return t.$ ? (O.selector = t.$, t.$(e)) : t.document ? t.document.getElementById("#" === e.charAt(0) ? e.substr(1) : e) : e
    };
    var z = [],
        I = {},
        E = O._internals = {
        isArray: p,
        isSelector: D,
        lazyTweens: z
        },
        L = O._plugins = {},
        F = E.tweenLookup = {},
        N = 0,
        X = E.reservedProps = {
        ease: 1,
        delay: 1,
        overwrite: 1,
        onComplete: 1,
        onCompleteParams: 1,
        onCompleteScope: 1,
        useFrames: 1,
        runBackwards: 1,
        startAt: 1,
        onUpdate: 1,
        onUpdateParams: 1,
        onUpdateScope: 1,
        onStart: 1,
        onStartParams: 1,
        onStartScope: 1,
        onReverseComplete: 1,
        onReverseCompleteParams: 1,
        onReverseCompleteScope: 1,
        onRepeat: 1,
        onRepeatParams: 1,
        onRepeatScope: 1,
        easeParams: 1,
        yoyo: 1,
        immediateRender: 1,
        repeat: 1,
        repeatDelay: 1,
        data: 1,
        paused: 1,
        reversed: 1,
        autoCSS: 1,
        lazy: 1
        },
        U = {
        none: 0,
        all: 1,
        auto: 2,
        concurrent: 3,
        allOnStart: 4,
        preexisting: 5,
        "true": 1,
        "false": 0
        },
        Y = R._rootFramesTimeline = new C,
        j = R._rootTimeline = new C,
        B = function () {
        var t = z.length;
        for (I = {}; --t > -1;) i = z[t], i && i._lazy !== !1 && (i.render(i._lazy, !1, !0), i._lazy = !1);
        z.length = 0
        };
    j._startTime = n.time, Y._startTime = n.frame, j._active = Y._active = !0, setTimeout(B, 1), R._updateRoot = O.render = function () {
      var t, e, i;
      if (z.length && B(), j.render((n.time - j._startTime) * j._timeScale, !1, !1), Y.render((n.frame - Y._startTime) * Y._timeScale, !1, !1), z.length && B(), !(n.frame % 120)) {
        for (i in F) {
          for (e = F[i].tweens, t = e.length; --t > -1;) e[t]._gc && e.splice(t, 1);
          0 === e.length && delete F[i]
        }
        if (i = j._first, (!i || i._paused) && O.autoSleep && !Y._first && 1 === n._listeners.tick.length) {
          for (; i && i._paused;) i = i._next;
          i || n.sleep()
        }
      }
    }, n.addEventListener("tick", R._updateRoot);
    var q = function (t, e, i) {
      var s, r, n = t._gsTweenID;
      if (F[n || (t._gsTweenID = n = "t" + N++)] || (F[n] = {
        target: t,
        tweens: []
      }), e && (s = F[n].tweens, s[r = s.length] = e, i)) for (; --r > -1;) s[r] === e && s.splice(r, 1);
      return F[n].tweens
    },
        V = function (t, e, i, s, r) {
        var n, a, o, h;
        if (1 === s || s >= 4) {
          for (h = r.length, n = 0; h > n; n++) if ((o = r[n]) !== e) o._gc || o._enabled(!1, !1) && (a = !0);
          else if (5 === s) break;
          return a
        }
        var _, u = e._startTime + l,
            p = [],
            f = 0,
            c = 0 === e._duration;
        for (n = r.length; --n > -1;)(o = r[n]) === e || o._gc || o._paused || (o._timeline !== e._timeline ? (_ = _ || W(e, 0, c), 0 === W(o, _, c) && (p[f++] = o)) : u >= o._startTime && o._startTime + o.totalDuration() / o._timeScale > u && ((c || !o._initted) && 2e-10 >= u - o._startTime || (p[f++] = o)));
        for (n = f; --n > -1;) o = p[n], 2 === s && o._kill(i, t) && (a = !0), (2 !== s || !o._firstPT && o._initted) && o._enabled(!1, !1) && (a = !0);
        return a
        },
        W = function (t, e, i) {
        for (var s = t._timeline, r = s._timeScale, n = t._startTime; s._timeline;) {
          if (n += s._startTime, r *= s._timeScale, s._paused) return -100;
          s = s._timeline
        }
        return n /= r, n > e ? n - e : i && n === e || !t._initted && 2 * l > n - e ? l : (n += t.totalDuration() / t._timeScale / r) > e + l ? 0 : n - e - l
        };
    r._init = function () {
      var t, e, i, s, r, n = this.vars,
          a = this._overwrittenProps,
          o = this._duration,
          h = !! n.immediateRender,
          l = n.ease;
      if (n.startAt) {
        this._startAt && (this._startAt.render(-1, !0), this._startAt.kill()), r = {};
        for (s in n.startAt) r[s] = n.startAt[s];
        if (r.overwrite = !1, r.immediateRender = !0, r.lazy = h && n.lazy !== !1, r.startAt = r.delay = null, this._startAt = O.to(this.target, 0, r), h) if (this._time > 0) this._startAt = null;
        else if (0 !== o) return
      } else if (n.runBackwards && 0 !== o) if (this._startAt) this._startAt.render(-1, !0), this._startAt.kill(), this._startAt = null;
      else {
        i = {};
        for (s in n) X[s] && "autoCSS" !== s || (i[s] = n[s]);
        if (i.overwrite = 0, i.data = "isFromStart", i.lazy = h && n.lazy !== !1, i.immediateRender = h, this._startAt = O.to(this.target, 0, i), h) {
          if (0 === this._time) return
        } else this._startAt._init(), this._startAt._enabled(!1)
      }
      if (this._ease = l ? l instanceof y ? n.easeParams instanceof Array ? l.config.apply(l, n.easeParams) : l : "function" == typeof l ? new y(l, n.easeParams) : T[l] || O.defaultEase : O.defaultEase, this._easeType = this._ease._type, this._easePower = this._ease._power, this._firstPT = null, this._targets) for (t = this._targets.length; --t > -1;) this._initProps(this._targets[t], this._propLookup[t] = {}, this._siblings[t], a ? a[t] : null) && (e = !0);
      else e = this._initProps(this.target, this._propLookup, this._siblings, a);
      if (e && O._onPluginEvent("_onInitAllProps", this), a && (this._firstPT || "function" != typeof this.target && this._enabled(!1, !1)), n.runBackwards) for (i = this._firstPT; i;) i.s += i.c, i.c = -i.c, i = i._next;
      this._onUpdate = n.onUpdate, this._initted = !0
    }, r._initProps = function (e, i, s, r) {
      var n, a, o, h, l, _;
      if (null == e) return !1;
      I[e._gsTweenID] && B(), this.vars.css || e.style && e !== t && e.nodeType && L.css && this.vars.autoCSS !== !1 && M(this.vars, e);
      for (n in this.vars) {
        if (_ = this.vars[n], X[n]) _ && (_ instanceof Array || _.push && p(_)) && -1 !== _.join("").indexOf("{self}") && (this.vars[n] = _ = this._swapSelfInParams(_, this));
        else if (L[n] && (h = new L[n])._onInitTween(e, this.vars[n], this)) {
          for (this._firstPT = l = {
            _next: this._firstPT,
            t: h,
            p: "setRatio",
            s: 0,
            c: 1,
            f: !0,
            n: n,
            pg: !0,
            pr: h._priority
          }, a = h._overwriteProps.length; --a > -1;) i[h._overwriteProps[a]] = this._firstPT;
          (h._priority || h._onInitAllProps) && (o = !0), (h._onDisable || h._onEnable) && (this._notifyPluginsOfEnabled = !0)
        } else this._firstPT = i[n] = l = {
          _next: this._firstPT,
          t: e,
          p: n,
          f: "function" == typeof e[n],
          n: n,
          pg: !1,
          pr: 0
        }, l.s = l.f ? e[n.indexOf("set") || "function" != typeof e["get" + n.substr(3)] ? n : "get" + n.substr(3)]() : parseFloat(e[n]), l.c = "string" == typeof _ && "=" === _.charAt(1) ? parseInt(_.charAt(0) + "1", 10) * Number(_.substr(2)) : Number(_) - l.s || 0;
        l && l._next && (l._next._prev = l)
      }
      return r && this._kill(r, e) ? this._initProps(e, i, s, r) : this._overwrite > 1 && this._firstPT && s.length > 1 && V(e, this, i, this._overwrite, s) ? (this._kill(i, e), this._initProps(e, i, s, r)) : (this._firstPT && (this.vars.lazy !== !1 && this._duration || this.vars.lazy && !this._duration) && (I[e._gsTweenID] = !0), o)
    }, r.render = function (t, e, i) {
      var s, r, n, a, o = this._time,
          h = this._duration,
          _ = this._rawPrevTime;
      if (t >= h) this._totalTime = this._time = h, this.ratio = this._ease._calcEnd ? this._ease.getRatio(1) : 1, this._reversed || (s = !0, r = "onComplete"), 0 === h && (this._initted || !this.vars.lazy || i) && (this._startTime === this._timeline._duration && (t = 0), (0 === t || 0 > _ || _ === l) && _ !== t && (i = !0, _ > l && (r = "onReverseComplete")), this._rawPrevTime = a = !e || t || _ === t ? t : l);
      else if (1e-7 > t) this._totalTime = this._time = 0, this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0, (0 !== o || 0 === h && _ > 0 && _ !== l) && (r = "onReverseComplete", s = this._reversed), 0 > t ? (this._active = !1, 0 === h && (this._initted || !this.vars.lazy || i) && (_ >= 0 && (i = !0), this._rawPrevTime = a = !e || t || _ === t ? t : l)) : this._initted || (i = !0);
      else if (this._totalTime = this._time = t, this._easeType) {
        var u = t / h,
            p = this._easeType,
            f = this._easePower;
        (1 === p || 3 === p && u >= .5) && (u = 1 - u), 3 === p && (u *= 2), 1 === f ? u *= u : 2 === f ? u *= u * u : 3 === f ? u *= u * u * u : 4 === f && (u *= u * u * u * u), this.ratio = 1 === p ? 1 - u : 2 === p ? u : .5 > t / h ? u / 2 : 1 - u / 2
      } else this.ratio = this._ease.getRatio(t / h);
      if (this._time !== o || i) {
        if (!this._initted) {
          if (this._init(), !this._initted || this._gc) return;
          if (!i && this._firstPT && (this.vars.lazy !== !1 && this._duration || this.vars.lazy && !this._duration)) return this._time = this._totalTime = o, this._rawPrevTime = _, z.push(this), this._lazy = t, void 0;
          this._time && !s ? this.ratio = this._ease.getRatio(this._time / h) : s && this._ease._calcEnd && (this.ratio = this._ease.getRatio(0 === this._time ? 0 : 1))
        }
        for (this._lazy !== !1 && (this._lazy = !1), this._active || !this._paused && this._time !== o && t >= 0 && (this._active = !0), 0 === o && (this._startAt && (t >= 0 ? this._startAt.render(t, e, i) : r || (r = "_dummyGS")), this.vars.onStart && (0 !== this._time || 0 === h) && (e || this.vars.onStart.apply(this.vars.onStartScope || this, this.vars.onStartParams || v))), n = this._firstPT; n;) n.f ? n.t[n.p](n.c * this.ratio + n.s) : n.t[n.p] = n.c * this.ratio + n.s, n = n._next;
        this._onUpdate && (0 > t && this._startAt && this._startTime && this._startAt.render(t, e, i), e || (this._time !== o || s) && this._onUpdate.apply(this.vars.onUpdateScope || this, this.vars.onUpdateParams || v)), r && (this._gc || (0 > t && this._startAt && !this._onUpdate && this._startTime && this._startAt.render(t, e, i), s && (this._timeline.autoRemoveChildren && this._enabled(!1, !1), this._active = !1), !e && this.vars[r] && this.vars[r].apply(this.vars[r + "Scope"] || this, this.vars[r + "Params"] || v), 0 === h && this._rawPrevTime === l && a !== l && (this._rawPrevTime = 0)))
      }
    }, r._kill = function (t, e) {
      if ("all" === t && (t = null), null == t && (null == e || e === this.target)) return this._lazy = !1, this._enabled(!1, !1);
      e = "string" != typeof e ? e || this._targets || this.target : O.selector(e) || e;
      var i, s, r, n, a, o, h, l;
      if ((p(e) || D(e)) && "number" != typeof e[0]) for (i = e.length; --i > -1;) this._kill(t, e[i]) && (o = !0);
      else {
        if (this._targets) {
          for (i = this._targets.length; --i > -1;) if (e === this._targets[i]) {
            a = this._propLookup[i] || {}, this._overwrittenProps = this._overwrittenProps || [], s = this._overwrittenProps[i] = t ? this._overwrittenProps[i] || {} : "all";
            break
          }
        } else {
          if (e !== this.target) return !1;
          a = this._propLookup, s = this._overwrittenProps = t ? this._overwrittenProps || {} : "all"
        }
        if (a) {
          h = t || a, l = t !== s && "all" !== s && t !== a && ("object" != typeof t || !t._tempKill);
          for (r in h)(n = a[r]) && (n.pg && n.t._kill(h) && (o = !0), n.pg && 0 !== n.t._overwriteProps.length || (n._prev ? n._prev._next = n._next : n === this._firstPT && (this._firstPT = n._next), n._next && (n._next._prev = n._prev), n._next = n._prev = null), delete a[r]), l && (s[r] = 1);
          !this._firstPT && this._initted && this._enabled(!1, !1)
        }
      }
      return o
    }, r.invalidate = function () {
      return this._notifyPluginsOfEnabled && O._onPluginEvent("_onDisable", this), this._firstPT = null, this._overwrittenProps = null, this._onUpdate = null, this._startAt = null, this._initted = this._active = this._notifyPluginsOfEnabled = this._lazy = !1, this._propLookup = this._targets ? {} : [], this
    }, r._enabled = function (t, e) {
      if (a || n.wake(), t && this._gc) {
        var i, s = this._targets;
        if (s) for (i = s.length; --i > -1;) this._siblings[i] = q(s[i], this, !0);
        else this._siblings = q(this.target, this, !0)
      }
      return R.prototype._enabled.call(this, t, e), this._notifyPluginsOfEnabled && this._firstPT ? O._onPluginEvent(t ? "_onEnable" : "_onDisable", this) : !1
    }, O.to = function (t, e, i) {
      return new O(t, e, i)
    }, O.from = function (t, e, i) {
      return i.runBackwards = !0, i.immediateRender = 0 != i.immediateRender, new O(t, e, i)
    }, O.fromTo = function (t, e, i, s) {
      return s.startAt = i, s.immediateRender = 0 != s.immediateRender && 0 != i.immediateRender, new O(t, e, s)
    }, O.delayedCall = function (t, e, i, s, r) {
      return new O(e, 0, {
        delay: t,
        onComplete: e,
        onCompleteParams: i,
        onCompleteScope: s,
        onReverseComplete: e,
        onReverseCompleteParams: i,
        onReverseCompleteScope: s,
        immediateRender: !1,
        useFrames: r,
        overwrite: 0
      })
    }, O.set = function (t, e) {
      return new O(t, 0, e)
    }, O.getTweensOf = function (t, e) {
      if (null == t) return [];
      t = "string" != typeof t ? t : O.selector(t) || t;
      var i, s, r, n;
      if ((p(t) || D(t)) && "number" != typeof t[0]) {
        for (i = t.length, s = []; --i > -1;) s = s.concat(O.getTweensOf(t[i], e));
        for (i = s.length; --i > -1;) for (n = s[i], r = i; --r > -1;) n === s[r] && s.splice(i, 1)
      } else for (s = q(t).concat(), i = s.length; --i > -1;)(s[i]._gc || e && !s[i].isActive()) && s.splice(i, 1);
      return s
    }, O.killTweensOf = O.killDelayedCallsTo = function (t, e, i) {
      "object" == typeof e && (i = e, e = !1);
      for (var s = O.getTweensOf(t, e), r = s.length; --r > -1;) s[r]._kill(i, t)
    };
    var G = d("plugins.TweenPlugin", function (t, e) {
      this._overwriteProps = (t || "").split(","), this._propName = this._overwriteProps[0], this._priority = e || 0, this._super = G.prototype
    }, !0);
    if (r = G.prototype, G.version = "1.10.1", G.API = 2, r._firstPT = null, r._addTween = function (t, e, i, s, r, n) {
      var a, o;
      return null != s && (a = "number" == typeof s || "=" !== s.charAt(1) ? Number(s) - i : parseInt(s.charAt(0) + "1", 10) * Number(s.substr(2))) ? (this._firstPT = o = {
        _next: this._firstPT,
        t: t,
        p: e,
        s: i,
        c: a,
        f: "function" == typeof t[e],
        n: r || e,
        r: n
      }, o._next && (o._next._prev = o), o) : void 0
    }, r.setRatio = function (t) {
      for (var e, i = this._firstPT, s = 1e-6; i;) e = i.c * t + i.s, i.r ? e = Math.round(e) : s > e && e > -s && (e = 0), i.f ? i.t[i.p](e) : i.t[i.p] = e, i = i._next
    }, r._kill = function (t) {
      var e, i = this._overwriteProps,
          s = this._firstPT;
      if (null != t[this._propName]) this._overwriteProps = [];
      else for (e = i.length; --e > -1;) null != t[i[e]] && i.splice(e, 1);
      for (; s;) null != t[s.n] && (s._next && (s._next._prev = s._prev), s._prev ? (s._prev._next = s._next, s._prev = null) : this._firstPT === s && (this._firstPT = s._next)), s = s._next;
      return !1
    }, r._roundProps = function (t, e) {
      for (var i = this._firstPT; i;)(t[this._propName] || null != i.n && t[i.n.split(this._propName + "_").join("")]) && (i.r = e), i = i._next
    }, O._onPluginEvent = function (t, e) {
      var i, s, r, n, a, o = e._firstPT;
      if ("_onInitAllProps" === t) {
        for (; o;) {
          for (a = o._next, s = r; s && s.pr > o.pr;) s = s._next;
          (o._prev = s ? s._prev : n) ? o._prev._next = o : r = o, (o._next = s) ? s._prev = o : n = o, o = a
        }
        o = e._firstPT = r
      }
      for (; o;) o.pg && "function" == typeof o.t[t] && o.t[t]() && (i = !0), o = o._next;
      return i
    }, G.activate = function (t) {
      for (var e = t.length; --e > -1;) t[e].API === G.API && (L[(new t[e])._propName] = t[e]);
      return !0
    }, m.plugin = function (t) {
      if (!(t && t.propName && t.init && t.API)) throw "illegal plugin definition.";
      var e, i = t.propName,
          s = t.priority || 0,
          r = t.overwriteProps,
          n = {
          init: "_onInitTween",
          set: "setRatio",
          kill: "_kill",
          round: "_roundProps",
          initAll: "_onInitAllProps"
          },
          a = d("plugins." + i.charAt(0).toUpperCase() + i.substr(1) + "Plugin", function () {
          G.call(this, i, s), this._overwriteProps = r || []
        }, t.global === !0),
          o = a.prototype = new G(i);
      o.constructor = a, a.API = t.API;
      for (e in n)"function" == typeof t[e] && (o[n[e]] = t[e]);
      return a.version = t.version, G.activate([a]), a
    }, i = t._gsQueue) {
      for (s = 0; i.length > s; s++) i[s]();
      for (r in f) f[r].func || t.console.log("GSAP encountered missing dependency: com.greensock." + r)
    }
    a = !1
  }
}(window);
/*
 * BackgroundCheck
 * http://kennethcachia.com/background-check
 *
 * v1.2.2
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.BackgroundCheck = factory(root);
  }

}(this, function () {

  'use strict';

  var resizeEvent = window.orientation !== undefined ? 'orientationchange' : 'resize';
  var supported;
  var canvas;
  var context;
  var throttleDelay;
  var viewport;
  var attrs = {};


/*
	 * Initializer
	 */

  function init(a) {

    if (a === undefined || a.targets === undefined) {
      throw 'Missing attributes';
    }

    // Default values
    attrs.debug = checkAttr(a.debug, false);
    attrs.debugOverlay = checkAttr(a.debugOverlay, false);
    attrs.targets = getElements(a.targets);
    attrs.images = getElements(a.images || 'img', true);
    attrs.changeParent = checkAttr(a.changeParent, false);
    attrs.threshold = checkAttr(a.threshold, 50);
    attrs.minComplexity = checkAttr(a.minComplexity, 30);
    attrs.minOverlap = checkAttr(a.minOverlap, 50);
    attrs.windowEvents = checkAttr(a.windowEvents, true);
    attrs.maxDuration = checkAttr(a.maxDuration, 500);

    attrs.mask = checkAttr(a.mask, {
      r: 0,
      g: 255,
      b: 0
    });

    attrs.classes = checkAttr(a.classes, {
      dark: 'background--dark',
      light: 'background--light',
      complex: 'background--complex'
    });

    if (supported === undefined) {
      checkSupport();

      if (supported) {
        canvas.style.position = 'fixed';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        window.addEventListener(resizeEvent, throttle.bind(null, function () {
          resizeCanvas();
          check();
        }));

        window.addEventListener('scroll', throttle.bind(null, check));

        resizeCanvas();
        check();
      }
    }
  }


/*
	 * Destructor
	 */

  function destroy() {
    supported = null;
    canvas = null;
    context = null;
    attrs = {};

    if (throttleDelay) {
      clearTimeout(throttleDelay);
    }
  }


/*
	 * Output debug logs
	 */

  function log(msg) {

    if (get('debug')) {
      console.log(msg);
    }
  }


/*
	 * Get attribute value, use a default
	 * when undefined
	 */

  function checkAttr(value, def) {
    checkType(value, typeof def);
    return (value === undefined) ? def : value;
  }


/*
	 * Reject unwanted types
	 */

  function checkType(value, type) {

    if (value !== undefined && typeof value !== type) {
      throw 'Incorrect attribute type';
    }
  }


/*
	 * Convert elements with background-image
	 * to Images
	 */

  function checkForCSSImages(els) {
    var el;
    var url;
    var list = [];

    for (var e = 0; e < els.length; e++) {
      el = els[e];
      list.push(el);

      if (el.tagName !== 'IMG') {
        url = window.getComputedStyle(el).backgroundImage;

        // Ignore multiple backgrounds
        if (url.split(/,url|, url/).length > 1) {
          throw 'Multiple backgrounds are not supported';
        }

        if (url && url !== 'none') {
          list[e] = {
            img: new Image(),
            el: list[e]
          };

          url = url.slice(4, -1);
          url = url.replace(/"/g, '');

          list[e].img.src = url;
          log('CSS Image - ' + url);
        } else {
          throw 'Element is not an <img> but does not have a background-image';
        }
      }
    }

    return list;
  }


/*
	 * Check for String, Element or NodeList
	 */

  function getElements(selector, convertToImages) {
    var els = selector;

    if (typeof selector === 'string') {
      els = document.querySelectorAll(selector);
    } else if (selector && selector.nodeType === 1) {
      els = [selector];
    }

    if (!els || els.length === 0 || els.length === undefined) {
      log('Elements not found');
    } else {

      if (convertToImages) {
        els = checkForCSSImages(els);
      }

      els = Array.prototype.slice.call(els);
    }

    return els;
  }


/*
	 * Check if browser supports <canvas>
	 */

  function checkSupport() {
    canvas = document.createElement('canvas');

    if (canvas && canvas.getContext) {
      context = canvas.getContext('2d');
      supported = true;
    } else {
      supported = false;
    }

    showDebugOverlay();
  }


/*
	 * Show <canvas> on top of page
	 */

  function showDebugOverlay() {

    if (get('debugOverlay')) {
      canvas.style.opacity = 0.5;
      canvas.style.pointerEvents = 'none';
      document.body.appendChild(canvas);
    } else {

      // Check if it was previously added
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }


/*
	 * Stop if it's slow
	 */

  function kill(start) {
    var duration = new Date().getTime() - start;

    log('Duration: ' + duration + 'ms');

    if (duration > get('maxDuration')) {
      // Log a message even when debug is false
      console.log('BackgroundCheck - Killed');
      removeClasses();
      destroy();
    }
  }


/*
	 * Set width and height of <canvas>
	 */

  function resizeCanvas() {
    viewport = {
      left: 0,
      top: 0,
      right: document.body.clientWidth,
      bottom: window.innerHeight
    };

    canvas.width = document.body.clientWidth;
    canvas.height = window.innerHeight;
  }


/*
	 * Process px and %, discard anything else
	 */

  function getValue(css, parent, delta) {
    var value;
    var percentage;

    if (css.indexOf('px') !== -1) {
      value = parseFloat(css);
    } else if (css.indexOf('%') !== -1) {
      value = parseFloat(css);
      percentage = value / 100;
      value = percentage * parent;

      if (delta) {
        value -= delta * percentage;
      }
    } else {
      value = parent;
    }

    return value;
  }


/*
	 * Calculate top, left, width and height
	 * using the object's CSS
	 */

  function calculateAreaFromCSS(obj) {
    var css = window.getComputedStyle(obj.el);

    // Force no-repeat and padding-box
    obj.el.style.backgroundRepeat = 'no-repeat';
    obj.el.style.backgroundOrigin = 'padding-box';

    // Background Size
    var size = css.backgroundSize.split(' ');
    var width = size[0];
    var height = size[1] === undefined ? 'auto' : size[1];

    var parentRatio = obj.el.clientWidth / obj.el.clientHeight;
    var imgRatio = obj.img.naturalWidth / obj.img.naturalHeight;

    if (width === 'cover') {

      if (parentRatio >= imgRatio) {
        width = '100%';
        height = 'auto';
      } else {
        width = 'auto';
        size[0] = 'auto';
        height = '100%';
      }

    } else if (width === 'contain') {

      if (1 / parentRatio < 1 / imgRatio) {
        width = 'auto';
        size[0] = 'auto';
        height = '100%';
      } else {
        width = '100%';
        height = 'auto';
      }
    }

    if (width === 'auto') {
      width = obj.img.naturalWidth;
    } else {
      width = getValue(width, obj.el.clientWidth);
    }

    if (height === 'auto') {
      height = (width / obj.img.naturalWidth) * obj.img.naturalHeight;
    } else {
      height = getValue(height, obj.el.clientHeight);
    }

    if (size[0] === 'auto' && size[1] !== 'auto') {
      width = (height / obj.img.naturalHeight) * obj.img.naturalWidth;
    }

    var position = css.backgroundPosition;

    // Fix inconsistencies between browsers
    if (position === 'top') {
      position = '50% 0%';
    } else if (position === 'left') {
      position = '0% 50%';
    } else if (position === 'right') {
      position = '100% 50%';
    } else if (position === 'bottom') {
      position = '50% 100%';
    } else if (position === 'center') {
      position = '50% 50%';
    }

    position = position.split(' ');

    var x;
    var y;

    // Two-value syntax vs Four-value syntax
    if (position.length === 4) {
      x = position[1];
      y = position[3];
    } else {
      x = position[0];
      y = position[1];
    }

    // Use a default value
    y = y || '50%';

    // Background Position
    x = getValue(x, obj.el.clientWidth, width);
    y = getValue(y, obj.el.clientHeight, height);

    // Take care of ex: background-position: right 20px bottom 20px;
    if (position.length === 4) {

      if (position[0] === 'right') {
        x = obj.el.clientWidth - obj.img.naturalWidth - x;
      }

      if (position[2] === 'bottom') {
        y = obj.el.clientHeight - obj.img.naturalHeight - y;
      }
    }

    x += obj.el.getBoundingClientRect().left;
    y += obj.el.getBoundingClientRect().top;

    return {
      left: Math.floor(x),
      right: Math.floor(x + width),
      top: Math.floor(y),
      bottom: Math.floor(y + height),
      width: Math.floor(width),
      height: Math.floor(height)
    };
  }


/*
	 * Get Bounding Client Rect
	 */

  function getArea(obj) {
    var area;
    var image;
    var parent;

    if (obj.nodeType) {
      var rect = obj.getBoundingClientRect();

      // Clone ClientRect for modification purposes
      area = {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };

      parent = obj.parentNode;
      image = obj;
    } else {
      area = calculateAreaFromCSS(obj);
      parent = obj.el;
      image = obj.img;
    }

    parent = parent.getBoundingClientRect();

    area.imageTop = 0;
    area.imageLeft = 0;
    area.imageWidth = image.naturalWidth;
    area.imageHeight = image.naturalHeight;

    var ratio = area.imageHeight / area.height;
    var delta;

    // Stay within the parent's boundary
    if (area.top < parent.top) {
      delta = parent.top - area.top;
      area.imageTop = ratio * delta;
      area.imageHeight -= ratio * delta;
      area.top += delta;
      area.height -= delta;
    }

    if (area.left < parent.left) {
      delta = parent.left - area.left;
      area.imageLeft += ratio * delta;
      area.imageWidth -= ratio * delta;
      area.width -= delta;
      area.left += delta;
    }

    if (area.bottom > parent.bottom) {
      delta = area.bottom - parent.bottom;
      area.imageHeight -= ratio * delta;
      area.height -= delta;
    }

    if (area.right > parent.right) {
      delta = area.right - parent.right;
      area.imageWidth -= ratio * delta;
      area.width -= delta;
    }

    area.imageTop = Math.floor(area.imageTop);
    area.imageLeft = Math.floor(area.imageLeft);
    area.imageHeight = Math.floor(area.imageHeight);
    area.imageWidth = Math.floor(area.imageWidth);

    return area;
  }


/*
	 * Render image on canvas
	 */

  function drawImage(image) {
    var area = getArea(image);

    image = image.nodeType ? image : image.img;

    if (area.imageWidth > 0 && area.imageHeight > 0 && area.width > 0 && area.height > 0) {
      context.drawImage(image, area.imageLeft, area.imageTop, area.imageWidth, area.imageHeight, area.left, area.top, area.width, area.height);
    } else {
      log('Skipping image - ' + image.src + ' - area too small');
    }
  }


/*
	 * Add/remove classes
	 */

  function classList(node, name, mode) {
    var className = node.className;

    switch (mode) {
    case 'add':
      className += ' ' + name;
      break;
    case 'remove':
      var pattern = new RegExp('(?:^|\\s)' + name + '(?!\\S)', 'g');
      className = className.replace(pattern, '');
      break;
    }

    node.className = className.trim();
  }


/*
	 * Remove classes from element or
	 * their parents, depending on checkParent
	 */

  function removeClasses(el) {
    var targets = el ? [el] : get('targets');
    var target;

    for (var t = 0; t < targets.length; t++) {
      target = targets[t];
      target = get('changeParent') ? target.parentNode : target;

      classList(target, get('classes').light, 'remove');
      classList(target, get('classes').dark, 'remove');
      classList(target, get('classes').complex, 'remove');
    }
  }


/*
	 * Calculate average pixel brightness of a region
	 * and add 'light' or 'dark' accordingly
	 */

  function calculatePixelBrightness(target) {
    var dims = target.getBoundingClientRect();
    var brightness;
    var data;
    var pixels = 0;
    var delta;
    var deltaSqr = 0;
    var mean = 0;
    var variance;
    var minOverlap = 0;
    var mask = get('mask');

    if (dims.width > 0 && dims.height > 0) {
      removeClasses(target);

      target = get('changeParent') ? target.parentNode : target;
      data = context.getImageData(dims.left, dims.top, dims.width, dims.height).data;

      for (var p = 0; p < data.length; p += 4) {

        if (data[p] === mask.r && data[p + 1] === mask.g && data[p + 2] === mask.b) {
          minOverlap++;
        } else {
          pixels++;
          brightness = (0.2126 * data[p]) + (0.7152 * data[p + 1]) + (0.0722 * data[p + 2]);
          delta = brightness - mean;
          deltaSqr += delta * delta;
          mean = mean + delta / pixels;
        }
      }

      if (minOverlap <= (data.length / 4) * (1 - (get('minOverlap') / 100))) {
        variance = Math.sqrt(deltaSqr / pixels) / 255;
        mean = mean / 255;
        log('Target: ' + target.className + ' lum: ' + mean + ' var: ' + variance);
        classList(target, mean <= (get('threshold') / 100) ? get('classes').dark : get('classes').light, 'add');

        if (variance > get('minComplexity') / 100) {
          classList(target, get('classes').complex, 'add');
        }
      }
    }
  }


/*
	 * Test if a is within b's boundary
	 */

  function isInside(a, b) {
    a = (a.nodeType ? a : a.el).getBoundingClientRect();
    b = b === viewport ? b : (b.nodeType ? b : b.el).getBoundingClientRect();

    return !(a.right < b.left || a.left > b.right || a.top > b.bottom || a.bottom < b.top);
  }


/*
	 * Process all targets (checkTarget is undefined)
	 * or a single target (checkTarget is a previously set target)
	 *
	 * When not all images are loaded, checkTarget is an image
	 * to avoid processing all targets multiple times
	 */

  function processTargets(checkTarget) {
    var start = new Date().getTime();
    var mode = (checkTarget && (checkTarget.tagName === 'IMG' || checkTarget.img)) ? 'image' : 'targets';
    var found = checkTarget ? false : true;
    var total = get('targets').length;
    var target;

    for (var t = 0; t < total; t++) {
      target = get('targets')[t];

      if (isInside(target, viewport)) {
        if (mode === 'targets' && (!checkTarget || checkTarget === target)) {
          found = true;
          calculatePixelBrightness(target);
        } else if (mode === 'image' && isInside(target, checkTarget)) {
          calculatePixelBrightness(target);
        }
      }
    }

    if (mode === 'targets' && !found) {
      throw checkTarget + ' is not a target';
    }

    kill(start);
  }


/*
	 * Find the element's zIndex. Also checks
	 * the zIndex of its parent
	 */

  function getZIndex(el) {
    var calculate = function (el) {
      var zindex = 0;

      if (window.getComputedStyle(el).position !== 'static') {
        zindex = parseInt(window.getComputedStyle(el).zIndex, 10) || 0;

        // Reserve zindex = 0 for elements with position: static;
        if (zindex >= 0) {
          zindex++;
        }
      }

      return zindex;
    };

    var parent = el.parentNode;
    var zIndexParent = parent ? calculate(parent) : 0;
    var zIndexEl = calculate(el);

    return (zIndexParent * 100000) + zIndexEl;
  }


/*
	 * Check zIndexes
	 */

  function sortImagesByZIndex(images) {
    var sorted = false;
    if (images && images.length) {
      images.sort(function (a, b) {
        a = a.nodeType ? a : a.el;
        b = b.nodeType ? b : b.el;

        var pos = a.compareDocumentPosition(b);
        var reverse = 0;

        a = getZIndex(a);
        b = getZIndex(b);

        if (a > b) {
          sorted = true;
        }

        // Reposition if zIndex is the same but the elements are not
        // sorted according to their document position
        if (a === b && pos === 2) {
          reverse = 1;
        } else if (a === b && pos === 4) {
          reverse = -1;
        }

        return reverse || a - b;
      });

      log('Sorted: ' + sorted);

      if (sorted) {
        log(images);
      }
    }

    return sorted;
  }


/*
	 * Main function
	 */

  function check(target, avoidClear, imageLoaded) {

    if (supported) {
      var mask = get('mask');

      log('--- BackgroundCheck ---');
      log('onLoad event: ' + (imageLoaded && imageLoaded.src));

      if (avoidClear !== true) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgb(' + mask.r + ', ' + mask.g + ', ' + mask.b + ')';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      var processImages = imageLoaded ? [imageLoaded] : get('images');
      var sorted = sortImagesByZIndex(processImages);

      var image;
      var imageNode;
      var loading = false;

      for (var i = 0; i < processImages.length; i++) {
        image = processImages[i];

        if (isInside(image, viewport)) {
          imageNode = image.nodeType ? image : image.img;

          if (imageNode.naturalWidth === 0) {
            loading = true;
            log('Loading... ' + image.src);

            imageNode.removeEventListener('load', check);

            if (sorted) {
              // Sorted -- redraw all images
              imageNode.addEventListener('load', check.bind(null, null, false, null));
            } else {
              // Not sorted -- just draw one image
              imageNode.addEventListener('load', check.bind(null, target, true, image));
            }
          } else {
            log('Drawing: ' + image.src);
            drawImage(image);
          }
        }
      }

      if (!imageLoaded && !loading) {
        processTargets(target);
      } else if (imageLoaded) {
        processTargets(imageLoaded);
      }
    }
  }


/*
	 * Throttle events
	 */

  function throttle(callback) {

    if (get('windowEvents') === true) {

      if (throttleDelay) {
        clearTimeout(throttleDelay);
      }

      throttleDelay = setTimeout(callback, 200);
    }
  }


/*
	 * Setter
	 */

  function set(property, newValue) {

    if (attrs[property] === undefined) {
      throw 'Unknown property - ' + property;
    } else if (newValue === undefined) {
      throw 'Missing value for ' + property;
    }

    if (property === 'targets' || property === 'images') {

      try {
        newValue = getElements(property === 'images' && !newValue ? 'img' : newValue, property === 'images' ? true : false);
      } catch (err) {
        newValue = [];
        throw err;
      }
    } else {
      checkType(newValue, typeof attrs[property]);
    }

    removeClasses();
    attrs[property] = newValue;
    check();

    if (property === 'debugOverlay') {
      showDebugOverlay();
    }
  }


/*
	 * Getter
	 */

  function get(property) {

    if (attrs[property] === undefined) {
      throw 'Unknown property - ' + property;
    }

    return attrs[property];
  }


/*
	 * Get position and size of all images.
	 * Used for testing purposes
	 */

  function getImageData() {
    var images = get('images');
    var area;
    var data = [];

    for (var i = 0; i < images.length; i++) {
      area = getArea(images[i]);
      data.push(area);
    }

    return data;
  }


  return {
/*
		 * Init and destroy
		 */
    init: init,
    destroy: destroy,

/*
		 * Expose main function
		 */
    refresh: check,

/*
		 * Setters and getters
		 */
    set: set,
    get: get,

/*
		 * Return image data
		 */
    getImageData: getImageData
  };

}));
/*!
 *  GMAP3 Plugin for jQuery
 *  Version   : 6.0.0
 *  Date      : 2014-04-25
 *  Author    : DEMONTE Jean-Baptiste
 *  Contact   : jbdemonte@gmail.com
 *  Web site  : http://gmap3.net
 *  Licence   : GPL v3 : http://www.gnu.org/licenses/gpl.html
 *
 *  Copyright (c) 2010-2014 Jean-Baptiste DEMONTE
 *  All rights reserved.
 */
;
(function ($, undef) {

  var defaults, gm, gId = 0,
      isFunction = $.isFunction,
      isArray = $.isArray;

  function isObject(m) {
    return typeof m === "object";
  }

  function isString(m) {
    return typeof m === "string";
  }

  function isNumber(m) {
    return typeof m === "number";
  }

  function isUndefined(m) {
    return m === undef;
  }

  /**
   * Initialize default values
   * defaults are defined at first gmap3 call to pass the rails asset pipeline and jasmine while google library is not yet loaded
   */

  function initDefaults() {
    gm = google.maps;
    if (!defaults) {
      defaults = {
        verbose: false,
        queryLimit: {
          attempt: 5,
          delay: 250,
          // setTimeout(..., delay + random);
          random: 250
        },
        classes: (function () {
          var r = {};
          $.each("Map Marker InfoWindow Circle Rectangle OverlayView StreetViewPanorama KmlLayer TrafficLayer BicyclingLayer GroundOverlay StyledMapType ImageMapType".split(" "), function (_, k) {
            r[k] = gm[k];
          });
          return r;
        }()),
        map: {
          mapTypeId: gm.MapTypeId.ROADMAP,
          center: [46.578498, 2.457275],
          zoom: 2
        },
        overlay: {
          pane: "floatPane",
          content: "",
          offset: {
            x: 0,
            y: 0
          }
        },
        geoloc: {
          getCurrentPosition: {
            maximumAge: 60000,
            timeout: 5000
          }
        }
      }
    }
  }


  /**
   * Generate a new ID if not defined
   * @param id {string} (optional)
   * @param simulate {boolean} (optional)
   * @returns {*}
   */

  function globalId(id, simulate) {
    return isUndefined(id) ? "gmap3_" + (simulate ? gId + 1 : ++gId) : id;
  }


  /**
   * Return true if current version of Google Maps is equal or above to these in parameter
   * @param version {string} Minimal version required
   * @return {Boolean}
   */

  function googleVersionMin(version) {
    var i, gmVersion = gm.version.split(".");
    version = version.split(".");
    for (i = 0; i < gmVersion.length; i++) {
      gmVersion[i] = parseInt(gmVersion[i], 10);
    }
    for (i = 0; i < version.length; i++) {
      version[i] = parseInt(version[i], 10);
      if (gmVersion.hasOwnProperty(i)) {
        if (gmVersion[i] < version[i]) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }


  /**
   * attach events from a container to a sender
   * td[
   *  events => { eventName => function, }
   *  onces  => { eventName => function, }
   *  data   => mixed data
   * ]
   **/

  function attachEvents($container, args, sender, id, senders) {
    var td = args.td || {},
        context = {
        id: id,
        data: td.data,
        tag: td.tag
        };

    function bind(items, handler) {
      if (items) {
        $.each(items, function (name, f) {
          var self = $container,
              fn = f;
          if (isArray(f)) {
            self = f[0];
            fn = f[1];
          }
          handler(sender, name, function (event) {
            fn.apply(self, [senders || sender, event, context]);
          });
        });
      }
    }
    bind(td.events, gm.event.addListener);
    bind(td.onces, gm.event.addListenerOnce);
  }

  /**
   * Extract keys from object
   * @param obj {object}
   * @returns {Array}
   */

  function getKeys(obj) {
    var k, keys = [];
    for (k in obj) {
      if (obj.hasOwnProperty(k)) {
        keys.push(k);
      }
    }
    return keys;
  }

  /**
   * copy a key content
   **/

  function copyKey(target, key) {
    var i, args = arguments;
    for (i = 2; i < args.length; i++) {
      if (key in args[i]) {
        if (args[i].hasOwnProperty(key)) {
          target[key] = args[i][key];
          return;
        }
      }
    }
  }

  /**
   * Build a tuple
   * @param args {object}
   * @param value {object}
   * @returns {object}
   */

  function tuple(args, value) {
    var k, i, keys = ["data", "tag", "id", "events", "onces"],
        td = {};

    // "copy" the common data
    if (args.td) {
      for (k in args.td) {
        if (args.td.hasOwnProperty(k)) {
          if ((k !== "options") && (k !== "values")) {
            td[k] = args.td[k];
          }
        }
      }
    }
    // "copy" some specific keys from value first else args.td
    for (i = 0; i < keys.length; i++) {
      copyKey(td, keys[i], value, args.td);
    }

    // create an extended options
    td.options = $.extend({}, args.opts || {}, value.options || {});

    return td;
  }

  /**
   * Log error
   */

  function error() {
    if (defaults.verbose) {
      var i, err = [];
      if (window.console && (isFunction(console.error))) {
        for (i = 0; i < arguments.length; i++) {
          err.push(arguments[i]);
        }
        console.error.apply(console, err);
      } else {
        err = "";
        for (i = 0; i < arguments.length; i++) {
          err += arguments[i].toString() + " ";
        }
        alert(err);
      }
    }
  }

  /**
   * return true if mixed is usable as number
   **/

  function numeric(mixed) {
    return (isNumber(mixed) || isString(mixed)) && mixed !== "" && !isNaN(mixed);
  }

  /**
   * convert data to array
   **/

  function array(mixed) {
    var k, a = [];
    if (!isUndefined(mixed)) {
      if (isObject(mixed)) {
        if (isNumber(mixed.length)) {
          a = mixed;
        } else {
          for (k in mixed) {
            a.push(mixed[k]);
          }
        }
      } else {
        a.push(mixed);
      }
    }
    return a;
  }

  /**
   * create a function to check a tag
   */

  function ftag(tag) {
    if (tag) {
      if (isFunction(tag)) {
        return tag;
      }
      tag = array(tag);
      return function (val) {
        var i;
        if (isUndefined(val)) {
          return false;
        }
        if (isObject(val)) {
          for (i = 0; i < val.length; i++) {
            if ($.inArray(val[i], tag) >= 0) {
              return true;
            }
          }
          return false;
        }
        return $.inArray(val, tag) >= 0;
      };
    }
  }


  /**
   * convert mixed [ lat, lng ] objet to gm.LatLng
   **/

  function toLatLng(mixed, emptyReturnMixed, noFlat) {
    var empty = emptyReturnMixed ? mixed : null;
    if (!mixed || (isString(mixed))) {
      return empty;
    }
    // defined latLng
    if (mixed.latLng) {
      return toLatLng(mixed.latLng);
    }
    // gm.LatLng object
    if (mixed instanceof gm.LatLng) {
      return mixed;
    }
    // {lat:X, lng:Y} object
    if (numeric(mixed.lat)) {
      return new gm.LatLng(mixed.lat, mixed.lng);
    }
    // [X, Y] object
    if (!noFlat && isArray(mixed)) {
      if (!numeric(mixed[0]) || !numeric(mixed[1])) {
        return empty;
      }
      return new gm.LatLng(mixed[0], mixed[1]);
    }
    return empty;
  }

  /**
   * convert mixed [ sw, ne ] object by gm.LatLngBounds
   **/

  function toLatLngBounds(mixed) {
    var ne, sw;
    if (!mixed || mixed instanceof gm.LatLngBounds) {
      return mixed || null;
    }
    if (isArray(mixed)) {
      if (mixed.length === 2) {
        ne = toLatLng(mixed[0]);
        sw = toLatLng(mixed[1]);
      } else if (mixed.length === 4) {
        ne = toLatLng([mixed[0], mixed[1]]);
        sw = toLatLng([mixed[2], mixed[3]]);
      }
    } else {
      if (("ne" in mixed) && ("sw" in mixed)) {
        ne = toLatLng(mixed.ne);
        sw = toLatLng(mixed.sw);
      } else if (("n" in mixed) && ("e" in mixed) && ("s" in mixed) && ("w" in mixed)) {
        ne = toLatLng([mixed.n, mixed.e]);
        sw = toLatLng([mixed.s, mixed.w]);
      }
    }
    if (ne && sw) {
      return new gm.LatLngBounds(sw, ne);
    }
    return null;
  }

  /**
   * resolveLatLng
   **/

  function resolveLatLng(ctx, method, runLatLng, args, attempt) {
    var latLng = runLatLng ? toLatLng(args.td, false, true) : false,
        conf = latLng ? {
        latLng: latLng
        } : (args.td.address ? (isString(args.td.address) ? {
        address: args.td.address
      } : args.td.address) : false),
        cache = conf ? geocoderCache.get(conf) : false,
        self = this;
    if (conf) {
      attempt = attempt || 0; // convert undefined to int
      if (cache) {
        args.latLng = cache.results[0].geometry.location;
        args.results = cache.results;
        args.status = cache.status;
        method.apply(ctx, [args]);
      } else {
        if (conf.location) {
          conf.location = toLatLng(conf.location);
        }
        if (conf.bounds) {
          conf.bounds = toLatLngBounds(conf.bounds);
        }
        geocoder().geocode(
        conf, function (results, status) {
          if (status === gm.GeocoderStatus.OK) {
            geocoderCache.store(conf, {
              results: results,
              status: status
            });
            args.latLng = results[0].geometry.location;
            args.results = results;
            args.status = status;
            method.apply(ctx, [args]);
          } else if ((status === gm.GeocoderStatus.OVER_QUERY_LIMIT) && (attempt < defaults.queryLimit.attempt)) {
            setTimeout(

            function () {
              resolveLatLng.apply(self, [ctx, method, runLatLng, args, attempt + 1]);
            }, defaults.queryLimit.delay + Math.floor(Math.random() * defaults.queryLimit.random));
          } else {
            error("geocode failed", status, conf);
            args.latLng = args.results = false;
            args.status = status;
            method.apply(ctx, [args]);
          }
        });
      }
    } else {
      args.latLng = toLatLng(args.td, false, true);
      method.apply(ctx, [args]);
    }
  }

  function resolveAllLatLng(list, ctx, method, args) {
    var self = this,
        i = -1;

    function resolve() {
      // look for next address to resolve
      do {
        i++;
      } while ((i < list.length) && !("address" in list[i]));

      // no address found, so run method
      if (i >= list.length) {
        method.apply(ctx, [args]);
        return;
      }

      resolveLatLng(
      self, function (args) {
        delete args.td;
        $.extend(list[i], args);
        resolve.apply(self, []); // resolve next (using apply avoid too much recursion)
      }, true, {
        td: list[i]
      });
    }
    resolve();
  }



  /**
   * geolocalise the user and return a LatLng
   **/

  function geoloc(ctx, method, args) {
    var is_echo = false; // sometime, a kind of echo appear, this trick will notice once the first call is run to ignore the next one
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(

      function (pos) {
        if (!is_echo) {
          is_echo = true;
          args.latLng = new gm.LatLng(pos.coords.latitude, pos.coords.longitude);
          method.apply(ctx, [args]);
        }
      }, function () {
        if (!is_echo) {
          is_echo = true;
          args.latLng = false;
          method.apply(ctx, [args]);
        }
      }, args.opts.getCurrentPosition);
    } else {
      args.latLng = false;
      method.apply(ctx, [args]);
    }
  }

  /**
   * Return true if get is a direct call
   * it means :
   *   - get is the only key
   *   - get has no callback
   * @param obj {Object} The request to check
   * @return {Boolean}
   */

  function isDirectGet(obj) {
    var k, result = false;
    if (isObject(obj) && obj.hasOwnProperty("get")) {
      for (k in obj) {
        if (k !== "get") {
          return false;
        }
      }
      result = !obj.get.hasOwnProperty("callback");
    }
    return result;
  }
  var services = {},
      geocoderCache = new GeocoderCache();


  function geocoder() {
    if (!services.geocoder) {
      services.geocoder = new gm.Geocoder();
    }
    return services.geocoder;
  }
  /**
   * Class GeocoderCache
   * @constructor
   */

  function GeocoderCache() {
    var cache = [];

    this.get = function (request) {
      if (cache.length) {
        var i, j, k, item, eq, keys = getKeys(request);
        for (i = 0; i < cache.length; i++) {
          item = cache[i];
          eq = keys.length === item.keys.length;
          for (j = 0;
          (j < keys.length) && eq; j++) {
            k = keys[j];
            eq = k in item.request;
            if (eq) {
              if (isObject(request[k]) && ("equals" in request[k]) && isFunction(request[k])) {
                eq = request[k].equals(item.request[k]);
              } else {
                eq = request[k] === item.request[k];
              }
            }
          }
          if (eq) {
            return item.results;
          }
        }
      }
    };

    this.store = function (request, results) {
      cache.push({
        request: request,
        keys: getKeys(request),
        results: results
      });
    };
  }
  /**
   * Class Stack
   * @constructor
   */

  function Stack() {
    var st = [],
        self = this;

    self.empty = function () {
      return !st.length;
    };

    self.add = function (v) {
      st.push(v);
    };

    self.get = function () {
      return st.length ? st[0] : false;
    };

    self.ack = function () {
      st.shift();
    };
  }
  /**
   * Class Store
   * @constructor
   */

  function Store() {
    var store = {},
         // name => [id, ...]
        objects = {},
         // id => object
        self = this;

    function normalize(res) {
      return {
        id: res.id,
        name: res.name,
        object: res.obj,
        tag: res.tag,
        data: res.data
      };
    }

    /**
     * add a mixed to the store
     **/
    self.add = function (args, name, obj, sub) {
      var td = args.td || {},
          id = globalId(td.id);
      if (!store[name]) {
        store[name] = [];
      }
      if (id in objects) { // object already exists: remove it
        self.clearById(id);
      }
      objects[id] = {
        obj: obj,
        sub: sub,
        name: name,
        id: id,
        tag: td.tag,
        data: td.data
      };
      store[name].push(id);
      return id;
    };

    /**
     * return a stored object by its id
     **/
    self.getById = function (id, sub, full) {
      var result = false;
      if (id in objects) {
        if (sub) {
          result = objects[id].sub;
        } else if (full) {
          result = normalize(objects[id]);
        } else {
          result = objects[id].obj;
        }
      }
      return result;
    };

    /**
     * return a stored value
     **/
    self.get = function (name, last, tag, full) {
      var n, id, check = ftag(tag);
      if (!store[name] || !store[name].length) {
        return null;
      }
      n = store[name].length;
      while (n) {
        n--;
        id = store[name][last ? n : store[name].length - n - 1];
        if (id && objects[id]) {
          if (check && !check(objects[id].tag)) {
            continue;
          }
          return full ? normalize(objects[id]) : objects[id].obj;
        }
      }
      return null;
    };

    /**
     * return all stored values
     **/
    self.all = function (name, tag, full) {
      var result = [],
          check = ftag(tag),
          find = function (n) {
          var i, id;
          for (i = 0; i < store[n].length; i++) {
            id = store[n][i];
            if (id && objects[id]) {
              if (check && !check(objects[id].tag)) {
                continue;
              }
              result.push(full ? normalize(objects[id]) : objects[id].obj);
            }
          }
          };
      if (name in store) {
        find(name);
      } else if (isUndefined(name)) { // internal use only
        for (name in store) {
          find(name);
        }
      }
      return result;
    };

    /**
     * hide and remove an object
     **/

    function rm(obj) {
      // Google maps element
      if (isFunction(obj.setMap)) {
        obj.setMap(null);
      }
      // jQuery
      if (isFunction(obj.remove)) {
        obj.remove();
      }
      // internal (cluster)
      if (isFunction(obj.free)) {
        obj.free();
      }
      obj = null;
    }

    /**
     * remove one object from the store
     **/
    self.rm = function (name, check, pop) {
      var idx, id;
      if (!store[name]) {
        return false;
      }
      if (check) {
        if (pop) {
          for (idx = store[name].length - 1; idx >= 0; idx--) {
            id = store[name][idx];
            if (check(objects[id].tag)) {
              break;
            }
          }
        } else {
          for (idx = 0; idx < store[name].length; idx++) {
            id = store[name][idx];
            if (check(objects[id].tag)) {
              break;
            }
          }
        }
      } else {
        idx = pop ? store[name].length - 1 : 0;
      }
      if (!(idx in store[name])) {
        return false;
      }
      return self.clearById(store[name][idx], idx);
    };

    /**
     * remove object from the store by its id
     **/
    self.clearById = function (id, idx) {
      if (id in objects) {
        var i, name = objects[id].name;
        for (i = 0; isUndefined(idx) && i < store[name].length; i++) {
          if (id === store[name][i]) {
            idx = i;
          }
        }
        rm(objects[id].obj);
        if (objects[id].sub) {
          rm(objects[id].sub);
        }
        delete objects[id];
        store[name].splice(idx, 1);
        return true;
      }
      return false;
    };

    /**
     * return an object from a container object in the store by its id
     * ! for now, only cluster manage this feature
     **/
    self.objGetById = function (id) {
      var result, idx;
      if (store.clusterer) {
        for (idx in store.clusterer) {
          if ((result = objects[store.clusterer[idx]].obj.getById(id)) !== false) {
            return result;
          }
        }
      }
      return false;
    };

    /**
     * remove object from a container object in the store by its id
     * ! for now, only cluster manage this feature
     **/
    self.objClearById = function (id) {
      var idx;
      if (store.clusterer) {
        for (idx in store.clusterer) {
          if (objects[store.clusterer[idx]].obj.clearById(id)) {
            return true;
          }
        }
      }
      return null;
    };

    /**
     * remove objects from the store
     **/
    self.clear = function (list, last, first, tag) {
      var k, i, name, check = ftag(tag);
      if (!list || !list.length) {
        list = [];
        for (k in store) {
          list.push(k);
        }
      } else {
        list = array(list);
      }
      for (i = 0; i < list.length; i++) {
        name = list[i];
        if (last) {
          self.rm(name, check, true);
        } else if (first) {
          self.rm(name, check, false);
        } else { // all
          while (self.rm(name, check, false)) {}
        }
      }
    };

    /**
     * remove object from a container object in the store by its tags
     * ! for now, only cluster manage this feature
     **/
    self.objClear = function (list, last, first, tag) {
      var idx;
      if (store.clusterer && ($.inArray("marker", list) >= 0 || !list.length)) {
        for (idx in store.clusterer) {
          objects[store.clusterer[idx]].obj.clear(last, first, tag);
        }
      }
    };
  }
  /**
   * Class Task
   * @param ctx
   * @param onEnd
   * @param td
   * @constructor
   */

  function Task(ctx, onEnd, td) {
    var session = {},
        self = this,
        current, resolve = {
        latLng: { // function => bool (=> address = latLng)
          map: false,
          marker: false,
          infowindow: false,
          circle: false,
          overlay: false,
          getlatlng: false,
          getmaxzoom: false,
          getelevation: false,
          streetviewpanorama: false,
          getaddress: true
        },
        geoloc: {
          getgeoloc: true
        }
        };

    function unify(td) {
      var result = {};
      result[td] = {};
      return result;
    }

    if (isString(td)) {
      td = unify(td);
    }

    function next() {
      var k;
      for (k in td) {
        if (td.hasOwnProperty(k) && !session.hasOwnProperty(k)) {
          return k;
        }
      }
    }

    self.run = function () {
      var k, opts;
      while (k = next()) {
        if (isFunction(ctx[k])) {
          current = k;
          opts = $.extend(true, {}, defaults[k] || {}, td[k].options || {});
          if (k in resolve.latLng) {
            if (td[k].values) {
              resolveAllLatLng(td[k].values, ctx, ctx[k], {
                td: td[k],
                opts: opts,
                session: session
              });
            } else {
              resolveLatLng(ctx, ctx[k], resolve.latLng[k], {
                td: td[k],
                opts: opts,
                session: session
              });
            }
          } else if (k in resolve.geoloc) {
            geoloc(ctx, ctx[k], {
              td: td[k],
              opts: opts,
              session: session
            });
          } else {
            ctx[k].apply(ctx, [{
              td: td[k],
              opts: opts,
              session: session
            }]);
          }
          return; // wait until ack
        } else {
          session[k] = null;
        }
      }
      onEnd.apply(ctx, [td, session]);
    };

    self.ack = function (result) {
      session[current] = result;
      self.run.apply(self, []);
    };
  }

  function directionsService() {
    if (!services.ds) {
      services.ds = new gm.DirectionsService();
    }
    return services.ds;
  }

  function distanceMatrixService() {
    if (!services.dms) {
      services.dms = new gm.DistanceMatrixService();
    }
    return services.dms;
  }

  function maxZoomService() {
    if (!services.mzs) {
      services.mzs = new gm.MaxZoomService();
    }
    return services.mzs;
  }

  function elevationService() {
    if (!services.es) {
      services.es = new gm.ElevationService();
    }
    return services.es;
  }

  /**
   * Usefull to get a projection
   * => done in a function, to let dead-code analyser works without google library loaded
   **/

  function newEmptyOverlay(map, radius) {
    function Overlay() {
      var self = this;
      self.onAdd = function () {};
      self.onRemove = function () {};
      self.draw = function () {};
      return defaults.classes.OverlayView.apply(self, []);
    }
    Overlay.prototype = defaults.classes.OverlayView.prototype;
    var obj = new Overlay();
    obj.setMap(map);
    return obj;
  }

  /**
   * Class InternalClusterer
   * This class manage clusters thanks to "td" objects
   *
   * Note:
   * Individuals marker are created on the fly thanks to the td objects, they are
   * first set to null to keep the indexes synchronised with the td list
   * This is the "display" function, set by the gmap3 object, which uses theses data
   * to create markers when clusters are not required
   * To remove a marker, the objects are deleted and set not null in arrays
   *    markers[key]
   *      = null : marker exist but has not been displayed yet
   *      = false : marker has been removed
   **/

  function InternalClusterer($container, map, raw) {
    var timer, projection, ffilter, fdisplay, ferror, // callback function
    updating = false,
        updated = false,
        redrawing = false,
        ready = false,
        enabled = true,
        self = this,
        events = [],
        store = {},
         // combin of index (id1-id2-...) => object
        ids = {},
         // unique id => index
        idxs = {},
         // index => unique id
        markers = [],
         // index => marker
        tds = [],
         // index => td or null if removed
        values = [],
         // index => value
        overlay = newEmptyOverlay(map, raw.radius);

    main();

    function prepareMarker(index) {
      if (!markers[index]) {
        delete tds[index].options.map;
        markers[index] = new defaults.classes.Marker(tds[index].options);
        attachEvents($container, {
          td: tds[index]
        }, markers[index], tds[index].id);
      }
    }

    /**
     * return a marker by its id, null if not yet displayed and false if no exist or removed
     **/
    self.getById = function (id) {
      if (id in ids) {
        prepareMarker(ids[id]);
        return markers[ids[id]];
      }
      return false;
    };

    /**
     * remove one object from the store
     **/
    self.rm = function (id) {
      var index = ids[id];
      if (markers[index]) { // can be null
        markers[index].setMap(null);
      }
      delete markers[index];
      markers[index] = false;

      delete tds[index];
      tds[index] = false;

      delete values[index];
      values[index] = false;

      delete ids[id];
      delete idxs[index];
      updated = true;
    };

    /**
     * remove a marker by its id
     **/
    self.clearById = function (id) {
      if (id in ids) {
        self.rm(id);
        return true;
      }
    };

    /**
     * remove objects from the store
     **/
    self.clear = function (last, first, tag) {
      var start, stop, step, index, i, list = [],
          check = ftag(tag);
      if (last) {
        start = tds.length - 1;
        stop = -1;
        step = -1;
      } else {
        start = 0;
        stop = tds.length;
        step = 1;
      }
      for (index = start; index !== stop; index += step) {
        if (tds[index]) {
          if (!check || check(tds[index].tag)) {
            list.push(idxs[index]);
            if (first || last) {
              break;
            }
          }
        }
      }
      for (i = 0; i < list.length; i++) {
        self.rm(list[i]);
      }
    };

    // add a "marker td" to the cluster
    self.add = function (td, value) {
      td.id = globalId(td.id);
      self.clearById(td.id);
      ids[td.id] = markers.length;
      idxs[markers.length] = td.id;
      markers.push(null); // null = marker not yet created / displayed
      tds.push(td);
      values.push(value);
      updated = true;
    };

    // add a real marker to the cluster
    self.addMarker = function (marker, td) {
      td = td || {};
      td.id = globalId(td.id);
      self.clearById(td.id);
      if (!td.options) {
        td.options = {};
      }
      td.options.position = marker.getPosition();
      attachEvents($container, {
        td: td
      }, marker, td.id);
      ids[td.id] = markers.length;
      idxs[markers.length] = td.id;
      markers.push(marker);
      tds.push(td);
      values.push(td.data || {});
      updated = true;
    };

    // return a "marker td" by its index
    self.td = function (index) {
      return tds[index];
    };

    // return a "marker value" by its index
    self.value = function (index) {
      return values[index];
    };

    // return a marker by its index
    self.marker = function (index) {
      if (index in markers) {
        prepareMarker(index);
        return markers[index];
      }
      return false;
    };

    // return a marker by its index
    self.markerIsSet = function (index) {
      return Boolean(markers[index]);
    };

    // store a new marker instead if the default "false"
    self.setMarker = function (index, marker) {
      markers[index] = marker;
    };

    // link the visible overlay to the logical data (to hide overlays later)
    self.store = function (cluster, obj, shadow) {
      store[cluster.ref] = {
        obj: obj,
        shadow: shadow
      };
    };

    // free all objects
    self.free = function () {
      var i;
      for (i = 0; i < events.length; i++) {
        gm.event.removeListener(events[i]);
      }
      events = [];

      $.each(store, function (key) {
        flush(key);
      });
      store = {};

      $.each(tds, function (i) {
        tds[i] = null;
      });
      tds = [];

      $.each(markers, function (i) {
        if (markers[i]) { // false = removed
          markers[i].setMap(null);
          delete markers[i];
        }
      });
      markers = [];

      $.each(values, function (i) {
        delete values[i];
      });
      values = [];

      ids = {};
      idxs = {};
    };

    // link the display function
    self.filter = function (f) {
      ffilter = f;
      redraw();
    };

    // enable/disable the clustering feature
    self.enable = function (value) {
      if (enabled !== value) {
        enabled = value;
        redraw();
      }
    };

    // link the display function
    self.display = function (f) {
      fdisplay = f;
    };

    // link the errorfunction
    self.error = function (f) {
      ferror = f;
    };

    // lock the redraw
    self.beginUpdate = function () {
      updating = true;
    };

    // unlock the redraw
    self.endUpdate = function () {
      updating = false;
      if (updated) {
        redraw();
      }
    };

    // extends current bounds with internal markers
    self.autofit = function (bounds) {
      var i;
      for (i = 0; i < tds.length; i++) {
        if (tds[i]) {
          bounds.extend(tds[i].options.position);
        }
      }
    };

    // bind events


    function main() {
      projection = overlay.getProjection();
      if (!projection) {
        setTimeout(function () {
          main.apply(self, []);
        }, 25);
        return;
      }
      ready = true;
      events.push(gm.event.addListener(map, "zoom_changed", delayRedraw));
      events.push(gm.event.addListener(map, "bounds_changed", delayRedraw));
      redraw();
    }

    // flush overlays


    function flush(key) {
      if (isObject(store[key])) { // is overlay
        if (isFunction(store[key].obj.setMap)) {
          store[key].obj.setMap(null);
        }
        if (isFunction(store[key].obj.remove)) {
          store[key].obj.remove();
        }
        if (isFunction(store[key].shadow.remove)) {
          store[key].obj.remove();
        }
        if (isFunction(store[key].shadow.setMap)) {
          store[key].shadow.setMap(null);
        }
        delete store[key].obj;
        delete store[key].shadow;
      } else if (markers[key]) { // marker not removed
        markers[key].setMap(null);
        // don't remove the marker object, it may be displayed later
      }
      delete store[key];
    }

    /**
     * return the distance between 2 latLng couple into meters
     * Params :
     *  Lat1, Lng1, Lat2, Lng2
     *  LatLng1, Lat2, Lng2
     *  Lat1, Lng1, LatLng2
     *  LatLng1, LatLng2
     **/

    function distanceInMeter() {
      var lat1, lat2, lng1, lng2, e, f, g, h, cos = Math.cos,
          sin = Math.sin,
          args = arguments;
      if (args[0] instanceof gm.LatLng) {
        lat1 = args[0].lat();
        lng1 = args[0].lng();
        if (args[1] instanceof gm.LatLng) {
          lat2 = args[1].lat();
          lng2 = args[1].lng();
        } else {
          lat2 = args[1];
          lng2 = args[2];
        }
      } else {
        lat1 = args[0];
        lng1 = args[1];
        if (args[2] instanceof gm.LatLng) {
          lat2 = args[2].lat();
          lng2 = args[2].lng();
        } else {
          lat2 = args[2];
          lng2 = args[3];
        }
      }
      e = Math.PI * lat1 / 180;
      f = Math.PI * lng1 / 180;
      g = Math.PI * lat2 / 180;
      h = Math.PI * lng2 / 180;
      return 1000 * 6371 * Math.acos(Math.min(cos(e) * cos(g) * cos(f) * cos(h) + cos(e) * sin(f) * cos(g) * sin(h) + sin(e) * sin(g), 1));
    }

    // extend the visible bounds


    function extendsMapBounds() {
      var radius = distanceInMeter(map.getCenter(), map.getBounds().getNorthEast()),
          circle = new gm.Circle({
          center: map.getCenter(),
          radius: 1.25 * radius // + 25%
        });
      return circle.getBounds();
    }

    // return an object where keys are store keys


    function getStoreKeys() {
      var k, keys = {};
      for (k in store) {
        keys[k] = true;
      }
      return keys;
    }

    // async the delay function


    function delayRedraw() {
      clearTimeout(timer);
      timer = setTimeout(redraw, 25);
    }

    // generate bounds extended by radius


    function extendsBounds(latLng) {
      var p = projection.fromLatLngToDivPixel(latLng),
          ne = projection.fromDivPixelToLatLng(new gm.Point(p.x + raw.radius, p.y - raw.radius)),
          sw = projection.fromDivPixelToLatLng(new gm.Point(p.x - raw.radius, p.y + raw.radius));
      return new gm.LatLngBounds(sw, ne);
    }

    // run the clustering process and call the display function


    function redraw() {
      if (updating || redrawing || !ready) {
        return;
      }

      var i, j, k, indexes, check = false,
          bounds, cluster, position, previous, lat, lng, loop, keys = [],
          used = {},
          zoom = map.getZoom(),
          forceDisabled = ("maxZoom" in raw) && (zoom > raw.maxZoom),
          previousKeys = getStoreKeys();

      // reset flag
      updated = false;

      if (zoom > 3) {
        // extend the bounds of the visible map to manage clusters near the boundaries
        bounds = extendsMapBounds();

        // check contain only if boundaries are valid
        check = bounds.getSouthWest().lng() < bounds.getNorthEast().lng();
      }

      // calculate positions of "visibles" markers (in extended bounds)
      for (i = 0; i < tds.length; i++) {
        if (tds[i] && (!check || bounds.contains(tds[i].options.position)) && (!ffilter || ffilter(values[i]))) {
          keys.push(i);
        }
      }

      // for each "visible" marker, search its neighbors to create a cluster
      // we can't do a classical "for" loop, because, analysis can bypass a marker while focusing on cluster
      while (1) {
        i = 0;
        while (used[i] && (i < keys.length)) { // look for the next marker not used
          i++;
        }
        if (i === keys.length) {
          break;
        }

        indexes = [];

        if (enabled && !forceDisabled) {
          loop = 10;
          do {
            previous = indexes;
            indexes = [];
            loop--;

            if (previous.length) {
              position = bounds.getCenter();
            } else {
              position = tds[keys[i]].options.position;
            }
            bounds = extendsBounds(position);

            for (j = i; j < keys.length; j++) {
              if (used[j]) {
                continue;
              }
              if (bounds.contains(tds[keys[j]].options.position)) {
                indexes.push(j);
              }
            }
          } while ((previous.length < indexes.length) && (indexes.length > 1) && loop);
        } else {
          for (j = i; j < keys.length; j++) {
            if (!used[j]) {
              indexes.push(j);
              break;
            }
          }
        }

        cluster = {
          indexes: [],
          ref: []
        };
        lat = lng = 0;
        for (k = 0; k < indexes.length; k++) {
          used[indexes[k]] = true;
          cluster.indexes.push(keys[indexes[k]]);
          cluster.ref.push(keys[indexes[k]]);
          lat += tds[keys[indexes[k]]].options.position.lat();
          lng += tds[keys[indexes[k]]].options.position.lng();
        }
        lat /= indexes.length;
        lng /= indexes.length;
        cluster.latLng = new gm.LatLng(lat, lng);

        cluster.ref = cluster.ref.join("-");

        if (cluster.ref in previousKeys) { // cluster doesn't change
          delete previousKeys[cluster.ref]; // remove this entry, these still in this array will be removed
        } else { // cluster is new
          if (indexes.length === 1) { // alone markers are not stored, so need to keep the key (else, will be displayed every time and marker will blink)
            store[cluster.ref] = true;
          }
          fdisplay(cluster);
        }
      }

      // flush the previous overlays which are not still used
      $.each(previousKeys, function (key) {
        flush(key);
      });
      redrawing = false;
    }
  }
  /**
   * Class Clusterer
   * a facade with limited method for external use
   **/

  function Clusterer(id, internalClusterer) {
    var self = this;
    self.id = function () {
      return id;
    };
    self.filter = function (f) {
      internalClusterer.filter(f);
    };
    self.enable = function () {
      internalClusterer.enable(true);
    };
    self.disable = function () {
      internalClusterer.enable(false);
    };
    self.add = function (marker, td, lock) {
      if (!lock) {
        internalClusterer.beginUpdate();
      }
      internalClusterer.addMarker(marker, td);
      if (!lock) {
        internalClusterer.endUpdate();
      }
    };
    self.getById = function (id) {
      return internalClusterer.getById(id);
    };
    self.clearById = function (id, lock) {
      var result;
      if (!lock) {
        internalClusterer.beginUpdate();
      }
      result = internalClusterer.clearById(id);
      if (!lock) {
        internalClusterer.endUpdate();
      }
      return result;
    };
    self.clear = function (last, first, tag, lock) {
      if (!lock) {
        internalClusterer.beginUpdate();
      }
      internalClusterer.clear(last, first, tag);
      if (!lock) {
        internalClusterer.endUpdate();
      }
    };
  }

  /**
   * Class OverlayView
   * @constructor
   */

  function OverlayView(map, opts, latLng, $div) {
    var self = this,
        listeners = [];

    defaults.classes.OverlayView.call(self);
    self.setMap(map);

    self.onAdd = function () {
      var panes = self.getPanes();
      if (opts.pane in panes) {
        $(panes[opts.pane]).append($div);
      }
      $.each("dblclick click mouseover mousemove mouseout mouseup mousedown".split(" "), function (i, name) {
        listeners.push(
        gm.event.addDomListener($div[0], name, function (e) {
          $.Event(e).stopPropagation();
          gm.event.trigger(self, name, [e]);
          self.draw();
        }));
      });
      listeners.push(
      gm.event.addDomListener($div[0], "contextmenu", function (e) {
        $.Event(e).stopPropagation();
        gm.event.trigger(self, "rightclick", [e]);
        self.draw();
      }));
    };

    self.getPosition = function () {
      return latLng;
    };

    self.setPosition = function (newLatLng) {
      latLng = newLatLng;
      self.draw();
    };

    self.draw = function () {
      var ps = self.getProjection().fromLatLngToDivPixel(latLng);
      $div.css("left", (ps.x + opts.offset.x) + "px").css("top", (ps.y + opts.offset.y) + "px");
    };

    self.onRemove = function () {
      var i;
      for (i = 0; i < listeners.length; i++) {
        gm.event.removeListener(listeners[i]);
      }
      $div.remove();
    };

    self.hide = function () {
      $div.hide();
    };

    self.show = function () {
      $div.show();
    };

    self.toggle = function () {
      if ($div) {
        if ($div.is(":visible")) {
          self.show();
        } else {
          self.hide();
        }
      }
    };

    self.toggleDOM = function () {
      self.setMap(self.getMap() ? null : map);
    };

    self.getDOMElement = function () {
      return $div[0];
    };
  }

  function Gmap3($this) {
    var self = this,
        stack = new Stack(),
        store = new Store(),
        map = null,
        task;

    /**
     * if not running, start next action in stack
     **/

    function run() {
      if (!task && (task = stack.get())) {
        task.run();
      }
    }

    /**
     * called when action in finished, to acknoledge the current in stack and start next one
     **/

    function end() {
      task = null;
      stack.ack();
      run.call(self); // restart to high level scope
    }

    //-----------------------------------------------------------------------//
    // Tools
    //-----------------------------------------------------------------------//
    /**
     * execute callback functions
     **/

    function callback(args) {
      var params, cb = args.td.callback;
      if (cb) {
        params = Array.prototype.slice.call(arguments, 1);
        if (isFunction(cb)) {
          cb.apply($this, params);
        } else if (isArray(cb)) {
          if (isFunction(cb[1])) {
            cb[1].apply(cb[0], params);
          }
        }
      }
    }

    /**
     * execute ending functions
     **/

    function manageEnd(args, obj, id) {
      if (id) {
        attachEvents($this, args, obj, id);
      }
      callback(args, obj);
      task.ack(obj);
    }

    /**
     * initialize the map if not yet initialized
     **/

    function newMap(latLng, args) {
      args = args || {};
      var opts = args.td && args.td.options ? args.td.options : 0;
      if (map) {
        if (opts) {
          if (opts.center) {
            opts.center = toLatLng(opts.center);
          }
          map.setOptions(opts);
        }
      } else {
        opts = args.opts || $.extend(true, {}, defaults.map, opts || {});
        opts.center = latLng || toLatLng(opts.center);
        map = new defaults.classes.Map($this.get(0), opts);
      }
    }

    /**
     * store actions to execute in a stack manager
     **/
    self._plan = function (list) {
      var k;
      for (k = 0; k < list.length; k++) {
        stack.add(new Task(self, end, list[k]));
      }
      run();
    };

    /**
     * Initialize gm.Map object
     **/
    self.map = function (args) {
      newMap(args.latLng, args);
      attachEvents($this, args, map);
      manageEnd(args, map);
    };

    /**
     * destroy an existing instance
     **/
    self.destroy = function (args) {
      store.clear();
      $this.empty();
      if (map) {
        map = null;
      }
      manageEnd(args, true);
    };

    /**
     * add an overlay
     **/
    self.overlay = function (args, internal) {
      var objs = [],
          multiple = "values" in args.td;
      if (!multiple) {
        args.td.values = [{
          latLng: args.latLng,
          options: args.opts
        }];
      }
      if (!args.td.values.length) {
        manageEnd(args, false);
        return;
      }
      if (!OverlayView.__initialised) {
        OverlayView.prototype = new defaults.classes.OverlayView();
        OverlayView.__initialised = true;
      }
      $.each(args.td.values, function (i, value) {
        var id, obj, td = tuple(args, value),
            $div = $(document.createElement("div")).css({
            border: "none",
            borderWidth: 0,
            position: "absolute"
          });
        $div.append(td.options.content);
        obj = new OverlayView(map, td.options, toLatLng(td) || toLatLng(value), $div);
        objs.push(obj);
        $div = null; // memory leak
        if (!internal) {
          id = store.add(args, "overlay", obj);
          attachEvents($this, {
            td: td
          }, obj, id);
        }
      });
      if (internal) {
        return objs[0];
      }
      manageEnd(args, multiple ? objs : objs[0]);
    };

    /**
     * Create an InternalClusterer object
     **/

    function createClusterer(raw) {
      var internalClusterer = new InternalClusterer($this, map, raw),
          td = {},
          styles = {},
          thresholds = [],
          isInt = /^[0-9]+$/,
          calculator, k;

      for (k in raw) {
        if (isInt.test(k)) {
          thresholds.push(1 * k); // cast to int
          styles[k] = raw[k];
          styles[k].width = styles[k].width || 0;
          styles[k].height = styles[k].height || 0;
        } else {
          td[k] = raw[k];
        }
      }
      thresholds.sort(function (a, b) {
        return a > b;
      });

      // external calculator
      if (td.calculator) {
        calculator = function (indexes) {
          var data = [];
          $.each(indexes, function (i, index) {
            data.push(internalClusterer.value(index));
          });
          return td.calculator.apply($this, [data]);
        };
      } else {
        calculator = function (indexes) {
          return indexes.length;
        };
      }

      // set error function
      internalClusterer.error(function () {
        error.apply(self, arguments);
      });

      // set display function
      internalClusterer.display(function (cluster) {
        var i, style, atd, obj, offset, shadow, cnt = calculator(cluster.indexes);

        // look for the style to use
        if (raw.force || cnt > 1) {
          for (i = 0; i < thresholds.length; i++) {
            if (thresholds[i] <= cnt) {
              style = styles[thresholds[i]];
            }
          }
        }

        if (style) {
          offset = style.offset || [-style.width / 2, -style.height / 2];
          // create a custom overlay command
          // nb: 2 extends are faster self a deeper extend
          atd = $.extend({}, td);
          atd.options = $.extend({
            pane: "overlayLayer",
            content: style.content ? style.content.replace("CLUSTER_COUNT", cnt) : "",
            offset: {
              x: ("x" in offset ? offset.x : offset[0]) || 0,
              y: ("y" in offset ? offset.y : offset[1]) || 0
            }
          }, td.options || {});

          obj = self.overlay({
            td: atd,
            opts: atd.options,
            latLng: toLatLng(cluster)
          }, true);

          atd.options.pane = "floatShadow";
          atd.options.content = $(document.createElement("div")).width(style.width + "px").height(style.height + "px").css({
            cursor: "pointer"
          });
          shadow = self.overlay({
            td: atd,
            opts: atd.options,
            latLng: toLatLng(cluster)
          }, true);

          // store data to the clusterer
          td.data = {
            latLng: toLatLng(cluster),
            markers: []
          };
          $.each(cluster.indexes, function (i, index) {
            td.data.markers.push(internalClusterer.value(index));
            if (internalClusterer.markerIsSet(index)) {
              internalClusterer.marker(index).setMap(null);
            }
          });
          attachEvents($this, {
            td: td
          }, shadow, undef, {
            main: obj,
            shadow: shadow
          });
          internalClusterer.store(cluster, obj, shadow);
        } else {
          $.each(cluster.indexes, function (i, index) {
            internalClusterer.marker(index).setMap(map);
          });
        }
      });

      return internalClusterer;
    }

    /**
     *  add a marker
     **/
    self.marker = function (args) {
      var objs, clusterer, internalClusterer, multiple = "values" in args.td,
          init = !map;
      if (!multiple) {
        args.opts.position = args.latLng || toLatLng(args.opts.position);
        args.td.values = [{
          options: args.opts
        }];
      }
      if (!args.td.values.length) {
        manageEnd(args, false);
        return;
      }
      if (init) {
        newMap();
      }
      if (args.td.cluster && !map.getBounds()) { // map not initialised => bounds not available : wait for map if clustering feature is required
        gm.event.addListenerOnce(map, "bounds_changed", function () {
          self.marker.apply(self, [args]);
        });
        return;
      }
      if (args.td.cluster) {
        if (args.td.cluster instanceof Clusterer) {
          clusterer = args.td.cluster;
          internalClusterer = store.getById(clusterer.id(), true);
        } else {
          internalClusterer = createClusterer(args.td.cluster);
          clusterer = new Clusterer(globalId(args.td.id, true), internalClusterer);
          store.add(args, "clusterer", clusterer, internalClusterer);
        }
        internalClusterer.beginUpdate();

        $.each(args.td.values, function (i, value) {
          var td = tuple(args, value);
          td.options.position = td.options.position ? toLatLng(td.options.position) : toLatLng(value);
          if (td.options.position) {
            td.options.map = map;
            if (init) {
              map.setCenter(td.options.position);
              init = false;
            }
            internalClusterer.add(td, value);
          }
        });

        internalClusterer.endUpdate();
        manageEnd(args, clusterer);

      } else {
        objs = [];
        $.each(args.td.values, function (i, value) {
          var id, obj, td = tuple(args, value);
          td.options.position = td.options.position ? toLatLng(td.options.position) : toLatLng(value);
          if (td.options.position) {
            td.options.map = map;
            if (init) {
              map.setCenter(td.options.position);
              init = false;
            }
            obj = new defaults.classes.Marker(td.options);
            objs.push(obj);
            id = store.add({
              td: td
            }, "marker", obj);
            attachEvents($this, {
              td: td
            }, obj, id);
          }
        });
        manageEnd(args, multiple ? objs : objs[0]);
      }
    };

    /**
     * return a route
     **/
    self.getroute = function (args) {
      args.opts.origin = toLatLng(args.opts.origin, true);
      args.opts.destination = toLatLng(args.opts.destination, true);
      directionsService().route(
      args.opts, function (results, status) {
        callback(args, status === gm.DirectionsStatus.OK ? results : false, status);
        task.ack();
      });
    };

    /**
     * return the distance between an origin and a destination
     *
     **/
    self.getdistance = function (args) {
      var i;
      args.opts.origins = array(args.opts.origins);
      for (i = 0; i < args.opts.origins.length; i++) {
        args.opts.origins[i] = toLatLng(args.opts.origins[i], true);
      }
      args.opts.destinations = array(args.opts.destinations);
      for (i = 0; i < args.opts.destinations.length; i++) {
        args.opts.destinations[i] = toLatLng(args.opts.destinations[i], true);
      }
      distanceMatrixService().getDistanceMatrix(
      args.opts, function (results, status) {
        callback(args, status === gm.DistanceMatrixStatus.OK ? results : false, status);
        task.ack();
      });
    };

    /**
     * add an infowindow
     **/
    self.infowindow = function (args) {
      var objs = [],
          multiple = "values" in args.td;
      if (!multiple) {
        if (args.latLng) {
          args.opts.position = args.latLng;
        }
        args.td.values = [{
          options: args.opts
        }];
      }
      $.each(args.td.values, function (i, value) {
        var id, obj, td = tuple(args, value);
        td.options.position = td.options.position ? toLatLng(td.options.position) : toLatLng(value.latLng);
        if (!map) {
          newMap(td.options.position);
        }
        obj = new defaults.classes.InfoWindow(td.options);
        if (obj && (isUndefined(td.open) || td.open)) {
          if (multiple) {
            obj.open(map, td.anchor || undef);
          } else {
            obj.open(map, td.anchor || (args.latLng ? undef : (args.session.marker ? args.session.marker : undef)));
          }
        }
        objs.push(obj);
        id = store.add({
          td: td
        }, "infowindow", obj);
        attachEvents($this, {
          td: td
        }, obj, id);
      });
      manageEnd(args, multiple ? objs : objs[0]);
    };

    /**
     * add a circle
     **/
    self.circle = function (args) {
      var objs = [],
          multiple = "values" in args.td;
      if (!multiple) {
        args.opts.center = args.latLng || toLatLng(args.opts.center);
        args.td.values = [{
          options: args.opts
        }];
      }
      if (!args.td.values.length) {
        manageEnd(args, false);
        return;
      }
      $.each(args.td.values, function (i, value) {
        var id, obj, td = tuple(args, value);
        td.options.center = td.options.center ? toLatLng(td.options.center) : toLatLng(value);
        if (!map) {
          newMap(td.options.center);
        }
        td.options.map = map;
        obj = new defaults.classes.Circle(td.options);
        objs.push(obj);
        id = store.add({
          td: td
        }, "circle", obj);
        attachEvents($this, {
          td: td
        }, obj, id);
      });
      manageEnd(args, multiple ? objs : objs[0]);
    };

    /**
     * returns address structure from latlng
     **/
    self.getaddress = function (args) {
      callback(args, args.results, args.status);
      task.ack();
    };

    /**
     * returns latlng from an address
     **/
    self.getlatlng = function (args) {
      callback(args, args.results, args.status);
      task.ack();
    };

    /**
     * return the max zoom of a location
     **/
    self.getmaxzoom = function (args) {
      maxZoomService().getMaxZoomAtLatLng(
      args.latLng, function (result) {
        callback(args, result.status === gm.MaxZoomStatus.OK ? result.zoom : false, status);
        task.ack();
      });
    };

    /**
     * return the elevation of a location
     **/
    self.getelevation = function (args) {
      var i, locations = [],
          f = function (results, status) {
          callback(args, status === gm.ElevationStatus.OK ? results : false, status);
          task.ack();
          };

      if (args.latLng) {
        locations.push(args.latLng);
      } else {
        locations = array(args.td.locations || []);
        for (i = 0; i < locations.length; i++) {
          locations[i] = toLatLng(locations[i]);
        }
      }
      if (locations.length) {
        elevationService().getElevationForLocations({
          locations: locations
        }, f);
      } else {
        if (args.td.path && args.td.path.length) {
          for (i = 0; i < args.td.path.length; i++) {
            locations.push(toLatLng(args.td.path[i]));
          }
        }
        if (locations.length) {
          elevationService().getElevationAlongPath({
            path: locations,
            samples: args.td.samples
          }, f);
        } else {
          task.ack();
        }
      }
    };

    /**
     * define defaults values
     **/
    self.defaults = function (args) {
      $.each(args.td, function (name, value) {
        if (isObject(defaults[name])) {
          defaults[name] = $.extend({}, defaults[name], value);
        } else {
          defaults[name] = value;
        }
      });
      task.ack(true);
    };

    /**
     * add a rectangle
     **/
    self.rectangle = function (args) {
      var objs = [],
          multiple = "values" in args.td;
      if (!multiple) {
        args.td.values = [{
          options: args.opts
        }];
      }
      if (!args.td.values.length) {
        manageEnd(args, false);
        return;
      }
      $.each(args.td.values, function (i, value) {
        var id, obj, td = tuple(args, value);
        td.options.bounds = td.options.bounds ? toLatLngBounds(td.options.bounds) : toLatLngBounds(value);
        if (!map) {
          newMap(td.options.bounds.getCenter());
        }
        td.options.map = map;

        obj = new defaults.classes.Rectangle(td.options);
        objs.push(obj);
        id = store.add({
          td: td
        }, "rectangle", obj);
        attachEvents($this, {
          td: td
        }, obj, id);
      });
      manageEnd(args, multiple ? objs : objs[0]);
    };

    /**
     * add a polygone / polyline
     **/

    function poly(args, poly, path) {
      var objs = [],
          multiple = "values" in args.td;
      if (!multiple) {
        args.td.values = [{
          options: args.opts
        }];
      }
      if (!args.td.values.length) {
        manageEnd(args, false);
        return;
      }
      newMap();
      $.each(args.td.values, function (_, value) {
        var id, i, j, obj, td = tuple(args, value);
        if (td.options[path]) {
          if (td.options[path][0][0] && isArray(td.options[path][0][0])) {
            for (i = 0; i < td.options[path].length; i++) {
              for (j = 0; j < td.options[path][i].length; j++) {
                td.options[path][i][j] = toLatLng(td.options[path][i][j]);
              }
            }
          } else {
            for (i = 0; i < td.options[path].length; i++) {
              td.options[path][i] = toLatLng(td.options[path][i]);
            }
          }
        }
        td.options.map = map;
        obj = new gm[poly](td.options);
        objs.push(obj);
        id = store.add({
          td: td
        }, poly.toLowerCase(), obj);
        attachEvents($this, {
          td: td
        }, obj, id);
      });
      manageEnd(args, multiple ? objs : objs[0]);
    }

    self.polyline = function (args) {
      poly(args, "Polyline", "path");
    };

    self.polygon = function (args) {
      poly(args, "Polygon", "paths");
    };

    /**
     * add a traffic layer
     **/
    self.trafficlayer = function (args) {
      newMap();
      var obj = store.get("trafficlayer");
      if (!obj) {
        obj = new defaults.classes.TrafficLayer();
        obj.setMap(map);
        store.add(args, "trafficlayer", obj);
      }
      manageEnd(args, obj);
    };

    /**
     * add a bicycling layer
     **/
    self.bicyclinglayer = function (args) {
      newMap();
      var obj = store.get("bicyclinglayer");
      if (!obj) {
        obj = new defaults.classes.BicyclingLayer();
        obj.setMap(map);
        store.add(args, "bicyclinglayer", obj);
      }
      manageEnd(args, obj);
    };

    /**
     * add a ground overlay
     **/
    self.groundoverlay = function (args) {
      args.opts.bounds = toLatLngBounds(args.opts.bounds);
      if (args.opts.bounds) {
        newMap(args.opts.bounds.getCenter());
      }
      var id, obj = new defaults.classes.GroundOverlay(args.opts.url, args.opts.bounds, args.opts.opts);
      obj.setMap(map);
      id = store.add(args, "groundoverlay", obj);
      manageEnd(args, obj, id);
    };

    /**
     * set a streetview
     **/
    self.streetviewpanorama = function (args) {
      if (!args.opts.opts) {
        args.opts.opts = {};
      }
      if (args.latLng) {
        args.opts.opts.position = args.latLng;
      } else if (args.opts.opts.position) {
        args.opts.opts.position = toLatLng(args.opts.opts.position);
      }
      if (args.td.divId) {
        args.opts.container = document.getElementById(args.td.divId);
      } else if (args.opts.container) {
        args.opts.container = $(args.opts.container).get(0);
      }
      var id, obj = new defaults.classes.StreetViewPanorama(args.opts.container, args.opts.opts);
      if (obj) {
        map.setStreetView(obj);
      }
      id = store.add(args, "streetviewpanorama", obj);
      manageEnd(args, obj, id);
    };

    self.kmllayer = function (args) {
      var objs = [],
          multiple = "values" in args.td;
      if (!multiple) {
        args.td.values = [{
          options: args.opts
        }];
      }
      if (!args.td.values.length) {
        manageEnd(args, false);
        return;
      }
      $.each(args.td.values, function (i, value) {
        var id, obj, options, td = tuple(args, value);
        if (!map) {
          newMap();
        }
        options = td.options;
        // compatibility 5.0-
        if (td.options.opts) {
          options = td.options.opts;
          if (td.options.url) {
            options.url = td.options.url;
          }
        }
        // -- end --
        options.map = map;
        if (googleVersionMin("3.10")) {
          obj = new defaults.classes.KmlLayer(options);
        } else {
          obj = new defaults.classes.KmlLayer(options.url, options);
        }
        objs.push(obj);
        id = store.add({
          td: td
        }, "kmllayer", obj);
        attachEvents($this, {
          td: td
        }, obj, id);
      });
      manageEnd(args, multiple ? objs : objs[0]);
    };

    /**
     * add a fix panel
     **/
    self.panel = function (args) {
      newMap();
      var id, $content, x = 0,
          y = 0,
          $div = $(document.createElement("div"));

      $div.css({
        position: "absolute",
        zIndex: 1000,
        visibility: "hidden"
      });

      if (args.opts.content) {
        $content = $(args.opts.content);
        $div.append($content);
        $this.first().prepend($div);

        if (!isUndefined(args.opts.left)) {
          x = args.opts.left;
        } else if (!isUndefined(args.opts.right)) {
          x = $this.width() - $content.width() - args.opts.right;
        } else if (args.opts.center) {
          x = ($this.width() - $content.width()) / 2;
        }

        if (!isUndefined(args.opts.top)) {
          y = args.opts.top;
        } else if (!isUndefined(args.opts.bottom)) {
          y = $this.height() - $content.height() - args.opts.bottom;
        } else if (args.opts.middle) {
          y = ($this.height() - $content.height()) / 2
        }

        $div.css({
          top: y,
          left: x,
          visibility: "visible"
        });
      }

      id = store.add(args, "panel", $div);
      manageEnd(args, $div, id);
      $div = null; // memory leak
    };

    /**
     * add a direction renderer
     **/
    self.directionsrenderer = function (args) {
      args.opts.map = map;
      var id, obj = new gm.DirectionsRenderer(args.opts);
      if (args.td.divId) {
        obj.setPanel(document.getElementById(args.td.divId));
      } else if (args.td.container) {
        obj.setPanel($(args.td.container).get(0));
      }
      id = store.add(args, "directionsrenderer", obj);
      manageEnd(args, obj, id);
    };

    /**
     * returns latLng of the user
     **/
    self.getgeoloc = function (args) {
      manageEnd(args, args.latLng);
    };

    /**
     * add a style
     **/
    self.styledmaptype = function (args) {
      newMap();
      var obj = new defaults.classes.StyledMapType(args.td.styles, args.opts);
      map.mapTypes.set(args.td.id, obj);
      manageEnd(args, obj);
    };

    /**
     * add an imageMapType
     **/
    self.imagemaptype = function (args) {
      newMap();
      var obj = new defaults.classes.ImageMapType(args.opts);
      map.mapTypes.set(args.td.id, obj);
      manageEnd(args, obj);
    };

    /**
     * autofit a map using its overlays (markers, rectangles ...)
     **/
    self.autofit = function (args) {
      var bounds = new gm.LatLngBounds();
      $.each(store.all(), function (i, obj) {
        if (obj.getPosition) {
          bounds.extend(obj.getPosition());
        } else if (obj.getBounds) {
          bounds.extend(obj.getBounds().getNorthEast());
          bounds.extend(obj.getBounds().getSouthWest());
        } else if (obj.getPaths) {
          obj.getPaths().forEach(function (path) {
            path.forEach(function (latLng) {
              bounds.extend(latLng);
            });
          });
        } else if (obj.getPath) {
          obj.getPath().forEach(function (latLng) {
            bounds.extend(latLng);
          });
        } else if (obj.getCenter) {
          bounds.extend(obj.getCenter());
        } else if (typeof Clusterer === "function" && obj instanceof Clusterer) {
          obj = store.getById(obj.id(), true);
          if (obj) {
            obj.autofit(bounds);
          }
        }
      });

      if (!bounds.isEmpty() && (!map.getBounds() || !map.getBounds().equals(bounds))) {
        if ("maxZoom" in args.td) {
          // fitBouds Callback event => detect zoom level and check maxZoom
          gm.event.addListenerOnce(
          map, "bounds_changed", function () {
            if (this.getZoom() > args.td.maxZoom) {
              this.setZoom(args.td.maxZoom);
            }
          });
        }
        map.fitBounds(bounds);
      }
      manageEnd(args, true);
    };

    /**
     * remove objects from a map
     **/
    self.clear = function (args) {
      if (isString(args.td)) {
        if (store.clearById(args.td) || store.objClearById(args.td)) {
          manageEnd(args, true);
          return;
        }
        args.td = {
          name: args.td
        };
      }
      if (args.td.id) {
        $.each(array(args.td.id), function (i, id) {
          store.clearById(id) || store.objClearById(id);
        });
      } else {
        store.clear(array(args.td.name), args.td.last, args.td.first, args.td.tag);
        store.objClear(array(args.td.name), args.td.last, args.td.first, args.td.tag);
      }
      manageEnd(args, true);
    };

    /**
     * return objects previously created
     **/
    self.get = function (args, direct, full) {
      var name, res, td = direct ? args : args.td;
      if (!direct) {
        full = td.full;
      }
      if (isString(td)) {
        res = store.getById(td, false, full) || store.objGetById(td);
        if (res === false) {
          name = td;
          td = {};
        }
      } else {
        name = td.name;
      }
      if (name === "map") {
        res = map;
      }
      if (!res) {
        res = [];
        if (td.id) {
          $.each(array(td.id), function (i, id) {
            res.push(store.getById(id, false, full) || store.objGetById(id));
          });
          if (!isArray(td.id)) {
            res = res[0];
          }
        } else {
          $.each(name ? array(name) : [undef], function (i, aName) {
            var result;
            if (td.first) {
              result = store.get(aName, false, td.tag, full);
              if (result) {
                res.push(result);
              }
            } else if (td.all) {
              $.each(store.all(aName, td.tag, full), function (i, result) {
                res.push(result);
              });
            } else {
              result = store.get(aName, true, td.tag, full);
              if (result) {
                res.push(result);
              }
            }
          });
          if (!td.all && !isArray(name)) {
            res = res[0];
          }
        }
      }
      res = isArray(res) || !td.all ? res : [res];
      if (direct) {
        return res;
      } else {
        manageEnd(args, res);
      }
    };

    /**
     * run a function on each items selected
     **/
    self.exec = function (args) {
      $.each(array(args.td.func), function (i, func) {
        $.each(self.get(args.td, true, args.td.hasOwnProperty("full") ? args.td.full : true), function (j, res) {
          func.call($this, res);
        });
      });
      manageEnd(args, true);
    };

    /**
     * trigger events on the map
     **/
    self.trigger = function (args) {
      if (isString(args.td)) {
        gm.event.trigger(map, args.td);
      } else {
        var options = [map, args.td.eventName];
        if (args.td.var_args) {
          $.each(args.td.var_args, function (i, v) {
            options.push(v);
          });
        }
        gm.event.trigger.apply(gm.event, options);
      }
      callback(args);
      task.ack();
    };
  }

  $.fn.gmap3 = function () {
    var i, list = [],
        empty = true,
        results = [];

    // init library
    initDefaults();

    // store all arguments in a td list
    for (i = 0; i < arguments.length; i++) {
      if (arguments[i]) {
        list.push(arguments[i]);
      }
    }

    // resolve empty call - run init
    if (!list.length) {
      list.push("map");
    }

    // loop on each jQuery object
    $.each(this, function () {
      var $this = $(this),
          gmap3 = $this.data("gmap3");
      empty = false;
      if (!gmap3) {
        gmap3 = new Gmap3($this);
        $this.data("gmap3", gmap3);
      }
      if (list.length === 1 && (list[0] === "get" || isDirectGet(list[0]))) {
        if (list[0] === "get") {
          results.push(gmap3.get("map", true));
        } else {
          results.push(gmap3.get(list[0].get, true, list[0].get.full));
        }
      } else {
        gmap3._plan(list);
      }
    });

    // return for direct call only
    if (results.length) {
      if (results.length === 1) { // 1 css selector
        return results[0];
      }
      return results;
    }

    return this;
  };
})(jQuery);
/*!
 * imagesLoaded PACKAGED v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

(function () {
  function e() {}
  function t(e, t) {
    for (var n = e.length; n--;) if (e[n].listener === t) return n;
    return -1
  }
  function n(e) {
    return function () {
      return this[e].apply(this, arguments)
    }
  }
  var i = e.prototype,
      r = this,
      o = r.EventEmitter;
  i.getListeners = function (e) {
    var t, n, i = this._getEvents();
    if ("object" == typeof e) {
      t = {};
      for (n in i) i.hasOwnProperty(n) && e.test(n) && (t[n] = i[n])
    } else t = i[e] || (i[e] = []);
    return t
  }, i.flattenListeners = function (e) {
    var t, n = [];
    for (t = 0; e.length > t; t += 1) n.push(e[t].listener);
    return n
  }, i.getListenersAsObject = function (e) {
    var t, n = this.getListeners(e);
    return n instanceof Array && (t = {}, t[e] = n), t || n
  }, i.addListener = function (e, n) {
    var i, r = this.getListenersAsObject(e),
        o = "object" == typeof n;
    for (i in r) r.hasOwnProperty(i) && -1 === t(r[i], n) && r[i].push(o ? n : {
      listener: n,
      once: !1
    });
    return this
  }, i.on = n("addListener"), i.addOnceListener = function (e, t) {
    return this.addListener(e, {
      listener: t,
      once: !0
    })
  }, i.once = n("addOnceListener"), i.defineEvent = function (e) {
    return this.getListeners(e), this
  }, i.defineEvents = function (e) {
    for (var t = 0; e.length > t; t += 1) this.defineEvent(e[t]);
    return this
  }, i.removeListener = function (e, n) {
    var i, r, o = this.getListenersAsObject(e);
    for (r in o) o.hasOwnProperty(r) && (i = t(o[r], n), -1 !== i && o[r].splice(i, 1));
    return this
  }, i.off = n("removeListener"), i.addListeners = function (e, t) {
    return this.manipulateListeners(!1, e, t)
  }, i.removeListeners = function (e, t) {
    return this.manipulateListeners(!0, e, t)
  }, i.manipulateListeners = function (e, t, n) {
    var i, r, o = e ? this.removeListener : this.addListener,
        s = e ? this.removeListeners : this.addListeners;
    if ("object" != typeof t || t instanceof RegExp) for (i = n.length; i--;) o.call(this, t, n[i]);
    else for (i in t) t.hasOwnProperty(i) && (r = t[i]) && ("function" == typeof r ? o.call(this, i, r) : s.call(this, i, r));
    return this
  }, i.removeEvent = function (e) {
    var t, n = typeof e,
        i = this._getEvents();
    if ("string" === n) delete i[e];
    else if ("object" === n) for (t in i) i.hasOwnProperty(t) && e.test(t) && delete i[t];
    else delete this._events;
    return this
  }, i.removeAllListeners = n("removeEvent"), i.emitEvent = function (e, t) {
    var n, i, r, o, s = this.getListenersAsObject(e);
    for (r in s) if (s.hasOwnProperty(r)) for (i = s[r].length; i--;) n = s[r][i], n.once === !0 && this.removeListener(e, n.listener), o = n.listener.apply(this, t || []), o === this._getOnceReturnValue() && this.removeListener(e, n.listener);
    return this
  }, i.trigger = n("emitEvent"), i.emit = function (e) {
    var t = Array.prototype.slice.call(arguments, 1);
    return this.emitEvent(e, t)
  }, i.setOnceReturnValue = function (e) {
    return this._onceReturnValue = e, this
  }, i._getOnceReturnValue = function () {
    return this.hasOwnProperty("_onceReturnValue") ? this._onceReturnValue : !0
  }, i._getEvents = function () {
    return this._events || (this._events = {})
  }, e.noConflict = function () {
    return r.EventEmitter = o, e
  }, "function" == typeof define && define.amd ? define("eventEmitter/EventEmitter", [], function () {
    return e
  }) : "object" == typeof module && module.exports ? module.exports = e : this.EventEmitter = e
}).call(this), function (e) {
  function t(t) {
    var n = e.event;
    return n.target = n.target || n.srcElement || t, n
  }
  var n = document.documentElement,
      i = function () {};
  n.addEventListener ? i = function (e, t, n) {
    e.addEventListener(t, n, !1)
  } : n.attachEvent && (i = function (e, n, i) {
    e[n + i] = i.handleEvent ?
    function () {
      var n = t(e);
      i.handleEvent.call(i, n)
    } : function () {
      var n = t(e);
      i.call(e, n)
    }, e.attachEvent("on" + n, e[n + i])
  });
  var r = function () {};
  n.removeEventListener ? r = function (e, t, n) {
    e.removeEventListener(t, n, !1)
  } : n.detachEvent && (r = function (e, t, n) {
    e.detachEvent("on" + t, e[t + n]);
    try {
      delete e[t + n]
    } catch (i) {
      e[t + n] = void 0
    }
  });
  var o = {
    bind: i,
    unbind: r
  };
  "function" == typeof define && define.amd ? define("eventie/eventie", o) : e.eventie = o
}(this), function (e, t) {
  "function" == typeof define && define.amd ? define(["eventEmitter/EventEmitter", "eventie/eventie"], function (n, i) {
    return t(e, n, i)
  }) : "object" == typeof exports ? module.exports = t(e, require("wolfy87-eventemitter"), require("eventie")) : e.imagesLoaded = t(e, e.EventEmitter, e.eventie)
}(window, function (e, t, n) {
  function i(e, t) {
    for (var n in t) e[n] = t[n];
    return e
  }
  function r(e) {
    return "[object Array]" === d.call(e)
  }
  function o(e) {
    var t = [];
    if (r(e)) t = e;
    else if ("number" == typeof e.length) for (var n = 0, i = e.length; i > n; n++) t.push(e[n]);
    else t.push(e);
    return t
  }
  function s(e, t, n) {
    if (!(this instanceof s)) return new s(e, t);
    "string" == typeof e && (e = document.querySelectorAll(e)), this.elements = o(e), this.options = i({}, this.options), "function" == typeof t ? n = t : i(this.options, t), n && this.on("always", n), this.getImages(), a && (this.jqDeferred = new a.Deferred);
    var r = this;
    setTimeout(function () {
      r.check()
    })
  }
  function f(e) {
    this.img = e
  }
  function c(e) {
    this.src = e, v[e] = this
  }
  var a = e.jQuery,
      u = e.console,
      h = u !== void 0,
      d = Object.prototype.toString;
  s.prototype = new t, s.prototype.options = {}, s.prototype.getImages = function () {
    this.images = [];
    for (var e = 0, t = this.elements.length; t > e; e++) {
      var n = this.elements[e];
      "IMG" === n.nodeName && this.addImage(n);
      var i = n.nodeType;
      if (i && (1 === i || 9 === i || 11 === i)) for (var r = n.querySelectorAll("img"), o = 0, s = r.length; s > o; o++) {
        var f = r[o];
        this.addImage(f)
      }
    }
  }, s.prototype.addImage = function (e) {
    var t = new f(e);
    this.images.push(t)
  }, s.prototype.check = function () {
    function e(e, r) {
      return t.options.debug && h && u.log("confirm", e, r), t.progress(e), n++, n === i && t.complete(), !0
    }
    var t = this,
        n = 0,
        i = this.images.length;
    if (this.hasAnyBroken = !1, !i) return this.complete(), void 0;
    for (var r = 0; i > r; r++) {
      var o = this.images[r];
      o.on("confirm", e), o.check()
    }
  }, s.prototype.progress = function (e) {
    this.hasAnyBroken = this.hasAnyBroken || !e.isLoaded;
    var t = this;
    setTimeout(function () {
      t.emit("progress", t, e), t.jqDeferred && t.jqDeferred.notify && t.jqDeferred.notify(t, e)
    })
  }, s.prototype.complete = function () {
    var e = this.hasAnyBroken ? "fail" : "done";
    this.isComplete = !0;
    var t = this;
    setTimeout(function () {
      if (t.emit(e, t), t.emit("always", t), t.jqDeferred) {
        var n = t.hasAnyBroken ? "reject" : "resolve";
        t.jqDeferred[n](t)
      }
    })
  }, a && (a.fn.imagesLoaded = function (e, t) {
    var n = new s(this, e, t);
    return n.jqDeferred.promise(a(this))
  }), f.prototype = new t, f.prototype.check = function () {
    var e = v[this.img.src] || new c(this.img.src);
    if (e.isConfirmed) return this.confirm(e.isLoaded, "cached was confirmed"), void 0;
    if (this.img.complete && void 0 !== this.img.naturalWidth) return this.confirm(0 !== this.img.naturalWidth, "naturalWidth"), void 0;
    var t = this;
    e.on("confirm", function (e, n) {
      return t.confirm(e.isLoaded, n), !0
    }), e.check()
  }, f.prototype.confirm = function (e, t) {
    this.isLoaded = e, this.emit("confirm", this, t)
  };
  var v = {};
  return c.prototype = new t, c.prototype.check = function () {
    if (!this.isChecked) {
      var e = new Image;
      n.bind(e, "load", this), n.bind(e, "error", this), e.src = this.src, this.isChecked = !0
    }
  }, c.prototype.handleEvent = function (e) {
    var t = "on" + e.type;
    this[t] && this[t](e)
  }, c.prototype.onload = function (e) {
    this.confirm(!0, "onload"), this.unbindProxyEvents(e)
  }, c.prototype.onerror = function (e) {
    this.confirm(!1, "onerror"), this.unbindProxyEvents(e)
  }, c.prototype.confirm = function (e, t) {
    this.isConfirmed = !0, this.isLoaded = e, this.emit("confirm", this, t)
  }, c.prototype.unbindProxyEvents = function (e) {
    n.unbind(e.target, "load", this), n.unbind(e.target, "error", this)
  }, s
});
/* Infinite Scroll
from here: https://github.com/clockworkgeek/infinite-scroll - it is a fork of the original
added localStorage history so it will try and regenerate on back in browser
 */
(function (p, i, k) {
  i.infinitescroll = function A(F, H, G) {
    this.element = i(G);
    if (!this._create(F, H)) {
      this.failed = true
    }
  };
  i.infinitescroll.defaults = {
    loading: {
      finished: k,
      finishedMsg: "<em>Congratulations, you've reached the end of the internet.</em>",
      img: "data:image/gif;base64,R0lGODlh3AATAPQeAPDy+MnQ6LW/4N3h8MzT6rjC4sTM5r/I5NHX7N7j8c7U6tvg8OLl8uXo9Ojr9b3G5MfP6Ovu9tPZ7PT1+vX2+tbb7vf4+8/W69jd7rC73vn5/O/x+K243ai02////wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQECgD/ACwAAAAA3AATAAAF/6AnjmRpnmiqrmzrvnAsz3Rt33iu73zv/8CgcEj0BAScpHLJbDqf0Kh0Sq1ar9isdioItAKGw+MAKYMFhbF63CW438f0mg1R2O8EuXj/aOPtaHx7fn96goR4hmuId4qDdX95c4+RBIGCB4yAjpmQhZN0YGYGXitdZBIVGAsLoq4BBKQDswm1CQRkcG6ytrYKubq8vbfAcMK9v7q7EMO1ycrHvsW6zcTKsczNz8HZw9vG3cjTsMIYqQkCLBwHCgsMDQ4RDAYIqfYSFxDxEfz88/X38Onr16+Bp4ADCco7eC8hQYMAEe57yNCew4IVBU7EGNDiRn8Z831cGLHhSIgdFf9chIeBg7oA7gjaWUWTVQAGE3LqBDCTlc9WOHfm7PkTqNCh54rePDqB6M+lR536hCpUqs2gVZM+xbrTqtGoWqdy1emValeXKzggYBBB5y1acFNZmEvXAoN2cGfJrTv3bl69Ffj2xZt3L1+/fw3XRVw4sGDGcR0fJhxZsF3KtBTThZxZ8mLMgC3fRatCbYMNFCzwLEqLgE4NsDWs/tvqdezZf13Hvk2A9Szdu2X3pg18N+68xXn7rh1c+PLksI/Dhe6cuO3ow3NfV92bdArTqC2Ebd3A8vjf5QWfH6Bg7Nz17c2fj69+fnq+8N2Lty+fuP78/eV2X13neIcCeBRwxorbZrA1ANoCDGrgoG8RTshahQ9iSKEEzUmYIYfNWViUhheCGJyIP5E4oom7WWjgCeBFAJNv1DVV01MAdJhhjdkplWNzO/5oXI846njjVEIqR2OS2B1pE5PVscajkxhMycqLJghQSwT40PgfAl4GqNSXYdZXJn5gSkmmmmJu1aZYb14V51do+pTOCmA40AqVCIhG5IJ9PvYnhIFOxmdqhpaI6GeHCtpooisuutmg+Eg62KOMKuqoTaXgicQWoIYq6qiklmoqFV0UoeqqrLbq6quwxirrrLTWauutJ4QAACH5BAUKABwALAcABADOAAsAAAX/IPd0D2dyRCoUp/k8gpHOKtseR9yiSmGbuBykler9XLAhkbDavXTL5k2oqFqNOxzUZPU5YYZd1XsD72rZpBjbeh52mSNnMSC8lwblKZGwi+0QfIJ8CncnCoCDgoVnBHmKfByGJimPkIwtiAeBkH6ZHJaKmCeVnKKTHIihg5KNq4uoqmEtcRUtEREMBggtEr4QDrjCuRC8h7/BwxENeicSF8DKy82pyNLMOxzWygzFmdvD2L3P0dze4+Xh1Arkyepi7dfFvvTtLQkZBC0T/FX3CRgCMOBHsJ+EHYQY7OinAGECgQsB+Lu3AOK+CewcWjwxQeJBihtNGHSoQOE+iQ3//4XkwBBhRZMcUS6YSXOAwIL8PGqEaSJCiYt9SNoCmnJPAgUVLChdaoFBURN8MAzl2PQphwQLfDFd6lTowglHve6rKpbjhK7/pG5VinZP1qkiz1rl4+tr2LRwWU64cFEihwEtZgbgR1UiHaMVvxpOSwBA37kzGz9e8G+B5MIEKLutOGEsAH2ATQwYfTmuX8aETWdGPZmiZcccNSzeTCA1Sw0bdiitC7LBWgu8jQr8HRzqgpK6gX88QbrB14z/kF+ELpwB8eVQj/JkqdylAudji/+ts3039vEEfK8Vz2dlvxZKG0CmbkKDBvllRd6fCzDvBLKBDSCeffhRJEFebFk1k/Mv9jVIoIJZSeBggwUaNeB+Qk34IE0cXlihcfRxkOAJFFhwGmKlmWDiakZhUJtnLBpnWWcnKaAZcxI0piFGGLBm1mc90kajSCveeBVWKeYEoU2wqeaQi0PetoE+rr14EpVC7oAbAUHqhYExbn2XHHsVqbcVew9tx8+XJKk5AZsqqdlddGpqAKdbAYBn1pcczmSTdWvdmZ17c1b3FZ99vnTdCRFM8OEcAhLwm1NdXnWcBBSMRWmfkWZqVlsmLIiAp/o1gGV2vpS4lalGYsUOqXrddcKCmK61aZ8SjEpUpVFVoCpTj4r661Km7kBHjrDyc1RAIQAAIfkEBQoAGwAsBwAEAM4ACwAABf/gtmUCd4goQQgFKj6PYKi0yrrbc8i4ohQt12EHcal+MNSQiCP8gigdz7iCioaCIvUmZLp8QBzW0EN2vSlCuDtFKaq4RyHzQLEKZNdiQDhRDVooCwkbfm59EAmKi4SGIm+AjIsKjhsqB4mSjT2IOIOUnICeCaB/mZKFNTSRmqVpmJqklSqskq6PfYYCDwYHDC4REQwGCBLGxxIQDsHMwhAIX8bKzcENgSLGF9PU1j3Sy9zX2NrgzQziChLk1BHWxcjf7N046tvN82715czn9Pryz6Ilc4ACj4EBOCZM8KEnAYYADBRKnACAYUMFv1wotIhCEcaJCisqwJFgAUSQGyX/kCSVUUTIdKMwJlyo0oXHlhskwrTJciZHEXsgaqS4s6PJiCAr1uzYU8kBBSgnWFqpoMJMUjGtDmUwkmfVmVypakWhEKvXsS4nhLW5wNjVroJIoc05wSzTr0PtiigpYe4EC2vj4iWrFu5euWIMRBhacaVJhYQBEFjA9jHjyQ0xEABwGceGAZYjY0YBOrRLCxUp29QM+bRkx5s7ZyYgVbTqwwti2ybJ+vLtDYpycyZbYOlptxdx0kV+V7lC5iJAyyRrwYKxAdiz82ng0/jnAdMJFz0cPi104Ec1Vj9/M6F173vKL/feXv156dw11tlqeMMnv4V5Ap53GmjQQH97nFfg+IFiucfgRX5Z8KAgbUlQ4IULIlghhhdOSB6AgX0IVn8eReghen3NRIBsRgnH4l4LuEidZBjwRpt6NM5WGwoW0KSjCwX6yJSMab2GwwAPDXfaBCtWpluRTQqC5JM5oUZAjUNS+VeOLWpJEQ7VYQANW0INJSZVDFSnZphjSikfmzE5N4EEbQI1QJmnWXCmHulRp2edwDXF43txukenJwvI9xyg9Q26Z3MzGUcBYFEChZh6DVTq34AU8Iflh51Sd+CnKFYQ6mmZkhqfBKfSxZWqA9DZanWjxmhrWwi0qtCrt/43K6WqVjjpmhIqgEGvculaGKklKstAACEAACH5BAUKABwALAcABADOAAsAAAX/ICdyQmaMYyAUqPgIBiHPxNpy79kqRXH8wAPsRmDdXpAWgWdEIYm2llCHqjVHU+jjJkwqBTecwItShMXkEfNWSh8e1NGAcLgpDGlRgk7EJ/6Ae3VKfoF/fDuFhohVeDeCfXkcCQqDVQcQhn+VNDOYmpSWaoqBlUSfmowjEA+iEAEGDRGztAwGCDcXEA60tXEiCrq8vREMEBLIyRLCxMWSHMzExnbRvQ2Sy7vN0zvVtNfU2tLY3rPgLdnDvca4VQS/Cpk3ABwSLQkYAQwT/P309vcI7OvXr94jBQMJ/nskkGA/BQBRLNDncAIAiDcG6LsxAWOLiQzmeURBKWSLCQbv/1F0eDGinJUKR47YY1IEgQASKk7Yc7ACRwZm7mHweRJoz59BJUogisKCUaFMR0x4SlJBVBFTk8pZivTR0K73rN5wqlXEAq5Fy3IYgHbEzQ0nLy4QSoCjXLoom96VOJEeCosK5n4kkFfqXjl94wa+l1gvAcGICbewAOAxY8l/Ky/QhAGz4cUkGxu2HNozhwMGBnCUqUdBg9UuW9eUynqSwLHIBujePef1ZGQZXcM+OFuEBeBhi3OYgLyqcuaxbT9vLkf4SeqyWxSQpKGB2gQpm1KdWbu72rPRzR9Ne2Nu9Kzr/1Jqj0yD/fvqP4aXOt5sW/5qsXXVcv1Nsp8IBUAmgswGF3llGgeU1YVXXKTN1FlhWFXW3gIE+DVChApysACHHo7Q4A35lLichh+ROBmLKAzgYmYEYDAhCgxKGOOMn4WR4kkDaoBBOxJtdNKQxFmg5JIWIBnQc07GaORfUY4AEkdV6jHlCEISSZ5yTXpp1pbGZbkWmcuZmQCaE6iJ0FhjMaDjTMsgZaNEHFRAQVp3bqXnZED1qYcECOz5V6BhSWCoVJQIKuKQi2KFKEkEFAqoAo7uYSmO3jk61wUUMKmknJ4SGimBmAa0qVQBhAAAIfkEBQoAGwAsBwAEAM4ACwAABf/gJm5FmRlEqhJC+bywgK5pO4rHI0D3pii22+Mg6/0Ej96weCMAk7cDkXf7lZTTnrMl7eaYoy10JN0ZFdco0XAuvKI6qkgVFJXYNwjkIBcNBgR8TQoGfRsJCRuCYYQQiI+ICosiCoGOkIiKfSl8mJkHZ4U9kZMbKaI3pKGXmJKrngmug4WwkhA0lrCBWgYFCCMQFwoQDRHGxwwGCBLMzRLEx8iGzMMO0cYNeCMKzBDW19lnF9DXDIY/48Xg093f0Q3s1dcR8OLe8+Y91OTv5wrj7o7B+7VNQqABIoRVCMBggsOHE36kSoCBIcSH3EbFangxogJYFi8CkJhqQciLJEf/LDDJEeJIBT0GsOwYUYJGBS0fjpQAMidGmyVP6sx4Y6VQhzs9VUwkwqaCCh0tmKoFtSMDmBOf9phg4SrVrROuasRQAaxXpVUhdsU6IsECZlvX3kwLUWzRt0BHOLTbNlbZG3vZinArge5Dvn7wbqtQkSYAAgtKmnSsYKVKo2AfW048uaPmG386i4Q8EQMBAIAnfB7xBxBqvapJ9zX9WgRS2YMpnvYMGdPK3aMjt/3dUcNI4blpj7iwkMFWDXDvSmgAlijrt9RTR78+PS6z1uAJZIe93Q8g5zcsWCi/4Y+C8bah5zUv3vv89uft30QP23punGCx5954oBBwnwYaNCDY/wYrsYeggnM9B2Fpf8GG2CEUVWhbWAtGouEGDy7Y4IEJVrbSiXghqGKIo7z1IVcXIkKWWR361QOLWWnIhwERpLaaCCee5iMBGJQmJGyPFTnbkfHVZGRtIGrg5HALEJAZbu39BuUEUmq1JJQIPtZilY5hGeSWsSk52G9XqsmgljdIcABytq13HyIM6RcUA+r1qZ4EBF3WHWB29tBgAzRhEGhig8KmqKFv8SeCeo+mgsF7YFXa1qWSbkDpom/mqR1PmHCqJ3fwNRVXjC7S6CZhFVCQ2lWvZiirhQq42SACt25IK2hv8TprriUV1usGgeka7LFcNmCldMLi6qZMgFLgpw16Cipb7bC1knXsBiEAACH5BAUKABsALAcABADOAAsAAAX/4FZsJPkUmUGsLCEUTywXglFuSg7fW1xAvNWLF6sFFcPb42C8EZCj24EJdCp2yoegWsolS0Uu6fmamg8n8YYcLU2bXSiRaXMGvqV6/KAeJAh8VgZqCX+BexCFioWAYgqNi4qAR4ORhRuHY408jAeUhAmYYiuVlpiflqGZa5CWkzc5fKmbbhIpsAoQDRG8vQwQCBLCwxK6vb5qwhfGxxENahvCEA7NzskSy7vNzzzK09W/PNHF1NvX2dXcN8K55cfh69Luveol3vO8zwi4Yhj+AQwmCBw4IYclDAAJDlQggVOChAoLKkgFkSCAHDwWLKhIEOONARsDKryogFPIiAUb/95gJNIiw4wnI778GFPhzBKFOAq8qLJEhQpiNArjMcHCmlTCUDIouTKBhApELSxFWiGiVKY4E2CAekPgUphDu0742nRrVLJZnyrFSqKQ2ohoSYAMW6IoDpNJ4bLdILTnAj8KUF7UeENjAKuDyxIgOuGiOI0EBBMgLNew5AUrDTMGsFixwBIaNCQuAXJB57qNJ2OWm2Aj4skwCQCIyNkhhtMkdsIuodE0AN4LJDRgfLPtn5YDLdBlraAByuUbBgxQwICxMOnYpVOPej074OFdlfc0TqC62OIbcppHjV4o+LrieWhfT8JC/I/T6W8oCl29vQ0XjLdBaA3s1RcPBO7lFvpX8BVoG4O5jTXRQRDuJ6FDTzEWF1/BCZhgbyAKE9qICYLloQYOFtahVRsWYlZ4KQJHlwHS/IYaZ6sZd9tmu5HQm2xi1UaTbzxYwJk/wBF5g5EEYOBZeEfGZmNdFyFZmZIR4jikbLThlh5kUUVJGmRT7sekkziRWUIACABk3T4qCsedgO4xhgGcY7q5pHJ4klBBTQRJ0CeHcoYHHUh6wgfdn9uJdSdMiebGJ0zUPTcoS286FCkrZxnYoYYKWLkBowhQoBeaOlZAgVhLidrXqg2GiqpQpZ4apwSwRtjqrB3muoF9BboaXKmshlqWqsWiGt2wphJkQbAU5hoCACH5BAUKABsALAcABADOAAsAAAX/oGFw2WZuT5oZROsSQnGaKjRvilI893MItlNOJ5v5gDcFrHhKIWcEYu/xFEqNv6B1N62aclysF7fsZYe5aOx2yL5aAUGSaT1oTYMBwQ5VGCAJgYIJCnx1gIOBhXdwiIl7d0p2iYGQUAQBjoOFSQR/lIQHnZ+Ue6OagqYzSqSJi5eTpTxGcjcSChANEbu8DBAIEsHBChe5vL13G7fFuscRDcnKuM3H0La3EA7Oz8kKEsXazr7Cw9/Gztar5uHHvte47MjktznZ2w0G1+D3BgirAqJmJMAQgMGEgwgn5Ei0gKDBhBMALGRYEOJBb5QcWlQo4cbAihZz3GgIMqFEBSM1/4ZEOWPAgpIIJXYU+PIhRG8ja1qU6VHlzZknJNQ6UanCjQkWCIGSUGEjAwVLjc44+DTqUQtPPS5gejUrTa5TJ3g9sWCr1BNUWZI161StiQUDmLYdGfesibQ3XMq1OPYthrwuA2yU2LBs2cBHIypYQPPlYAKFD5cVvNPtW8eVGbdcQADATsiNO4cFAPkvHpedPzc8kUcPgNGgZ5RNDZG05reoE9s2vSEP79MEGiQGy1qP8LA4ZcdtsJE48ONoLTBtTV0B9LsTnPceoIDBDQvS7W7vfjVY3q3eZ4A339J4eaAmKqU/sV58HvJh2RcnIBsDUw0ABqhBA5aV5V9XUFGiHfVeAiWwoFgJJrIXRH1tEMiDFV4oHoAEGlaWhgIGSGBO2nFomYY3mKjVglidaNYJGJDkWW2xxTfbjCbVaOGNqoX2GloR8ZeTaECS9pthRGJH2g0b3Agbk6hNANtteHD2GJUucfajCQBy5OOTQ25ZgUPvaVVQmbKh9510/qQpwXx3SQdfk8tZJOd5b6JJFplT3ZnmmX3qd5l1eg5q00HrtUkUn0AKaiGjClSAgKLYZcgWXwocGRcCFGCKwSB6ceqphwmYRUFYT/1WKlOdUpipmxW0mlCqHjYkAaeoZlqrqZ4qd+upQKaapn/AmgAegZ8KUtYtFAQQAgAh+QQFCgAbACwHAAQAzgALAAAF/+C2PUcmiCiZGUTrEkKBis8jQEquKwU5HyXIbEPgyX7BYa5wTNmEMwWsSXsqFbEh8DYs9mrgGjdK6GkPY5GOeU6ryz7UFopSQEzygOGhJBjoIgMDBAcBM0V/CYqLCQqFOwobiYyKjn2TlI6GKC2YjJZknouaZAcQlJUHl6eooJwKooobqoewrJSEmyKdt59NhRKFMxLEEA4RyMkMEAjDEhfGycqAG8TQx9IRDRDE3d3R2ctD1RLg0ttKEnbY5wZD3+zJ6M7X2RHi9Oby7u/r9g38UFjTh2xZJBEBMDAboogAgwkQI07IMUORwocSJwCgWDFBAIwZOaJIsOBjRogKJP8wTODw5ESVHVtm3AhzpEeQElOuNDlTZ0ycEUWKWFASqEahGwYUPbnxoAgEdlYSqDBkgoUNClAlIHbSAoOsqCRQnQHxq1axVb06FWFxLIqyaze0Tft1JVqyE+pWXMD1pF6bYl3+HTqAWNW8cRUFzmih0ZAAB2oGKukSAAGGRHWJgLiR6AylBLpuHKKUMlMCngMpDSAa9QIUggZVVvDaJobLeC3XZpvgNgCmtPcuwP3WgmXSq4do0DC6o2/guzcseECtUoO0hmcsGKDgOt7ssBd07wqesAIGZC1YIBa7PQHvb1+SFo+++HrJSQfB33xfav3i5eX3Hnb4CTJgegEq8tH/YQEOcIJzbm2G2EoYRLgBXFpVmFYDcREV4HIcnmUhiGBRouEMJGJGzHIspqgdXxK0yCKHRNXoIX4uorCdTyjkyNtdPWrA4Up82EbAbzMRxxZRR54WXVLDIRmRcag5d2R6ugl3ZXzNhTecchpMhIGVAKAYpgJjjsSklBEd99maZoo535ZvdamjBEpusJyctg3h4X8XqodBMx0tiNeg/oGJaKGABpogS40KSqiaEgBqlQWLUtqoVQnytekEjzo0hHqhRorppOZt2p923M2AAV+oBtpAnnPNoB6HaU6mAAIU+IXmi3j2mtFXuUoHKwXpzVrsjcgGOauKEjQrwq157hitGq2NoWmjh7z6Wmxb0m5w66+2VRAuXN/yFUAIACH5BAUKABsALAcABADOAAsAAAX/4CZuRiaM45MZqBgIRbs9AqTcuFLE7VHLOh7KB5ERdjJaEaU4ClO/lgKWjKKcMiJQ8KgumcieVdQMD8cbBeuAkkC6LYLhOxoQ2PF5Ys9PKPBMen17f0CCg4VSh32JV4t8jSNqEIOEgJKPlkYBlJWRInKdiJdkmQlvKAsLBxdABA4RsbIMBggtEhcQsLKxDBC2TAS6vLENdJLDxMZAubu8vjIbzcQRtMzJz79S08oQEt/guNiyy7fcvMbh4OezdAvGrakLAQwyABsELQkY9BP+//ckyPDD4J9BfAMh1GsBoImMeQUN+lMgUJ9CiRMa5msxoB9Gh/o8GmxYMZXIgxtR/yQ46S/gQAURR0pDwYDfywoyLPip5AdnCwsMFPBU4BPFhKBDi444quCmDKZOfwZ9KEGpCKgcN1jdALSpPqIYsabS+nSqvqplvYqQYAeDPgwKwjaMtiDl0oaqUAyo+3TuWwUAMPpVCfee0cEjVBGQq2ABx7oTWmQk4FglZMGN9fGVDMCuiH2AOVOu/PmyxM630gwM0CCn6q8LjVJ8GXvpa5Uwn95OTC/nNxkda1/dLSK475IjCD6dHbK1ZOa4hXP9DXs5chJ00UpVm5xo2qRpoxptwF2E4/IbJpB/SDz9+q9b1aNfQH08+p4a8uvX8B53fLP+ycAfemjsRUBgp1H20K+BghHgVgt1GXZXZpZ5lt4ECjxYR4ScUWiShEtZqBiIInRGWnERNnjiBglw+JyGnxUmGowsyiiZg189lNtPGACjV2+S9UjbU0JWF6SPvEk3QZEqsZYTk3UAaRSUnznJI5LmESCdBVSyaOWUWLK4I5gDUYVeV1T9l+FZClCAUVA09uSmRHBCKAECFEhW51ht6rnmWBXkaR+NjuHpJ40D3DmnQXt2F+ihZxlqVKOfQRACACH5BAUKABwALAcABADOAAsAAAX/ICdyUCkUo/g8mUG8MCGkKgspeC6j6XEIEBpBUeCNfECaglBcOVfJFK7YQwZHQ6JRZBUqTrSuVEuD3nI45pYjFuWKvjjSkCoRaBUMWxkwBGgJCXspQ36Bh4EEB0oKhoiBgyNLjo8Ki4QElIiWfJqHnISNEI+Ql5J9o6SgkqKkgqYihamPkW6oNBgSfiMMDQkGCBLCwxIQDhHIyQwQCGMKxsnKVyPCF9DREQ3MxMPX0cu4wt7J2uHWx9jlKd3o39MiuefYEcvNkuLt5O8c1ePI2tyELXGQwoGDAQf+iEC2xByDCRAjTlAgIUWCBRgCPJQ4AQBFXAs0coT40WLIjRxL/47AcHLkxIomRXL0CHPERZkpa4q4iVKiyp0tR/7kwHMkTUBBJR5dOCEBAVcKKtCAyOHpowXCpk7goABqBZdcvWploACpBKkpIJI1q5OD2rIWE0R1uTZu1LFwbWL9OlKuWb4c6+o9i3dEgw0RCGDUG9KlRw56gDY2qmCByZBaASi+TACA0TucAaTteCcy0ZuOK3N2vJlx58+LRQyY3Xm0ZsgjZg+oPQLi7dUcNXi0LOJw1pgNtB7XG6CBy+U75SYfPTSQAgZTNUDnQHt67wnbZyvwLgKiMN3oCZB3C76tdewpLFgIP2C88rbi4Y+QT3+8S5USMICZXWj1pkEDeUU3lOYGB3alSoEiMIjgX4WlgNF2EibIwQIXauWXSRg2SAOHIU5IIIMoZkhhWiJaiFVbKo6AQEgQXrTAazO1JhkBrBG3Y2Y6EsUhaGn95hprSN0oWpFE7rhkeaQBchGOEWnwEmc0uKWZj0LeuNV3W4Y2lZHFlQCSRjTIl8uZ+kG5HU/3sRlnTG2ytyadytnD3HrmuRcSn+0h1dycexIK1KCjYaCnjCCVqOFFJTZ5GkUUjESWaUIKU2lgCmAKKQIUjHapXRKE+t2og1VgankNYnohqKJ2CmKplso6GKz7WYCgqxeuyoF8u9IQAgA7",
      msg: null,
      msgText: "<em>Loading the next set of posts...</em>",
      selector: null,
      speed: "fast",
      start: k
    },
    state: {
      isDuringAjax: false,
      isInvalidPage: false,
      isDestroyed: false,
      isDone: false,
      isPaused: false,
      isBeyondMaxPage: false,
      currPage: 1
    },
    debug: false,
    behavior: k,
    binder: i(p),
    nextSelector: "div.navigation a:first",
    navSelector: "div.navigation",
    contentSelector: null,
    extraScrollPx: 150,
    itemSelector: "div.post",
    animate: false,
    pathParse: k,
    dataType: "html",
    appendCallback: true,
    bufferPx: 40,
    errorCallback: function () {},
    infid: 0,
    pixelsFromNavToBottom: k,
    path: k,
    prefill: false,
    maxPage: k
  };
  i.infinitescroll.prototype = {
    _binding: function g(H) {
      var F = this,
          G = F.options;
      G.v = "2.0b2.120520";
      if ( !! G.behavior && this["_binding_" + G.behavior] !== k) {
        this["_binding_" + G.behavior].call(this);
        return
      }
      if (H !== "bind" && H !== "unbind") {
        this._debug("Binding value  " + H + " not valid");
        return false
      }
      if (H === "unbind") {
        (this.options.binder).unbind("smartscroll.infscr." + F.options.infid)
      } else {
        (this.options.binder)[H]("smartscroll.infscr." + F.options.infid, function () {
          F.scroll()
        })
      }
      this._debug("Binding", H)
    },
    _create: function u(H, L) {
      var I = i.extend(true, {}, i.infinitescroll.defaults, H);
      this.options = I;
      var K = i(p);
      var F = this;
      if (!F._validate(H)) {
        return false
      }
      var J = i(I.nextSelector).attr("href");
      if (!J) {
        this._debug("Navigation selector not found");
        return false
      }
      I.path = I.path || this._determinepath(J);
      I.contentSelector = I.contentSelector || this.element;
      I.loading.selector = I.loading.selector || I.contentSelector;
      I.loading.msg = I.loading.msg || i('<div id="infscr-loading"><img alt="Loading..." src="' + I.loading.img + '" /><div>' + I.loading.msgText + "</div></div>");
      (new Image()).src = I.loading.img;
      if (I.pixelsFromNavToBottom === k) {
        I.pixelsFromNavToBottom = i(document).height() - i(I.navSelector).offset().top;
        this._debug("pixelsFromNavToBottom: " + I.pixelsFromNavToBottom)
      }
      var G = this;
      I.loading.start = I.loading.start ||
      function () {
        i(I.navSelector).hide();
        I.loading.msg.appendTo(I.loading.selector).show(I.loading.speed, i.proxy(function () {
          this.beginAjax(I)
        }, G))
      };
      I.loading.finished = I.loading.finished ||
      function () {
        if (!I.state.isBeyondMaxPage) {
          I.loading.msg.fadeOut(I.loading.speed)
        }
      };
      I.callback = function (M, O, N) {
        if ( !! I.behavior && M["_callback_" + I.behavior] !== k) {
          M["_callback_" + I.behavior].call(i(I.contentSelector)[0], O, N)
        }
        if (L) {
          L.call(i(I.contentSelector)[0], O, I, N)
        }
        if (I.prefill) {
          K.bind("resize.infinite-scroll", M._prefill)
        }
      };
      if (H.debug) {
        if (Function.prototype.bind && (typeof console === "object" || typeof console === "function") && typeof console.log === "object") {
          ["log", "info", "warn", "error", "assert", "dir", "clear", "profile", "profileEnd"].forEach(function (M) {
            console[M] = this.call(console[M], console)
          }, Function.prototype.bind)
        }
      }
      this._setup();
      if (I.prefill) {
        this._prefill()
      }
      return true
    },
    _prefill: function n() {
      var F = this;
      var H = i(p);

      function G() {
        return (F.options.contentSelector.height() <= H.height())
      }
      this._prefill = function () {
        if (G()) {
          F.scroll()
        }
        H.bind("resize.infinite-scroll", function () {
          if (G()) {
            H.unbind("resize.infinite-scroll");
            F.scroll()
          }
        })
      };
      this._prefill()
    },
    _debug: function r() {
      if (true !== this.options.debug) {
        return
      }
      if (typeof console !== "undefined" && typeof console.log === "function") {
        if ((Array.prototype.slice.call(arguments)).length === 1 && typeof Array.prototype.slice.call(arguments)[0] === "string") {
          console.log((Array.prototype.slice.call(arguments)).toString())
        } else {
          console.log(Array.prototype.slice.call(arguments))
        }
      } else {
        if (!Function.prototype.bind && typeof console !== "undefined" && typeof console.log === "object") {
          Function.prototype.call.call(console.log, console, Array.prototype.slice.call(arguments))
        }
      }
    },
    _determinepath: function C(G) {
      var F = this.options;
      if ( !! F.behavior && this["_determinepath_" + F.behavior] !== k) {
        return this["_determinepath_" + F.behavior].call(this, G)
      }
      if ( !! F.pathParse) {
        this._debug("pathParse manual");
        return F.pathParse(G, this.options.state.currPage + 1)
      } else {
        if (G.match(/^(.*?)\b2\b(.*?$)/)) {
          G = G.match(/^(.*?)\b2\b(.*?$)/).slice(1)
        } else {
          if (G.match(/^(.*?)2(.*?$)/)) {
            if (G.match(/^(.*?page=)2(\/.*|$)/)) {
              G = G.match(/^(.*?page=)2(\/.*|$)/).slice(1);
              return G
            }
            G = G.match(/^(.*?)2(.*?$)/).slice(1)
          } else {
            if (G.match(/^(.*?page=)1(\/.*|$)/)) {
              G = G.match(/^(.*?page=)1(\/.*|$)/).slice(1);
              return G
            } else {
              this._debug("Sorry, we couldn't parse your Next (Previous Posts) URL. Verify your the css selector points to the correct A tag. If you still get this error: yell, scream, and kindly ask for help at infinite-scroll.com.");
              F.state.isInvalidPage = true
            }
          }
        }
      }
      this._debug("determinePath", G);
      return G
    },
    _error: function w(G) {
      var F = this.options;
      if ( !! F.behavior && this["_error_" + F.behavior] !== k) {
        this["_error_" + F.behavior].call(this, G);
        return
      }
      if (G !== "destroy" && G !== "end") {
        G = "unknown"
      }
      this._debug("Error", G);
      if (G === "end" || F.state.isBeyondMaxPage) {
        this._showdonemsg()
      }
      F.state.isDone = true;
      F.state.currPage = 1;
      F.state.isPaused = false;
      F.state.isBeyondMaxPage = false;
      this._binding("unbind")
    },
    _cache: function q(F, G) {
      if (p.sessionStorage) {
        sessionStorage.setItem("infscr::" + F, G)
      }
    },
    _loadcallback: function c(J, I, G) {
      var F = this.options,
          L = this.options.callback,
          N = (F.state.isDone) ? "done" : (!F.appendCallback) ? "no-append" : "append",
          M;
      if ( !! F.behavior && this["_loadcallback_" + F.behavior] !== k) {
        this["_loadcallback_" + F.behavior].call(this, J, I);
        return
      }
      switch (N) {
      case "done":
        this._showdonemsg();
        return false;
      case "no-append":
        if (F.dataType === "html") {
          I = "<div>" + I + "</div>";
          I = i(I).find(F.itemSelector)
        }
        break;
      case "append":
        var H = J.children();
        if (H.length === 0) {
          return this._error("end")
        }
        M = document.createDocumentFragment();
        while (J[0].firstChild) {
          M.appendChild(J[0].firstChild)
        }
        this._debug("contentSelector", i(F.contentSelector)[0]);
        i(F.contentSelector)[0].appendChild(M);
        I = H.get();
        break
      }
      F.loading.finished.call(i(F.contentSelector)[0], F);
      if (F.animate) {
        var K = i(p).scrollTop() + i(F.loading.msg).height() + F.extraScrollPx + "px";
        i("html,body").animate({
          scrollTop: K
        }, 800, function () {
          F.state.isDuringAjax = false
        })
      }
      if (!F.animate) {
        F.state.isDuringAjax = false
      }
      L(this, I, G);
      if (F.prefill) {
        this._prefill()
      }
    },
    _nearbottom: function v() {
      var G = this.options,
          F = 0 + i(document).height() - (G.binder.scrollTop()) - i(p).height();
      if ( !! G.behavior && this["_nearbottom_" + G.behavior] !== k) {
        return this["_nearbottom_" + G.behavior].call(this)
      }
      this._debug("math:", F, G.pixelsFromNavToBottom);
      return (F - G.bufferPx < G.pixelsFromNavToBottom)
    },
    _pausing: function l(G) {
      var F = this.options;
      if ( !! F.behavior && this["_pausing_" + F.behavior] !== k) {
        this["_pausing_" + F.behavior].call(this, G);
        return
      }
      if (G !== "pause" && G !== "resume" && G !== null) {
        this._debug("Invalid argument. Toggling pause value instead")
      }
      G = (G && (G === "pause" || G === "resume")) ? G : "toggle";
      switch (G) {
      case "pause":
        F.state.isPaused = true;
        break;
      case "resume":
        F.state.isPaused = false;
        break;
      case "toggle":
        F.state.isPaused = !F.state.isPaused;
        break
      }
      this._debug("Paused", F.state.isPaused);
      return false
    },
    _setup: function s() {
      var F = this.options;
      if ( !! F.behavior && this["_setup_" + F.behavior] !== k) {
        this["_setup_" + F.behavior].call(this);
        return
      }
      this._binding("bind");
      this.restore();
      return false
    },
    _showdonemsg: function a() {
      var F = this.options;
      if ( !! F.behavior && this["_showdonemsg_" + F.behavior] !== k) {
        this["_showdonemsg_" + F.behavior].call(this);
        return
      }
      F.loading.msg.find("img").hide().parent().find("div").html(F.loading.finishedMsg).animate({
        opacity: 1
      }, 2000, function () {
        i(this).parent().fadeOut(F.loading.speed)
      });
      F.errorCallback.call(i(F.contentSelector)[0], "done")
    },
    _validate: function x(G) {
      for (var F in G) {
        if (F.indexOf && F.indexOf("Selector") > -1 && i(G[F]).length === 0) {
          this._debug("Your " + F + " found no elements.");
          return false
        }
      }
      return true
    },
    bind: function o() {
      this._binding("bind")
    },
    destroy: function E() {
      this.options.state.isDestroyed = true;
      this.options.loading.finished();
      return this._error("destroy")
    },
    pause: function e() {
      this._pausing("pause")
    },
    resume: function h() {
      this._pausing("resume")
    },
    beginAjax: function D(I) {
      var G = this,
          K = I.path,
          H, F, M, L;
      I.state.currPage++;
      if (I.maxPage != k && I.state.currPage > I.maxPage) {
        I.state.isBeyondMaxPage = true;
        this.destroy();
        return
      }
      H = i(I.contentSelector).is("table, tbody") ? i("<tbody/>") : i("<div/>");
      F = (typeof K === "function") ? K(I.state.currPage) : K.join(I.state.currPage);
      G._debug("heading into ajax", F);
      M = (I.dataType === "html" || I.dataType === "json") ? I.dataType : "html+callback";
      if (I.appendCallback && I.dataType === "html") {
        M += "+callback"
      }
      switch (M) {
      case "html+callback":
        G._debug("Using HTML via .load() method");
        H.load(F + " " + I.itemSelector, k, function J(N) {
          G._loadcallback(H, N, F);
          G._cache(F, N)
        });
        break;
      case "html":
        G._debug("Using " + (M.toUpperCase()) + " via $.ajax() method");
        i.ajax({
          url: F,
          dataType: I.dataType,
          complete: function J(N, O) {
            L = (typeof(N.isResolved) !== "undefined") ? (N.isResolved()) : (O === "success" || O === "notmodified");
            if (L) {
              G._loadcallback(H, N.responseText, F);
              G._cache(destUrl, N.responseText)
            } else {
              G._error("end")
            }
          }
        });
        break;
      case "json":
        G._debug("Using " + (M.toUpperCase()) + " via $.ajax() method");
        i.ajax({
          dataType: "json",
          type: "GET",
          url: F,
          success: function (P, Q, O) {
            L = (typeof(O.isResolved) !== "undefined") ? (O.isResolved()) : (Q === "success" || Q === "notmodified");
            if (I.appendCallback) {
              if (I.template !== k) {
                var N = I.template(P);
                H.append(N);
                if (L) {
                  G._loadcallback(H, N);
                  G._cache(F, O.responseText)
                } else {
                  G._error("end")
                }
              } else {
                G._debug("template must be defined.");
                G._error("end")
              }
            } else {
              if (L) {
                G._loadcallback(H, P, F);
                G._cache(F, O.responseText)
              } else {
                G._error("end")
              }
            }
          },
          error: function () {
            G._debug("JSON ajax request failed.");
            G._error("end")
          }
        });
        break
      }
    },
    restore: function B() {
      var J = this.options;
      if (!p.sessionStorage || !! J.behavior || J.state.isDestroyed) {
        return
      }
      var G = this,
          L = J.path,
          I, F, M, K;
      F = (typeof L === "function") ? L(J.state.currPage + 1) : L.join(J.state.currPage + 1);
      K = sessionStorage.getItem("infscr::" + F);
      if (!K) {
        G._debug("sessionStorage does not have " + F);
        return
      }
      J.state.currPage++;
      if (J.maxPage != k && J.state.currPage > J.maxPage) {
        J.state.isBeyondMaxPage = true;
        this.destroy();
        return
      }
      I = i(J.contentSelector).is("table, tbody") ? i("<tbody/>") : i("<div/>");
      M = (J.dataType === "html" || J.dataType === "json") ? J.dataType : "html+callback";
      if (J.appendCallback && J.dataType === "html") {
        M += "+callback"
      }
      switch (M) {
      case "html":
      case "html+callback":
        G._debug("Using HTML from sessionStorage (" + F + ")");
        I.html(!J.itemSelector ? K : i("<div>").append(i(K)).find(J.itemSelector));
        this._loadcallback(I, K, F);
        break;
      case "json":
        G._debug("Using JSON from sessionStorage (" + F + ")");
        if (J.appendCallback) {
          if (J.template !== k) {
            var H = J.template(JSON.parse(K));
            I.append(H);
            G._loadcallback(I, H, F)
          } else {
            G._debug("template must be defined.");
            G._error("end")
          }
        } else {
          G._loadcallback(I, JSON.parse(K), F)
        }
        break
      }
      G.restore()
    },
    retrieve: function b(H) {
      H = H || null;
      var F = this,
          G = F.options;
      if ( !! G.behavior && this["retrieve_" + G.behavior] !== k) {
        this["retrieve_" + G.behavior].call(this, H);
        return
      }
      if (G.state.isDestroyed) {
        this._debug("Instance is destroyed");
        return false
      }
      G.state.isDuringAjax = true;
      G.loading.start.call(i(G.contentSelector)[0], G)
    },
    scroll: function f() {
      var F = this.options,
          G = F.state;
      if ( !! F.behavior && this["scroll_" + F.behavior] !== k) {
        this["scroll_" + F.behavior].call(this);
        return
      }
      if (G.isDuringAjax || G.isInvalidPage || G.isDone || G.isDestroyed || G.isPaused) {
        return
      }
      if (!this._nearbottom()) {
        return
      }
      this.retrieve()
    },
    toggle: function z() {
      this._pausing()
    },
    unbind: function m() {
      this._binding("unbind")
    },
    update: function j(F) {
      if (i.isPlainObject(F)) {
        this.options = i.extend(true, this.options, F)
      }
    }
  };
  i.fn.infinitescroll = function d(H, I) {
    var G = typeof H;
    switch (G) {
    case "string":
      var F = Array.prototype.slice.call(arguments, 1);
      this.each(function () {
        var J = i.data(this, "infinitescroll");
        if (!J) {
          return false
        }
        if (!i.isFunction(J[H]) || H.charAt(0) === "_") {
          return false
        }
        J[H].apply(J, F)
      });
      break;
    case "object":
      this.each(function () {
        var J = i.data(this, "infinitescroll");
        if (J) {
          J.update(H)
        } else {
          J = new i.infinitescroll(H, I, this);
          if (!J.failed) {
            i.data(this, "infinitescroll", J)
          }
        }
      });
      break
    }
    return this
  };
  var y = i.event,
      t;
  y.special.smartscroll = {
    setup: function () {
      i(this).bind("scroll", y.special.smartscroll.handler)
    },
    teardown: function () {
      i(this).unbind("scroll", y.special.smartscroll.handler)
    },
    handler: function (I, F) {
      var H = this,
          G = arguments;
      I.type = "smartscroll";
      if (t) {
        clearTimeout(t)
      }
      t = setTimeout(function () {
        i(H).trigger("smartscroll", G)
      }, F === "execAsap" ? 0 : 100)
    }
  };
  i.fn.smartscroll = function (F) {
    return F ? this.bind("smartscroll", F) : this.trigger("smartscroll", ["execAsap"])
  }
})(window, jQuery);
/*!
 * Isotope PACKAGED v2.1.0
 * Filter & sort magical layouts
 * http://isotope.metafizzy.co
 */

/**
 * Bridget makes jQuery widgets
 * v1.1.0
 * MIT license
 */

(function (window) {



  // -------------------------- utils -------------------------- //
  var slice = Array.prototype.slice;

  function noop() {}

  // -------------------------- definition -------------------------- //

  function defineBridget($) {

    // bail if no jQuery
    if (!$) {
      return;
    }

    // -------------------------- addOptionMethod -------------------------- //
    /**
     * adds option method -> $().plugin('option', {...})
     * @param {Function} PluginClass - constructor class
     */

    function addOptionMethod(PluginClass) {
      // don't overwrite original option method
      if (PluginClass.prototype.option) {
        return;
      }

      // option setter
      PluginClass.prototype.option = function (opts) {
        // bail out if not an object
        if (!$.isPlainObject(opts)) {
          return;
        }
        this.options = $.extend(true, this.options, opts);
      };
    }

    // -------------------------- plugin bridge -------------------------- //
    // helper function for logging errors
    // $.error breaks jQuery chaining
    var logError = typeof console === 'undefined' ? noop : function (message) {
      console.error(message);
    };

    /**
     * jQuery plugin bridge, access methods like $elem.plugin('method')
     * @param {String} namespace - plugin name
     * @param {Function} PluginClass - constructor class
     */

    function bridge(namespace, PluginClass) {
      // add to jQuery fn namespace
      $.fn[namespace] = function (options) {
        if (typeof options === 'string') {
          // call plugin method when first argument is a string
          // get arguments for method
          var args = slice.call(arguments, 1);

          for (var i = 0, len = this.length; i < len; i++) {
            var elem = this[i];
            var instance = $.data(elem, namespace);
            if (!instance) {
              logError("cannot call methods on " + namespace + " prior to initialization; " + "attempted to call '" + options + "'");
              continue;
            }
            if (!$.isFunction(instance[options]) || options.charAt(0) === '_') {
              logError("no such method '" + options + "' for " + namespace + " instance");
              continue;
            }

            // trigger method with arguments
            var returnValue = instance[options].apply(instance, args);

            // break look and return first value if provided
            if (returnValue !== undefined) {
              return returnValue;
            }
          }
          // return this if no return value
          return this;
        } else {
          return this.each(function () {
            var instance = $.data(this, namespace);
            if (instance) {
              // apply options & init
              instance.option(options);
              instance._init();
            } else {
              // initialize new instance
              instance = new PluginClass(this, options);
              $.data(this, namespace, instance);
            }
          });
        }
      };

    }

    // -------------------------- bridget -------------------------- //
    /**
     * converts a Prototypical class into a proper jQuery plugin
     *   the class must have a ._init method
     * @param {String} namespace - plugin name, used in $().pluginName
     * @param {Function} PluginClass - constructor class
     */
    $.bridget = function (namespace, PluginClass) {
      addOptionMethod(PluginClass);
      bridge(namespace, PluginClass);
    };

    return $.bridget;

  }

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('jquery-bridget/jquery.bridget', ['jquery'], defineBridget);
  } else if (typeof exports === 'object') {
    defineBridget(require('jquery'));
  } else {
    // get jquery from browser global
    defineBridget(window.jQuery);
  }

})(window);

/*!
 * eventie v1.0.5
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false, module: false */

(function (window) {



  var docElem = document.documentElement;

  var bind = function () {};

  function getIEEvent(obj) {
    var event = window.event;
    // add event.target
    event.target = event.target || event.srcElement || obj;
    return event;
  }

  if (docElem.addEventListener) {
    bind = function (obj, type, fn) {
      obj.addEventListener(type, fn, false);
    };
  } else if (docElem.attachEvent) {
    bind = function (obj, type, fn) {
      obj[type + fn] = fn.handleEvent ?
      function () {
        var event = getIEEvent(obj);
        fn.handleEvent.call(fn, event);
      } : function () {
        var event = getIEEvent(obj);
        fn.call(obj, event);
      };
      obj.attachEvent("on" + type, obj[type + fn]);
    };
  }

  var unbind = function () {};

  if (docElem.removeEventListener) {
    unbind = function (obj, type, fn) {
      obj.removeEventListener(type, fn, false);
    };
  } else if (docElem.detachEvent) {
    unbind = function (obj, type, fn) {
      obj.detachEvent("on" + type, obj[type + fn]);
      try {
        delete obj[type + fn];
      } catch (err) {
        // can't delete window object properties
        obj[type + fn] = undefined;
      }
    };
  }

  var eventie = {
    bind: bind,
    unbind: unbind
  };

  // ----- module definition ----- //
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('eventie/eventie', eventie);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = eventie;
  } else {
    // browser global
    window.eventie = eventie;
  }

})(this);

/*!
 * docReady v1.0.4
 * Cross browser DOMContentLoaded event emitter
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true*/
/*global define: false, require: false, module: false */

(function (window) {



  var document = window.document;
  // collection of functions to be triggered on ready
  var queue = [];

  function docReady(fn) {
    // throw out non-functions
    if (typeof fn !== 'function') {
      return;
    }

    if (docReady.isReady) {
      // ready now, hit it
      fn();
    } else {
      // queue function when ready
      queue.push(fn);
    }
  }

  docReady.isReady = false;

  // triggered on various doc ready events


  function onReady(event) {
    // bail if already triggered or IE8 document is not ready just yet
    var isIE8NotReady = event.type === 'readystatechange' && document.readyState !== 'complete';
    if (docReady.isReady || isIE8NotReady) {
      return;
    }

    trigger();
  }

  function trigger() {
    docReady.isReady = true;
    // process queue
    for (var i = 0, len = queue.length; i < len; i++) {
      var fn = queue[i];
      fn();
    }
  }

  function defineDocReady(eventie) {
    // trigger ready if page is ready
    if (document.readyState === 'complete') {
      trigger();
    } else {
      // listen for events
      eventie.bind(document, 'DOMContentLoaded', onReady);
      eventie.bind(document, 'readystatechange', onReady);
      eventie.bind(window, 'load', onReady);
    }

    return docReady;
  }

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('doc-ready/doc-ready', ['eventie/eventie'], defineDocReady);
  } else if (typeof exports === 'object') {
    module.exports = defineDocReady(require('eventie'));
  } else {
    // browser global
    window.docReady = defineDocReady(window.eventie);
  }

})(window);

/*!
 * EventEmitter v4.2.9 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function () {


  /**
   * Class for managing events.
   * Can be extended to provide event functionality in other classes.
   *
   * @class EventEmitter Manages event registering and emitting.
   */

  function EventEmitter() {}

  // Shortcuts to improve speed and size
  var proto = EventEmitter.prototype;
  var exports = this;
  var originalGlobalValue = exports.EventEmitter;

  /**
   * Finds the index of the listener for the event in its storage array.
   *
   * @param {Function[]} listeners Array of listeners to search through.
   * @param {Function} listener Method to look for.
   * @return {Number} Index of the specified listener, -1 if not found
   * @api private
   */

  function indexOfListener(listeners, listener) {
    var i = listeners.length;
    while (i--) {
      if (listeners[i].listener === listener) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Alias a method while keeping the context correct, to allow for overwriting of target method.
   *
   * @param {String} name The name of the target method.
   * @return {Function} The aliased method
   * @api private
   */

  function alias(name) {
    return function aliasClosure() {
      return this[name].apply(this, arguments);
    };
  }

  /**
   * Returns the listener array for the specified event.
   * Will initialise the event object and listener arrays if required.
   * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
   * Each property in the object response is an array of listener functions.
   *
   * @param {String|RegExp} evt Name of the event to return the listeners from.
   * @return {Function[]|Object} All listener functions for the event.
   */
  proto.getListeners = function getListeners(evt) {
    var events = this._getEvents();
    var response;
    var key;

    // Return a concatenated array of all matching events if
    // the selector is a regular expression.
    if (evt instanceof RegExp) {
      response = {};
      for (key in events) {
        if (events.hasOwnProperty(key) && evt.test(key)) {
          response[key] = events[key];
        }
      }
    }
    else {
      response = events[evt] || (events[evt] = []);
    }

    return response;
  };

  /**
   * Takes a list of listener objects and flattens it into a list of listener functions.
   *
   * @param {Object[]} listeners Raw listener objects.
   * @return {Function[]} Just the listener functions.
   */
  proto.flattenListeners = function flattenListeners(listeners) {
    var flatListeners = [];
    var i;

    for (i = 0; i < listeners.length; i += 1) {
      flatListeners.push(listeners[i].listener);
    }

    return flatListeners;
  };

  /**
   * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
   *
   * @param {String|RegExp} evt Name of the event to return the listeners from.
   * @return {Object} All listener functions for an event in an object.
   */
  proto.getListenersAsObject = function getListenersAsObject(evt) {
    var listeners = this.getListeners(evt);
    var response;

    if (listeners instanceof Array) {
      response = {};
      response[evt] = listeners;
    }

    return response || listeners;
  };

  /**
   * Adds a listener function to the specified event.
   * The listener will not be added if it is a duplicate.
   * If the listener returns true then it will be removed after it is called.
   * If you pass a regular expression as the event name then the listener will be added to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to attach the listener to.
   * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.addListener = function addListener(evt, listener) {
    var listeners = this.getListenersAsObject(evt);
    var listenerIsWrapped = typeof listener === 'object';
    var key;

    for (key in listeners) {
      if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
        listeners[key].push(listenerIsWrapped ? listener : {
          listener: listener,
          once: false
        });
      }
    }

    return this;
  };

  /**
   * Alias of addListener
   */
  proto.on = alias('addListener');

  /**
   * Semi-alias of addListener. It will add a listener that will be
   * automatically removed after its first execution.
   *
   * @param {String|RegExp} evt Name of the event to attach the listener to.
   * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.addOnceListener = function addOnceListener(evt, listener) {
    return this.addListener(evt, {
      listener: listener,
      once: true
    });
  };

  /**
   * Alias of addOnceListener.
   */
  proto.once = alias('addOnceListener');

  /**
   * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
   * You need to tell it what event names should be matched by a regex.
   *
   * @param {String} evt Name of the event to create.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.defineEvent = function defineEvent(evt) {
    this.getListeners(evt);
    return this;
  };

  /**
   * Uses defineEvent to define multiple events.
   *
   * @param {String[]} evts An array of event names to define.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.defineEvents = function defineEvents(evts) {
    for (var i = 0; i < evts.length; i += 1) {
      this.defineEvent(evts[i]);
    }
    return this;
  };

  /**
   * Removes a listener function from the specified event.
   * When passed a regular expression as the event name, it will remove the listener from all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to remove the listener from.
   * @param {Function} listener Method to remove from the event.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.removeListener = function removeListener(evt, listener) {
    var listeners = this.getListenersAsObject(evt);
    var index;
    var key;

    for (key in listeners) {
      if (listeners.hasOwnProperty(key)) {
        index = indexOfListener(listeners[key], listener);

        if (index !== -1) {
          listeners[key].splice(index, 1);
        }
      }
    }

    return this;
  };

  /**
   * Alias of removeListener
   */
  proto.off = alias('removeListener');

  /**
   * Adds listeners in bulk using the manipulateListeners method.
   * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
   * You can also pass it a regular expression to add the array of listeners to all events that match it.
   * Yeah, this function does quite a bit. That's probably a bad thing.
   *
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to add.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.addListeners = function addListeners(evt, listeners) {
    // Pass through to manipulateListeners
    return this.manipulateListeners(false, evt, listeners);
  };

  /**
   * Removes listeners in bulk using the manipulateListeners method.
   * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
   * You can also pass it an event name and an array of listeners to be removed.
   * You can also pass it a regular expression to remove the listeners from all events that match it.
   *
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to remove.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.removeListeners = function removeListeners(evt, listeners) {
    // Pass through to manipulateListeners
    return this.manipulateListeners(true, evt, listeners);
  };

  /**
   * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
   * The first argument will determine if the listeners are removed (true) or added (false).
   * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
   * You can also pass it an event name and an array of listeners to be added/removed.
   * You can also pass it a regular expression to manipulate the listeners of all events that match it.
   *
   * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
    var i;
    var value;
    var single = remove ? this.removeListener : this.addListener;
    var multiple = remove ? this.removeListeners : this.addListeners;

    // If evt is an object then pass each of its properties to this method
    if (typeof evt === 'object' && !(evt instanceof RegExp)) {
      for (i in evt) {
        if (evt.hasOwnProperty(i) && (value = evt[i])) {
          // Pass the single listener straight through to the singular method
          if (typeof value === 'function') {
            single.call(this, i, value);
          }
          else {
            // Otherwise pass back to the multiple function
            multiple.call(this, i, value);
          }
        }
      }
    }
    else {
      // So evt must be a string
      // And listeners must be an array of listeners
      // Loop over it and pass each one to the multiple method
      i = listeners.length;
      while (i--) {
        single.call(this, evt, listeners[i]);
      }
    }

    return this;
  };

  /**
   * Removes all listeners from a specified event.
   * If you do not specify an event then all listeners will be removed.
   * That means every event will be emptied.
   * You can also pass a regex to remove all events that match it.
   *
   * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.removeEvent = function removeEvent(evt) {
    var type = typeof evt;
    var events = this._getEvents();
    var key;

    // Remove different things depending on the state of evt
    if (type === 'string') {
      // Remove all listeners for the specified event
      delete events[evt];
    }
    else if (evt instanceof RegExp) {
      // Remove all events matching the regex.
      for (key in events) {
        if (events.hasOwnProperty(key) && evt.test(key)) {
          delete events[key];
        }
      }
    }
    else {
      // Remove all listeners in all events
      delete this._events;
    }

    return this;
  };

  /**
   * Alias of removeEvent.
   *
   * Added to mirror the node API.
   */
  proto.removeAllListeners = alias('removeEvent');

  /**
   * Emits an event of your choice.
   * When emitted, every listener attached to that event will be executed.
   * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
   * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
   * So they will not arrive within the array on the other side, they will be separate.
   * You can also pass a regular expression to emit to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
   * @param {Array} [args] Optional array of arguments to be passed to each listener.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.emitEvent = function emitEvent(evt, args) {
    var listeners = this.getListenersAsObject(evt);
    var listener;
    var i;
    var key;
    var response;

    for (key in listeners) {
      if (listeners.hasOwnProperty(key)) {
        i = listeners[key].length;

        while (i--) {
          // If the listener returns true then it shall be removed from the event
          // The function is executed either with a basic call or an apply if there is an args array
          listener = listeners[key][i];

          if (listener.once === true) {
            this.removeListener(evt, listener.listener);
          }

          response = listener.listener.apply(this, args || []);

          if (response === this._getOnceReturnValue()) {
            this.removeListener(evt, listener.listener);
          }
        }
      }
    }

    return this;
  };

  /**
   * Alias of emitEvent
   */
  proto.trigger = alias('emitEvent');

  /**
   * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
   * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
   * @param {...*} Optional additional arguments to be passed to each listener.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.emit = function emit(evt) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.emitEvent(evt, args);
  };

  /**
   * Sets the current value to check against when executing listeners. If a
   * listeners return value matches the one set here then it will be removed
   * after execution. This value defaults to true.
   *
   * @param {*} value The new value to check for when executing listeners.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  proto.setOnceReturnValue = function setOnceReturnValue(value) {
    this._onceReturnValue = value;
    return this;
  };

  /**
   * Fetches the current value to check against when executing listeners. If
   * the listeners return value matches this one then it should be removed
   * automatically. It will return true by default.
   *
   * @return {*|Boolean} The current value to check for or the default, true.
   * @api private
   */
  proto._getOnceReturnValue = function _getOnceReturnValue() {
    if (this.hasOwnProperty('_onceReturnValue')) {
      return this._onceReturnValue;
    }
    else {
      return true;
    }
  };

  /**
   * Fetches the events object and creates one if required.
   *
   * @return {Object} The events storage object.
   * @api private
   */
  proto._getEvents = function _getEvents() {
    return this._events || (this._events = {});
  };

  /**
   * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
   *
   * @return {Function} Non conflicting EventEmitter class.
   */
  EventEmitter.noConflict = function noConflict() {
    exports.EventEmitter = originalGlobalValue;
    return EventEmitter;
  };

  // Expose the class either via AMD, CommonJS or the global object
  if (typeof define === 'function' && define.amd) {
    define('eventEmitter/EventEmitter', [], function () {
      return EventEmitter;
    });
  }
  else if (typeof module === 'object' && module.exports) {
    module.exports = EventEmitter;
  }
  else {
    exports.EventEmitter = EventEmitter;
  }
}.call(this));

/*!
 * getStyleProperty v1.0.4
 * original by kangax
 * http://perfectionkills.com/feature-testing-css-properties/
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false, exports: false, module: false */

(function (window) {



  var prefixes = 'Webkit Moz ms Ms O'.split(' ');
  var docElemStyle = document.documentElement.style;

  function getStyleProperty(propName) {
    if (!propName) {
      return;
    }

    // test standard property first
    if (typeof docElemStyle[propName] === 'string') {
      return propName;
    }

    // capitalize
    propName = propName.charAt(0).toUpperCase() + propName.slice(1);

    // test vendor specific properties
    var prefixed;
    for (var i = 0, len = prefixes.length; i < len; i++) {
      prefixed = prefixes[i] + propName;
      if (typeof docElemStyle[prefixed] === 'string') {
        return prefixed;
      }
    }
  }

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('get-style-property/get-style-property', [], function () {
      return getStyleProperty;
    });
  } else if (typeof exports === 'object') {
    // CommonJS for Component
    module.exports = getStyleProperty;
  } else {
    // browser global
    window.getStyleProperty = getStyleProperty;
  }

})(window);

/*!
 * getSize v1.2.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, exports: false, require: false, module: false, console: false */

(function (window, undefined) {



  // -------------------------- helpers -------------------------- //
  // get a number from a string, not a percentage


  function getStyleSize(value) {
    var num = parseFloat(value);
    // not a percent like '100%', and a number
    var isValid = value.indexOf('%') === -1 && !isNaN(num);
    return isValid && num;
  }

  function noop() {}

  var logError = typeof console === 'undefined' ? noop : function (message) {
    console.error(message);
  };

  // -------------------------- measurements -------------------------- //
  var measurements = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth'];

  function getZeroSize() {
    var size = {
      width: 0,
      height: 0,
      innerWidth: 0,
      innerHeight: 0,
      outerWidth: 0,
      outerHeight: 0
    };
    for (var i = 0, len = measurements.length; i < len; i++) {
      var measurement = measurements[i];
      size[measurement] = 0;
    }
    return size;
  }



  function defineGetSize(getStyleProperty) {

    // -------------------------- setup -------------------------- //
    var isSetup = false;

    var getStyle, boxSizingProp, isBoxSizeOuter;

    /**
     * setup vars and functions
     * do it on initial getSize(), rather than on script load
     * For Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=548397
     */

    function setup() {
      // setup once
      if (isSetup) {
        return;
      }
      isSetup = true;

      var getComputedStyle = window.getComputedStyle;
      getStyle = (function () {
        var getStyleFn = getComputedStyle ?
        function (elem) {
          return getComputedStyle(elem, null);
        } : function (elem) {
          return elem.currentStyle;
        };

        return function getStyle(elem) {
          var style = getStyleFn(elem);
          if (!style) {
            logError('Style returned ' + style + '. Are you running this code in a hidden iframe on Firefox? ' + 'See http://bit.ly/getsizebug1');
          }
          return style;
        };
      })();

      // -------------------------- box sizing -------------------------- //
      boxSizingProp = getStyleProperty('boxSizing');

      /**
       * WebKit measures the outer-width on style.width on border-box elems
       * IE & Firefox measures the inner-width
       */
      if (boxSizingProp) {
        var div = document.createElement('div');
        div.style.width = '200px';
        div.style.padding = '1px 2px 3px 4px';
        div.style.borderStyle = 'solid';
        div.style.borderWidth = '1px 2px 3px 4px';
        div.style[boxSizingProp] = 'border-box';

        var body = document.body || document.documentElement;
        body.appendChild(div);
        var style = getStyle(div);

        isBoxSizeOuter = getStyleSize(style.width) === 200;
        body.removeChild(div);
      }

    }

    // -------------------------- getSize -------------------------- //

    function getSize(elem) {
      setup();

      // use querySeletor if elem is string
      if (typeof elem === 'string') {
        elem = document.querySelector(elem);
      }

      // do not proceed on non-objects
      if (!elem || typeof elem !== 'object' || !elem.nodeType) {
        return;
      }

      var style = getStyle(elem);

      // if hidden, everything is 0
      if (style.display === 'none') {
        return getZeroSize();
      }

      var size = {};
      size.width = elem.offsetWidth;
      size.height = elem.offsetHeight;

      var isBorderBox = size.isBorderBox = !! (boxSizingProp && style[boxSizingProp] && style[boxSizingProp] === 'border-box');

      // get all measurements
      for (var i = 0, len = measurements.length; i < len; i++) {
        var measurement = measurements[i];
        var value = style[measurement];
        value = mungeNonPixel(elem, value);
        var num = parseFloat(value);
        // any 'auto', 'medium' value will be 0
        size[measurement] = !isNaN(num) ? num : 0;
      }

      var paddingWidth = size.paddingLeft + size.paddingRight;
      var paddingHeight = size.paddingTop + size.paddingBottom;
      var marginWidth = size.marginLeft + size.marginRight;
      var marginHeight = size.marginTop + size.marginBottom;
      var borderWidth = size.borderLeftWidth + size.borderRightWidth;
      var borderHeight = size.borderTopWidth + size.borderBottomWidth;

      var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

      // overwrite width and height if we can get it from style
      var styleWidth = getStyleSize(style.width);
      if (styleWidth !== false) {
        size.width = styleWidth +
        // add padding and border unless it's already including it
        (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
      }

      var styleHeight = getStyleSize(style.height);
      if (styleHeight !== false) {
        size.height = styleHeight +
        // add padding and border unless it's already including it
        (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
      }

      size.innerWidth = size.width - (paddingWidth + borderWidth);
      size.innerHeight = size.height - (paddingHeight + borderHeight);

      size.outerWidth = size.width + marginWidth;
      size.outerHeight = size.height + marginHeight;

      return size;
    }

    // IE8 returns percent values, not pixels
    // taken from jQuery's curCSS


    function mungeNonPixel(elem, value) {
      // IE8 and has percent value
      if (window.getComputedStyle || value.indexOf('%') === -1) {
        return value;
      }
      var style = elem.style;
      // Remember the original values
      var left = style.left;
      var rs = elem.runtimeStyle;
      var rsLeft = rs && rs.left;

      // Put in the new values to get a computed value out
      if (rsLeft) {
        rs.left = elem.currentStyle.left;
      }
      style.left = value;
      value = style.pixelLeft;

      // Revert the changed values
      style.left = left;
      if (rsLeft) {
        rs.left = rsLeft;
      }

      return value;
    }

    return getSize;

  }

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD for RequireJS
    define('get-size/get-size', ['get-style-property/get-style-property'], defineGetSize);
  } else if (typeof exports === 'object') {
    // CommonJS for Component
    module.exports = defineGetSize(require('desandro-get-style-property'));
  } else {
    // browser global
    window.getSize = defineGetSize(window.getStyleProperty);
  }

})(window);

/**
 * matchesSelector v1.0.2
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false */

(function (ElemProto) {



  var matchesMethod = (function () {
    // check un-prefixed
    if (ElemProto.matchesSelector) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = ['webkit', 'moz', 'ms', 'o'];

    for (var i = 0, len = prefixes.length; i < len; i++) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if (ElemProto[method]) {
        return method;
      }
    }
  })();

  // ----- match ----- //

  function match(elem, selector) {
    return elem[matchesMethod](selector);
  }

  // ----- appendToFragment ----- //

  function checkParent(elem) {
    // not needed if already has parent
    if (elem.parentNode) {
      return;
    }
    var fragment = document.createDocumentFragment();
    fragment.appendChild(elem);
  }

  // ----- query ----- //
  // fall back to using QSA
  // thx @jonathantneal https://gist.github.com/3062955


  function query(elem, selector) {
    // append to fragment if no parent
    checkParent(elem);

    // match elem with all selected elems of parent
    var elems = elem.parentNode.querySelectorAll(selector);
    for (var i = 0, len = elems.length; i < len; i++) {
      // return true if match
      if (elems[i] === elem) {
        return true;
      }
    }
    // otherwise return false
    return false;
  }

  // ----- matchChild ----- //

  function matchChild(elem, selector) {
    checkParent(elem);
    return match(elem, selector);
  }

  // ----- matchesSelector ----- //
  var matchesSelector;

  if (matchesMethod) {
    // IE9 supports matchesSelector, but doesn't work on orphaned elems
    // check for that
    var div = document.createElement('div');
    var supportsOrphans = match(div, 'div');
    matchesSelector = supportsOrphans ? match : matchChild;
  } else {
    matchesSelector = query;
  }

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('matches-selector/matches-selector', [], function () {
      return matchesSelector;
    });
  } else if (typeof exports === 'object') {
    module.exports = matchesSelector;
  }
  else {
    // browser global
    window.matchesSelector = matchesSelector;
  }

})(Element.prototype);

/**
 * Outlayer Item
 */

(function (window) {



  // ----- get style ----- //
  var getComputedStyle = window.getComputedStyle;
  var getStyle = getComputedStyle ?
  function (elem) {
    return getComputedStyle(elem, null);
  } : function (elem) {
    return elem.currentStyle;
  };


  // extend objects


  function extend(a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }
    return a;
  }

  function isEmptyObj(obj) {
    for (var prop in obj) {
      return false;
    }
    prop = null;
    return true;
  }

  // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/


  function toDash(str) {
    return str.replace(/([A-Z])/g, function ($1) {
      return '-' + $1.toLowerCase();
    });
  }

  // -------------------------- Outlayer definition -------------------------- //

  function outlayerItemDefinition(EventEmitter, getSize, getStyleProperty) {

    // -------------------------- CSS3 support -------------------------- //
    var transitionProperty = getStyleProperty('transition');
    var transformProperty = getStyleProperty('transform');
    var supportsCSS3 = transitionProperty && transformProperty;
    var is3d = !! getStyleProperty('perspective');

    var transitionEndEvent = {
      WebkitTransition: 'webkitTransitionEnd',
      MozTransition: 'transitionend',
      OTransition: 'otransitionend',
      transition: 'transitionend'
    }[transitionProperty];

    // properties that could have vendor prefix
    var prefixableProperties = ['transform', 'transition', 'transitionDuration', 'transitionProperty'];

    // cache all vendor properties
    var vendorProperties = (function () {
      var cache = {};
      for (var i = 0, len = prefixableProperties.length; i < len; i++) {
        var prop = prefixableProperties[i];
        var supportedProp = getStyleProperty(prop);
        if (supportedProp && supportedProp !== prop) {
          cache[prop] = supportedProp;
        }
      }
      return cache;
    })();

    // -------------------------- Item -------------------------- //

    function Item(element, layout) {
      if (!element) {
        return;
      }

      this.element = element;
      // parent layout class, i.e. Masonry, Isotope, or Packery
      this.layout = layout;
      this.position = {
        x: 0,
        y: 0
      };

      this._create();
    }

    // inherit EventEmitter
    extend(Item.prototype, EventEmitter.prototype);

    Item.prototype._create = function () {
      // transition objects
      this._transn = {
        ingProperties: {},
        clean: {},
        onEnd: {}
      };

      this.css({
        position: 'absolute'
      });
    };

    // trigger specified handler for event type
    Item.prototype.handleEvent = function (event) {
      var method = 'on' + event.type;
      if (this[method]) {
        this[method](event);
      }
    };

    Item.prototype.getSize = function () {
      this.size = getSize(this.element);
    };

    /**
     * apply CSS styles to element
     * @param {Object} style
     */
    Item.prototype.css = function (style) {
      var elemStyle = this.element.style;

      for (var prop in style) {
        // use vendor property if available
        var supportedProp = vendorProperties[prop] || prop;
        elemStyle[supportedProp] = style[prop];
      }
    };

    // measure position, and sets it
    Item.prototype.getPosition = function () {
      var style = getStyle(this.element);
      var layoutOptions = this.layout.options;
      var isOriginLeft = layoutOptions.isOriginLeft;
      var isOriginTop = layoutOptions.isOriginTop;
      var x = parseInt(style[isOriginLeft ? 'left' : 'right'], 10);
      var y = parseInt(style[isOriginTop ? 'top' : 'bottom'], 10);

      // clean up 'auto' or other non-integer values
      x = isNaN(x) ? 0 : x;
      y = isNaN(y) ? 0 : y;
      // remove padding from measurement
      var layoutSize = this.layout.size;
      x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
      y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;

      this.position.x = x;
      this.position.y = y;
    };

    // set settled position, apply padding
    Item.prototype.layoutPosition = function () {
      var layoutSize = this.layout.size;
      var layoutOptions = this.layout.options;
      var style = {};

      if (layoutOptions.isOriginLeft) {
        style.left = (this.position.x + layoutSize.paddingLeft) + 'px';
        // reset other property
        style.right = '';
      } else {
        style.right = (this.position.x + layoutSize.paddingRight) + 'px';
        style.left = '';
      }

      if (layoutOptions.isOriginTop) {
        style.top = (this.position.y + layoutSize.paddingTop) + 'px';
        style.bottom = '';
      } else {
        style.bottom = (this.position.y + layoutSize.paddingBottom) + 'px';
        style.top = '';
      }

      this.css(style);
      this.emitEvent('layout', [this]);
    };


    // transform translate function
    var translate = is3d ?
    function (x, y) {
      return 'translate3d(' + x + 'px, ' + y + 'px, 0)';
    } : function (x, y) {
      return 'translate(' + x + 'px, ' + y + 'px)';
    };


    Item.prototype._transitionTo = function (x, y) {
      this.getPosition();
      // get current x & y from top/left
      var curX = this.position.x;
      var curY = this.position.y;

      var compareX = parseInt(x, 10);
      var compareY = parseInt(y, 10);
      var didNotMove = compareX === this.position.x && compareY === this.position.y;

      // save end position
      this.setPosition(x, y);

      // if did not move and not transitioning, just go to layout
      if (didNotMove && !this.isTransitioning) {
        this.layoutPosition();
        return;
      }

      var transX = x - curX;
      var transY = y - curY;
      var transitionStyle = {};
      // flip cooridinates if origin on right or bottom
      var layoutOptions = this.layout.options;
      transX = layoutOptions.isOriginLeft ? transX : -transX;
      transY = layoutOptions.isOriginTop ? transY : -transY;
      transitionStyle.transform = translate(transX, transY);

      this.transition({
        to: transitionStyle,
        onTransitionEnd: {
          transform: this.layoutPosition
        },
        isCleaning: true
      });
    };

    // non transition + transform support
    Item.prototype.goTo = function (x, y) {
      this.setPosition(x, y);
      this.layoutPosition();
    };

    // use transition and transforms if supported
    Item.prototype.moveTo = supportsCSS3 ? Item.prototype._transitionTo : Item.prototype.goTo;

    Item.prototype.setPosition = function (x, y) {
      this.position.x = parseInt(x, 10);
      this.position.y = parseInt(y, 10);
    };

    // ----- transition ----- //
    /**
     * @param {Object} style - CSS
     * @param {Function} onTransitionEnd
     */

    // non transition, just trigger callback
    Item.prototype._nonTransition = function (args) {
      this.css(args.to);
      if (args.isCleaning) {
        this._removeStyles(args.to);
      }
      for (var prop in args.onTransitionEnd) {
        args.onTransitionEnd[prop].call(this);
      }
    };

    /**
     * proper transition
     * @param {Object} args - arguments
     *   @param {Object} to - style to transition to
     *   @param {Object} from - style to start transition from
     *   @param {Boolean} isCleaning - removes transition styles after transition
     *   @param {Function} onTransitionEnd - callback
     */
    Item.prototype._transition = function (args) {
      // redirect to nonTransition if no transition duration
      if (!parseFloat(this.layout.options.transitionDuration)) {
        this._nonTransition(args);
        return;
      }

      var _transition = this._transn;
      // keep track of onTransitionEnd callback by css property
      for (var prop in args.onTransitionEnd) {
        _transition.onEnd[prop] = args.onTransitionEnd[prop];
      }
      // keep track of properties that are transitioning
      for (prop in args.to) {
        _transition.ingProperties[prop] = true;
        // keep track of properties to clean up when transition is done
        if (args.isCleaning) {
          _transition.clean[prop] = true;
        }
      }

      // set from styles
      if (args.from) {
        this.css(args.from);
        // force redraw. http://blog.alexmaccaw.com/css-transitions
        var h = this.element.offsetHeight;
        // hack for JSHint to hush about unused var
        h = null;
      }
      // enable transition
      this.enableTransition(args.to);
      // set styles that are transitioning
      this.css(args.to);

      this.isTransitioning = true;

    };

    var itemTransitionProperties = transformProperty && (toDash(transformProperty) + ',opacity');

    Item.prototype.enableTransition = function ( /* style */ ) {
      // only enable if not already transitioning
      // bug in IE10 were re-setting transition style will prevent
      // transitionend event from triggering
      if (this.isTransitioning) {
        return;
      }

      // make transition: foo, bar, baz from style object
      // TODO uncomment this bit when IE10 bug is resolved
      // var transitionValue = [];
      // for ( var prop in style ) {
      //   // dash-ify camelCased properties like WebkitTransition
      //   transitionValue.push( toDash( prop ) );
      // }
      // enable transition styles
      // HACK always enable transform,opacity for IE10
      this.css({
        transitionProperty: itemTransitionProperties,
        transitionDuration: this.layout.options.transitionDuration
      });
      // listen for transition end event
      this.element.addEventListener(transitionEndEvent, this, false);
    };

    Item.prototype.transition = Item.prototype[transitionProperty ? '_transition' : '_nonTransition'];

    // ----- events ----- //
    Item.prototype.onwebkitTransitionEnd = function (event) {
      this.ontransitionend(event);
    };

    Item.prototype.onotransitionend = function (event) {
      this.ontransitionend(event);
    };

    // properties that I munge to make my life easier
    var dashedVendorProperties = {
      '-webkit-transform': 'transform',
      '-moz-transform': 'transform',
      '-o-transform': 'transform'
    };

    Item.prototype.ontransitionend = function (event) {
      // disregard bubbled events from children
      if (event.target !== this.element) {
        return;
      }
      var _transition = this._transn;
      // get property name of transitioned property, convert to prefix-free
      var propertyName = dashedVendorProperties[event.propertyName] || event.propertyName;

      // remove property that has completed transitioning
      delete _transition.ingProperties[propertyName];
      // check if any properties are still transitioning
      if (isEmptyObj(_transition.ingProperties)) {
        // all properties have completed transitioning
        this.disableTransition();
      }
      // clean style
      if (propertyName in _transition.clean) {
        // clean up style
        this.element.style[event.propertyName] = '';
        delete _transition.clean[propertyName];
      }
      // trigger onTransitionEnd callback
      if (propertyName in _transition.onEnd) {
        var onTransitionEnd = _transition.onEnd[propertyName];
        onTransitionEnd.call(this);
        delete _transition.onEnd[propertyName];
      }

      this.emitEvent('transitionEnd', [this]);
    };

    Item.prototype.disableTransition = function () {
      this.removeTransitionStyles();
      this.element.removeEventListener(transitionEndEvent, this, false);
      this.isTransitioning = false;
    };

    /**
     * removes style property from element
     * @param {Object} style
     **/
    Item.prototype._removeStyles = function (style) {
      // clean up transition styles
      var cleanStyle = {};
      for (var prop in style) {
        cleanStyle[prop] = '';
      }
      this.css(cleanStyle);
    };

    var cleanTransitionStyle = {
      transitionProperty: '',
      transitionDuration: ''
    };

    Item.prototype.removeTransitionStyles = function () {
      // remove transition
      this.css(cleanTransitionStyle);
    };

    // ----- show/hide/remove ----- //
    // remove element from DOM
    Item.prototype.removeElem = function () {
      this.element.parentNode.removeChild(this.element);
      this.emitEvent('remove', [this]);
    };

    Item.prototype.remove = function () {
      // just remove element if no transition support or no transition
      if (!transitionProperty || !parseFloat(this.layout.options.transitionDuration)) {
        this.removeElem();
        return;
      }

      // start transition
      var _this = this;
      this.on('transitionEnd', function () {
        _this.removeElem();
        return true; // bind once
      });
      this.hide();
    };

    Item.prototype.reveal = function () {
      delete this.isHidden;
      // remove display: none
      this.css({
        display: ''
      });

      var options = this.layout.options;
      this.transition({
        from: options.hiddenStyle,
        to: options.visibleStyle,
        isCleaning: true
      });
    };

    Item.prototype.hide = function () {
      // set flag
      this.isHidden = true;
      // remove display: none
      this.css({
        display: ''
      });

      var options = this.layout.options;
      this.transition({
        from: options.visibleStyle,
        to: options.hiddenStyle,
        // keep hidden stuff hidden
        isCleaning: true,
        onTransitionEnd: {
          opacity: function () {
            // check if still hidden
            // during transition, item may have been un-hidden
            if (this.isHidden) {
              this.css({
                display: 'none'
              });
            }
          }
        }
      });
    };

    Item.prototype.destroy = function () {
      this.css({
        position: '',
        left: '',
        right: '',
        top: '',
        bottom: '',
        transition: '',
        transform: ''
      });
    };

    return Item;

  }

  // -------------------------- transport -------------------------- //
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('outlayer/item', ['eventEmitter/EventEmitter', 'get-size/get-size', 'get-style-property/get-style-property'], outlayerItemDefinition);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = outlayerItemDefinition(
    require('wolfy87-eventemitter'), require('get-size'), require('desandro-get-style-property'));
  } else {
    // browser global
    window.Outlayer = {};
    window.Outlayer.Item = outlayerItemDefinition(
    window.EventEmitter, window.getSize, window.getStyleProperty);
  }

})(window);

/*!
 * Outlayer v1.3.0
 * the brains and guts of a layout library
 * MIT license
 */

(function (window) {



  // ----- vars ----- //
  var document = window.document;
  var console = window.console;
  var jQuery = window.jQuery;
  var noop = function () {};

  // -------------------------- helpers -------------------------- //
  // extend objects


  function extend(a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }
    return a;
  }


  var objToString = Object.prototype.toString;

  function isArray(obj) {
    return objToString.call(obj) === '[object Array]';
  }

  // turn element or nodeList into an array


  function makeArray(obj) {
    var ary = [];
    if (isArray(obj)) {
      // use object if already an array
      ary = obj;
    } else if (obj && typeof obj.length === 'number') {
      // convert nodeList to array
      for (var i = 0, len = obj.length; i < len; i++) {
        ary.push(obj[i]);
      }
    } else {
      // array of single index
      ary.push(obj);
    }
    return ary;
  }

  // http://stackoverflow.com/a/384380/182183
  var isElement = (typeof HTMLElement === 'function' || typeof HTMLElement === 'object') ?
  function isElementDOM2(obj) {
    return obj instanceof HTMLElement;
  } : function isElementQuirky(obj) {
    return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
  };

  // index of helper cause IE8
  var indexOf = Array.prototype.indexOf ?
  function (ary, obj) {
    return ary.indexOf(obj);
  } : function (ary, obj) {
    for (var i = 0, len = ary.length; i < len; i++) {
      if (ary[i] === obj) {
        return i;
      }
    }
    return -1;
  };

  function removeFrom(obj, ary) {
    var index = indexOf(ary, obj);
    if (index !== -1) {
      ary.splice(index, 1);
    }
  }

  // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/


  function toDashed(str) {
    return str.replace(/(.)([A-Z])/g, function (match, $1, $2) {
      return $1 + '-' + $2;
    }).toLowerCase();
  }


  function outlayerDefinition(eventie, docReady, EventEmitter, getSize, matchesSelector, Item) {

    // -------------------------- Outlayer -------------------------- //
    // globally unique identifiers
    var GUID = 0;
    // internal store of all Outlayer intances
    var instances = {};


    /**
     * @param {Element, String} element
     * @param {Object} options
     * @constructor
     */

    function Outlayer(element, options) {
      // use element as selector string
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }

      // bail out if not proper element
      if (!element || !isElement(element)) {
        if (console) {
          console.error('Bad ' + this.constructor.namespace + ' element: ' + element);
        }
        return;
      }

      this.element = element;

      // options
      this.options = extend({}, this.constructor.defaults);
      this.option(options);

      // add id for Outlayer.getFromElement
      var id = ++GUID;
      this.element.outlayerGUID = id; // expando
      instances[id] = this; // associate via id
      // kick it off
      this._create();

      if (this.options.isInitLayout) {
        this.layout();
      }
    }

    // settings are for internal use only
    Outlayer.namespace = 'outlayer';
    Outlayer.Item = Item;

    // default options
    Outlayer.defaults = {
      containerStyle: {
        position: 'relative'
      },
      isInitLayout: true,
      isOriginLeft: true,
      isOriginTop: true,
      isResizeBound: true,
      isResizingContainer: true,
      // item options
      transitionDuration: '0.4s',
      hiddenStyle: {
        opacity: 0,
        transform: 'scale(0.001)'
      },
      visibleStyle: {
        opacity: 1,
        transform: 'scale(1)'
      }
    };

    // inherit EventEmitter
    extend(Outlayer.prototype, EventEmitter.prototype);

    /**
     * set options
     * @param {Object} opts
     */
    Outlayer.prototype.option = function (opts) {
      extend(this.options, opts);
    };

    Outlayer.prototype._create = function () {
      // get items from children
      this.reloadItems();
      // elements that affect layout, but are not laid out
      this.stamps = [];
      this.stamp(this.options.stamp);
      // set container style
      extend(this.element.style, this.options.containerStyle);

      // bind resize method
      if (this.options.isResizeBound) {
        this.bindResize();
      }
    };

    // goes through all children again and gets bricks in proper order
    Outlayer.prototype.reloadItems = function () {
      // collection of item elements
      this.items = this._itemize(this.element.children);
    };


    /**
     * turn elements into Outlayer.Items to be used in layout
     * @param {Array or NodeList or HTMLElement} elems
     * @returns {Array} items - collection of new Outlayer Items
     */
    Outlayer.prototype._itemize = function (elems) {

      var itemElems = this._filterFindItemElements(elems);
      var Item = this.constructor.Item;

      // create new Outlayer Items for collection
      var items = [];
      for (var i = 0, len = itemElems.length; i < len; i++) {
        var elem = itemElems[i];
        var item = new Item(elem, this);
        items.push(item);
      }

      return items;
    };

    /**
     * get item elements to be used in layout
     * @param {Array or NodeList or HTMLElement} elems
     * @returns {Array} items - item elements
     */
    Outlayer.prototype._filterFindItemElements = function (elems) {
      // make array of elems
      elems = makeArray(elems);
      var itemSelector = this.options.itemSelector;
      var itemElems = [];

      for (var i = 0, len = elems.length; i < len; i++) {
        var elem = elems[i];
        // check that elem is an actual element
        if (!isElement(elem)) {
          continue;
        }
        // filter & find items if we have an item selector
        if (itemSelector) {
          // filter siblings
          if (matchesSelector(elem, itemSelector)) {
            itemElems.push(elem);
          }
          // find children
          var childElems = elem.querySelectorAll(itemSelector);
          // concat childElems to filterFound array
          for (var j = 0, jLen = childElems.length; j < jLen; j++) {
            itemElems.push(childElems[j]);
          }
        } else {
          itemElems.push(elem);
        }
      }

      return itemElems;
    };

    /**
     * getter method for getting item elements
     * @returns {Array} elems - collection of item elements
     */
    Outlayer.prototype.getItemElements = function () {
      var elems = [];
      for (var i = 0, len = this.items.length; i < len; i++) {
        elems.push(this.items[i].element);
      }
      return elems;
    };

    // ----- init & layout ----- //
    /**
     * lays out all items
     */
    Outlayer.prototype.layout = function () {
      this._resetLayout();
      this._manageStamps();

      // don't animate first layout
      var isInstant = this.options.isLayoutInstant !== undefined ? this.options.isLayoutInstant : !this._isLayoutInited;
      this.layoutItems(this.items, isInstant);

      // flag for initalized
      this._isLayoutInited = true;
    };

    // _init is alias for layout
    Outlayer.prototype._init = Outlayer.prototype.layout;

    /**
     * logic before any new layout
     */
    Outlayer.prototype._resetLayout = function () {
      this.getSize();
    };


    Outlayer.prototype.getSize = function () {
      this.size = getSize(this.element);
    };

    /**
     * get measurement from option, for columnWidth, rowHeight, gutter
     * if option is String -> get element from selector string, & get size of element
     * if option is Element -> get size of element
     * else use option as a number
     *
     * @param {String} measurement
     * @param {String} size - width or height
     * @private
     */
    Outlayer.prototype._getMeasurement = function (measurement, size) {
      var option = this.options[measurement];
      var elem;
      if (!option) {
        // default to 0
        this[measurement] = 0;
      } else {
        // use option as an element
        if (typeof option === 'string') {
          elem = this.element.querySelector(option);
        } else if (isElement(option)) {
          elem = option;
        }
        // use size of element, if element
        this[measurement] = elem ? getSize(elem)[size] : option;
      }
    };

    /**
     * layout a collection of item elements
     * @api public
     */
    Outlayer.prototype.layoutItems = function (items, isInstant) {
      items = this._getItemsForLayout(items);

      this._layoutItems(items, isInstant);

      this._postLayout();
    };

    /**
     * get the items to be laid out
     * you may want to skip over some items
     * @param {Array} items
     * @returns {Array} items
     */
    Outlayer.prototype._getItemsForLayout = function (items) {
      var layoutItems = [];
      for (var i = 0, len = items.length; i < len; i++) {
        var item = items[i];
        if (!item.isIgnored) {
          layoutItems.push(item);
        }
      }
      return layoutItems;
    };

    /**
     * layout items
     * @param {Array} items
     * @param {Boolean} isInstant
     */
    Outlayer.prototype._layoutItems = function (items, isInstant) {
      var _this = this;

      function onItemsLayout() {
        _this.emitEvent('layoutComplete', [_this, items]);
      }

      if (!items || !items.length) {
        // no items, emit event with empty array
        onItemsLayout();
        return;
      }

      // emit layoutComplete when done
      this._itemsOn(items, 'layout', onItemsLayout);

      var queue = [];

      for (var i = 0, len = items.length; i < len; i++) {
        var item = items[i];
        // get x/y object from method
        var position = this._getItemLayoutPosition(item);
        // enqueue
        position.item = item;
        position.isInstant = isInstant || item.isLayoutInstant;
        queue.push(position);
      }

      this._processLayoutQueue(queue);
    };

    /**
     * get item layout position
     * @param {Outlayer.Item} item
     * @returns {Object} x and y position
     */
    Outlayer.prototype._getItemLayoutPosition = function ( /* item */ ) {
      return {
        x: 0,
        y: 0
      };
    };

    /**
     * iterate over array and position each item
     * Reason being - separating this logic prevents 'layout invalidation'
     * thx @paul_irish
     * @param {Array} queue
     */
    Outlayer.prototype._processLayoutQueue = function (queue) {
      for (var i = 0, len = queue.length; i < len; i++) {
        var obj = queue[i];
        this._positionItem(obj.item, obj.x, obj.y, obj.isInstant);
      }
    };

    /**
     * Sets position of item in DOM
     * @param {Outlayer.Item} item
     * @param {Number} x - horizontal position
     * @param {Number} y - vertical position
     * @param {Boolean} isInstant - disables transitions
     */
    Outlayer.prototype._positionItem = function (item, x, y, isInstant) {
      if (isInstant) {
        // if not transition, just set CSS
        item.goTo(x, y);
      } else {
        item.moveTo(x, y);
      }
    };

    /**
     * Any logic you want to do after each layout,
     * i.e. size the container
     */
    Outlayer.prototype._postLayout = function () {
      this.resizeContainer();
    };

    Outlayer.prototype.resizeContainer = function () {
      if (!this.options.isResizingContainer) {
        return;
      }
      var size = this._getContainerSize();
      if (size) {
        this._setContainerMeasure(size.width, true);
        this._setContainerMeasure(size.height, false);
      }
    };

    /**
     * Sets width or height of container if returned
     * @returns {Object} size
     *   @param {Number} width
     *   @param {Number} height
     */
    Outlayer.prototype._getContainerSize = noop;

    /**
     * @param {Number} measure - size of width or height
     * @param {Boolean} isWidth
     */
    Outlayer.prototype._setContainerMeasure = function (measure, isWidth) {
      if (measure === undefined) {
        return;
      }

      var elemSize = this.size;
      // add padding and border width if border box
      if (elemSize.isBorderBox) {
        measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight + elemSize.borderLeftWidth + elemSize.borderRightWidth : elemSize.paddingBottom + elemSize.paddingTop + elemSize.borderTopWidth + elemSize.borderBottomWidth;
      }

      measure = Math.max(measure, 0);
      this.element.style[isWidth ? 'width' : 'height'] = measure + 'px';
    };

    /**
     * trigger a callback for a collection of items events
     * @param {Array} items - Outlayer.Items
     * @param {String} eventName
     * @param {Function} callback
     */
    Outlayer.prototype._itemsOn = function (items, eventName, callback) {
      var doneCount = 0;
      var count = items.length;
      // event callback
      var _this = this;

      function tick() {
        doneCount++;
        if (doneCount === count) {
          callback.call(_this);
        }
        return true; // bind once
      }
      // bind callback
      for (var i = 0, len = items.length; i < len; i++) {
        var item = items[i];
        item.on(eventName, tick);
      }
    };

    // -------------------------- ignore & stamps -------------------------- //

    /**
     * keep item in collection, but do not lay it out
     * ignored items do not get skipped in layout
     * @param {Element} elem
     */
    Outlayer.prototype.ignore = function (elem) {
      var item = this.getItem(elem);
      if (item) {
        item.isIgnored = true;
      }
    };

    /**
     * return item to layout collection
     * @param {Element} elem
     */
    Outlayer.prototype.unignore = function (elem) {
      var item = this.getItem(elem);
      if (item) {
        delete item.isIgnored;
      }
    };

    /**
     * adds elements to stamps
     * @param {NodeList, Array, Element, or String} elems
     */
    Outlayer.prototype.stamp = function (elems) {
      elems = this._find(elems);
      if (!elems) {
        return;
      }

      this.stamps = this.stamps.concat(elems);
      // ignore
      for (var i = 0, len = elems.length; i < len; i++) {
        var elem = elems[i];
        this.ignore(elem);
      }
    };

    /**
     * removes elements to stamps
     * @param {NodeList, Array, or Element} elems
     */
    Outlayer.prototype.unstamp = function (elems) {
      elems = this._find(elems);
      if (!elems) {
        return;
      }

      for (var i = 0, len = elems.length; i < len; i++) {
        var elem = elems[i];
        // filter out removed stamp elements
        removeFrom(elem, this.stamps);
        this.unignore(elem);
      }

    };

    /**
     * finds child elements
     * @param {NodeList, Array, Element, or String} elems
     * @returns {Array} elems
     */
    Outlayer.prototype._find = function (elems) {
      if (!elems) {
        return;
      }
      // if string, use argument as selector string
      if (typeof elems === 'string') {
        elems = this.element.querySelectorAll(elems);
      }
      elems = makeArray(elems);
      return elems;
    };

    Outlayer.prototype._manageStamps = function () {
      if (!this.stamps || !this.stamps.length) {
        return;
      }

      this._getBoundingRect();

      for (var i = 0, len = this.stamps.length; i < len; i++) {
        var stamp = this.stamps[i];
        this._manageStamp(stamp);
      }
    };

    // update boundingLeft / Top
    Outlayer.prototype._getBoundingRect = function () {
      // get bounding rect for container element
      var boundingRect = this.element.getBoundingClientRect();
      var size = this.size;
      this._boundingRect = {
        left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
        top: boundingRect.top + size.paddingTop + size.borderTopWidth,
        right: boundingRect.right - (size.paddingRight + size.borderRightWidth),
        bottom: boundingRect.bottom - (size.paddingBottom + size.borderBottomWidth)
      };
    };

    /**
     * @param {Element} stamp
     **/
    Outlayer.prototype._manageStamp = noop;

    /**
     * get x/y position of element relative to container element
     * @param {Element} elem
     * @returns {Object} offset - has left, top, right, bottom
     */
    Outlayer.prototype._getElementOffset = function (elem) {
      var boundingRect = elem.getBoundingClientRect();
      var thisRect = this._boundingRect;
      var size = getSize(elem);
      var offset = {
        left: boundingRect.left - thisRect.left - size.marginLeft,
        top: boundingRect.top - thisRect.top - size.marginTop,
        right: thisRect.right - boundingRect.right - size.marginRight,
        bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
      };
      return offset;
    };

    // -------------------------- resize -------------------------- //
    // enable event handlers for listeners
    // i.e. resize -> onresize
    Outlayer.prototype.handleEvent = function (event) {
      var method = 'on' + event.type;
      if (this[method]) {
        this[method](event);
      }
    };

    /**
     * Bind layout to window resizing
     */
    Outlayer.prototype.bindResize = function () {
      // bind just one listener
      if (this.isResizeBound) {
        return;
      }
      eventie.bind(window, 'resize', this);
      this.isResizeBound = true;
    };

    /**
     * Unbind layout to window resizing
     */
    Outlayer.prototype.unbindResize = function () {
      if (this.isResizeBound) {
        eventie.unbind(window, 'resize', this);
      }
      this.isResizeBound = false;
    };

    // original debounce by John Hann
    // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
    // this fires every resize
    Outlayer.prototype.onresize = function () {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      var _this = this;

      function delayed() {
        _this.resize();
        delete _this.resizeTimeout;
      }

      this.resizeTimeout = setTimeout(delayed, 100);
    };

    // debounced, layout on resize
    Outlayer.prototype.resize = function () {
      // don't trigger if size did not change
      // or if resize was unbound. See #9
      if (!this.isResizeBound || !this.needsResizeLayout()) {
        return;
      }

      this.layout();
    };

    /**
     * check if layout is needed post layout
     * @returns Boolean
     */
    Outlayer.prototype.needsResizeLayout = function () {
      var size = getSize(this.element);
      // check that this.size and size are there
      // IE8 triggers resize on body size change, so they might not be
      var hasSizes = this.size && size;
      return hasSizes && size.innerWidth !== this.size.innerWidth;
    };

    // -------------------------- methods -------------------------- //
    /**
     * add items to Outlayer instance
     * @param {Array or NodeList or Element} elems
     * @returns {Array} items - Outlayer.Items
     **/
    Outlayer.prototype.addItems = function (elems) {
      var items = this._itemize(elems);
      // add items to collection
      if (items.length) {
        this.items = this.items.concat(items);
      }
      return items;
    };

    /**
     * Layout newly-appended item elements
     * @param {Array or NodeList or Element} elems
     */
    Outlayer.prototype.appended = function (elems) {
      var items = this.addItems(elems);
      if (!items.length) {
        return;
      }
      // layout and reveal just the new items
      this.layoutItems(items, true);
      this.reveal(items);
    };

    /**
     * Layout prepended elements
     * @param {Array or NodeList or Element} elems
     */
    Outlayer.prototype.prepended = function (elems) {
      var items = this._itemize(elems);
      if (!items.length) {
        return;
      }
      // add items to beginning of collection
      var previousItems = this.items.slice(0);
      this.items = items.concat(previousItems);
      // start new layout
      this._resetLayout();
      this._manageStamps();
      // layout new stuff without transition
      this.layoutItems(items, true);
      this.reveal(items);
      // layout previous items
      this.layoutItems(previousItems);
    };

    /**
     * reveal a collection of items
     * @param {Array of Outlayer.Items} items
     */
    Outlayer.prototype.reveal = function (items) {
      var len = items && items.length;
      if (!len) {
        return;
      }
      for (var i = 0; i < len; i++) {
        var item = items[i];
        item.reveal();
      }
    };

    /**
     * hide a collection of items
     * @param {Array of Outlayer.Items} items
     */
    Outlayer.prototype.hide = function (items) {
      var len = items && items.length;
      if (!len) {
        return;
      }
      for (var i = 0; i < len; i++) {
        var item = items[i];
        item.hide();
      }
    };

    /**
     * get Outlayer.Item, given an Element
     * @param {Element} elem
     * @param {Function} callback
     * @returns {Outlayer.Item} item
     */
    Outlayer.prototype.getItem = function (elem) {
      // loop through items to get the one that matches
      for (var i = 0, len = this.items.length; i < len; i++) {
        var item = this.items[i];
        if (item.element === elem) {
          // return item
          return item;
        }
      }
    };

    /**
     * get collection of Outlayer.Items, given Elements
     * @param {Array} elems
     * @returns {Array} items - Outlayer.Items
     */
    Outlayer.prototype.getItems = function (elems) {
      if (!elems || !elems.length) {
        return;
      }
      var items = [];
      for (var i = 0, len = elems.length; i < len; i++) {
        var elem = elems[i];
        var item = this.getItem(elem);
        if (item) {
          items.push(item);
        }
      }

      return items;
    };

    /**
     * remove element(s) from instance and DOM
     * @param {Array or NodeList or Element} elems
     */
    Outlayer.prototype.remove = function (elems) {
      elems = makeArray(elems);

      var removeItems = this.getItems(elems);
      // bail if no items to remove
      if (!removeItems || !removeItems.length) {
        return;
      }

      this._itemsOn(removeItems, 'remove', function () {
        this.emitEvent('removeComplete', [this, removeItems]);
      });

      for (var i = 0, len = removeItems.length; i < len; i++) {
        var item = removeItems[i];
        item.remove();
        // remove item from collection
        removeFrom(item, this.items);
      }
    };

    // ----- destroy ----- //
    // remove and disable Outlayer instance
    Outlayer.prototype.destroy = function () {
      // clean up dynamic styles
      var style = this.element.style;
      style.height = '';
      style.position = '';
      style.width = '';
      // destroy items
      for (var i = 0, len = this.items.length; i < len; i++) {
        var item = this.items[i];
        item.destroy();
      }

      this.unbindResize();

      var id = this.element.outlayerGUID;
      delete instances[id]; // remove reference to instance by id
      delete this.element.outlayerGUID;
      // remove data for jQuery
      if (jQuery) {
        jQuery.removeData(this.element, this.constructor.namespace);
      }

    };

    // -------------------------- data -------------------------- //
    /**
     * get Outlayer instance from element
     * @param {Element} elem
     * @returns {Outlayer}
     */
    Outlayer.data = function (elem) {
      var id = elem && elem.outlayerGUID;
      return id && instances[id];
    };


    // -------------------------- create Outlayer class -------------------------- //
    /**
     * create a layout class
     * @param {String} namespace
     */
    Outlayer.create = function (namespace, options) {
      // sub-class Outlayer


      function Layout() {
        Outlayer.apply(this, arguments);
      }
      // inherit Outlayer prototype, use Object.create if there
      if (Object.create) {
        Layout.prototype = Object.create(Outlayer.prototype);
      } else {
        extend(Layout.prototype, Outlayer.prototype);
      }
      // set contructor, used for namespace and Item
      Layout.prototype.constructor = Layout;

      Layout.defaults = extend({}, Outlayer.defaults);
      // apply new options
      extend(Layout.defaults, options);
      // keep prototype.settings for backwards compatibility (Packery v1.2.0)
      Layout.prototype.settings = {};

      Layout.namespace = namespace;

      Layout.data = Outlayer.data;

      // sub-class Item
      Layout.Item = function LayoutItem() {
        Item.apply(this, arguments);
      };

      Layout.Item.prototype = new Item();

      // -------------------------- declarative -------------------------- //
      /**
       * allow user to initialize Outlayer via .js-namespace class
       * options are parsed from data-namespace-option attribute
       */
      docReady(function () {
        var dashedNamespace = toDashed(namespace);
        var elems = document.querySelectorAll('.js-' + dashedNamespace);
        var dataAttr = 'data-' + dashedNamespace + '-options';

        for (var i = 0, len = elems.length; i < len; i++) {
          var elem = elems[i];
          var attr = elem.getAttribute(dataAttr);
          var options;
          try {
            options = attr && JSON.parse(attr);
          } catch (error) {
            // log error, do not initialize
            if (console) {
              console.error('Error parsing ' + dataAttr + ' on ' + elem.nodeName.toLowerCase() + (elem.id ? '#' + elem.id : '') + ': ' + error);
            }
            continue;
          }
          // initialize
          var instance = new Layout(elem, options);
          // make available via $().data('layoutname')
          if (jQuery) {
            jQuery.data(elem, namespace, instance);
          }
        }
      });

      // -------------------------- jQuery bridge -------------------------- //
      // make into jQuery plugin
      if (jQuery && jQuery.bridget) {
        jQuery.bridget(namespace, Layout);
      }

      return Layout;
    };

    // ----- fin ----- //
    // back in global
    Outlayer.Item = Item;

    return Outlayer;

  }

  // -------------------------- transport -------------------------- //
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('outlayer/outlayer', ['eventie/eventie', 'doc-ready/doc-ready', 'eventEmitter/EventEmitter', 'get-size/get-size', 'matches-selector/matches-selector', './item'], outlayerDefinition);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = outlayerDefinition(
    require('eventie'), require('doc-ready'), require('wolfy87-eventemitter'), require('get-size'), require('desandro-matches-selector'), require('./item'));
  } else {
    // browser global
    window.Outlayer = outlayerDefinition(
    window.eventie, window.docReady, window.EventEmitter, window.getSize, window.matchesSelector, window.Outlayer.Item);
  }

})(window);

/**
 * Isotope Item
 **/

(function (window) {



  // -------------------------- Item -------------------------- //

  function itemDefinition(Outlayer) {

    // sub-class Outlayer Item


    function Item() {
      Outlayer.Item.apply(this, arguments);
    }

    Item.prototype = new Outlayer.Item();

    Item.prototype._create = function () {
      // assign id, used for original-order sorting
      this.id = this.layout.itemGUID++;
      Outlayer.Item.prototype._create.call(this);
      this.sortData = {};
    };

    Item.prototype.updateSortData = function () {
      if (this.isIgnored) {
        return;
      }
      // default sorters
      this.sortData.id = this.id;
      // for backward compatibility
      this.sortData['original-order'] = this.id;
      this.sortData.random = Math.random();
      // go thru getSortData obj and apply the sorters
      var getSortData = this.layout.options.getSortData;
      var sorters = this.layout._sorters;
      for (var key in getSortData) {
        var sorter = sorters[key];
        this.sortData[key] = sorter(this.element, this);
      }
    };

    var _destroy = Item.prototype.destroy;
    Item.prototype.destroy = function () {
      // call super
      _destroy.apply(this, arguments);
      // reset display, #741
      this.css({
        display: ''
      });
    };

    return Item;

  }

  // -------------------------- transport -------------------------- //
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('isotope/js/item', ['outlayer/outlayer'], itemDefinition);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = itemDefinition(
    require('outlayer'));
  } else {
    // browser global
    window.Isotope = window.Isotope || {};
    window.Isotope.Item = itemDefinition(
    window.Outlayer);
  }

})(window);

(function (window) {



  // --------------------------  -------------------------- //

  function layoutModeDefinition(getSize, Outlayer) {

    // layout mode class


    function LayoutMode(isotope) {
      this.isotope = isotope;
      // link properties
      if (isotope) {
        this.options = isotope.options[this.namespace];
        this.element = isotope.element;
        this.items = isotope.filteredItems;
        this.size = isotope.size;
      }
    }

    /**
     * some methods should just defer to default Outlayer method
     * and reference the Isotope instance as `this`
     **/
    (function () {
      var facadeMethods = ['_resetLayout', '_getItemLayoutPosition', '_manageStamp', '_getContainerSize', '_getElementOffset', 'needsResizeLayout'];

      for (var i = 0, len = facadeMethods.length; i < len; i++) {
        var methodName = facadeMethods[i];
        LayoutMode.prototype[methodName] = getOutlayerMethod(methodName);
      }

      function getOutlayerMethod(methodName) {
        return function () {
          return Outlayer.prototype[methodName].apply(this.isotope, arguments);
        };
      }
    })();

    // -----  ----- //
    // for horizontal layout modes, check vertical size
    LayoutMode.prototype.needsVerticalResizeLayout = function () {
      // don't trigger if size did not change
      var size = getSize(this.isotope.element);
      // check that this.size and size are there
      // IE8 triggers resize on body size change, so they might not be
      var hasSizes = this.isotope.size && size;
      return hasSizes && size.innerHeight !== this.isotope.size.innerHeight;
    };

    // ----- measurements ----- //
    LayoutMode.prototype._getMeasurement = function () {
      this.isotope._getMeasurement.apply(this, arguments);
    };

    LayoutMode.prototype.getColumnWidth = function () {
      this.getSegmentSize('column', 'Width');
    };

    LayoutMode.prototype.getRowHeight = function () {
      this.getSegmentSize('row', 'Height');
    };

    /**
     * get columnWidth or rowHeight
     * segment: 'column' or 'row'
     * size 'Width' or 'Height'
     **/
    LayoutMode.prototype.getSegmentSize = function (segment, size) {
      var segmentName = segment + size;
      var outerSize = 'outer' + size;
      // columnWidth / outerWidth // rowHeight / outerHeight
      this._getMeasurement(segmentName, outerSize);
      // got rowHeight or columnWidth, we can chill
      if (this[segmentName]) {
        return;
      }
      // fall back to item of first element
      var firstItemSize = this.getFirstItemSize();
      this[segmentName] = firstItemSize && firstItemSize[outerSize] ||
      // or size of container
      this.isotope.size['inner' + size];
    };

    LayoutMode.prototype.getFirstItemSize = function () {
      var firstItem = this.isotope.filteredItems[0];
      return firstItem && firstItem.element && getSize(firstItem.element);
    };

    // ----- methods that should reference isotope ----- //
    LayoutMode.prototype.layout = function () {
      this.isotope.layout.apply(this.isotope, arguments);
    };

    LayoutMode.prototype.getSize = function () {
      this.isotope.getSize();
      this.size = this.isotope.size;
    };

    // -------------------------- create -------------------------- //
    LayoutMode.modes = {};

    LayoutMode.create = function (namespace, options) {

      function Mode() {
        LayoutMode.apply(this, arguments);
      }

      Mode.prototype = new LayoutMode();

      // default options
      if (options) {
        Mode.options = options;
      }

      Mode.prototype.namespace = namespace;
      // register in Isotope
      LayoutMode.modes[namespace] = Mode;

      return Mode;
    };


    return LayoutMode;

  }

  if (typeof define === 'function' && define.amd) {
    // AMD
    define('isotope/js/layout-mode', ['get-size/get-size', 'outlayer/outlayer'], layoutModeDefinition);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = layoutModeDefinition(
    require('get-size'), require('outlayer'));
  } else {
    // browser global
    window.Isotope = window.Isotope || {};
    window.Isotope.LayoutMode = layoutModeDefinition(
    window.getSize, window.Outlayer);
  }


})(window);

/*!
 * Masonry v3.2.1
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

(function (window) {



  // -------------------------- helpers -------------------------- //
  var indexOf = Array.prototype.indexOf ?
  function (items, value) {
    return items.indexOf(value);
  } : function (items, value) {
    for (var i = 0, len = items.length; i < len; i++) {
      var item = items[i];
      if (item === value) {
        return i;
      }
    }
    return -1;
  };

  // -------------------------- masonryDefinition -------------------------- //
  // used for AMD definition and requires


  function masonryDefinition(Outlayer, getSize) {
    // create an Outlayer layout class
    var Masonry = Outlayer.create('masonry');

    Masonry.prototype._resetLayout = function () {
      this.getSize();
      this._getMeasurement('columnWidth', 'outerWidth');
      this._getMeasurement('gutter', 'outerWidth');
      this.measureColumns();

      // reset column Y
      var i = this.cols;
      this.colYs = [];
      while (i--) {
        this.colYs.push(0);
      }

      this.maxY = 0;
    };

    Masonry.prototype.measureColumns = function () {
      this.getContainerWidth();
      // if columnWidth is 0, default to outerWidth of first item
      if (!this.columnWidth) {
        var firstItem = this.items[0];
        var firstItemElem = firstItem && firstItem.element;
        // columnWidth fall back to item of first element
        this.columnWidth = firstItemElem && getSize(firstItemElem).outerWidth ||
        // if first elem has no width, default to size of container
        this.containerWidth;
      }

      this.columnWidth += this.gutter;

      this.cols = Math.floor((this.containerWidth + this.gutter) / this.columnWidth);
      this.cols = Math.max(this.cols, 1);
    };

    Masonry.prototype.getContainerWidth = function () {
      // container is parent if fit width
      var container = this.options.isFitWidth ? this.element.parentNode : this.element;
      // check that this.size and size are there
      // IE8 triggers resize on body size change, so they might not be
      var size = getSize(container);
      this.containerWidth = size && size.innerWidth;
    };

    Masonry.prototype._getItemLayoutPosition = function (item) {
      item.getSize();
      // how many columns does this brick span
      var remainder = item.size.outerWidth % this.columnWidth;
      var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil';
      // round if off by 1 pixel, otherwise use ceil
      var colSpan = Math[mathMethod](item.size.outerWidth / this.columnWidth);
      colSpan = Math.min(colSpan, this.cols);

      var colGroup = this._getColGroup(colSpan);
      // get the minimum Y value from the columns
      var minimumY = Math.min.apply(Math, colGroup);
      var shortColIndex = indexOf(colGroup, minimumY);

      // position the brick
      var position = {
        x: this.columnWidth * shortColIndex,
        y: minimumY
      };

      // apply setHeight to necessary columns
      var setHeight = minimumY + item.size.outerHeight;
      var setSpan = this.cols + 1 - colGroup.length;
      for (var i = 0; i < setSpan; i++) {
        this.colYs[shortColIndex + i] = setHeight;
      }

      return position;
    };

    /**
     * @param {Number} colSpan - number of columns the element spans
     * @returns {Array} colGroup
     */
    Masonry.prototype._getColGroup = function (colSpan) {
      if (colSpan < 2) {
        // if brick spans only one column, use all the column Ys
        return this.colYs;
      }

      var colGroup = [];
      // how many different places could this brick fit horizontally
      var groupCount = this.cols + 1 - colSpan;
      // for each group potential horizontal position
      for (var i = 0; i < groupCount; i++) {
        // make an array of colY values for that one group
        var groupColYs = this.colYs.slice(i, i + colSpan);
        // and get the max value of the array
        colGroup[i] = Math.max.apply(Math, groupColYs);
      }
      return colGroup;
    };

    Masonry.prototype._manageStamp = function (stamp) {
      var stampSize = getSize(stamp);
      var offset = this._getElementOffset(stamp);
      // get the columns that this stamp affects
      var firstX = this.options.isOriginLeft ? offset.left : offset.right;
      var lastX = firstX + stampSize.outerWidth;
      var firstCol = Math.floor(firstX / this.columnWidth);
      firstCol = Math.max(0, firstCol);
      var lastCol = Math.floor(lastX / this.columnWidth);
      // lastCol should not go over if multiple of columnWidth #425
      lastCol -= lastX % this.columnWidth ? 0 : 1;
      lastCol = Math.min(this.cols - 1, lastCol);
      // set colYs to bottom of the stamp
      var stampMaxY = (this.options.isOriginTop ? offset.top : offset.bottom) + stampSize.outerHeight;
      for (var i = firstCol; i <= lastCol; i++) {
        this.colYs[i] = Math.max(stampMaxY, this.colYs[i]);
      }
    };

    Masonry.prototype._getContainerSize = function () {
      this.maxY = Math.max.apply(Math, this.colYs);
      var size = {
        height: this.maxY
      };

      if (this.options.isFitWidth) {
        size.width = this._getContainerFitWidth();
      }

      return size;
    };

    Masonry.prototype._getContainerFitWidth = function () {
      var unusedCols = 0;
      // count unused columns
      var i = this.cols;
      while (--i) {
        if (this.colYs[i] !== 0) {
          break;
        }
        unusedCols++;
      }
      // fit container to columns that have been used
      return (this.cols - unusedCols) * this.columnWidth - this.gutter;
    };

    Masonry.prototype.needsResizeLayout = function () {
      var previousWidth = this.containerWidth;
      this.getContainerWidth();
      return previousWidth !== this.containerWidth;
    };

    return Masonry;
  }

  // -------------------------- transport -------------------------- //
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('masonry/masonry', ['outlayer/outlayer', 'get-size/get-size'], masonryDefinition);
  } else if (typeof exports === 'object') {
    module.exports = masonryDefinition(
    require('outlayer'), require('get-size'));
  } else {
    // browser global
    window.Masonry = masonryDefinition(
    window.Outlayer, window.getSize);
  }

})(window);

/*!
 * Masonry layout mode
 * sub-classes Masonry
 * http://masonry.desandro.com
 */

(function (window) {



  // -------------------------- helpers -------------------------- //
  // extend objects


  function extend(a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }
    return a;
  }

  // -------------------------- masonryDefinition -------------------------- //
  // used for AMD definition and requires


  function masonryDefinition(LayoutMode, Masonry) {
    // create an Outlayer layout class
    var MasonryMode = LayoutMode.create('masonry');

    // save on to these methods
    var _getElementOffset = MasonryMode.prototype._getElementOffset;
    var layout = MasonryMode.prototype.layout;
    var _getMeasurement = MasonryMode.prototype._getMeasurement;

    // sub-class Masonry
    extend(MasonryMode.prototype, Masonry.prototype);

    // set back, as it was overwritten by Masonry
    MasonryMode.prototype._getElementOffset = _getElementOffset;
    MasonryMode.prototype.layout = layout;
    MasonryMode.prototype._getMeasurement = _getMeasurement;

    var measureColumns = MasonryMode.prototype.measureColumns;
    MasonryMode.prototype.measureColumns = function () {
      // set items, used if measuring first item
      this.items = this.isotope.filteredItems;
      measureColumns.call(this);
    };

    // HACK copy over isOriginLeft/Top options
    var _manageStamp = MasonryMode.prototype._manageStamp;
    MasonryMode.prototype._manageStamp = function () {
      this.options.isOriginLeft = this.isotope.options.isOriginLeft;
      this.options.isOriginTop = this.isotope.options.isOriginTop;
      _manageStamp.apply(this, arguments);
    };

    return MasonryMode;
  }

  // -------------------------- transport -------------------------- //
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('isotope/js/layout-modes/masonry', ['../layout-mode', 'masonry/masonry'], masonryDefinition);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = masonryDefinition(
    require('../layout-mode'), require('masonry-layout'));
  } else {
    // browser global
    masonryDefinition(
    window.Isotope.LayoutMode, window.Masonry);
  }

})(window);

(function (window) {



  function fitRowsDefinition(LayoutMode) {

    var FitRows = LayoutMode.create('fitRows');

    FitRows.prototype._resetLayout = function () {
      this.x = 0;
      this.y = 0;
      this.maxY = 0;
      this._getMeasurement('gutter', 'outerWidth');
    };

    FitRows.prototype._getItemLayoutPosition = function (item) {
      item.getSize();

      var itemWidth = item.size.outerWidth + this.gutter;
      // if this element cannot fit in the current row
      var containerWidth = this.isotope.size.innerWidth + this.gutter;
      if (this.x !== 0 && itemWidth + this.x > containerWidth) {
        this.x = 0;
        this.y = this.maxY;
      }

      var position = {
        x: this.x,
        y: this.y
      };

      this.maxY = Math.max(this.maxY, this.y + item.size.outerHeight);
      this.x += itemWidth;

      return position;
    };

    FitRows.prototype._getContainerSize = function () {
      return {
        height: this.maxY
      };
    };

    return FitRows;

  }

  if (typeof define === 'function' && define.amd) {
    // AMD
    define('isotope/js/layout-modes/fit-rows', ['../layout-mode'], fitRowsDefinition);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = fitRowsDefinition(
    require('../layout-mode'));
  } else {
    // browser global
    fitRowsDefinition(
    window.Isotope.LayoutMode);
  }

})(window);

(function (window) {



  function verticalDefinition(LayoutMode) {

    var Vertical = LayoutMode.create('vertical', {
      horizontalAlignment: 0
    });

    Vertical.prototype._resetLayout = function () {
      this.y = 0;
    };

    Vertical.prototype._getItemLayoutPosition = function (item) {
      item.getSize();
      var x = (this.isotope.size.innerWidth - item.size.outerWidth) * this.options.horizontalAlignment;
      var y = this.y;
      this.y += item.size.outerHeight;
      return {
        x: x,
        y: y
      };
    };

    Vertical.prototype._getContainerSize = function () {
      return {
        height: this.y
      };
    };

    return Vertical;

  }

  if (typeof define === 'function' && define.amd) {
    // AMD
    define('isotope/js/layout-modes/vertical', ['../layout-mode'], verticalDefinition);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = verticalDefinition(
    require('../layout-mode'));
  } else {
    // browser global
    verticalDefinition(
    window.Isotope.LayoutMode);
  }

})(window);

/*!
 * Isotope v2.1.0
 * Filter & sort magical layouts
 * http://isotope.metafizzy.co
 */

(function (window) {



  // -------------------------- vars -------------------------- //
  var jQuery = window.jQuery;

  // -------------------------- helpers -------------------------- //
  // extend objects


  function extend(a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }
    return a;
  }

  var trim = String.prototype.trim ?
  function (str) {
    return str.trim();
  } : function (str) {
    return str.replace(/^\s+|\s+$/g, '');
  };

  var docElem = document.documentElement;

  var getText = docElem.textContent ?
  function (elem) {
    return elem.textContent;
  } : function (elem) {
    return elem.innerText;
  };

  var objToString = Object.prototype.toString;

  function isArray(obj) {
    return objToString.call(obj) === '[object Array]';
  }

  // index of helper cause IE8
  var indexOf = Array.prototype.indexOf ?
  function (ary, obj) {
    return ary.indexOf(obj);
  } : function (ary, obj) {
    for (var i = 0, len = ary.length; i < len; i++) {
      if (ary[i] === obj) {
        return i;
      }
    }
    return -1;
  };

  // turn element or nodeList into an array


  function makeArray(obj) {
    var ary = [];
    if (isArray(obj)) {
      // use object if already an array
      ary = obj;
    } else if (obj && typeof obj.length === 'number') {
      // convert nodeList to array
      for (var i = 0, len = obj.length; i < len; i++) {
        ary.push(obj[i]);
      }
    } else {
      // array of single index
      ary.push(obj);
    }
    return ary;
  }

  function removeFrom(obj, ary) {
    var index = indexOf(ary, obj);
    if (index !== -1) {
      ary.splice(index, 1);
    }
  }

  // -------------------------- isotopeDefinition -------------------------- //
  // used for AMD definition and requires


  function isotopeDefinition(Outlayer, getSize, matchesSelector, Item, LayoutMode) {
    // create an Outlayer layout class
    var Isotope = Outlayer.create('isotope', {
      layoutMode: "masonry",
      isJQueryFiltering: true,
      sortAscending: true
    });

    Isotope.Item = Item;
    Isotope.LayoutMode = LayoutMode;

    Isotope.prototype._create = function () {
      this.itemGUID = 0;
      // functions that sort items
      this._sorters = {};
      this._getSorters();
      // call super
      Outlayer.prototype._create.call(this);

      // create layout modes
      this.modes = {};
      // start filteredItems with all items
      this.filteredItems = this.items;
      // keep of track of sortBys
      this.sortHistory = ['original-order'];
      // create from registered layout modes
      for (var name in LayoutMode.modes) {
        this._initLayoutMode(name);
      }
    };

    Isotope.prototype.reloadItems = function () {
      // reset item ID counter
      this.itemGUID = 0;
      // call super
      Outlayer.prototype.reloadItems.call(this);
    };

    Isotope.prototype._itemize = function () {
      var items = Outlayer.prototype._itemize.apply(this, arguments);
      // assign ID for original-order
      for (var i = 0, len = items.length; i < len; i++) {
        var item = items[i];
        item.id = this.itemGUID++;
      }
      this._updateItemsSortData(items);
      return items;
    };


    // -------------------------- layout -------------------------- //
    Isotope.prototype._initLayoutMode = function (name) {
      var Mode = LayoutMode.modes[name];
      // set mode options
      // HACK extend initial options, back-fill in default options
      var initialOpts = this.options[name] || {};
      this.options[name] = Mode.options ? extend(Mode.options, initialOpts) : initialOpts;
      // init layout mode instance
      this.modes[name] = new Mode(this);
    };


    Isotope.prototype.layout = function () {
      // if first time doing layout, do all magic
      if (!this._isLayoutInited && this.options.isInitLayout) {
        this.arrange();
        return;
      }
      this._layout();
    };

    // private method to be used in layout() & magic()
    Isotope.prototype._layout = function () {
      // don't animate first layout
      var isInstant = this._getIsInstant();
      // layout flow
      this._resetLayout();
      this._manageStamps();
      this.layoutItems(this.filteredItems, isInstant);

      // flag for initalized
      this._isLayoutInited = true;
    };

    // filter + sort + layout
    Isotope.prototype.arrange = function (opts) {
      // set any options pass
      this.option(opts);
      this._getIsInstant();
      // filter, sort, and layout
      this.filteredItems = this._filter(this.items);
      this._sort();
      this._layout();
    };
    // alias to _init for main plugin method
    Isotope.prototype._init = Isotope.prototype.arrange;

    // HACK
    // Don't animate/transition first layout
    // Or don't animate/transition other layouts
    Isotope.prototype._getIsInstant = function () {
      var isInstant = this.options.isLayoutInstant !== undefined ? this.options.isLayoutInstant : !this._isLayoutInited;
      this._isInstant = isInstant;
      return isInstant;
    };

    // -------------------------- filter -------------------------- //
    Isotope.prototype._filter = function (items) {
      var filter = this.options.filter;
      filter = filter || '*';
      var matches = [];
      var hiddenMatched = [];
      var visibleUnmatched = [];

      var test = this._getFilterTest(filter);

      // test each item
      for (var i = 0, len = items.length; i < len; i++) {
        var item = items[i];
        if (item.isIgnored) {
          continue;
        }
        // add item to either matched or unmatched group
        var isMatched = test(item);
        // item.isFilterMatched = isMatched;
        // add to matches if its a match
        if (isMatched) {
          matches.push(item);
        }
        // add to additional group if item needs to be hidden or revealed
        if (isMatched && item.isHidden) {
          hiddenMatched.push(item);
        } else if (!isMatched && !item.isHidden) {
          visibleUnmatched.push(item);
        }
      }

      var _this = this;

      function hideReveal() {
        _this.reveal(hiddenMatched);
        _this.hide(visibleUnmatched);
      }

      if (this._isInstant) {
        this._noTransition(hideReveal);
      } else {
        hideReveal();
      }

      return matches;
    };

    // get a jQuery, function, or a matchesSelector test given the filter
    Isotope.prototype._getFilterTest = function (filter) {
      if (jQuery && this.options.isJQueryFiltering) {
        // use jQuery
        return function (item) {
          return jQuery(item.element).is(filter);
        };
      }
      if (typeof filter === 'function') {
        // use filter as function
        return function (item) {
          return filter(item.element);
        };
      }
      // default, use filter as selector string
      return function (item) {
        return matchesSelector(item.element, filter);
      };
    };

    // -------------------------- sorting -------------------------- //
    /**
     * @params {Array} elems
     * @public
     */
    Isotope.prototype.updateSortData = function (elems) {
      // get items
      var items;
      if (elems) {
        elems = makeArray(elems);
        items = this.getItems(elems);
      } else {
        // update all items if no elems provided
        items = this.items;
      }

      this._getSorters();
      this._updateItemsSortData(items);
    };

    Isotope.prototype._getSorters = function () {
      var getSortData = this.options.getSortData;
      for (var key in getSortData) {
        var sorter = getSortData[key];
        this._sorters[key] = mungeSorter(sorter);
      }
    };

    /**
     * @params {Array} items - of Isotope.Items
     * @private
     */
    Isotope.prototype._updateItemsSortData = function (items) {
      // do not update if no items
      var len = items && items.length;

      for (var i = 0; len && i < len; i++) {
        var item = items[i];
        item.updateSortData();
      }
    };

    // ----- munge sorter ----- //
    // encapsulate this, as we just need mungeSorter
    // other functions in here are just for munging
    var mungeSorter = (function () {
      // add a magic layer to sorters for convienent shorthands
      // `.foo-bar` will use the text of .foo-bar querySelector
      // `[foo-bar]` will use attribute
      // you can also add parser
      // `.foo-bar parseInt` will parse that as a number


      function mungeSorter(sorter) {
        // if not a string, return function or whatever it is
        if (typeof sorter !== 'string') {
          return sorter;
        }
        // parse the sorter string
        var args = trim(sorter).split(' ');
        var query = args[0];
        // check if query looks like [an-attribute]
        var attrMatch = query.match(/^\[(.+)\]$/);
        var attr = attrMatch && attrMatch[1];
        var getValue = getValueGetter(attr, query);
        // use second argument as a parser
        var parser = Isotope.sortDataParsers[args[1]];
        // parse the value, if there was a parser
        sorter = parser ?
        function (elem) {
          return elem && parser(getValue(elem));
        } :
        // otherwise just return value


        function (elem) {
          return elem && getValue(elem);
        };

        return sorter;
      }

      // get an attribute getter, or get text of the querySelector


      function getValueGetter(attr, query) {
        var getValue;
        // if query looks like [foo-bar], get attribute
        if (attr) {
          getValue = function (elem) {
            return elem.getAttribute(attr);
          };
        } else {
          // otherwise, assume its a querySelector, and get its text
          getValue = function (elem) {
            var child = elem.querySelector(query);
            return child && getText(child);
          };
        }
        return getValue;
      }

      return mungeSorter;
    })();

    // parsers used in getSortData shortcut strings
    Isotope.sortDataParsers = {
      'parseInt': function (val) {
        return parseInt(val, 10);
      },
      'parseFloat': function (val) {
        return parseFloat(val);
      }
    };

    // ----- sort method ----- //
    // sort filteredItem order
    Isotope.prototype._sort = function () {
      var sortByOpt = this.options.sortBy;
      if (!sortByOpt) {
        return;
      }
      // concat all sortBy and sortHistory
      var sortBys = [].concat.apply(sortByOpt, this.sortHistory);
      // sort magic
      var itemSorter = getItemSorter(sortBys, this.options.sortAscending);
      this.filteredItems.sort(itemSorter);
      // keep track of sortBy History
      if (sortByOpt !== this.sortHistory[0]) {
        // add to front, oldest goes in last
        this.sortHistory.unshift(sortByOpt);
      }
    };

    // returns a function used for sorting


    function getItemSorter(sortBys, sortAsc) {
      return function sorter(itemA, itemB) {
        // cycle through all sortKeys
        for (var i = 0, len = sortBys.length; i < len; i++) {
          var sortBy = sortBys[i];
          var a = itemA.sortData[sortBy];
          var b = itemB.sortData[sortBy];
          if (a > b || a < b) {
            // if sortAsc is an object, use the value given the sortBy key
            var isAscending = sortAsc[sortBy] !== undefined ? sortAsc[sortBy] : sortAsc;
            var direction = isAscending ? 1 : -1;
            return (a > b ? 1 : -1) * direction;
          }
        }
        return 0;
      };
    }

    // -------------------------- methods -------------------------- //
    // get layout mode
    Isotope.prototype._mode = function () {
      var layoutMode = this.options.layoutMode;
      var mode = this.modes[layoutMode];
      if (!mode) {
        // TODO console.error
        throw new Error('No layout mode: ' + layoutMode);
      }
      // HACK sync mode's options
      // any options set after init for layout mode need to be synced
      mode.options = this.options[layoutMode];
      return mode;
    };

    Isotope.prototype._resetLayout = function () {
      // trigger original reset layout
      Outlayer.prototype._resetLayout.call(this);
      this._mode()._resetLayout();
    };

    Isotope.prototype._getItemLayoutPosition = function (item) {
      return this._mode()._getItemLayoutPosition(item);
    };

    Isotope.prototype._manageStamp = function (stamp) {
      this._mode()._manageStamp(stamp);
    };

    Isotope.prototype._getContainerSize = function () {
      return this._mode()._getContainerSize();
    };

    Isotope.prototype.needsResizeLayout = function () {
      return this._mode().needsResizeLayout();
    };

    // -------------------------- adding & removing -------------------------- //
    // HEADS UP overwrites default Outlayer appended
    Isotope.prototype.appended = function (elems) {
      var items = this.addItems(elems);
      if (!items.length) {
        return;
      }
      var filteredItems = this._filterRevealAdded(items);
      // add to filteredItems
      this.filteredItems = this.filteredItems.concat(filteredItems);
    };

    // HEADS UP overwrites default Outlayer prepended
    Isotope.prototype.prepended = function (elems) {
      var items = this._itemize(elems);
      if (!items.length) {
        return;
      }
      // add items to beginning of collection
      var previousItems = this.items.slice(0);
      this.items = items.concat(previousItems);
      // start new layout
      this._resetLayout();
      this._manageStamps();
      // layout new stuff without transition
      var filteredItems = this._filterRevealAdded(items);
      // layout previous items
      this.layoutItems(previousItems);
      // add to filteredItems
      this.filteredItems = filteredItems.concat(this.filteredItems);
    };

    Isotope.prototype._filterRevealAdded = function (items) {
      var filteredItems = this._noTransition(function () {
        return this._filter(items);
      });
      // layout and reveal just the new items
      this.layoutItems(filteredItems, true);
      this.reveal(filteredItems);
      return items;
    };

    /**
     * Filter, sort, and layout newly-appended item elements
     * @param {Array or NodeList or Element} elems
     */
    Isotope.prototype.insert = function (elems) {
      var items = this.addItems(elems);
      if (!items.length) {
        return;
      }
      // append item elements
      var i, item;
      var len = items.length;
      for (i = 0; i < len; i++) {
        item = items[i];
        this.element.appendChild(item.element);
      }
      // filter new stuff
/*
			 // this way adds hides new filtered items with NO transition
			 // so user can't see if new hidden items have been inserted
			 var filteredInsertItems;
			 this._noTransition( function() {
			 filteredInsertItems = this._filter( items );
			 // hide all new items
			 this.hide( filteredInsertItems );
			 });
			 // */
      // this way hides new filtered items with transition
      // so user at least sees that something has been added
      var filteredInsertItems = this._filter(items);
      // hide all newitems
      this._noTransition(function () {
        this.hide(filteredInsertItems);
      });
      // */
      // set flag
      for (i = 0; i < len; i++) {
        items[i].isLayoutInstant = true;
      }
      this.arrange();
      // reset flag
      for (i = 0; i < len; i++) {
        delete items[i].isLayoutInstant;
      }
      this.reveal(filteredInsertItems);
    };

    var _remove = Isotope.prototype.remove;
    Isotope.prototype.remove = function (elems) {
      elems = makeArray(elems);
      var removeItems = this.getItems(elems);
      // do regular thing
      _remove.call(this, elems);
      // bail if no items to remove
      if (!removeItems || !removeItems.length) {
        return;
      }
      // remove elems from filteredItems
      for (var i = 0, len = removeItems.length; i < len; i++) {
        var item = removeItems[i];
        // remove item from collection
        removeFrom(item, this.filteredItems);
      }
    };

    Isotope.prototype.shuffle = function () {
      // update random sortData
      for (var i = 0, len = this.items.length; i < len; i++) {
        var item = this.items[i];
        item.sortData.random = Math.random();
      }
      this.options.sortBy = 'random';
      this._sort();
      this._layout();
    };

    /**
     * trigger fn without transition
     * kind of hacky to have this in the first place
     * @param {Function} fn
     * @returns ret
     * @private
     */
    Isotope.prototype._noTransition = function (fn) {
      // save transitionDuration before disabling
      var transitionDuration = this.options.transitionDuration;
      // disable transition
      this.options.transitionDuration = 0;
      // do it
      var returnValue = fn.call(this);
      // re-enable transition for reveal
      this.options.transitionDuration = transitionDuration;
      return returnValue;
    };

    // ----- helper methods ----- //
    /**
     * getter method for getting filtered item elements
     * @returns {Array} elems - collection of item elements
     */
    Isotope.prototype.getFilteredItemElements = function () {
      var elems = [];
      for (var i = 0, len = this.filteredItems.length; i < len; i++) {
        elems.push(this.filteredItems[i].element);
      }
      return elems;
    };

    // -----  ----- //
    return Isotope;
  }

  // -------------------------- transport -------------------------- //
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['outlayer/outlayer', 'get-size/get-size', 'matches-selector/matches-selector', 'isotope/js/item', 'isotope/js/layout-mode',
    // include default layout modes
    'isotope/js/layout-modes/masonry', 'isotope/js/layout-modes/fit-rows', 'isotope/js/layout-modes/vertical'], isotopeDefinition);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = isotopeDefinition(
    require('outlayer'), require('get-size'), require('desandro-matches-selector'), require('./item'), require('./layout-mode'),
    // include default layout modes
    require('./layout-modes/masonry'), require('./layout-modes/fit-rows'), require('./layout-modes/vertical'));
  } else {
    // browser global
    window.Isotope = isotopeDefinition(
    window.Outlayer, window.getSize, window.matchesSelector, window.Isotope.Item, window.Isotope.LayoutMode);
  }

})(window);

/*!
 * VERSION: 0.1.8
 * DATE: 2014-06-21
 * UPDATES AND DOCS AT: http://www.greensock.com/jquery-gsap-plugin/
 *
 * Requires TweenLite version 1.8.0 or higher and CSSPlugin.
 *
 * @license Copyright (c) 2014, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 */
(function (t) {
  "use strict";
  var e, i, s, r = t.fn.animate,
      n = t.fn.stop,
      a = !0,
      o = function (t) {
      var e, i = {};
      for (e in t) i[e] = t[e];
      return i
      },
      h = {
      overwrite: 1,
      delay: 1,
      useFrames: 1,
      runBackwards: 1,
      easeParams: 1,
      yoyo: 1,
      immediateRender: 1,
      repeat: 1,
      repeatDelay: 1,
      autoCSS: 1
      },
      l = function (t, e) {
      for (var i in h) h[i] && void 0 !== t[i] && (e[i] = t[i])
      },
      _ = function (t) {
      return function (e) {
        return t.getRatio(e)
      }
      },
      u = {},
      c = function () {
      var r, n, a, o = window.GreenSockGlobals || window;
      if (e = o.TweenMax || o.TweenLite, e && (r = (e.version + ".0.0").split("."), n = !(Number(r[0]) > 0 && Number(r[1]) > 7), o = o.com.greensock, i = o.plugins.CSSPlugin, u = o.easing.Ease.map || {}), !e || !i || n) return e = null, !s && window.console && (window.console.log("The jquery.gsap.js plugin requires the TweenMax (or at least TweenLite and CSSPlugin) JavaScript file(s)." + (n ? " Version " + r.join(".") + " is too old." : "")), s = !0), void 0;
      if (t.easing) {
        for (a in u) t.easing[a] = _(u[a]);
        c = !1
      }
      };
  t.fn.animate = function (s, n, h, _) {
    if (s = s || {}, c && (c(), !e || !i)) return r.call(this, s, n, h, _);
    if (!a || s.skipGSAP === !0 || "object" == typeof n && "function" == typeof n.step || null != s.scrollTop || null != s.scrollLeft) return r.call(this, s, n, h, _);
    var f, p, m, d, g = t.speed(n, h, _),
        v = {
        ease: u[g.easing] || (g.easing === !1 ? u.linear : u.swing)
        },
        T = this,
        y = "object" == typeof n ? n.specialEasing : null;
    for (p in s) {
      if (f = s[p], f instanceof Array && u[f[1]] && (y = y || {}, y[p] = f[1], f = f[0]), "toggle" === f || "hide" === f || "show" === f) return r.call(this, s, n, h, _);
      v[-1 === p.indexOf("-") ? p : t.camelCase(p)] = f
    }
    if (y) {
      v = o(v), d = [];
      for (p in y) f = d[d.length] = {}, l(v, f), f.ease = u[y[p]] || v.ease, -1 !== p.indexOf("-") && (p = t.camelCase(p)), f[p] = v[p], delete v[p];
      0 === d.length && (d = null)
    }
    return m = function (i) {
      var s, r = o(v);
      if (d) for (s = d.length; --s > -1;) e.to(this, t.fx.off ? 0 : g.duration / 1e3, d[s]);
      r.onComplete = function () {
        i ? i() : g.old && t(this).each(g.old)
      }, e.to(this, t.fx.off ? 0 : g.duration / 1e3, r)
    }, g.queue !== !1 ? (T.queue(g.queue, m), "function" == typeof g.old && T.queue(g.queue, function (t) {
      g.old(), t()
    })) : m.call(T), T
  }, t.fn.stop = function (t, i) {
    if (n.call(this, t, i), e) {
      if (i) for (var s, r = e.getTweensOf(this), a = r.length; --a > -1;) s = r[a].totalTime() / r[a].totalDuration(), s > 0 && 1 > s && r[a].seek(r[a].totalDuration());
      e.killTweensOf(this)
    }
    return this
  }, t.gsap = {
    enabled: function (t) {
      a = t
    },
    version: "0.1.8"
  }
})(jQuery);
/*! Magnific Popup - v1.0.0 - 2014-12-12
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2014 Dmitry Semenov; */
;
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals
    factory(window.jQuery || window.Zepto);
  }
}(function ($) {

  /*>>core*/
  /**
   *
   * Magnific Popup Core JS file
   *
   */


  /**
   * Private static constants
   */
  var CLOSE_EVENT = 'Close',
      BEFORE_CLOSE_EVENT = 'BeforeClose',
      AFTER_CLOSE_EVENT = 'AfterClose',
      BEFORE_APPEND_EVENT = 'BeforeAppend',
      MARKUP_PARSE_EVENT = 'MarkupParse',
      OPEN_EVENT = 'Open',
      CHANGE_EVENT = 'Change',
      NS = 'mfp',
      EVENT_NS = '.' + NS,
      READY_CLASS = 'mfp-ready',
      REMOVING_CLASS = 'mfp-removing',
      PREVENT_CLOSE_CLASS = 'mfp-prevent-close';


  /**
   * Private vars
   */
  var mfp, // As we have only one instance of MagnificPopup object, we define it locally to not to use 'this'
  MagnificPopup = function () {},
      _isJQ = !! (window.jQuery),
      _prevStatus, _window = $(window),
      _body, _document, _prevContentType, _wrapClasses, _currPopupType;


  /**
   * Private functions
   */
  var _mfpOn = function (name, f) {
    mfp.ev.on(NS + name + EVENT_NS, f);
  },
      _getEl = function (className, appendTo, html, raw) {
      var el = document.createElement('div');
      el.className = 'mfp-' + className;
      if (html) {
        el.innerHTML = html;
      }
      if (!raw) {
        el = $(el);
        if (appendTo) {
          el.appendTo(appendTo);
        }
      } else if (appendTo) {
        appendTo.appendChild(el);
      }
      return el;
      },
      _mfpTrigger = function (e, data) {
      mfp.ev.triggerHandler(NS + e, data);

      if (mfp.st.callbacks) {
        // converts "mfpEventName" to "eventName" callback and triggers it if it's present
        e = e.charAt(0).toLowerCase() + e.slice(1);
        if (mfp.st.callbacks[e]) {
          mfp.st.callbacks[e].apply(mfp, $.isArray(data) ? data : [data]);
        }
      }
      },
      _getCloseBtn = function (type) {
      if (type !== _currPopupType || !mfp.currTemplate.closeBtn) {
        mfp.currTemplate.closeBtn = $(mfp.st.closeMarkup.replace('%title%', mfp.st.tClose));
        _currPopupType = type;
      }
      return mfp.currTemplate.closeBtn;
      },


      // Initialize Magnific Popup only when called at least once
      _checkInstance = function () {
      if (!$.magnificPopup.instance) {
        mfp = new MagnificPopup();
        mfp.init();
        $.magnificPopup.instance = mfp;
      }
      },


      // CSS transition detection, http://stackoverflow.com/questions/7264899/detect-css-transitions-using-javascript-and-without-modernizr
      supportsTransitions = function () {
      var s = document.createElement('p').style,
           // 's' for style. better to create an element if body yet to exist
          v = ['ms', 'O', 'Moz', 'Webkit']; // 'v' for vendor
      if (s['transition'] !== undefined) {
        return true;
      }

      while (v.length) {
        if (v.pop() + 'Transition' in s) {
          return true;
        }
      }

      return false;
      };



  /**
   * Public functions
   */
  MagnificPopup.prototype = {

    constructor: MagnificPopup,

    /**
     * Initializes Magnific Popup plugin.
     * This function is triggered only once when $.fn.magnificPopup or $.magnificPopup is executed
     */
    init: function () {
      var appVersion = navigator.appVersion;
      mfp.isIE7 = appVersion.indexOf("MSIE 7.") !== -1;
      mfp.isIE8 = appVersion.indexOf("MSIE 8.") !== -1;
      mfp.isLowIE = mfp.isIE7 || mfp.isIE8;
      mfp.isAndroid = (/android/gi).test(appVersion);
      mfp.isIOS = (/iphone|ipad|ipod/gi).test(appVersion);
      mfp.supportsTransition = supportsTransitions();

      // We disable fixed positioned lightbox on devices that don't handle it nicely.
      // If you know a better way of detecting this - let me know.
      mfp.probablyMobile = (mfp.isAndroid || mfp.isIOS || /(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent));
      _document = $(document);

      mfp.popupsCache = {};
    },

    /**
     * Opens popup
     * @param  data [description]
     */
    open: function (data) {

      if (!_body) {
        _body = $(document.body);
      }

      var i;

      if (data.isObj === false) {
        // convert jQuery collection to array to avoid conflicts later
        mfp.items = data.items.toArray();

        mfp.index = 0;
        var items = data.items,
            item;
        for (i = 0; i < items.length; i++) {
          item = items[i];
          if (item.parsed) {
            item = item.el[0];
          }
          if (item === data.el[0]) {
            mfp.index = i;
            break;
          }
        }
      } else {
        mfp.items = $.isArray(data.items) ? data.items : [data.items];
        mfp.index = data.index || 0;
      }

      // if popup is already opened - we just update the content
      if (mfp.isOpen) {
        mfp.updateItemHTML();
        return;
      }

      mfp.types = [];
      _wrapClasses = '';
      if (data.mainEl && data.mainEl.length) {
        mfp.ev = data.mainEl.eq(0);
      } else {
        mfp.ev = _document;
      }

      if (data.key) {
        if (!mfp.popupsCache[data.key]) {
          mfp.popupsCache[data.key] = {};
        }
        mfp.currTemplate = mfp.popupsCache[data.key];
      } else {
        mfp.currTemplate = {};
      }



      mfp.st = $.extend(true, {}, $.magnificPopup.defaults, data);
      mfp.fixedContentPos = mfp.st.fixedContentPos === 'auto' ? !mfp.probablyMobile : mfp.st.fixedContentPos;

      if (mfp.st.modal) {
        mfp.st.closeOnContentClick = false;
        mfp.st.closeOnBgClick = false;
        mfp.st.showCloseBtn = false;
        mfp.st.enableEscapeKey = false;
      }


      // Building markup
      // main containers are created only once
      if (!mfp.bgOverlay) {

        // Dark overlay
        mfp.bgOverlay = _getEl('bg').on('click' + EVENT_NS, function () {
          mfp.close();
        });

        mfp.wrap = _getEl('wrap').attr('tabindex', -1).on('click' + EVENT_NS, function (e) {
          if (mfp._checkIfClose(e.target)) {
            mfp.close();
          }
        });

        mfp.container = _getEl('container', mfp.wrap);
      }

      mfp.contentContainer = _getEl('content');
      if (mfp.st.preloader) {
        mfp.preloader = _getEl('preloader', mfp.container, mfp.st.tLoading);
      }


      // Initializing modules
      var modules = $.magnificPopup.modules;
      for (i = 0; i < modules.length; i++) {
        var n = modules[i];
        n = n.charAt(0).toUpperCase() + n.slice(1);
        mfp['init' + n].call(mfp);
      }
      _mfpTrigger('BeforeOpen');


      if (mfp.st.showCloseBtn) {
        // Close button
        if (!mfp.st.closeBtnInside) {
          mfp.wrap.append(_getCloseBtn());
        } else {
          _mfpOn(MARKUP_PARSE_EVENT, function (e, template, values, item) {
            values.close_replaceWith = _getCloseBtn(item.type);
          });
          _wrapClasses += ' mfp-close-btn-in';
        }
      }

      if (mfp.st.alignTop) {
        _wrapClasses += ' mfp-align-top';
      }



      if (mfp.fixedContentPos) {
        mfp.wrap.css({
          overflow: mfp.st.overflowY,
          overflowX: 'hidden',
          overflowY: mfp.st.overflowY
        });
      } else {
        mfp.wrap.css({
          top: _window.scrollTop(),
          position: 'absolute'
        });
      }
      if (mfp.st.fixedBgPos === false || (mfp.st.fixedBgPos === 'auto' && !mfp.fixedContentPos)) {
        mfp.bgOverlay.css({
          height: _document.height(),
          position: 'absolute'
        });
      }



      if (mfp.st.enableEscapeKey) {
        // Close on ESC key
        _document.on('keyup' + EVENT_NS, function (e) {
          if (e.keyCode === 27) {
            mfp.close();
          }
        });
      }

      _window.on('resize' + EVENT_NS, function () {
        mfp.updateSize();
      });


      if (!mfp.st.closeOnContentClick) {
        _wrapClasses += ' mfp-auto-cursor';
      }

      if (_wrapClasses) mfp.wrap.addClass(_wrapClasses);


      // this triggers recalculation of layout, so we get it once to not to trigger twice
      var windowHeight = mfp.wH = _window.height();


      var windowStyles = {};

      if (mfp.fixedContentPos) {
        if (mfp._hasScrollBar(windowHeight)) {
          var s = mfp._getScrollbarSize();
          if (s) {
            windowStyles.marginRight = s;
          }
        }
      }

      if (mfp.fixedContentPos) {
        if (!mfp.isIE7) {
          windowStyles.overflow = 'hidden';
        } else {
          // ie7 double-scroll bug
          $('body, html').css('overflow', 'hidden');
        }
      }



      var classesToadd = mfp.st.mainClass;
      if (mfp.isIE7) {
        classesToadd += ' mfp-ie7';
      }
      if (classesToadd) {
        mfp._addClassToMFP(classesToadd);
      }

      // add content
      mfp.updateItemHTML();

      _mfpTrigger('BuildControls');

      // remove scrollbar, add margin e.t.c
      $('html').css(windowStyles);

      // add everything to DOM
      mfp.bgOverlay.add(mfp.wrap).prependTo(mfp.st.prependTo || _body);

      // Save last focused element
      mfp._lastFocusedEl = document.activeElement;

      // Wait for next cycle to allow CSS transition
      setTimeout(function () {

        if (mfp.content) {
          mfp._addClassToMFP(READY_CLASS);
          mfp._setFocus();
        } else {
          // if content is not defined (not loaded e.t.c) we add class only for BG
          mfp.bgOverlay.addClass(READY_CLASS);
        }

        // Trap the focus in popup
        _document.on('focusin' + EVENT_NS, mfp._onFocusIn);

      }, 16);

      mfp.isOpen = true;
      mfp.updateSize(windowHeight);
      _mfpTrigger(OPEN_EVENT);

      return data;
    },

    /**
     * Closes the popup
     */
    close: function () {
      if (!mfp.isOpen) return;
      _mfpTrigger(BEFORE_CLOSE_EVENT);

      mfp.isOpen = false;
      // for CSS3 animation
      if (mfp.st.removalDelay && !mfp.isLowIE && mfp.supportsTransition) {
        mfp._addClassToMFP(REMOVING_CLASS);
        setTimeout(function () {
          mfp._close();
        }, mfp.st.removalDelay);
      } else {
        mfp._close();
      }
    },

    /**
     * Helper for close() function
     */
    _close: function () {
      _mfpTrigger(CLOSE_EVENT);

      var classesToRemove = REMOVING_CLASS + ' ' + READY_CLASS + ' ';

      mfp.bgOverlay.detach();
      mfp.wrap.detach();
      mfp.container.empty();

      if (mfp.st.mainClass) {
        classesToRemove += mfp.st.mainClass + ' ';
      }

      mfp._removeClassFromMFP(classesToRemove);

      if (mfp.fixedContentPos) {
        var windowStyles = {
          marginRight: ''
        };
        if (mfp.isIE7) {
          $('body, html').css('overflow', '');
        } else {
          windowStyles.overflow = '';
        }
        $('html').css(windowStyles);
      }

      _document.off('keyup' + EVENT_NS + ' focusin' + EVENT_NS);
      mfp.ev.off(EVENT_NS);

      // clean up DOM elements that aren't removed
      mfp.wrap.attr('class', 'mfp-wrap').removeAttr('style');
      mfp.bgOverlay.attr('class', 'mfp-bg');
      mfp.container.attr('class', 'mfp-container');

      // remove close button from target element
      if (mfp.st.showCloseBtn && (!mfp.st.closeBtnInside || mfp.currTemplate[mfp.currItem.type] === true)) {
        if (mfp.currTemplate.closeBtn) mfp.currTemplate.closeBtn.detach();
      }


      if (mfp._lastFocusedEl) {
        $(mfp._lastFocusedEl).focus(); // put tab focus back
      }
      mfp.currItem = null;
      mfp.content = null;
      mfp.currTemplate = null;
      mfp.prevHeight = 0;

      _mfpTrigger(AFTER_CLOSE_EVENT);
    },

    updateSize: function (winHeight) {

      if (mfp.isIOS) {
        // fixes iOS nav bars https://github.com/dimsemenov/Magnific-Popup/issues/2
        var zoomLevel = document.documentElement.clientWidth / window.innerWidth;
        var height = window.innerHeight * zoomLevel;
        mfp.wrap.css('height', height);
        mfp.wH = height;
      } else {
        mfp.wH = winHeight || _window.height();
      }
      // Fixes #84: popup incorrectly positioned with position:relative on body
      if (!mfp.fixedContentPos) {
        mfp.wrap.css('height', mfp.wH);
      }

      _mfpTrigger('Resize');

    },

    /**
     * Set content of popup based on current index
     */
    updateItemHTML: function () {
      var item = mfp.items[mfp.index];

      // Detach and perform modifications
      mfp.contentContainer.detach();

      if (mfp.content) mfp.content.detach();

      if (!item.parsed) {
        item = mfp.parseEl(mfp.index);
      }

      var type = item.type;

      _mfpTrigger('BeforeChange', [mfp.currItem ? mfp.currItem.type : '', type]);
      // BeforeChange event works like so:
      // _mfpOn('BeforeChange', function(e, prevType, newType) { });
      mfp.currItem = item;





      if (!mfp.currTemplate[type]) {
        var markup = mfp.st[type] ? mfp.st[type].markup : false;

        // allows to modify markup
        _mfpTrigger('FirstMarkupParse', markup);

        if (markup) {
          mfp.currTemplate[type] = $(markup);
        } else {
          // if there is no markup found we just define that template is parsed
          mfp.currTemplate[type] = true;
        }
      }

      if (_prevContentType && _prevContentType !== item.type) {
        mfp.container.removeClass('mfp-' + _prevContentType + '-holder');
      }

      var newContent = mfp['get' + type.charAt(0).toUpperCase() + type.slice(1)](item, mfp.currTemplate[type]);
      mfp.appendContent(newContent, type);

      item.preloaded = true;

      _mfpTrigger(CHANGE_EVENT, item);
      _prevContentType = item.type;

      // Append container back after its content changed
      mfp.container.prepend(mfp.contentContainer);

      _mfpTrigger('AfterChange');
    },


    /**
     * Set HTML content of popup
     */
    appendContent: function (newContent, type) {
      mfp.content = newContent;

      if (newContent) {
        if (mfp.st.showCloseBtn && mfp.st.closeBtnInside && mfp.currTemplate[type] === true) {
          // if there is no markup, we just append close button element inside
          if (!mfp.content.find('.mfp-close').length) {
            mfp.content.append(_getCloseBtn());
          }
        } else {
          mfp.content = newContent;
        }
      } else {
        mfp.content = '';
      }

      _mfpTrigger(BEFORE_APPEND_EVENT);
      mfp.container.addClass('mfp-' + type + '-holder');

      mfp.contentContainer.append(mfp.content);
    },




    /**
     * Creates Magnific Popup data object based on given data
     * @param  {int} index Index of item to parse
     */
    parseEl: function (index) {
      var item = mfp.items[index],
          type;

      if (item.tagName) {
        item = {
          el: $(item)
        };
      } else {
        type = item.type;
        item = {
          data: item,
          src: item.src
        };
      }

      if (item.el) {
        var types = mfp.types;

        // check for 'mfp-TYPE' class
        for (var i = 0; i < types.length; i++) {
          if (item.el.hasClass('mfp-' + types[i])) {
            type = types[i];
            break;
          }
        }

        item.src = item.el.attr('data-mfp-src');
        if (!item.src) {
          item.src = item.el.attr('href');
        }
      }

      item.type = type || mfp.st.type || 'inline';
      item.index = index;
      item.parsed = true;
      mfp.items[index] = item;
      _mfpTrigger('ElementParse', item);

      return mfp.items[index];
    },


    /**
     * Initializes single popup or a group of popups
     */
    addGroup: function (el, options) {
      var eHandler = function (e) {
        e.mfpEl = this;
        mfp._openClick(e, el, options);
      };

      if (!options) {
        options = {};
      }

      var eName = 'click.magnificPopup';
      options.mainEl = el;

      if (options.items) {
        options.isObj = true;
        el.off(eName).on(eName, eHandler);
      } else {
        options.isObj = false;
        if (options.delegate) {
          el.off(eName).on(eName, options.delegate, eHandler);
        } else {
          options.items = el;
          el.off(eName).on(eName, eHandler);
        }
      }
    },
    _openClick: function (e, el, options) {
      var midClick = options.midClick !== undefined ? options.midClick : $.magnificPopup.defaults.midClick;


      if (!midClick && (e.which === 2 || e.ctrlKey || e.metaKey)) {
        return;
      }

      var disableOn = options.disableOn !== undefined ? options.disableOn : $.magnificPopup.defaults.disableOn;

      if (disableOn) {
        if ($.isFunction(disableOn)) {
          if (!disableOn.call(mfp)) {
            return true;
          }
        } else { // else it's number
          if (_window.width() < disableOn) {
            return true;
          }
        }
      }

      if (e.type) {
        e.preventDefault();

        // This will prevent popup from closing if element is inside and popup is already opened
        if (mfp.isOpen) {
          e.stopPropagation();
        }
      }


      options.el = $(e.mfpEl);
      if (options.delegate) {
        options.items = el.find(options.delegate);
      }
      mfp.open(options);
    },


    /**
     * Updates text on preloader
     */
    updateStatus: function (status, text) {

      if (mfp.preloader) {
        if (_prevStatus !== status) {
          mfp.container.removeClass('mfp-s-' + _prevStatus);
        }

        if (!text && status === 'loading') {
          text = mfp.st.tLoading;
        }

        var data = {
          status: status,
          text: text
        };
        // allows to modify status
        _mfpTrigger('UpdateStatus', data);

        status = data.status;
        text = data.text;

        mfp.preloader.html(text);

        mfp.preloader.find('a').on('click', function (e) {
          e.stopImmediatePropagation();
        });

        mfp.container.addClass('mfp-s-' + status);
        _prevStatus = status;
      }
    },


/*
		"Private" helpers that aren't private at all
	 */
    // Check to close popup or not
    // "target" is an element that was clicked
    _checkIfClose: function (target) {

      if ($(target).hasClass(PREVENT_CLOSE_CLASS)) {
        return;
      }

      var closeOnContent = mfp.st.closeOnContentClick;
      var closeOnBg = mfp.st.closeOnBgClick;

      if (closeOnContent && closeOnBg) {
        return true;
      } else {

        // We close the popup if click is on close button or on preloader. Or if there is no content.
        if (!mfp.content || $(target).hasClass('mfp-close') || (mfp.preloader && target === mfp.preloader[0])) {
          return true;
        }

        // if click is outside the content
        if ((target !== mfp.content[0] && !$.contains(mfp.content[0], target))) {
          if (closeOnBg) {
            // last check, if the clicked element is in DOM, (in case it's removed onclick)
            if ($.contains(document, target)) {
              return true;
            }
          }
        } else if (closeOnContent) {
          return true;
        }

      }
      return false;
    },
    _addClassToMFP: function (cName) {
      mfp.bgOverlay.addClass(cName);
      mfp.wrap.addClass(cName);
    },
    _removeClassFromMFP: function (cName) {
      this.bgOverlay.removeClass(cName);
      mfp.wrap.removeClass(cName);
    },
    _hasScrollBar: function (winHeight) {
      return ((mfp.isIE7 ? _document.height() : document.body.scrollHeight) > (winHeight || _window.height()));
    },
    _setFocus: function () {
      (mfp.st.focus ? mfp.content.find(mfp.st.focus).eq(0) : mfp.wrap).focus();
    },
    _onFocusIn: function (e) {
      if (e.target !== mfp.wrap[0] && !$.contains(mfp.wrap[0], e.target)) {
        mfp._setFocus();
        return false;
      }
    },
    _parseMarkup: function (template, values, item) {
      var arr;
      if (item.data) {
        values = $.extend(item.data, values);
      }
      _mfpTrigger(MARKUP_PARSE_EVENT, [template, values, item]);

      $.each(values, function (key, value) {
        if (value === undefined || value === false) {
          return true;
        }
        arr = key.split('_');
        if (arr.length > 1) {
          var el = template.find(EVENT_NS + '-' + arr[0]);

          if (el.length > 0) {
            var attr = arr[1];
            if (attr === 'replaceWith') {
              if (el[0] !== value[0]) {
                el.replaceWith(value);
              }
            } else if (attr === 'img') {
              if (el.is('img')) {
                el.attr('src', value);
              } else {
                el.replaceWith('<img src="' + value + '" class="' + el.attr('class') + '" />');
              }
            } else {
              el.attr(arr[1], value);
            }
          }

        } else {
          template.find(EVENT_NS + '-' + key).html(value);
        }
      });
    },

    _getScrollbarSize: function () {
      // thx David
      if (mfp.scrollbarSize === undefined) {
        var scrollDiv = document.createElement("div");
        scrollDiv.style.cssText = 'width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;';
        document.body.appendChild(scrollDiv);
        mfp.scrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
      }
      return mfp.scrollbarSize;
    }

  }; /* MagnificPopup core prototype end */




  /**
   * Public static functions
   */
  $.magnificPopup = {
    instance: null,
    proto: MagnificPopup.prototype,
    modules: [],

    open: function (options, index) {
      _checkInstance();

      if (!options) {
        options = {};
      } else {
        options = $.extend(true, {}, options);
      }


      options.isObj = true;
      options.index = index || 0;
      return this.instance.open(options);
    },

    close: function () {
      return $.magnificPopup.instance && $.magnificPopup.instance.close();
    },

    registerModule: function (name, module) {
      if (module.options) {
        $.magnificPopup.defaults[name] = module.options;
      }
      $.extend(this.proto, module.proto);
      this.modules.push(name);
    },

    defaults: {

      // Info about options is in docs:
      // http://dimsemenov.com/plugins/magnific-popup/documentation.html#options
      disableOn: 0,

      key: null,

      midClick: false,

      mainClass: '',

      preloader: true,

      focus: '',
      // CSS selector of input to focus after popup is opened
      closeOnContentClick: false,

      closeOnBgClick: true,

      closeBtnInside: true,

      showCloseBtn: true,

      enableEscapeKey: true,

      modal: false,

      alignTop: false,

      removalDelay: 0,

      prependTo: null,

      fixedContentPos: 'auto',

      fixedBgPos: 'auto',

      overflowY: 'auto',

      closeMarkup: '<button title="%title%" type="button" class="mfp-close">&times;</button>',

      tClose: 'Close (Esc)',

      tLoading: 'Loading...'

    }
  };



  $.fn.magnificPopup = function (options) {
    _checkInstance();

    var jqEl = $(this);

    // We call some API method of first param is a string
    if (typeof options === "string") {

      if (options === 'open') {
        var items, itemOpts = _isJQ ? jqEl.data('magnificPopup') : jqEl[0].magnificPopup,
            index = parseInt(arguments[1], 10) || 0;

        if (itemOpts.items) {
          items = itemOpts.items[index];
        } else {
          items = jqEl;
          if (itemOpts.delegate) {
            items = items.find(itemOpts.delegate);
          }
          items = items.eq(index);
        }
        mfp._openClick({
          mfpEl: items
        }, jqEl, itemOpts);
      } else {
        if (mfp.isOpen) mfp[options].apply(mfp, Array.prototype.slice.call(arguments, 1));
      }

    } else {
      // clone options obj
      options = $.extend(true, {}, options);

/*
		 * As Zepto doesn't support .data() method for objects
		 * and it works only in normal browsers
		 * we assign "options" object directly to the DOM element. FTW!
		 */
      if (_isJQ) {
        jqEl.data('magnificPopup', options);
      } else {
        jqEl[0].magnificPopup = options;
      }

      mfp.addGroup(jqEl, options);

    }
    return jqEl;
  };


  //Quick benchmark
/*
var start = performance.now(),
	i,
	rounds = 1000;

for(i = 0; i < rounds; i++) {

}
console.log('Test #1:', performance.now() - start);

start = performance.now();
for(i = 0; i < rounds; i++) {

}
console.log('Test #2:', performance.now() - start);
*/


  /*>>core*/

  /*>>inline*/

  var INLINE_NS = 'inline',
      _hiddenClass, _inlinePlaceholder, _lastInlineElement, _putInlineElementsBack = function () {
      if (_lastInlineElement) {
        _inlinePlaceholder.after(_lastInlineElement.addClass(_hiddenClass)).detach();
        _lastInlineElement = null;
      }
      };

  $.magnificPopup.registerModule(INLINE_NS, {
    options: {
      hiddenClass: 'hide',
      // will be appended with `mfp-` prefix
      markup: '',
      tNotFound: 'Content not found'
    },
    proto: {

      initInline: function () {
        mfp.types.push(INLINE_NS);

        _mfpOn(CLOSE_EVENT + '.' + INLINE_NS, function () {
          _putInlineElementsBack();
        });
      },

      getInline: function (item, template) {

        _putInlineElementsBack();

        if (item.src) {
          var inlineSt = mfp.st.inline,
              el = $(item.src);

          if (el.length) {

            // If target element has parent - we replace it with placeholder and put it back after popup is closed
            var parent = el[0].parentNode;
            if (parent && parent.tagName) {
              if (!_inlinePlaceholder) {
                _hiddenClass = inlineSt.hiddenClass;
                _inlinePlaceholder = _getEl(_hiddenClass);
                _hiddenClass = 'mfp-' + _hiddenClass;
              }
              // replace target inline element with placeholder
              _lastInlineElement = el.after(_inlinePlaceholder).detach().removeClass(_hiddenClass);
            }

            mfp.updateStatus('ready');
          } else {
            mfp.updateStatus('error', inlineSt.tNotFound);
            el = $('<div>');
          }

          item.inlineElement = el;
          return el;
        }

        mfp.updateStatus('ready');
        mfp._parseMarkup(template, {}, item);
        return template;
      }
    }
  });

  /*>>inline*/

  /*>>ajax*/
  var AJAX_NS = 'ajax',
      _ajaxCur, _removeAjaxCursor = function () {
      if (_ajaxCur) {
        _body.removeClass(_ajaxCur);
      }
      },
      _destroyAjaxRequest = function () {
      _removeAjaxCursor();
      if (mfp.req) {
        mfp.req.abort();
      }
      };

  $.magnificPopup.registerModule(AJAX_NS, {

    options: {
      settings: null,
      cursor: 'mfp-ajax-cur',
      tError: '<a href="%url%">The content</a> could not be loaded.'
    },

    proto: {
      initAjax: function () {
        mfp.types.push(AJAX_NS);
        _ajaxCur = mfp.st.ajax.cursor;

        _mfpOn(CLOSE_EVENT + '.' + AJAX_NS, _destroyAjaxRequest);
        _mfpOn('BeforeChange.' + AJAX_NS, _destroyAjaxRequest);
      },
      getAjax: function (item) {

        if (_ajaxCur) _body.addClass(_ajaxCur);

        mfp.updateStatus('loading');

        var opts = $.extend({
          url: item.src,
          success: function (data, textStatus, jqXHR) {
            var temp = {
              data: data,
              xhr: jqXHR
            };

            _mfpTrigger('ParseAjax', temp);

            mfp.appendContent($(temp.data), AJAX_NS);

            item.finished = true;

            _removeAjaxCursor();

            mfp._setFocus();

            setTimeout(function () {
              mfp.wrap.addClass(READY_CLASS);
            }, 16);

            mfp.updateStatus('ready');

            _mfpTrigger('AjaxContentAdded');
          },
          error: function () {
            _removeAjaxCursor();
            item.finished = item.loadError = true;
            mfp.updateStatus('error', mfp.st.ajax.tError.replace('%url%', item.src));
          }
        }, mfp.st.ajax.settings);

        mfp.req = $.ajax(opts);

        return '';
      }
    }
  });







  /*>>ajax*/

  /*>>image*/
  var _imgInterval, _getTitle = function (item) {
    if (item.data && item.data.title !== undefined) return item.data.title;

    var src = mfp.st.image.titleSrc;

    if (src) {
      if ($.isFunction(src)) {
        return src.call(mfp, item);
      } else if (item.el) {
        return item.el.attr(src) || '';
      }
    }
    return '';
  };

  $.magnificPopup.registerModule('image', {

    options: {
      markup: '<div class="mfp-figure">' + '<div class="mfp-close"></div>' + '<figure>' + '<div class="mfp-img"></div>' + '<figcaption>' + '<div class="mfp-bottom-bar">' + '<div class="mfp-title"></div>' + '<div class="mfp-counter"></div>' + '</div>' + '</figcaption>' + '</figure>' + '</div>',
      cursor: 'mfp-zoom-out-cur',
      titleSrc: 'title',
      verticalFit: true,
      tError: '<a href="%url%">The image</a> could not be loaded.'
    },

    proto: {
      initImage: function () {
        var imgSt = mfp.st.image,
            ns = '.image';

        mfp.types.push('image');

        _mfpOn(OPEN_EVENT + ns, function () {
          if (mfp.currItem.type === 'image' && imgSt.cursor) {
            _body.addClass(imgSt.cursor);
          }
        });

        _mfpOn(CLOSE_EVENT + ns, function () {
          if (imgSt.cursor) {
            _body.removeClass(imgSt.cursor);
          }
          _window.off('resize' + EVENT_NS);
        });

        _mfpOn('Resize' + ns, mfp.resizeImage);
        if (mfp.isLowIE) {
          _mfpOn('AfterChange', mfp.resizeImage);
        }
      },
      resizeImage: function () {
        var item = mfp.currItem;
        if (!item || !item.img) return;

        if (mfp.st.image.verticalFit) {
          var decr = 0;
          // fix box-sizing in ie7/8
          if (mfp.isLowIE) {
            decr = parseInt(item.img.css('padding-top'), 10) + parseInt(item.img.css('padding-bottom'), 10);
          }
          item.img.css('max-height', mfp.wH - decr);
        }
      },
      _onImageHasSize: function (item) {
        if (item.img) {

          item.hasSize = true;

          if (_imgInterval) {
            clearInterval(_imgInterval);
          }

          item.isCheckingImgSize = false;

          _mfpTrigger('ImageHasSize', item);

          if (item.imgHidden) {
            if (mfp.content) mfp.content.removeClass('mfp-loading');

            item.imgHidden = false;
          }

        }
      },

      /**
       * Function that loops until the image has size to display elements that rely on it asap
       */
      findImageSize: function (item) {

        var counter = 0,
            img = item.img[0],
            mfpSetInterval = function (delay) {

            if (_imgInterval) {
              clearInterval(_imgInterval);
            }
            // decelerating interval that checks for size of an image
            _imgInterval = setInterval(function () {
              if (img.naturalWidth > 0) {
                mfp._onImageHasSize(item);
                return;
              }

              if (counter > 200) {
                clearInterval(_imgInterval);
              }

              counter++;
              if (counter === 3) {
                mfpSetInterval(10);
              } else if (counter === 40) {
                mfpSetInterval(50);
              } else if (counter === 100) {
                mfpSetInterval(500);
              }
            }, delay);
            };

        mfpSetInterval(1);
      },

      getImage: function (item, template) {

        var guard = 0,




            // image load complete handler
            onLoadComplete = function () {
            if (item) {
              if (item.img[0].complete) {
                item.img.off('.mfploader');

                if (item === mfp.currItem) {
                  mfp._onImageHasSize(item);

                  mfp.updateStatus('ready');
                }

                item.hasSize = true;
                item.loaded = true;

                _mfpTrigger('ImageLoadComplete');

              }
              else {
                // if image complete check fails 200 times (20 sec), we assume that there was an error.
                guard++;
                if (guard < 200) {
                  setTimeout(onLoadComplete, 100);
                } else {
                  onLoadError();
                }
              }
            }
            },




            // image error handler
            onLoadError = function () {
            if (item) {
              item.img.off('.mfploader');
              if (item === mfp.currItem) {
                mfp._onImageHasSize(item);
                mfp.updateStatus('error', imgSt.tError.replace('%url%', item.src));
              }

              item.hasSize = true;
              item.loaded = true;
              item.loadError = true;
            }
            },
            imgSt = mfp.st.image;


        var el = template.find('.mfp-img');
        if (el.length) {
          var img = document.createElement('img');
          img.className = 'mfp-img';
          if (item.el && item.el.find('img').length) {
            img.alt = item.el.find('img').attr('alt');
          }
          item.img = $(img).on('load.mfploader', onLoadComplete).on('error.mfploader', onLoadError);
          img.src = item.src;

          // without clone() "error" event is not firing when IMG is replaced by new IMG
          // TODO: find a way to avoid such cloning
          if (el.is('img')) {
            item.img = item.img.clone();
          }

          img = item.img[0];
          if (img.naturalWidth > 0) {
            item.hasSize = true;
          } else if (!img.width) {
            item.hasSize = false;
          }
        }

        mfp._parseMarkup(template, {
          title: _getTitle(item),
          img_replaceWith: item.img
        }, item);

        mfp.resizeImage();

        if (item.hasSize) {
          if (_imgInterval) clearInterval(_imgInterval);

          if (item.loadError) {
            template.addClass('mfp-loading');
            mfp.updateStatus('error', imgSt.tError.replace('%url%', item.src));
          } else {
            template.removeClass('mfp-loading');
            mfp.updateStatus('ready');
          }
          return template;
        }

        mfp.updateStatus('loading');
        item.loading = true;

        if (!item.hasSize) {
          item.imgHidden = true;
          template.addClass('mfp-loading');
          mfp.findImageSize(item);
        }

        return template;
      }
    }
  });



  /*>>image*/

  /*>>zoom*/
  var hasMozTransform, getHasMozTransform = function () {
    if (hasMozTransform === undefined) {
      hasMozTransform = document.createElement('p').style.MozTransform !== undefined;
    }
    return hasMozTransform;
  };

  $.magnificPopup.registerModule('zoom', {

    options: {
      enabled: false,
      easing: 'ease-in-out',
      duration: 300,
      opener: function (element) {
        return element.is('img') ? element : element.find('img');
      }
    },

    proto: {

      initZoom: function () {
        var zoomSt = mfp.st.zoom,
            ns = '.zoom',
            image;

        if (!zoomSt.enabled || !mfp.supportsTransition) {
          return;
        }

        var duration = zoomSt.duration,
            getElToAnimate = function (image) {
            var newImg = image.clone().removeAttr('style').removeAttr('class').addClass('mfp-animated-image'),
                transition = 'all ' + (zoomSt.duration / 1000) + 's ' + zoomSt.easing,
                cssObj = {
                position: 'fixed',
                zIndex: 9999,
                left: 0,
                top: 0,
                '-webkit-backface-visibility': 'hidden'
                },
                t = 'transition';

            cssObj['-webkit-' + t] = cssObj['-moz-' + t] = cssObj['-o-' + t] = cssObj[t] = transition;

            newImg.css(cssObj);
            return newImg;
            },
            showMainContent = function () {
            mfp.content.css('visibility', 'visible');
            },
            openTimeout, animatedImg;

        _mfpOn('BuildControls' + ns, function () {
          if (mfp._allowZoom()) {

            clearTimeout(openTimeout);
            mfp.content.css('visibility', 'hidden');

            // Basically, all code below does is clones existing image, puts in on top of the current one and animated it
            image = mfp._getItemToZoom();

            if (!image) {
              showMainContent();
              return;
            }

            animatedImg = getElToAnimate(image);

            animatedImg.css(mfp._getOffset());

            mfp.wrap.append(animatedImg);

            openTimeout = setTimeout(function () {
              animatedImg.css(mfp._getOffset(true));
              openTimeout = setTimeout(function () {

                showMainContent();

                setTimeout(function () {
                  animatedImg.remove();
                  image = animatedImg = null;
                  _mfpTrigger('ZoomAnimationEnded');
                }, 16); // avoid blink when switching images
              }, duration); // this timeout equals animation duration
            }, 16); // by adding this timeout we avoid short glitch at the beginning of animation

            // Lots of timeouts...
          }
        });
        _mfpOn(BEFORE_CLOSE_EVENT + ns, function () {
          if (mfp._allowZoom()) {

            clearTimeout(openTimeout);

            mfp.st.removalDelay = duration;

            if (!image) {
              image = mfp._getItemToZoom();
              if (!image) {
                return;
              }
              animatedImg = getElToAnimate(image);
            }


            animatedImg.css(mfp._getOffset(true));
            mfp.wrap.append(animatedImg);
            mfp.content.css('visibility', 'hidden');

            setTimeout(function () {
              animatedImg.css(mfp._getOffset());
            }, 16);
          }

        });

        _mfpOn(CLOSE_EVENT + ns, function () {
          if (mfp._allowZoom()) {
            showMainContent();
            if (animatedImg) {
              animatedImg.remove();
            }
            image = null;
          }
        });
      },

      _allowZoom: function () {
        return mfp.currItem.type === 'image';
      },

      _getItemToZoom: function () {
        if (mfp.currItem.hasSize) {
          return mfp.currItem.img;
        } else {
          return false;
        }
      },

      // Get element postion relative to viewport
      _getOffset: function (isLarge) {
        var el;
        if (isLarge) {
          el = mfp.currItem.img;
        } else {
          el = mfp.st.zoom.opener(mfp.currItem.el || mfp.currItem);
        }

        var offset = el.offset();
        var paddingTop = parseInt(el.css('padding-top'), 10);
        var paddingBottom = parseInt(el.css('padding-bottom'), 10);
        offset.top -= ($(window).scrollTop() - paddingTop);


/*

			Animating left + top + width/height looks glitchy in Firefox, but perfect in Chrome. And vice-versa.

			 */
        var obj = {
          width: el.width(),
          // fix Zepto height+padding issue
          height: (_isJQ ? el.innerHeight() : el[0].offsetHeight) - paddingBottom - paddingTop
        };

        // I hate to do this, but there is no another option
        if (getHasMozTransform()) {
          obj['-moz-transform'] = obj['transform'] = 'translate(' + offset.left + 'px,' + offset.top + 'px)';
        } else {
          obj.left = offset.left;
          obj.top = offset.top;
        }
        return obj;
      }

    }
  });



  /*>>zoom*/

  /*>>iframe*/

  var IFRAME_NS = 'iframe',
      _emptyPage = '//about:blank',


      _fixIframeBugs = function (isShowing) {
      if (mfp.currTemplate[IFRAME_NS]) {
        var el = mfp.currTemplate[IFRAME_NS].find('iframe');
        if (el.length) {
          // reset src after the popup is closed to avoid "video keeps playing after popup is closed" bug
          if (!isShowing) {
            el[0].src = _emptyPage;
          }

          // IE8 black screen bug fix
          if (mfp.isIE8) {
            el.css('display', isShowing ? 'block' : 'none');
          }
        }
      }
      };

  $.magnificPopup.registerModule(IFRAME_NS, {

    options: {
      markup: '<div class="mfp-iframe-scaler">' + '<div class="mfp-close"></div>' + '<iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe>' + '</div>',

      srcAction: 'iframe_src',

      // we don't care and support only one default type of URL by default
      patterns: {
        youtube: {
          index: 'youtube.com',
          id: 'v=',
          src: '//www.youtube.com/embed/%id%?autoplay=1'
        },
        vimeo: {
          index: 'vimeo.com/',
          id: '/',
          src: '//player.vimeo.com/video/%id%?autoplay=1'
        },
        gmaps: {
          index: '//maps.google.',
          src: '%id%&output=embed'
        }
      }
    },

    proto: {
      initIframe: function () {
        mfp.types.push(IFRAME_NS);

        _mfpOn('BeforeChange', function (e, prevType, newType) {
          if (prevType !== newType) {
            if (prevType === IFRAME_NS) {
              _fixIframeBugs(); // iframe if removed
            } else if (newType === IFRAME_NS) {
              _fixIframeBugs(true); // iframe is showing
            }
          } // else {
          // iframe source is switched, don't do anything
          //}
        });

        _mfpOn(CLOSE_EVENT + '.' + IFRAME_NS, function () {
          _fixIframeBugs();
        });
      },

      getIframe: function (item, template) {
        var embedSrc = item.src;
        var iframeSt = mfp.st.iframe;

        $.each(iframeSt.patterns, function () {
          if (embedSrc.indexOf(this.index) > -1) {
            if (this.id) {
              if (typeof this.id === 'string') {
                embedSrc = embedSrc.substr(embedSrc.lastIndexOf(this.id) + this.id.length, embedSrc.length);
              } else {
                embedSrc = this.id.call(this, embedSrc);
              }
            }
            embedSrc = this.src.replace('%id%', embedSrc);
            return false; // break;
          }
        });

        var dataObj = {};
        if (iframeSt.srcAction) {
          dataObj[iframeSt.srcAction] = embedSrc;
        }
        mfp._parseMarkup(template, dataObj, item);

        mfp.updateStatus('ready');

        return template;
      }
    }
  });



  /*>>iframe*/

  /*>>gallery*/
  /**
   * Get looped index depending on number of slides
   */
  var _getLoopedId = function (index) {
    var numSlides = mfp.items.length;
    if (index > numSlides - 1) {
      return index - numSlides;
    } else if (index < 0) {
      return numSlides + index;
    }
    return index;
  },
      _replaceCurrTotal = function (text, curr, total) {
      return text.replace(/%curr%/gi, curr + 1).replace(/%total%/gi, total);
      };

  $.magnificPopup.registerModule('gallery', {

    options: {
      enabled: false,
      arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',
      preload: [0, 2],
      navigateByImgClick: true,
      arrows: true,

      tPrev: 'Previous (Left arrow key)',
      tNext: 'Next (Right arrow key)',
      tCounter: '%curr% of %total%'
    },

    proto: {
      initGallery: function () {

        var gSt = mfp.st.gallery,
            ns = '.mfp-gallery',
            supportsFastClick = Boolean($.fn.mfpFastClick);

        mfp.direction = true; // true - next, false - prev
        if (!gSt || !gSt.enabled) return false;

        _wrapClasses += ' mfp-gallery';

        _mfpOn(OPEN_EVENT + ns, function () {

          if (gSt.navigateByImgClick) {
            mfp.wrap.on('click' + ns, '.mfp-img', function () {
              if (mfp.items.length > 1) {
                mfp.next();
                return false;
              }
            });
          }

          _document.on('keydown' + ns, function (e) {
            if (e.keyCode === 37) {
              mfp.prev();
            } else if (e.keyCode === 39) {
              mfp.next();
            }
          });
        });

        _mfpOn('UpdateStatus' + ns, function (e, data) {
          if (data.text) {
            data.text = _replaceCurrTotal(data.text, mfp.currItem.index, mfp.items.length);
          }
        });

        _mfpOn(MARKUP_PARSE_EVENT + ns, function (e, element, values, item) {
          var l = mfp.items.length;
          values.counter = l > 1 ? _replaceCurrTotal(gSt.tCounter, item.index, l) : '';
        });

        _mfpOn('BuildControls' + ns, function () {
          if (mfp.items.length > 1 && gSt.arrows && !mfp.arrowLeft) {
            var markup = gSt.arrowMarkup,
                arrowLeft = mfp.arrowLeft = $(markup.replace(/%title%/gi, gSt.tPrev).replace(/%dir%/gi, 'left')).addClass(PREVENT_CLOSE_CLASS),
                arrowRight = mfp.arrowRight = $(markup.replace(/%title%/gi, gSt.tNext).replace(/%dir%/gi, 'right')).addClass(PREVENT_CLOSE_CLASS);

            var eName = supportsFastClick ? 'mfpFastClick' : 'click';
            arrowLeft[eName](function () {
              mfp.prev();
            });
            arrowRight[eName](function () {
              mfp.next();
            });

            // Polyfill for :before and :after (adds elements with classes mfp-a and mfp-b)
            if (mfp.isIE7) {
              _getEl('b', arrowLeft[0], false, true);
              _getEl('a', arrowLeft[0], false, true);
              _getEl('b', arrowRight[0], false, true);
              _getEl('a', arrowRight[0], false, true);
            }

            mfp.container.append(arrowLeft.add(arrowRight));
          }
        });

        _mfpOn(CHANGE_EVENT + ns, function () {
          if (mfp._preloadTimeout) clearTimeout(mfp._preloadTimeout);

          mfp._preloadTimeout = setTimeout(function () {
            mfp.preloadNearbyImages();
            mfp._preloadTimeout = null;
          }, 16);
        });


        _mfpOn(CLOSE_EVENT + ns, function () {
          _document.off(ns);
          mfp.wrap.off('click' + ns);

          if (mfp.arrowLeft && supportsFastClick) {
            mfp.arrowLeft.add(mfp.arrowRight).destroyMfpFastClick();
          }
          mfp.arrowRight = mfp.arrowLeft = null;
        });

      },
      next: function () {
        mfp.direction = true;
        mfp.index = _getLoopedId(mfp.index + 1);
        mfp.updateItemHTML();
      },
      prev: function () {
        mfp.direction = false;
        mfp.index = _getLoopedId(mfp.index - 1);
        mfp.updateItemHTML();
      },
      goTo: function (newIndex) {
        mfp.direction = (newIndex >= mfp.index);
        mfp.index = newIndex;
        mfp.updateItemHTML();
      },
      preloadNearbyImages: function () {
        var p = mfp.st.gallery.preload,
            preloadBefore = Math.min(p[0], mfp.items.length),
            preloadAfter = Math.min(p[1], mfp.items.length),
            i;

        for (i = 1; i <= (mfp.direction ? preloadAfter : preloadBefore); i++) {
          mfp._preloadItem(mfp.index + i);
        }
        for (i = 1; i <= (mfp.direction ? preloadBefore : preloadAfter); i++) {
          mfp._preloadItem(mfp.index - i);
        }
      },
      _preloadItem: function (index) {
        index = _getLoopedId(index);

        if (mfp.items[index].preloaded) {
          return;
        }

        var item = mfp.items[index];
        if (!item.parsed) {
          item = mfp.parseEl(index);
        }

        _mfpTrigger('LazyLoad', item);

        if (item.type === 'image') {
          item.img = $('<img class="mfp-img" />').on('load.mfploader', function () {
            item.hasSize = true;
          }).on('error.mfploader', function () {
            item.hasSize = true;
            item.loadError = true;
            _mfpTrigger('LazyLoadError', item);
          }).attr('src', item.src);
        }


        item.preloaded = true;
      }
    }
  });

/*
Touch Support that might be implemented some day

addSwipeGesture: function() {
	var startX,
		moved,
		multipleTouches;

		return;

	var namespace = '.mfp',
		addEventNames = function(pref, down, move, up, cancel) {
			mfp._tStart = pref + down + namespace;
			mfp._tMove = pref + move + namespace;
			mfp._tEnd = pref + up + namespace;
			mfp._tCancel = pref + cancel + namespace;
		};

	if(window.navigator.msPointerEnabled) {
		addEventNames('MSPointer', 'Down', 'Move', 'Up', 'Cancel');
	} else if('ontouchstart' in window) {
		addEventNames('touch', 'start', 'move', 'end', 'cancel');
	} else {
		return;
	}
	_window.on(mfp._tStart, function(e) {
		var oE = e.originalEvent;
		multipleTouches = moved = false;
		startX = oE.pageX || oE.changedTouches[0].pageX;
	}).on(mfp._tMove, function(e) {
		if(e.originalEvent.touches.length > 1) {
			multipleTouches = e.originalEvent.touches.length;
		} else {
			//e.preventDefault();
			moved = true;
		}
	}).on(mfp._tEnd + ' ' + mfp._tCancel, function(e) {
		if(moved && !multipleTouches) {
			var oE = e.originalEvent,
				diff = startX - (oE.pageX || oE.changedTouches[0].pageX);

			if(diff > 20) {
				mfp.next();
			} else if(diff < -20) {
				mfp.prev();
			}
		}
	});
},
*/


  /*>>gallery*/

  /*>>retina*/

  var RETINA_NS = 'retina';

  $.magnificPopup.registerModule(RETINA_NS, {
    options: {
      replaceSrc: function (item) {
        return item.src.replace(/\.\w+$/, function (m) {
          return '@2x' + m;
        });
      },
      ratio: 1 // Function or number.  Set to 1 to disable.
    },
    proto: {
      initRetina: function () {
        if (window.devicePixelRatio > 1) {

          var st = mfp.st.retina,
              ratio = st.ratio;

          ratio = !isNaN(ratio) ? ratio : ratio();

          if (ratio > 1) {
            _mfpOn('ImageHasSize' + '.' + RETINA_NS, function (e, item) {
              item.img.css({
                'max-width': item.img[0].naturalWidth / ratio,
                'width': '100%'
              });
            });
            _mfpOn('ElementParse' + '.' + RETINA_NS, function (e, item) {
              item.src = st.replaceSrc(item, ratio);
            });
          }
        }

      }
    }
  });

  /*>>retina*/

  /*>>fastclick*/
  /**
   * FastClick event implementation. (removes 300ms delay on touch devices)
   * Based on https://developers.google.com/mobile/articles/fast_buttons
   *
   * You may use it outside the Magnific Popup by calling just:
   *
   * $('.your-el').mfpFastClick(function() {
   *     console.log('Clicked!');
   * });
   *
   * To unbind:
   * $('.your-el').destroyMfpFastClick();
   *
   *
   * Note that it's a very basic and simple implementation, it blocks ghost click on the same element where it was bound.
   * If you need something more advanced, use plugin by FT Labs https://github.com/ftlabs/fastclick
   *
   */

  (function () {
    var ghostClickDelay = 1000,
        supportsTouch = 'ontouchstart' in window,
        unbindTouchMove = function () {
        _window.off('touchmove' + ns + ' touchend' + ns);
        },
        eName = 'mfpFastClick',
        ns = '.' + eName;


    // As Zepto.js doesn't have an easy way to add custom events (like jQuery), so we implement it in this way
    $.fn.mfpFastClick = function (callback) {

      return $(this).each(function () {

        var elem = $(this),
            lock;

        if (supportsTouch) {

          var timeout, startX, startY, pointerMoved, point, numPointers;

          elem.on('touchstart' + ns, function (e) {
            pointerMoved = false;
            numPointers = 1;

            point = e.originalEvent ? e.originalEvent.touches[0] : e.touches[0];
            startX = point.clientX;
            startY = point.clientY;

            _window.on('touchmove' + ns, function (e) {
              point = e.originalEvent ? e.originalEvent.touches : e.touches;
              numPointers = point.length;
              point = point[0];
              if (Math.abs(point.clientX - startX) > 10 || Math.abs(point.clientY - startY) > 10) {
                pointerMoved = true;
                unbindTouchMove();
              }
            }).on('touchend' + ns, function (e) {
              unbindTouchMove();
              if (pointerMoved || numPointers > 1) {
                return;
              }
              lock = true;
              e.preventDefault();
              clearTimeout(timeout);
              timeout = setTimeout(function () {
                lock = false;
              }, ghostClickDelay);
              callback();
            });
          });

        }

        elem.on('click' + ns, function () {
          if (!lock) {
            callback();
          }
        });
      });
    };

    $.fn.destroyMfpFastClick = function () {
      $(this).off('touchstart' + ns + ' click' + ns);
      if (supportsTouch) _window.off('touchmove' + ns + ' touchend' + ns);
    };
  })();

  /*>>fastclick*/
  _checkInstance();
}));
/* Modernizr 2.8.3 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-fontface-backgroundsize-borderimage-borderradius-boxshadow-flexbox-hsla-multiplebgs-opacity-rgba-textshadow-cssanimations-csscolumns-generatedcontent-cssgradients-cssreflections-csstransforms-csstransforms3d-csstransitions-applicationcache-canvas-canvastext-draganddrop-hashchange-history-audio-video-indexeddb-input-inputtypes-localstorage-postmessage-sessionstorage-websockets-websqldatabase-webworkers-geolocation-inlinesvg-smil-svg-svgclippaths-touch-webgl-shiv-mq-cssclasses-addtest-prefixed-teststyles-testprop-testallprops-hasevent-prefixes-domprefixes-load
 */
;
window.Modernizr = function (a, b, c) {
  function D(a) {
    j.cssText = a
  }
  function E(a, b) {
    return D(n.join(a + ";") + (b || ""))
  }
  function F(a, b) {
    return typeof a === b
  }
  function G(a, b) {
    return !!~ ("" + a).indexOf(b)
  }
  function H(a, b) {
    for (var d in a) {
      var e = a[d];
      if (!G(e, "-") && j[e] !== c) return b == "pfx" ? e : !0
    }
    return !1
  }
  function I(a, b, d) {
    for (var e in a) {
      var f = b[a[e]];
      if (f !== c) return d === !1 ? a[e] : F(f, "function") ? f.bind(d || b) : f
    }
    return !1
  }
  function J(a, b, c) {
    var d = a.charAt(0).toUpperCase() + a.slice(1),
        e = (a + " " + p.join(d + " ") + d).split(" ");
    return F(b, "string") || F(b, "undefined") ? H(e, b) : (e = (a + " " + q.join(d + " ") + d).split(" "), I(e, b, c))
  }
  function K() {
    e.input = function (c) {
      for (var d = 0, e = c.length; d < e; d++) u[c[d]] = c[d] in k;
      return u.list && (u.list = !! b.createElement("datalist") && !! a.HTMLDataListElement), u
    }("autocomplete autofocus list placeholder max min multiple pattern required step".split(" ")), e.inputtypes = function (a) {
      for (var d = 0, e, f, h, i = a.length; d < i; d++) k.setAttribute("type", f = a[d]), e = k.type !== "text", e && (k.value = l, k.style.cssText = "position:absolute;visibility:hidden;", /^range$/.test(f) && k.style.WebkitAppearance !== c ? (g.appendChild(k), h = b.defaultView, e = h.getComputedStyle && h.getComputedStyle(k, null).WebkitAppearance !== "textfield" && k.offsetHeight !== 0, g.removeChild(k)) : /^(search|tel)$/.test(f) || (/^(url|email)$/.test(f) ? e = k.checkValidity && k.checkValidity() === !1 : e = k.value != l)), t[a[d]] = !! e;
      return t
    }("search tel url email datetime date month week time datetime-local number range color".split(" "))
  }
  var d = "2.8.3",
      e = {},
      f = !0,
      g = b.documentElement,
      h = "modernizr",
      i = b.createElement(h),
      j = i.style,
      k = b.createElement("input"),
      l = ":)",
      m = {}.toString,
      n = " -webkit- -moz- -o- -ms- ".split(" "),
      o = "Webkit Moz O ms",
      p = o.split(" "),
      q = o.toLowerCase().split(" "),
      r = {
      svg: "http://www.w3.org/2000/svg"
      },
      s = {},
      t = {},
      u = {},
      v = [],
      w = v.slice,
      x, y = function (a, c, d, e) {
      var f, i, j, k, l = b.createElement("div"),
          m = b.body,
          n = m || b.createElement("body");
      if (parseInt(d, 10)) while (d--) j = b.createElement("div"), j.id = e ? e[d] : h + (d + 1), l.appendChild(j);
      return f = ["&#173;", '<style id="s', h, '">', a, "</style>"].join(""), l.id = h, (m ? l : n).innerHTML += f, n.appendChild(l), m || (n.style.background = "", n.style.overflow = "hidden", k = g.style.overflow, g.style.overflow = "hidden", g.appendChild(n)), i = c(l, a), m ? l.parentNode.removeChild(l) : (n.parentNode.removeChild(n), g.style.overflow = k), !! i
      },
      z = function (b) {
      var c = a.matchMedia || a.msMatchMedia;
      if (c) return c(b) && c(b).matches || !1;
      var d;
      return y("@media " + b + " { #" + h + " { position: absolute; } }", function (b) {
        d = (a.getComputedStyle ? getComputedStyle(b, null) : b.currentStyle)["position"] == "absolute"
      }), d
      },
      A = function () {
      function d(d, e) {
        e = e || b.createElement(a[d] || "div"), d = "on" + d;
        var f = d in e;
        return f || (e.setAttribute || (e = b.createElement("div")), e.setAttribute && e.removeAttribute && (e.setAttribute(d, ""), f = F(e[d], "function"), F(e[d], "undefined") || (e[d] = c), e.removeAttribute(d))), e = null, f
      }
      var a = {
        select: "input",
        change: "input",
        submit: "form",
        reset: "form",
        error: "img",
        load: "img",
        abort: "img"
      };
      return d
      }(),
      B = {}.hasOwnProperty,
      C;
  !F(B, "undefined") && !F(B.call, "undefined") ? C = function (a, b) {
    return B.call(a, b)
  } : C = function (a, b) {
    return b in a && F(a.constructor.prototype[b], "undefined")
  }, Function.prototype.bind || (Function.prototype.bind = function (b) {
    var c = this;
    if (typeof c != "function") throw new TypeError;
    var d = w.call(arguments, 1),
        e = function () {
        if (this instanceof e) {
          var a = function () {};
          a.prototype = c.prototype;
          var f = new a,
              g = c.apply(f, d.concat(w.call(arguments)));
          return Object(g) === g ? g : f
        }
        return c.apply(b, d.concat(w.call(arguments)))
        };
    return e
  }), s.flexbox = function () {
    return J("flexWrap")
  }, s.canvas = function () {
    var a = b.createElement("canvas");
    return !!a.getContext && !! a.getContext("2d")
  }, s.canvastext = function () {
    return !!e.canvas && !! F(b.createElement("canvas").getContext("2d").fillText, "function")
  }, s.webgl = function () {
    return !!a.WebGLRenderingContext
  }, s.touch = function () {
    var c;
    return "ontouchstart" in a || a.DocumentTouch && b instanceof DocumentTouch ? c = !0 : y(["@media (", n.join("touch-enabled),("), h, ")", "{#modernizr{top:9px;position:absolute}}"].join(""), function (a) {
      c = a.offsetTop === 9
    }), c
  }, s.geolocation = function () {
    return "geolocation" in navigator
  }, s.postmessage = function () {
    return !!a.postMessage
  }, s.websqldatabase = function () {
    return !!a.openDatabase
  }, s.indexedDB = function () {
    return !!J("indexedDB", a)
  }, s.hashchange = function () {
    return A("hashchange", a) && (b.documentMode === c || b.documentMode > 7)
  }, s.history = function () {
    return !!a.history && !! history.pushState
  }, s.draganddrop = function () {
    var a = b.createElement("div");
    return "draggable" in a || "ondragstart" in a && "ondrop" in a
  }, s.websockets = function () {
    return "WebSocket" in a || "MozWebSocket" in a
  }, s.rgba = function () {
    return D("background-color:rgba(150,255,150,.5)"), G(j.backgroundColor, "rgba")
  }, s.hsla = function () {
    return D("background-color:hsla(120,40%,100%,.5)"), G(j.backgroundColor, "rgba") || G(j.backgroundColor, "hsla")
  }, s.multiplebgs = function () {
    return D("background:url(https://),url(https://),red url(https://)"), /(url\s*\(.*?){3}/.test(j.background)
  }, s.backgroundsize = function () {
    return J("backgroundSize")
  }, s.borderimage = function () {
    return J("borderImage")
  }, s.borderradius = function () {
    return J("borderRadius")
  }, s.boxshadow = function () {
    return J("boxShadow")
  }, s.textshadow = function () {
    return b.createElement("div").style.textShadow === ""
  }, s.opacity = function () {
    return E("opacity:.55"), /^0.55$/.test(j.opacity)
  }, s.cssanimations = function () {
    return J("animationName")
  }, s.csscolumns = function () {
    return J("columnCount")
  }, s.cssgradients = function () {
    var a = "background-image:",
        b = "gradient(linear,left top,right bottom,from(#9f9),to(white));",
        c = "linear-gradient(left top,#9f9, white);";
    return D((a + "-webkit- ".split(" ").join(b + a) + n.join(c + a)).slice(0, -a.length)), G(j.backgroundImage, "gradient")
  }, s.cssreflections = function () {
    return J("boxReflect")
  }, s.csstransforms = function () {
    return !!J("transform")
  }, s.csstransforms3d = function () {
    var a = !! J("perspective");
    return a && "webkitPerspective" in g.style && y("@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}", function (b, c) {
      a = b.offsetLeft === 9 && b.offsetHeight === 3
    }), a
  }, s.csstransitions = function () {
    return J("transition")
  }, s.fontface = function () {
    var a;
    return y('@font-face {font-family:"font";src:url("https://")}', function (c, d) {
      var e = b.getElementById("smodernizr"),
          f = e.sheet || e.styleSheet,
          g = f ? f.cssRules && f.cssRules[0] ? f.cssRules[0].cssText : f.cssText || "" : "";
      a = /src/i.test(g) && g.indexOf(d.split(" ")[0]) === 0
    }), a
  }, s.generatedcontent = function () {
    var a;
    return y(["#", h, "{font:0/0 a}#", h, ':after{content:"', l, '";visibility:hidden;font:3px/1 a}'].join(""), function (b) {
      a = b.offsetHeight >= 3
    }), a
  }, s.video = function () {
    var a = b.createElement("video"),
        c = !1;
    try {
      if (c = !! a.canPlayType) c = new Boolean(c), c.ogg = a.canPlayType('video/ogg; codecs="theora"').replace(/^no$/, ""), c.h264 = a.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/, ""), c.webm = a.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/, "")
    } catch (d) {}
    return c
  }, s.audio = function () {
    var a = b.createElement("audio"),
        c = !1;
    try {
      if (c = !! a.canPlayType) c = new Boolean(c), c.ogg = a.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""), c.mp3 = a.canPlayType("audio/mpeg;").replace(/^no$/, ""), c.wav = a.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ""), c.m4a = (a.canPlayType("audio/x-m4a;") || a.canPlayType("audio/aac;")).replace(/^no$/, "")
    } catch (d) {}
    return c
  }, s.localstorage = function () {
    try {
      return localStorage.setItem(h, h), localStorage.removeItem(h), !0
    } catch (a) {
      return !1
    }
  }, s.sessionstorage = function () {
    try {
      return sessionStorage.setItem(h, h), sessionStorage.removeItem(h), !0
    } catch (a) {
      return !1
    }
  }, s.webworkers = function () {
    return !!a.Worker
  }, s.applicationcache = function () {
    return !!a.applicationCache
  }, s.svg = function () {
    return !!b.createElementNS && !! b.createElementNS(r.svg, "svg").createSVGRect
  }, s.inlinesvg = function () {
    var a = b.createElement("div");
    return a.innerHTML = "<svg/>", (a.firstChild && a.firstChild.namespaceURI) == r.svg
  }, s.smil = function () {
    return !!b.createElementNS && /SVGAnimate/.test(m.call(b.createElementNS(r.svg, "animate")))
  }, s.svgclippaths = function () {
    return !!b.createElementNS && /SVGClipPath/.test(m.call(b.createElementNS(r.svg, "clipPath")))
  };
  for (var L in s) C(s, L) && (x = L.toLowerCase(), e[x] = s[L](), v.push((e[x] ? "" : "no-") + x));
  return e.input || K(), e.addTest = function (a, b) {
    if (typeof a == "object") for (var d in a) C(a, d) && e.addTest(d, a[d]);
    else {
      a = a.toLowerCase();
      if (e[a] !== c) return e;
      b = typeof b == "function" ? b() : b, typeof f != "undefined" && f && (g.className += " " + (b ? "" : "no-") + a), e[a] = b
    }
    return e
  }, D(""), i = k = null, function (a, b) {
    function l(a, b) {
      var c = a.createElement("p"),
          d = a.getElementsByTagName("head")[0] || a.documentElement;
      return c.innerHTML = "x<style>" + b + "</style>", d.insertBefore(c.lastChild, d.firstChild)
    }
    function m() {
      var a = s.elements;
      return typeof a == "string" ? a.split(" ") : a
    }
    function n(a) {
      var b = j[a[h]];
      return b || (b = {}, i++, a[h] = i, j[i] = b), b
    }
    function o(a, c, d) {
      c || (c = b);
      if (k) return c.createElement(a);
      d || (d = n(c));
      var g;
      return d.cache[a] ? g = d.cache[a].cloneNode() : f.test(a) ? g = (d.cache[a] = d.createElem(a)).cloneNode() : g = d.createElem(a), g.canHaveChildren && !e.test(a) && !g.tagUrn ? d.frag.appendChild(g) : g
    }
    function p(a, c) {
      a || (a = b);
      if (k) return a.createDocumentFragment();
      c = c || n(a);
      var d = c.frag.cloneNode(),
          e = 0,
          f = m(),
          g = f.length;
      for (; e < g; e++) d.createElement(f[e]);
      return d
    }
    function q(a, b) {
      b.cache || (b.cache = {}, b.createElem = a.createElement, b.createFrag = a.createDocumentFragment, b.frag = b.createFrag()), a.createElement = function (c) {
        return s.shivMethods ? o(c, a, b) : b.createElem(c)
      }, a.createDocumentFragment = Function("h,f", "return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&(" + m().join().replace(/[\w\-]+/g, function (a) {
        return b.createElem(a), b.frag.createElement(a), 'c("' + a + '")'
      }) + ");return n}")(s, b.frag)
    }
    function r(a) {
      a || (a = b);
      var c = n(a);
      return s.shivCSS && !g && !c.hasCSS && (c.hasCSS = !! l(a, "article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}")), k || q(a, c), a
    }
    var c = "3.7.0",
        d = a.html5 || {},
        e = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,
        f = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,
        g, h = "_html5shiv",
        i = 0,
        j = {},
        k;
    (function () {
      try {
        var a = b.createElement("a");
        a.innerHTML = "<xyz></xyz>", g = "hidden" in a, k = a.childNodes.length == 1 ||
        function () {
          b.createElement("a");
          var a = b.createDocumentFragment();
          return typeof a.cloneNode == "undefined" || typeof a.createDocumentFragment == "undefined" || typeof a.createElement == "undefined"
        }()
      } catch (c) {
        g = !0, k = !0
      }
    })();
    var s = {
      elements: d.elements || "abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video",
      version: c,
      shivCSS: d.shivCSS !== !1,
      supportsUnknownElements: k,
      shivMethods: d.shivMethods !== !1,
      type: "default",
      shivDocument: r,
      createElement: o,
      createDocumentFragment: p
    };
    a.html5 = s, r(b)
  }(this, b), e._version = d, e._prefixes = n, e._domPrefixes = q, e._cssomPrefixes = p, e.mq = z, e.hasEvent = A, e.testProp = function (a) {
    return H([a])
  }, e.testAllProps = J, e.testStyles = y, e.prefixed = function (a, b, c) {
    return b ? J(a, b, c) : J(a, "pfx")
  }, g.className = g.className.replace(/(^|\s)no-js(\s|$)/, "$1$2") + (f ? " js " + v.join(" ") : ""), e
}(this, this.document), function (a, b, c) {
  function d(a) {
    return "[object Function]" == o.call(a)
  }
  function e(a) {
    return "string" == typeof a
  }
  function f() {}
  function g(a) {
    return !a || "loaded" == a || "complete" == a || "uninitialized" == a
  }
  function h() {
    var a = p.shift();
    q = 1, a ? a.t ? m(function () {
      ("c" == a.t ? B.injectCss : B.injectJs)(a.s, 0, a.a, a.x, a.e, 1)
    }, 0) : (a(), h()) : q = 0
  }
  function i(a, c, d, e, f, i, j) {
    function k(b) {
      if (!o && g(l.readyState) && (u.r = o = 1, !q && h(), l.onload = l.onreadystatechange = null, b)) {
        "img" != a && m(function () {
          t.removeChild(l)
        }, 50);
        for (var d in y[c]) y[c].hasOwnProperty(d) && y[c][d].onload()
      }
    }
    var j = j || B.errorTimeout,
        l = b.createElement(a),
        o = 0,
        r = 0,
        u = {
        t: d,
        s: c,
        e: f,
        a: i,
        x: j
        };
    1 === y[c] && (r = 1, y[c] = []), "object" == a ? l.data = c : (l.src = c, l.type = a), l.width = l.height = "0", l.onerror = l.onload = l.onreadystatechange = function () {
      k.call(this, r)
    }, p.splice(e, 0, u), "img" != a && (r || 2 === y[c] ? (t.insertBefore(l, s ? null : n), m(k, j)) : y[c].push(l))
  }
  function j(a, b, c, d, f) {
    return q = 0, b = b || "j", e(a) ? i("c" == b ? v : u, a, b, this.i++, c, d, f) : (p.splice(this.i++, 0, a), 1 == p.length && h()), this
  }
  function k() {
    var a = B;
    return a.loader = {
      load: j,
      i: 0
    }, a
  }
  var l = b.documentElement,
      m = a.setTimeout,
      n = b.getElementsByTagName("script")[0],
      o = {}.toString,
      p = [],
      q = 0,
      r = "MozAppearance" in l.style,
      s = r && !! b.createRange().compareNode,
      t = s ? l : n.parentNode,
      l = a.opera && "[object Opera]" == o.call(a.opera),
      l = !! b.attachEvent && !l,
      u = r ? "object" : l ? "script" : "img",
      v = l ? "script" : u,
      w = Array.isArray ||
      function (a) {
      return "[object Array]" == o.call(a)
      },
      x = [],
      y = {},
      z = {
      timeout: function (a, b) {
        return b.length && (a.timeout = b[0]), a
      }
      },
      A, B;
  B = function (a) {
    function b(a) {
      var a = a.split("!"),
          b = x.length,
          c = a.pop(),
          d = a.length,
          c = {
          url: c,
          origUrl: c,
          prefixes: a
          },
          e, f, g;
      for (f = 0; f < d; f++) g = a[f].split("="), (e = z[g.shift()]) && (c = e(c, g));
      for (f = 0; f < b; f++) c = x[f](c);
      return c
    }
    function g(a, e, f, g, h) {
      var i = b(a),
          j = i.autoCallback;
      i.url.split(".").pop().split("?").shift(), i.bypass || (e && (e = d(e) ? e : e[a] || e[g] || e[a.split("/").pop().split("?")[0]]), i.instead ? i.instead(a, e, f, g, h) : (y[i.url] ? i.noexec = !0 : y[i.url] = 1, f.load(i.url, i.forceCSS || !i.forceJS && "css" == i.url.split(".").pop().split("?").shift() ? "c" : c, i.noexec, i.attrs, i.timeout), (d(e) || d(j)) && f.load(function () {
        k(), e && e(i.origUrl, h, g), j && j(i.origUrl, h, g), y[i.url] = 2
      })))
    }
    function h(a, b) {
      function c(a, c) {
        if (a) {
          if (e(a)) c || (j = function () {
            var a = [].slice.call(arguments);
            k.apply(this, a), l()
          }), g(a, j, b, 0, h);
          else if (Object(a) === a) for (n in m = function () {
            var b = 0,
                c;
            for (c in a) a.hasOwnProperty(c) && b++;
            return b
          }(), a) a.hasOwnProperty(n) && (!c && !--m && (d(j) ? j = function () {
            var a = [].slice.call(arguments);
            k.apply(this, a), l()
          } : j[n] = function (a) {
            return function () {
              var b = [].slice.call(arguments);
              a && a.apply(this, b), l()
            }
          }(k[n])), g(a[n], j, b, n, h))
        } else!c && l()
      }
      var h = !! a.test,
          i = a.load || a.both,
          j = a.callback || f,
          k = j,
          l = a.complete || f,
          m, n;
      c(h ? a.yep : a.nope, !! i), i && c(i)
    }
    var i, j, l = this.yepnope.loader;
    if (e(a)) g(a, 0, l, 0);
    else if (w(a)) for (i = 0; i < a.length; i++) j = a[i], e(j) ? g(j, 0, l, 0) : w(j) ? B(j) : Object(j) === j && h(j, l);
    else Object(a) === a && h(a, l)
  }, B.addPrefix = function (a, b) {
    z[a] = b
  }, B.addFilter = function (a) {
    x.push(a)
  }, B.errorTimeout = 1e4, null == b.readyState && b.addEventListener && (b.readyState = "loading", b.addEventListener("DOMContentLoaded", A = function () {
    b.removeEventListener("DOMContentLoaded", A, 0), b.readyState = "complete"
  }, 0)), a.yepnope = k(), a.yepnope.executeStack = h, a.yepnope.injectJs = function (a, c, d, e, i, j) {
    var k = b.createElement("script"),
        l, o, e = e || B.errorTimeout;
    k.src = a;
    for (o in d) k.setAttribute(o, d[o]);
    c = j ? h : c || f, k.onreadystatechange = k.onload = function () {
      !l && g(k.readyState) && (l = 1, c(), k.onload = k.onreadystatechange = null)
    }, m(function () {
      l || (l = 1, c(1))
    }, e), i ? k.onload() : n.parentNode.insertBefore(k, n)
  }, a.yepnope.injectCss = function (a, c, d, e, g, i) {
    var e = b.createElement("link"),
        j, c = i ? h : c || f;
    e.href = a, e.rel = "stylesheet", e.type = "text/css";
    for (j in d) e.setAttribute(j, d[j]);
    g || (n.parentNode.insertBefore(e, n), m(c, 0))
  }
}(this, document), Modernizr.load = function () {
  yepnope.apply(window, [].slice.call(arguments, 0))
}; /* --- ORGANIC TABS --- */

// --- MODIFIED
// https://github.com/CSS-Tricks/jQuery-Organic-Tabs
(function ($) {
  "use strict";
  $.organicTabs = function (el, options) {
    var base = this;
    base.$el = $(el);
    base.$nav = base.$el.find(".tabs__nav");
    base.init = function () {
      base.options = $.extend({}, $.organicTabs.defaultOptions, options);
      var $allListWrap = base.$el.find(".tabs__content"),
          curList = base.$el.find("a.current").attr("href").substring(1);
      $allListWrap.height(base.$el.find("#" + curList).height());

      base.$nav.find("li > a").off('click');
      base.$nav.find("li > a").click(function (event) {

        var curList = base.$el.find("a.current").attr("href").substring(1),
            $newList = $(this),
            listID = $newList.attr("href").substring(1);
        if ((listID != curList) && (base.$el.find(":animated").length == 0)) {
          base.$el.find("#" + curList).css({
            opacity: 0,
            "z-index": 10,
            "pointer-events": "none"
          }).removeClass("current");
          var newHeight = base.$el.find("#" + listID).height();
          $allListWrap.css({
            height: newHeight
          });
          setTimeout(function () {
            //base.$el.find("#" + curList);
            base.$el.find("#" + listID).css({
              opacity: 1,
              "z-index": 100,
              "pointer-events": "auto"
            }).addClass("current");
            base.$el.find(".tabs__nav li a").removeClass("current");
            $newList.addClass("current");
          }, 250);
        }
        setTimeout(function () {
          $(window).trigger('organicTabsChange');
        }, 350);
        event.preventDefault();
      });
    };
    base.init();
  };
  $.organicTabs.defaultOptions = {
    speed: 300
  };
  $.fn.organicTabs = function (options) {
    return this.each(function () {
      (new $.organicTabs(this, options));
    });
  };

})(jQuery); /* --- ROYALSLIDER --- */

// jQuery RoyalSlider plugin. Custom build. Copyright 2011-2013 Dmitry Semenov http://dimsemenov.com
// http://dimsemenov.com/private/home.php?build=bullets_thumbnails_tabs_fullscreen_autoplay_video_animated-blocks_auto-height_global-caption_active-class_deeplinking_visible-nearby
// jquery.royalslider v9.5.6
(function (n) {
  function u(b, f) {
    var c, a = this,
        e = window.navigator,
        g = e.userAgent.toLowerCase();
    a.uid = n.rsModules.uid++;
    a.ns = ".rs" + a.uid;
    var d = document.createElement("div").style,
        h = ["webkit", "Moz", "ms", "O"],
        k = "",
        l = 0,
        r;
    for (c = 0; c < h.length; c++) r = h[c], !k && r + "Transform" in d && (k = r), r = r.toLowerCase(), window.requestAnimationFrame || (window.requestAnimationFrame = window[r + "RequestAnimationFrame"], window.cancelAnimationFrame = window[r + "CancelAnimationFrame"] || window[r + "CancelRequestAnimationFrame"]);
    window.requestAnimationFrame || (window.requestAnimationFrame = function (a, b) {
      var c = (new Date).getTime(),
          d = Math.max(0, 16 - (c - l)),
          e = window.setTimeout(function () {
          a(c + d)
        }, d);
      l = c + d;
      return e
    });
    window.cancelAnimationFrame || (window.cancelAnimationFrame = function (a) {
      clearTimeout(a)
    });
    a.isIPAD = g.match(/(ipad)/);
    a.isIOS = a.isIPAD || g.match(/(iphone|ipod)/);
    c = function (a) {
      a = /(chrome)[ \/]([\w.]+)/.exec(a) || /(webkit)[ \/]([\w.]+)/.exec(a) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a) || /(msie) ([\w.]+)/.exec(a) || 0 > a.indexOf("compatible") && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a) || [];
      return {
        browser: a[1] || "",
        version: a[2] || "0"
      }
    }(g);
    h = {};
    c.browser && (h[c.browser] = !0, h.version = c.version);
    h.chrome && (h.webkit = !0);
    a._a = h;
    a.isAndroid = -1 < g.indexOf("android");
    a.slider = n(b);
    a.ev = n(a);
    a._b = n(document);
    a.st = n.extend({}, n.fn.royalSlider.defaults, f);
    a._c = a.st.transitionSpeed;
    a._d = 0;
    !a.st.allowCSS3 || h.webkit && !a.st.allowCSS3OnWebkit || (c = k + (k ? "T" : "t"), a._e = c + "ransform" in d && c + "ransition" in d, a._e && (a._f = k + (k ? "P" : "p") + "erspective" in d));
    k = k.toLowerCase();
    a._g = "-" + k + "-";
    a._h = "vertical" === a.st.slidesOrientation ? !1 : !0;
    a._i = a._h ? "left" : "top";
    a._j = a._h ? "width" : "height";
    a._k = -1;
    a._l = "fade" === a.st.transitionType ? !1 : !0;
    a._l || (a.st.sliderDrag = !1, a._m = 10);
    a._n = "z-index:0; display:none; opacity:0;";
    a._o = 0;
    a._p = 0;
    a._q = 0;
    n.each(n.rsModules, function (b, c) {
      "uid" !== b && c.call(a)
    });
    a.slides = [];
    a._r = 0;
    (a.st.slides ? n(a.st.slides) : a.slider.children().detach()).each(function () {
      a._s(this, !0)
    });
    a.st.randomizeSlides && a.slides.sort(function () {
      return.5 - Math.random()
    });
    a.numSlides = a.slides.length;
    a._t();
    a.st.startSlideId ? a.st.startSlideId > a.numSlides - 1 && (a.st.startSlideId = a.numSlides - 1) : a.st.startSlideId = 0;
    a._o = a.staticSlideId = a.currSlideId = a._u = a.st.startSlideId;
    a.currSlide = a.slides[a.currSlideId];
    a._v = 0;
    a.pointerMultitouch = !1;
    a.slider.addClass((a._h ? "rsHor" : "rsVer") + (a._l ? "" : " rsFade"));
    d = '<div class="rsOverflow"><div class="rsContainer">';
    a.slidesSpacing = a.st.slidesSpacing;
    a._w = (a._h ? a.slider.width() : a.slider.height()) + a.st.slidesSpacing;
    a._x = Boolean(0 < a._y);
    1 >= a.numSlides && (a._z = !1);
    a._a1 = a._z && a._l ? 2 === a.numSlides ? 1 : 2 : 0;
    a._b1 =
    6 > a.numSlides ? a.numSlides : 6;
    a._c1 = 0;
    a._d1 = 0;
    a.slidesJQ = [];
    for (c = 0; c < a.numSlides; c++) a.slidesJQ.push(n('<div style="' + (a._l ? "" : c !== a.currSlideId ? a._n : "z-index:0;") + '" class="rsSlide "></div>'));
    a._e1 = d = n(d + "</div></div>");
    var m = a.ns,
        k = function (b, c, d, e, f) {
        a._j1 = b + c + m;
        a._k1 = b + d + m;
        a._l1 = b + e + m;
        f && (a._m1 = b + f + m)
        };
    c = e.pointerEnabled;
    a.pointerEnabled = c || e.msPointerEnabled;
    a.pointerEnabled ? (a.hasTouch = !1, a._n1 = .2, a.pointerMultitouch = Boolean(1 < e[(c ? "m" : "msM") + "axTouchPoints"]), c ? k("pointer", "down", "move", "up", "cancel") : k("MSPointer", "Down", "Move", "Up", "Cancel")) : (a.isIOS ? a._j1 = a._k1 = a._l1 = a._m1 = "" : k("mouse", "down", "move", "up"), "ontouchstart" in window || "createTouch" in document ? (a.hasTouch = !0, a._j1 += " touchstart" + m, a._k1 += " touchmove" + m, a._l1 += " touchend" + m, a._m1 += " touchcancel" + m, a._n1 = .5, a.st.sliderTouch && (a._f1 = !0)) : (a.hasTouch = !1, a._n1 = .2));
    a.st.sliderDrag && (a._f1 = !0, h.msie || h.opera ? a._g1 = a._h1 = "move" : h.mozilla ? (a._g1 = "-moz-grab", a._h1 = "-moz-grabbing") : h.webkit && -1 != e.platform.indexOf("Mac") && (a._g1 = "-webkit-grab", a._h1 = "-webkit-grabbing"), a._i1());
    a.slider.html(d);
    a._o1 = a.st.controlsInside ? a._e1 : a.slider;
    a._p1 = a._e1.children(".rsContainer");
    a.pointerEnabled && a._p1.css((c ? "" : "-ms-") + "touch-action", a._h ? "pan-y" : "pan-x");
    a._q1 = n('<div class="rsPreloader"></div>');
    e = a._p1.children(".rsSlide");
    a._r1 = a.slidesJQ[a.currSlideId];
    a._s1 = 0;
    a._e ? (a._t1 = "transition-property", a._u1 = "transition-duration", a._v1 = "transition-timing-function", a._w1 = a._x1 = a._g + "transform", a._f ? (h.webkit && !h.chrome && a.slider.addClass("rsWebkit3d"), a._y1 = "translate3d(", a._z1 = "px, ", a._a2 = "px, 0px)") : (a._y1 = "translate(", a._z1 = "px, ", a._a2 = "px)"), a._l ? a._p1[a._g + a._t1] = a._g + "transform" : (h = {}, h[a._g + a._t1] = "opacity", h[a._g + a._u1] = a.st.transitionSpeed + "ms", h[a._g + a._v1] = a.st.css3easeInOut, e.css(h))) : (a._x1 = "left", a._w1 = "top");
    var p;
    n(window).on("resize" + a.ns, function () {
      p && clearTimeout(p);
      p = setTimeout(function () {
        a.updateSliderSize()
      }, 50)
    });
    a.ev.trigger("rsAfterPropsSetup");
    a.updateSliderSize();
    a.st.keyboardNavEnabled && a._b2();
    a.st.arrowsNavHideOnTouch && (a.hasTouch || a.pointerMultitouch) && (a.st.arrowsNav = !1);
    a.st.arrowsNav && (e = a._o1, n('<div class="rsArrow rsArrowLeft"><div class="rsArrowIcn"></div></div><div class="rsArrow rsArrowRight"><div class="rsArrowIcn"></div></div>').appendTo(e), a._c2 = e.children(".rsArrowLeft").click(function (b) {
      b.preventDefault();
      a.prev()
    }), a._d2 = e.children(".rsArrowRight").click(function (b) {
      b.preventDefault();
      a.next()
    }), a.st.arrowsNavAutoHide && !a.hasTouch && (a._c2.addClass("rsHidden"), a._d2.addClass("rsHidden"), e.one("mousemove.arrowshover", function () {
      a._c2.removeClass("rsHidden");
      a._d2.removeClass("rsHidden")
    }), e.hover(function () {
      a._e2 || (a._c2.removeClass("rsHidden"), a._d2.removeClass("rsHidden"))
    }, function () {
      a._e2 || (a._c2.addClass("rsHidden"), a._d2.addClass("rsHidden"))
    })), a.ev.on("rsOnUpdateNav", function () {
      a._f2()
    }), a._f2());
    if (a.hasTouch && a.st.sliderTouch || !a.hasTouch && a.st.sliderDrag) a._p1.on(a._j1, function (b) {
      a._g2(b)
    });
    else a.dragSuccess = !1;
    var q = ["rsPlayBtnIcon", "rsPlayBtn", "rsCloseVideoBtn", "rsCloseVideoIcn"];
    a._p1.click(function (b) {
      if (!a.dragSuccess) {
        var c =
        n(b.target).attr("class");
        if (-1 !== n.inArray(c, q) && a.toggleVideo()) return !1;
        if (a.st.navigateByClick && !a._h2) {
          if (n(b.target).closest(".rsNoDrag", a._r1).length) return !0;
          a._i2(b)
        }
        a.ev.trigger("rsSlideClick", b)
      }
    }).on("click.rs", "a", function (b) {
      if (a.dragSuccess) return !1;
      a._h2 = !0;
      setTimeout(function () {
        a._h2 = !1
      }, 3)
    });
    a.ev.trigger("rsAfterInit")
  }
  n.rsModules || (n.rsModules = {
    uid: 0
  });
  u.prototype = {
    constructor: u,
    _i2: function (b) {
      b = b[this._h ? "pageX" : "pageY"] - this._j2;
      b >= this._q ? this.next() : 0 > b && this.prev()
    },
    _t: function () {
      var b;
      b = this.st.numImagesToPreload;
      if (this._z = this.st.loop) 2 === this.numSlides ? (this._z = !1, this.st.loopRewind = !0) : 2 > this.numSlides && (this.st.loopRewind = this._z = !1);
      this._z && 0 < b && (4 >= this.numSlides ? b = 1 : this.st.numImagesToPreload > (this.numSlides - 1) / 2 && (b = Math.floor((this.numSlides - 1) / 2)));
      this._y = b
    },
    _s: function (b, f) {
      function c(b, c) {
        c ? g.images.push(b.attr(c)) : g.images.push(b.text());
        if (h) {
          h = !1;
          g.caption = "src" === c ? b.attr("alt") : b.contents();
          g.image = g.images[0];
          g.videoURL = b.attr("data-rsVideo");
          var d = b.attr("data-rsw"),
              e = b.attr("data-rsh");
          "undefined" !== typeof d && !1 !== d && "undefined" !== typeof e && !1 !== e ? (g.iW = parseInt(d, 10), g.iH = parseInt(e, 10)) : a.st.imgWidth && a.st.imgHeight && (g.iW = a.st.imgWidth, g.iH = a.st.imgHeight)
        }
      }
      var a = this,
          e, g = {},
          d, h = !0;
      b = n(b);
      a._k2 = b;
      a.ev.trigger("rsBeforeParseNode", [b, g]);
      if (!g.stopParsing) return b = a._k2, g.id = a._r, g.contentAdded = !1, a._r++, g.images = [], g.isBig = !1, g.hasCover || (b.hasClass("rsImg") ? (d = b, e = !0) : (d = b.find(".rsImg"), d.length && (e = !0)), e ? (g.bigImage = d.eq(0).attr("data-rsBigImg"), d.each(function () {
        var a =
        n(this);
        a.is("a") ? c(a, "href") : a.is("img") ? c(a, "src") : c(a)
      })) : b.is("img") && (b.addClass("rsImg rsMainSlideImage"), c(b, "src"))), d = b.find(".rsCaption"), d.length && (g.caption = d.remove()), g.content = b, a.ev.trigger("rsAfterParseNode", [b, g]), f && a.slides.push(g), 0 === g.images.length && (g.isLoaded = !0, g.isRendered = !1, g.isLoading = !1, g.images = null), g
    },
    _b2: function () {
      var b = this,
          f, c, a = function (a) {
          37 === a ? b.prev() : 39 === a && b.next()
          };
      b._b.on("keydown" + b.ns, function (e) {
        b._l2 || (c = e.keyCode, 37 !== c && 39 !== c || f || (e.preventDefault(), a(c), f = setInterval(function () {
          a(c)
        }, 700)))
      }).on("keyup" + b.ns, function (a) {
        f && (clearInterval(f), f = null)
      })
    },
    goTo: function (b, f) {
      b !== this.currSlideId && this._m2(b, this.st.transitionSpeed, !0, !f)
    },
    destroy: function (b) {
      this.ev.trigger("rsBeforeDestroy");
      this._b.off("keydown" + this.ns + " keyup" + this.ns + " " + this._k1 + " " + this._l1);
      this._p1.off(this._j1 + " click");
      this.slider.data("royalSlider", null);
      n.removeData(this.slider, "royalSlider");
      n(window).off("resize" + this.ns);
      this.loadingTimeout && clearTimeout(this.loadingTimeout);
      b && this.slider.remove();
      this.ev = this.slider = this.slides = null
    },
    _n2: function (b, f) {
      function c(c, f, g) {
        c.isAdded ? (a(f, c), e(f, c)) : (g || (g = d.slidesJQ[f]), c.holder ? g = c.holder : (g = d.slidesJQ[f] = n(g), c.holder = g), c.appendOnLoaded = !1, e(f, c, g), a(f, c), d._p2(c, g, b), c.isAdded = !0)
      }
      function a(a, c) {
        c.contentAdded || (d.setItemHtml(c, b), b || (c.contentAdded = !0))
      }
      function e(a, b, c) {
        d._l && (c || (c = d.slidesJQ[a]), c.css(d._i, (a + d._d1 + p) * d._w))
      }
      function g(a) {
        if (l) {
          if (a > r - 1) return g(a - r);
          if (0 > a) return g(r + a)
        }
        return a
      }
      var d = this,
          h, k, l = d._z,
          r = d.numSlides;
      if (!isNaN(f)) return g(f);
      var m = d.currSlideId,
          p, q = b ? Math.abs(d._o2 - d.currSlideId) >= d.numSlides - 1 ? 0 : 1 : d._y,
          s = Math.min(2, q),
          v = !1,
          u = !1,
          t;
      for (k = m; k < m + 1 + s; k++) if (t = g(k), (h = d.slides[t]) && (!h.isAdded || !h.positionSet)) {
        v = !0;
        break
      }
      for (k = m - 1; k > m - 1 - s; k--) if (t = g(k), (h = d.slides[t]) && (!h.isAdded || !h.positionSet)) {
        u = !0;
        break
      }
      if (v) for (k = m; k < m + q + 1; k++) t = g(k), p = Math.floor((d._u - (m - k)) / d.numSlides) * d.numSlides, (h = d.slides[t]) && c(h, t);
      if (u) for (k = m - 1; k > m - 1 - q; k--) t = g(k), p = Math.floor((d._u - (m - k)) / r) * r, (h = d.slides[t]) && c(h, t);
      if (!b) for (s = g(m - q), m = g(m + q), q = s > m ? 0 : s, k = 0; k < r; k++) s > m && k > s - 1 || !(k < q || k > m) || (h = d.slides[k]) && h.holder && (h.holder.detach(), h.isAdded = !1)
    },
    setItemHtml: function (b, f) {
      var c = this,
          a = function () {
          if (!b.images) b.isRendered = !0, b.isLoaded = !0, b.isLoading = !1, d(!0);
          else if (!b.isLoading) {
            var a, f;
            b.content.hasClass("rsImg") ? (a = b.content, f = !0) : a = b.content.find(".rsImg:not(img)");
            a && !a.is("img") && a.each(function () {
              var a = n(this),
                  c = '<img class="rsImg" src="' + (a.is("a") ? a.attr("href") : a.text()) + '" />';
              f ? b.content = n(c) : a.replaceWith(c)
            });
            a = f ? b.content : b.content.find("img.rsImg");
            k();
            a.eq(0).addClass("rsMainSlideImage");
            b.iW && b.iH && (b.isLoaded || c._q2(b), d());
            b.isLoading = !0;
            if (b.isBig) n("<img />").on("load.rs error.rs", function (a) {
              n(this).off("load.rs error.rs");
              e([this], !0)
            }).attr("src", b.image);
            else {
              b.loaded = [];
              b.numStartedLoad = 0;
              a = function (a) {
                n(this).off("load.rs error.rs");
                b.loaded.push(this);
                b.loaded.length === b.numStartedLoad && e(b.loaded, !1)
              };
              for (var g = 0; g < b.images.length; g++) {
                var h = n("<img />");
                b.numStartedLoad++;
                h.on("load.rs error.rs", a).attr("src", b.images[g])
              }
            }
          }
          },
          e = function (a, c) {
          if (a.length) {
            var d = a[0];
            if (c !== b.isBig)(d = b.holder.children()) && 1 < d.length && l();
            else if (b.iW && b.iH) g();
            else if (b.iW = d.width, b.iH = d.height, b.iW && b.iH) g();
            else {
              var e = new Image;
              e.onload = function () {
                e.width ? (b.iW = e.width, b.iH = e.height, g()) : setTimeout(function () {
                  e.width && (b.iW = e.width, b.iH = e.height);
                  g()
                }, 1E3)
              };
              e.src = d.src
            }
          } else g()
          },
          g = function () {
          b.isLoaded = !0;
          b.isLoading = !1;
          d();
          l();
          h()
          },
          d = function () {
          if (!b.isAppended && c.ev) {
            var a = c.st.visibleNearby,
                d = b.id - c._o;
            f || b.appendOnLoaded || !c.st.fadeinLoadedSlide || 0 !== d && (!(a || c._r2 || c._l2) || -1 !== d && 1 !== d) || (a = {
              visibility: "visible",
              opacity: 0
            }, a[c._g + "transition"] = "opacity 400ms ease-in-out", b.content.css(a), setTimeout(function () {
              b.content.css("opacity", 1)
            }, 16));
            b.holder.find(".rsPreloader").length ? b.holder.append(b.content) : b.holder.html(b.content);
            b.isAppended = !0;
            b.isLoaded && (c._q2(b), h());
            b.sizeReady || (b.sizeReady = !0, setTimeout(function () {
              c.ev.trigger("rsMaybeSizeReady", b)
            }, 100))
          }
          },
          h = function () {
          !b.loadedTriggered && c.ev && (b.isLoaded = b.loadedTriggered = !0, b.holder.trigger("rsAfterContentSet"), c.ev.trigger("rsAfterContentSet", b))
          },
          k = function () {
          c.st.usePreloader && b.holder.html(c._q1.clone())
          },
          l = function (a) {
          c.st.usePreloader && (a = b.holder.find(".rsPreloader"), a.length && a.remove())
          };
      b.isLoaded ? d() : f ? !c._l && b.images && b.iW && b.iH ? a() : (b.holder.isWaiting = !0, k(), b.holder.slideId = -99) : a()
    },
    _p2: function (b, f, c) {
      this._p1.append(b.holder);
      b.appendOnLoaded = !1
    },
    _g2: function (b, f) {
      var c =
      this,
          a, e = "touchstart" === b.type;
      c._s2 = e;
      c.ev.trigger("rsDragStart");
      if (n(b.target).closest(".rsNoDrag", c._r1).length) return c.dragSuccess = !1, !0;
      !f && c._r2 && (c._t2 = !0, c._u2());
      c.dragSuccess = !1;
      if (c._l2) e && (c._v2 = !0);
      else {
        e && (c._v2 = !1);
        c._w2();
        if (e) {
          var g = b.originalEvent.touches;
          if (g && 0 < g.length) a = g[0], 1 < g.length && (c._v2 = !0);
          else return
        } else b.preventDefault(), a = b, c.pointerEnabled && (a = a.originalEvent);
        c._l2 = !0;
        c._b.on(c._k1, function (a) {
          c._x2(a, f)
        }).on(c._l1, function (a) {
          c._y2(a, f)
        });
        c._z2 = "";
        c._a3 = !1;
        c._b3 = a.pageX;
        c._c3 = a.pageY;
        c._d3 = c._v = (f ? c._e3 : c._h) ? a.pageX : a.pageY;
        c._f3 = 0;
        c._g3 = 0;
        c._h3 = f ? c._i3 : c._p;
        c._j3 = (new Date).getTime();
        if (e) c._e1.on(c._m1, function (a) {
          c._y2(a, f)
        })
      }
    },
    _k3: function (b, f) {
      if (this._l3) {
        var c = this._m3,
            a = b.pageX - this._b3,
            e = b.pageY - this._c3,
            g = this._h3 + a,
            d = this._h3 + e,
            h = f ? this._e3 : this._h,
            g = h ? g : d,
            d = this._z2;
        this._a3 = !0;
        this._b3 = b.pageX;
        this._c3 = b.pageY;
        "x" === d && 0 !== a ? this._f3 = 0 < a ? 1 : -1 : "y" === d && 0 !== e && (this._g3 = 0 < e ? 1 : -1);
        d = h ? this._b3 : this._c3;
        a = h ? a : e;
        f ? g > this._n3 ? g = this._h3 + a * this._n1 : g < this._o3 && (g = this._h3 + a * this._n1) : this._z || (0 >= this.currSlideId && 0 < d - this._d3 && (g = this._h3 + a * this._n1), this.currSlideId >= this.numSlides - 1 && 0 > d - this._d3 && (g = this._h3 + a * this._n1));
        this._h3 = g;
        200 < c - this._j3 && (this._j3 = c, this._v = d);
        f ? this._q3(this._h3) : this._l && this._p3(this._h3)
      }
    },
    _x2: function (b, f) {
      var c = this,
          a, e = "touchmove" === b.type;
      if (!c._s2 || e) {
        if (e) {
          if (c._r3) return;
          var g = b.originalEvent.touches;
          if (g) {
            if (1 < g.length) return;
            a = g[0]
          } else return
        } else a = b, c.pointerEnabled && (a = a.originalEvent);
        c._a3 || (c._e && (f ? c._s3 : c._p1).css(c._g + c._u1, "0s"), function h() {
          c._l2 && (c._t3 = requestAnimationFrame(h), c._u3 && c._k3(c._u3, f))
        }());
        if (c._l3) b.preventDefault(), c._m3 = (new Date).getTime(), c._u3 = a;
        else if (g = f ? c._e3 : c._h, a = Math.abs(a.pageX - c._b3) - Math.abs(a.pageY - c._c3) - (g ? -7 : 7), 7 < a) {
          if (g) b.preventDefault(), c._z2 = "x";
          else if (e) {
            c._v3(b);
            return
          }
          c._l3 = !0
        } else if (-7 > a) {
          if (!g) b.preventDefault(), c._z2 = "y";
          else if (e) {
            c._v3(b);
            return
          }
          c._l3 = !0
        }
      }
    },
    _v3: function (b, f) {
      this._r3 = !0;
      this._a3 = this._l2 = !1;
      this._y2(b)
    },
    _y2: function (b, f) {
      function c(a) {
        return 100 > a ? 100 : 500 < a ? 500 : a
      }
      function a(a, b) {
        if (e._l || f) h = (-e._u - e._d1) * e._w, k = Math.abs(e._p - h), e._c = k / b, a && (e._c += 250), e._c = c(e._c), e._x3(h, !1)
      }
      var e = this,
          g, d, h, k;
      g = -1 < b.type.indexOf("touch");
      if (!e._s2 || g) if (e._s2 = !1, e.ev.trigger("rsDragRelease"), e._u3 = null, e._l2 = !1, e._r3 = !1, e._l3 = !1, e._m3 = 0, cancelAnimationFrame(e._t3), e._a3 && (f ? e._q3(e._h3) : e._l && e._p3(e._h3)), e._b.off(e._k1).off(e._l1), g && e._e1.off(e._m1), e._i1(), !e._a3 && !e._v2 && f && e._w3) {
        var l = n(b.target).closest(".rsNavItem");
        l.length && e.goTo(l.index())
      } else {
        d = f ? e._e3 : e._h;
        if (!e._a3 || "y" === e._z2 && d || "x" === e._z2 && !d) if (!f && e._t2) {
          e._t2 = !1;
          if (e.st.navigateByClick) {
            e._i2(e.pointerEnabled ? b.originalEvent : b);
            e.dragSuccess = !0;
            return
          }
          e.dragSuccess = !0
        } else {
          e._t2 = !1;
          e.dragSuccess = !1;
          return
        } else e.dragSuccess = !0;
        e._t2 = !1;
        e._z2 = "";
        var r = e.st.minSlideOffset;
        g = g ? b.originalEvent.changedTouches[0] : e.pointerEnabled ? b.originalEvent : b;
        var m = d ? g.pageX : g.pageY,
            p = e._d3;
        g = e._v;
        var q = e.currSlideId,
            s = e.numSlides,
            v = d ? e._f3 : e._g3,
            u = e._z;
        Math.abs(m - p);
        g = m - g;
        d = (new Date).getTime() - e._j3;
        d = Math.abs(g) / d;
        if (0 === v || 1 >= s) a(!0, d);
        else {
          if (!u && !f) if (0 >= q) {
            if (0 < v) {
              a(!0, d);
              return
            }
          } else if (q >= s - 1 && 0 > v) {
            a(!0, d);
            return
          }
          if (f) {
            h = e._i3;
            if (h > e._n3) h = e._n3;
            else if (h < e._o3) h = e._o3;
            else {
              m = d * d / .006;
              l = -e._i3;
              p = e._y3 - e._z3 + e._i3;
              0 < g && m > l ? (l += e._z3 / (15 / (m / d * .003)), d = d * l / m, m = l) : 0 > g && m > p && (p += e._z3 / (15 / (m / d * .003)), d = d * p / m, m = p);
              l = Math.max(Math.round(d / .003), 50);
              h += m * (0 > g ? -1 : 1);
              if (h > e._n3) {
                e._a4(h, l, !0, e._n3, 200);
                return
              }
              if (h < e._o3) {
                e._a4(h, l, !0, e._o3, 200);
                return
              }
            }
            e._a4(h, l, !0)
          } else l = function (a) {
            var b = Math.floor(a / e._w);
            a - b * e._w > r && b++;
            return b
          }, p + r < m ? 0 > v ? a(!1, d) : (l = l(m - p), e._m2(e.currSlideId - l, c(Math.abs(e._p - (-e._u - e._d1 + l) * e._w) / d), !1, !0, !0)) : p - r > m ? 0 < v ? a(!1, d) : (l = l(p - m), e._m2(e.currSlideId + l, c(Math.abs(e._p - (-e._u - e._d1 - l) * e._w) / d), !1, !0, !0)) : a(!1, d)
        }
      }
    },
    _p3: function (b) {
      b = this._p = b;
      this._e ? this._p1.css(this._x1, this._y1 + (this._h ? b + this._z1 + 0 : 0 + this._z1 + b) + this._a2) : this._p1.css(this._h ? this._x1 : this._w1, b)
    },
    updateSliderSize: function (b) {
      var f, c;
      if (this.slider) {
        if (this.st.autoScaleSlider) {
          var a =
          this.st.autoScaleSliderWidth,
              e = this.st.autoScaleSliderHeight;
          this.st.autoScaleHeight ? (f = this.slider.width(), f != this.width && (this.slider.css("height", e / a * f), f = this.slider.width()), c = this.slider.height()) : (c = this.slider.height(), c != this.height && (this.slider.css("width", a / e * c), c = this.slider.height()), f = this.slider.width())
        } else f = this.slider.width(), c = this.slider.height();
        if (b || f != this.width || c != this.height) {
          this.width = f;
          this.height = c;
          this._b4 = f;
          this._c4 = c;
          this.ev.trigger("rsBeforeSizeSet");
          this.ev.trigger("rsAfterSizePropSet");
          this._e1.css({
            width: this._b4,
            height: this._c4
          });
          this._w = (this._h ? this._b4 : this._c4) + this.st.slidesSpacing;
          this._d4 = this.st.imageScalePadding;
          for (f = 0; f < this.slides.length; f++) b = this.slides[f], b.positionSet = !1, b && b.images && b.isLoaded && (b.isRendered = !1, this._q2(b));
          if (this._e4) for (f = 0; f < this._e4.length; f++) b = this._e4[f], b.holder.css(this._i, (b.id + this._d1) * this._w);
          this._n2();
          this._l && (this._e && this._p1.css(this._g + "transition-duration", "0s"), this._p3((-this._u - this._d1) * this._w));
          this.ev.trigger("rsOnUpdateNav")
        }
        this._j2 =
        this._e1.offset();
        this._j2 = this._j2[this._i]
      }
    },
    appendSlide: function (b, f) {
      var c = this._s(b);
      if (isNaN(f) || f > this.numSlides) f = this.numSlides;
      this.slides.splice(f, 0, c);
      this.slidesJQ.splice(f, 0, n('<div style="' + (this._l ? "position:absolute;" : this._n) + '" class="rsSlide"></div>'));
      f <= this.currSlideId && this.currSlideId++;
      this.ev.trigger("rsOnAppendSlide", [c, f]);
      this._f4(f);
      f === this.currSlideId && this.ev.trigger("rsAfterSlideChange")
    },
    removeSlide: function (b) {
      var f = this.slides[b];
      f && (f.holder && f.holder.remove(), b < this.currSlideId && this.currSlideId--, this.slides.splice(b, 1), this.slidesJQ.splice(b, 1), this.ev.trigger("rsOnRemoveSlide", [b]), this._f4(b), b === this.currSlideId && this.ev.trigger("rsAfterSlideChange"))
    },
    _f4: function (b) {
      var f = this;
      b = f.numSlides;
      b = 0 >= f._u ? 0 : Math.floor(f._u / b);
      f.numSlides = f.slides.length;
      0 === f.numSlides ? (f.currSlideId = f._d1 = f._u = 0, f.currSlide = f._g4 = null) : f._u = b * f.numSlides + f.currSlideId;
      for (b = 0; b < f.numSlides; b++) f.slides[b].id = b;
      f.currSlide = f.slides[f.currSlideId];
      f._r1 = f.slidesJQ[f.currSlideId];
      f.currSlideId >= f.numSlides ? f.goTo(f.numSlides - 1) : 0 > f.currSlideId && f.goTo(0);
      f._t();
      f._l && f._p1.css(f._g + f._u1, "0ms");
      f._h4 && clearTimeout(f._h4);
      f._h4 = setTimeout(function () {
        f._l && f._p3((-f._u - f._d1) * f._w);
        f._n2();
        f._l || f._r1.css({
          display: "block",
          opacity: 1
        })
      }, 14);
      f.ev.trigger("rsOnUpdateNav")
    },
    _i1: function () {
      this._f1 && this._l && (this._g1 ? this._e1.css("cursor", this._g1) : (this._e1.removeClass("grabbing-cursor"), this._e1.addClass("grab-cursor")))
    },
    _w2: function () {
      this._f1 && this._l && (this._h1 ? this._e1.css("cursor", this._h1) : (this._e1.removeClass("grab-cursor"), this._e1.addClass("grabbing-cursor")))
    },
    next: function (b) {
      this._m2("next", this.st.transitionSpeed, !0, !b)
    },
    prev: function (b) {
      this._m2("prev", this.st.transitionSpeed, !0, !b)
    },
    _m2: function (b, f, c, a, e) {
      var g = this,
          d, h, k;
      g.ev.trigger("rsBeforeMove", [b, a]);
      k = "next" === b ? g.currSlideId + 1 : "prev" === b ? g.currSlideId - 1 : b = parseInt(b, 10);
      if (!g._z) {
        if (0 > k) {
          g._i4("left", !a);
          return
        }
        if (k >= g.numSlides) {
          g._i4("right", !a);
          return
        }
      }
      g._r2 && (g._u2(!0), c = !1);
      h = k - g.currSlideId;
      k = g._o2 =
      g.currSlideId;
      var l = g.currSlideId + h;
      a = g._u;
      var n;
      g._z ? (l = g._n2(!1, l), a += h) : a = l;
      g._o = l;
      g._g4 = g.slidesJQ[g.currSlideId];
      g._u = a;
      g.currSlideId = g._o;
      g.currSlide = g.slides[g.currSlideId];
      g._r1 = g.slidesJQ[g.currSlideId];
      var l = g.st.slidesDiff,
          m = Boolean(0 < h);
      h = Math.abs(h);
      var p = Math.floor(k / g._y),
          q = Math.floor((k + (m ? l : -l)) / g._y),
          p = (m ? Math.max(p, q) : Math.min(p, q)) * g._y + (m ? g._y - 1 : 0);
      p > g.numSlides - 1 ? p = g.numSlides - 1 : 0 > p && (p = 0);
      k = m ? p - k : k - p;
      k > g._y && (k = g._y);
      if (h > k + l) for (g._d1 += (h - (k + l)) * (m ? -1 : 1), f *= 1.4, k = 0; k < g.numSlides; k++) g.slides[k].positionSet = !1;
      g._c = f;
      g._n2(!0);
      e || (n = !0);
      d = (-a - g._d1) * g._w;
      n ? setTimeout(function () {
        g._j4 = !1;
        g._x3(d, b, !1, c);
        g.ev.trigger("rsOnUpdateNav")
      }, 0) : (g._x3(d, b, !1, c), g.ev.trigger("rsOnUpdateNav"))
    },
    _f2: function () {
      this.st.arrowsNav && (1 >= this.numSlides ? (this._c2.css("display", "none"), this._d2.css("display", "none")) : (this._c2.css("display", "block"), this._d2.css("display", "block"), this._z || this.st.loopRewind || (0 === this.currSlideId ? this._c2.addClass("rsArrowDisabled") : this._c2.removeClass("rsArrowDisabled"), this.currSlideId === this.numSlides - 1 ? this._d2.addClass("rsArrowDisabled") : this._d2.removeClass("rsArrowDisabled"))))
    },
    _x3: function (b, f, c, a, e) {
      function g() {
        var a;
        h && (a = h.data("rsTimeout")) && (h !== k && h.css({
          opacity: 0,
          display: "none",
          zIndex: 0
        }), clearTimeout(a), h.data("rsTimeout", ""));
        if (a = k.data("rsTimeout")) clearTimeout(a), k.data("rsTimeout", "")
      }
      var d = this,
          h, k, l = {};
      isNaN(d._c) && (d._c = 400);
      d._p = d._h3 = b;
      d.ev.trigger("rsBeforeAnimStart");
      d._e ? d._l ? (d._c = parseInt(d._c, 10), c = d._g + d._v1, l[d._g + d._u1] = d._c + "ms", l[c] = a ? n.rsCSS3Easing[d.st.easeInOut] : n.rsCSS3Easing[d.st.easeOut], d._p1.css(l), a || !d.hasTouch ? setTimeout(function () {
        d._p3(b)
      }, 5) : d._p3(b)) : (d._c = d.st.transitionSpeed, h = d._g4, k = d._r1, k.data("rsTimeout") && k.css("opacity", 0), g(), h && h.data("rsTimeout", setTimeout(function () {
        l[d._g + d._u1] = "0ms";
        l.zIndex = 0;
        l.display = "none";
        h.data("rsTimeout", "");
        h.css(l);
        setTimeout(function () {
          h.css("opacity", 0)
        }, 16)
      }, d._c + 60)), l.display = "block", l.zIndex = d._m, l.opacity = 0, l[d._g + d._u1] = "0ms", l[d._g + d._v1] = n.rsCSS3Easing[d.st.easeInOut], k.css(l), k.data("rsTimeout", setTimeout(function () {
        k.css(d._g + d._u1, d._c + "ms");
        k.data("rsTimeout", setTimeout(function () {
          k.css("opacity", 1);
          k.data("rsTimeout", "")
        }, 20))
      }, 20))) : d._l ? (l[d._h ? d._x1 : d._w1] = b + "px", d._p1.animate(l, d._c, a ? d.st.easeInOut : d.st.easeOut)) : (h = d._g4, k = d._r1, k.stop(!0, !0).css({
        opacity: 0,
        display: "block",
        zIndex: d._m
      }), d._c = d.st.transitionSpeed, k.animate({
        opacity: 1
      }, d._c, d.st.easeInOut), g(), h && h.data("rsTimeout", setTimeout(function () {
        h.stop(!0, !0).css({
          opacity: 0,
          display: "none",
          zIndex: 0
        })
      }, d._c + 60)));
      d._r2 = !0;
      d.loadingTimeout && clearTimeout(d.loadingTimeout);
      d.loadingTimeout = e ? setTimeout(function () {
        d.loadingTimeout = null;
        e.call()
      }, d._c + 60) : setTimeout(function () {
        d.loadingTimeout = null;
        d._k4(f)
      }, d._c + 60)
    },
    _u2: function (b) {
      this._r2 = !1;
      clearTimeout(this.loadingTimeout);
      if (this._l) if (!this._e) this._p1.stop(!0), this._p = parseInt(this._p1.css(this._h ? this._x1 : this._w1), 10);
      else {
        if (!b) {
          b = this._p;
          var f = this._h3 = this._l4();
          this._p1.css(this._g + this._u1, "0ms");
          b !== f && this._p3(f)
        }
      } else 20 < this._m ? this._m = 10 : this._m++
    },
    _l4: function () {
      var b = window.getComputedStyle(this._p1.get(0), null).getPropertyValue(this._g + "transform").replace(/^matrix\(/i, "").split(/, |\)$/g),
          f = 0 === b[0].indexOf("matrix3d");
      return parseInt(b[this._h ? f ? 12 : 4 : f ? 13 : 5], 10)
    },
    _m4: function (b, f) {
      return this._e ? this._y1 + (f ? b + this._z1 + 0 : 0 + this._z1 + b) + this._a2 : b
    },
    _k4: function (b) {
      this._l || (this._r1.css("z-index", 0), this._m = 10);
      this._r2 = !1;
      this.staticSlideId = this.currSlideId;
      this._n2();
      this._n4 = !1;
      this.ev.trigger("rsAfterSlideChange")
    },
    _i4: function (b, f) {
      var c =
      this,
          a = (-c._u - c._d1) * c._w;
      if (0 !== c.numSlides && !c._r2) if (c.st.loopRewind) c.goTo("left" === b ? c.numSlides - 1 : 0, f);
      else if (c._l) {
        c._c = 200;
        var e = function () {
          c._r2 = !1
        };
        c._x3(a + ("left" === b ? 30 : -30), "", !1, !0, function () {
          c._r2 = !1;
          c._x3(a, "", !1, !0, e)
        })
      }
    },
    _q2: function (b, f) {
      if (!b.isRendered) {
        var c = b.content,
            a = "rsMainSlideImage",
            e, g = this.st.imageAlignCenter,
            d = this.st.imageScaleMode,
            h;
        b.videoURL && (a = "rsVideoContainer", "fill" !== d ? e = !0 : (h = c, h.hasClass(a) || (h = h.find("." + a)), h.css({
          width: "100%",
          height: "100%"
        }), a = "rsMainSlideImage"));
        c.hasClass(a) || (c = c.find("." + a));
        if (c) {
          var k = b.iW,
              l = b.iH;
          b.isRendered = !0;
          if ("none" !== d || g) {
            a = "fill" !== d ? this._d4 : 0;
            h = this._b4 - 2 * a;
            var n = this._c4 - 2 * a,
                m, p, q = {};
            "fit-if-smaller" === d && (k > h || l > n) && (d = "fit");
            if ("fill" === d || "fit" === d) m = h / k, p = n / l, m = "fill" == d ? m > p ? m : p : "fit" == d ? m < p ? m : p : 1, k = Math.ceil(k * m, 10), l = Math.ceil(l * m, 10);
            "none" !== d && (q.width = k, q.height = l, e && c.find(".rsImg").css({
              width: "100%",
              height: "100%"
            }));
            g && (q.marginLeft = Math.floor((h - k) / 2) + a, q.marginTop = Math.floor((n - l) / 2) + a);
            c.css(q)
          }
        }
      }
    }
  };
  n.rsProto =
  u.prototype;
  n.fn.royalSlider = function (b) {
    var f = arguments;
    return this.each(function () {
      var c = n(this);
      if ("object" !== typeof b && b) {
        if ((c = c.data("royalSlider")) && c[b]) return c[b].apply(c, Array.prototype.slice.call(f, 1))
      } else c.data("royalSlider") || c.data("royalSlider", new u(c, b))
    })
  };
  n.fn.royalSlider.defaults = {
    slidesSpacing: 8,
    startSlideId: 0,
    loop: !1,
    loopRewind: !1,
    numImagesToPreload: 4,
    fadeinLoadedSlide: !0,
    slidesOrientation: "horizontal",
    transitionType: "move",
    transitionSpeed: 600,
    controlNavigation: "bullets",
    controlsInside: !0,
    arrowsNav: !0,
    arrowsNavAutoHide: !0,
    navigateByClick: !0,
    randomizeSlides: !1,
    sliderDrag: !0,
    sliderTouch: !0,
    keyboardNavEnabled: !1,
    fadeInAfterLoaded: !0,
    allowCSS3: !0,
    allowCSS3OnWebkit: !0,
    addActiveClass: !1,
    autoHeight: !1,
    easeOut: "easeOutSine",
    easeInOut: "easeInOutSine",
    minSlideOffset: 10,
    imageScaleMode: "fit-if-smaller",
    imageAlignCenter: !0,
    imageScalePadding: 4,
    usePreloader: !0,
    autoScaleSlider: !1,
    autoScaleSliderWidth: 800,
    autoScaleSliderHeight: 400,
    autoScaleHeight: !0,
    arrowsNavHideOnTouch: !1,
    globalCaption: !1,
    slidesDiff: 2
  };
  n.rsCSS3Easing = {
    easeOutSine: "cubic-bezier(0.390, 0.575, 0.565, 1.000)",
    easeInOutSine: "cubic-bezier(0.445, 0.050, 0.550, 0.950)"
  };
  n.extend(jQuery.easing, {
    easeInOutSine: function (b, f, c, a, e) {
      return -a / 2 * (Math.cos(Math.PI * f / e) - 1) + c
    },
    easeOutSine: function (b, f, c, a, e) {
      return a * Math.sin(f / e * (Math.PI / 2)) + c
    },
    easeOutCubic: function (b, f, c, a, e) {
      return a * ((f = f / e - 1) * f * f + 1) + c
    }
  })
})(jQuery, window);
// jquery.rs.bullets v1.0.1
(function (c) {
  c.extend(c.rsProto, {
    _i5: function () {
      var a = this;
      "bullets" === a.st.controlNavigation && (a.ev.one("rsAfterPropsSetup", function () {
        a._j5 = !0;
        a.slider.addClass("rsWithBullets");
        for (var b = '<div class="rsNav rsBullets">', e = 0; e < a.numSlides; e++) b += '<div class="rsNavItem rsBullet"><span></span></div>';
        a._k5 = b = c(b + "</div>");
        a._l5 = b.appendTo(a.slider).children();
        a._k5.on("click.rs", ".rsNavItem", function (b) {
          a._m5 || a.goTo(c(this).index())
        })
      }), a.ev.on("rsOnAppendSlide", function (b, c, d) {
        d >= a.numSlides ? a._k5.append('<div class="rsNavItem rsBullet"><span></span></div>') : a._l5.eq(d).before('<div class="rsNavItem rsBullet"><span></span></div>');
        a._l5 = a._k5.children()
      }), a.ev.on("rsOnRemoveSlide", function (b, c) {
        var d = a._l5.eq(c);
        d && d.length && (d.remove(), a._l5 = a._k5.children())
      }), a.ev.on("rsOnUpdateNav", function () {
        var b = a.currSlideId;
        a._n5 && a._n5.removeClass("rsNavSelected");
        b = a._l5.eq(b);
        b.addClass("rsNavSelected");
        a._n5 = b
      }))
    }
  });
  c.rsModules.bullets = c.rsProto._i5
})(jQuery);
// jquery.rs.thumbnails v1.0.8
(function (f) {
  f.extend(f.rsProto, {
    _h6: function () {
      var a = this;
      "thumbnails" === a.st.controlNavigation && (a._i6 = {
        drag: !0,
        touch: !0,
        orientation: "horizontal",
        navigation: !0,
        arrows: !0,
        arrowLeft: null,
        arrowRight: null,
        spacing: 4,
        arrowsAutoHide: !1,
        appendSpan: !1,
        transitionSpeed: 600,
        autoCenter: !0,
        fitInViewport: !0,
        firstMargin: !0,
        paddingTop: 0,
        paddingBottom: 0
      }, a.st.thumbs = f.extend({}, a._i6, a.st.thumbs), a._j6 = !0, !1 === a.st.thumbs.firstMargin ? a.st.thumbs.firstMargin = 0 : !0 === a.st.thumbs.firstMargin && (a.st.thumbs.firstMargin =
      a.st.thumbs.spacing), a.ev.on("rsBeforeParseNode", function (a, b, c) {
        b = f(b);
        c.thumbnail = b.find(".rsTmb").remove();
        c.thumbnail.length ? c.thumbnail = f(document.createElement("div")).append(c.thumbnail).html() : (c.thumbnail = b.attr("data-rsTmb"), c.thumbnail || (c.thumbnail = b.find(".rsImg").attr("data-rsTmb")), c.thumbnail = c.thumbnail ? '<img src="' + c.thumbnail + '"/>' : "")
      }), a.ev.one("rsAfterPropsSetup", function () {
        a._k6()
      }), a._n5 = null, a.ev.on("rsOnUpdateNav", function () {
        var e = f(a._l5[a.currSlideId]);
        e !== a._n5 && (a._n5 && (a._n5.removeClass("rsNavSelected"), a._n5 = null), a._l6 && a._m6(a.currSlideId), a._n5 = e.addClass("rsNavSelected"))
      }), a.ev.on("rsOnAppendSlide", function (e, b, c) {
        e = "<div" + a._n6 + ' class="rsNavItem rsThumb">' + a._o6 + b.thumbnail + "</div>";
        a._e && a._s3.css(a._g + "transition-duration", "0ms");
        c >= a.numSlides ? a._s3.append(e) : a._l5.eq(c).before(e);
        a._l5 = a._s3.children();
        a.updateThumbsSize(!0)
      }), a.ev.on("rsOnRemoveSlide", function (e, b) {
        var c = a._l5.eq(b);
        c && (a._e && a._s3.css(a._g + "transition-duration", "0ms"), c.remove(), a._l5 = a._s3.children(), a.updateThumbsSize(!0))
      }))
    },
    _k6: function () {
      var a = this,
          e = "rsThumbs",
          b = a.st.thumbs,
          c = "",
          g, d, h = b.spacing;
      a._j5 = !0;
      a._e3 = "vertical" === b.orientation ? !1 : !0;
      a._n6 = g = h ? ' style="margin-' + (a._e3 ? "right" : "bottom") + ":" + h + 'px;"' : "";
      a._i3 = 0;
      a._p6 = !1;
      a._m5 = !1;
      a._l6 = !1;
      a._q6 = b.arrows && b.navigation;
      d = a._e3 ? "Hor" : "Ver";
      a.slider.addClass("rsWithThumbs rsWithThumbs" + d);
      c += '<div class="rsNav rsThumbs rsThumbs' + d + '"><div class="' + e + 'Container">';
      a._o6 = b.appendSpan ? '<span class="thumbIco"></span>' : "";
      for (var k = 0; k < a.numSlides; k++) d = a.slides[k], c += "<div" + g + ' class="rsNavItem rsThumb">' + d.thumbnail + a._o6 + "</div>";
      c = f(c + "</div></div>");
      g = {};
      b.paddingTop && (g[a._e3 ? "paddingTop" : "paddingLeft"] = b.paddingTop);
      b.paddingBottom && (g[a._e3 ? "paddingBottom" : "paddingRight"] = b.paddingBottom);
      c.css(g);
      a._s3 = f(c).find("." + e + "Container");
      a._q6 && (e += "Arrow", b.arrowLeft ? a._r6 = b.arrowLeft : (a._r6 = f('<div class="' + e + " " + e + 'Left"><div class="' + e + 'Icn"></div></div>'), c.append(a._r6)), b.arrowRight ? a._s6 = b.arrowRight : (a._s6 = f('<div class="' + e + " " + e + 'Right"><div class="' + e + 'Icn"></div></div>'), c.append(a._s6)), a._r6.click(function () {
        var b = (Math.floor(a._i3 / a._t6) + a._u6) * a._t6 + a.st.thumbs.firstMargin;
        a._a4(b > a._n3 ? a._n3 : b)
      }), a._s6.click(function () {
        var b = (Math.floor(a._i3 / a._t6) - a._u6) * a._t6 + a.st.thumbs.firstMargin;
        a._a4(b < a._o3 ? a._o3 : b)
      }), b.arrowsAutoHide && !a.hasTouch && (a._r6.css("opacity", 0), a._s6.css("opacity", 0), c.one("mousemove.rsarrowshover", function () {
        a._l6 && (a._r6.css("opacity", 1), a._s6.css("opacity", 1))
      }), c.hover(function () {
        a._l6 && (a._r6.css("opacity", 1), a._s6.css("opacity", 1))
      }, function () {
        a._l6 && (a._r6.css("opacity", 0), a._s6.css("opacity", 0))
      })));
      a._k5 = c;
      a._l5 = a._s3.children();
      a.msEnabled && a.st.thumbs.navigation && a._s3.css("-ms-touch-action", a._e3 ? "pan-y" : "pan-x");
      a.slider.append(c);
      a._w3 = !0;
      a._v6 = h;
      b.navigation && a._e && a._s3.css(a._g + "transition-property", a._g + "transform");
      a._k5.on("click.rs", ".rsNavItem", function (b) {
        a._m5 || a.goTo(f(this).index())
      });
      a.ev.off("rsBeforeSizeSet.thumbs").on("rsBeforeSizeSet.thumbs", function () {
        a._w6 = a._e3 ? a._c4 : a._b4;
        a.updateThumbsSize(!0)
      });
      a.ev.off("rsAutoHeightChange.thumbs").on("rsAutoHeightChange.thumbs", function (b, c) {
        a.updateThumbsSize(!0, c)
      })
    },
    updateThumbsSize: function (a, e) {
      var b = this,
          c = b._l5.first(),
          f = {},
          d = b._l5.length;
      b._t6 = (b._e3 ? c.outerWidth() : c.outerHeight()) + b._v6;
      b._y3 = d * b._t6 - b._v6;
      f[b._e3 ? "width" : "height"] = b._y3 + b._v6;
      b._z3 = b._e3 ? b._k5.width() : void 0 !== e ? e : b._k5.height();
      b._w3 && (b.isFullscreen || b.st.thumbs.fitInViewport) && (b._e3 ? b._c4 = b._w6 - b._k5.outerHeight() : b._b4 = b._w6 - b._k5.outerWidth());
      b._z3 && (b._o3 = -(b._y3 - b._z3) - b.st.thumbs.firstMargin, b._n3 = b.st.thumbs.firstMargin, b._u6 = Math.floor(b._z3 / b._t6), b._y3 < b._z3 ? (b.st.thumbs.autoCenter ? b._q3((b._z3 - b._y3) / 2) : b._q3(b._n3), b.st.thumbs.arrows && b._r6 && (b._r6.addClass("rsThumbsArrowDisabled"), b._s6.addClass("rsThumbsArrowDisabled")), b._l6 = !1, b._m5 = !1, b._k5.off(b._j1)) : b.st.thumbs.navigation && !b._l6 && (b._l6 = !0, !b.hasTouch && b.st.thumbs.drag || b.hasTouch && b.st.thumbs.touch) && (b._m5 = !0, b._k5.on(b._j1, function (a) {
        b._g2(a, !0)
      })), b._s3.css(f), a && e && b._m6(b.currSlideId, !0))
    },
    setThumbsOrientation: function (a, e) {
      this._w3 && (this.st.thumbs.orientation = a, this._k5.remove(), this.slider.removeClass("rsWithThumbsHor rsWithThumbsVer"), this._k6(), this._k5.off(this._j1), e || this.updateSliderSize(!0))
    },
    _q3: function (a) {
      this._i3 = a;
      this._e ? this._s3.css(this._x1, this._y1 + (this._e3 ? a + this._z1 + 0 : 0 + this._z1 + a) + this._a2) : this._s3.css(this._e3 ? this._x1 : this._w1, a)
    },
    _a4: function (a, e, b, c, g) {
      var d = this;
      if (d._l6) {
        e || (e = d.st.thumbs.transitionSpeed);
        d._i3 = a;
        d._x6 && clearTimeout(d._x6);
        d._p6 && (d._e || d._s3.stop(), b = !0);
        var h = {};
        d._p6 = !0;
        d._e ? (h[d._g + "transition-duration"] = e + "ms", h[d._g + "transition-timing-function"] = b ? f.rsCSS3Easing[d.st.easeOut] : f.rsCSS3Easing[d.st.easeInOut], d._s3.css(h), d._q3(a)) : (h[d._e3 ? d._x1 : d._w1] = a + "px", d._s3.animate(h, e, b ? "easeOutCubic" : d.st.easeInOut));
        c && (d._i3 = c);
        d._y6();
        d._x6 = setTimeout(function () {
          d._p6 = !1;
          g && (d._a4(c, g, !0), g = null)
        }, e)
      }
    },
    _y6: function () {
      this._q6 && (this._i3 === this._n3 ? this._r6.addClass("rsThumbsArrowDisabled") : this._r6.removeClass("rsThumbsArrowDisabled"), this._i3 === this._o3 ? this._s6.addClass("rsThumbsArrowDisabled") : this._s6.removeClass("rsThumbsArrowDisabled"))
    },
    _m6: function (a, e) {
      var b = 0,
          c, f = a * this._t6 + 2 * this._t6 - this._v6 + this._n3,
          d = Math.floor(this._i3 / this._t6);
      this._l6 && (this._j6 && (e = !0, this._j6 = !1), f + this._i3 > this._z3 ? (a === this.numSlides - 1 && (b = 1), d = -a + this._u6 - 2 + b, c = d * this._t6 + this._z3 % this._t6 + this._v6 - this._n3) : 0 !== a ? (a - 1) * this._t6 <= -this._i3 + this._n3 && a - 1 <= this.numSlides - this._u6 && (c = (-a + 1) * this._t6 + this._n3) : c = this._n3, c !== this._i3 && (b = void 0 === c ? this._i3 : c, b > this._n3 ? this._q3(this._n3) : b < this._o3 ? this._q3(this._o3) : void 0 !== c && (e ? this._q3(c) : this._a4(c))), this._y6())
    }
  });
  f.rsModules.thumbnails = f.rsProto._h6
})(jQuery);
// jquery.rs.tabs v1.0.2
(function (e) {
  e.extend(e.rsProto, {
    _f6: function () {
      var a = this;
      "tabs" === a.st.controlNavigation && (a.ev.on("rsBeforeParseNode", function (a, d, b) {
        d = e(d);
        b.thumbnail = d.find(".rsTmb").remove();
        b.thumbnail.length ? b.thumbnail = e(document.createElement("div")).append(b.thumbnail).html() : (b.thumbnail = d.attr("data-rsTmb"), b.thumbnail || (b.thumbnail = d.find(".rsImg").attr("data-rsTmb")), b.thumbnail = b.thumbnail ? '<img src="' + b.thumbnail + '"/>' : "")
      }), a.ev.one("rsAfterPropsSetup", function () {
        a._g6()
      }), a.ev.on("rsOnAppendSlide", function (c, d, b) {
        b >= a.numSlides ? a._k5.append('<div class="rsNavItem rsTab">' + d.thumbnail + "</div>") : a._l5.eq(b).before('<div class="rsNavItem rsTab">' + item.thumbnail + "</div>");
        a._l5 = a._k5.children()
      }), a.ev.on("rsOnRemoveSlide", function (c, d) {
        var b = a._l5.eq(d);
        b && (b.remove(), a._l5 = a._k5.children())
      }), a.ev.on("rsOnUpdateNav", function () {
        var c = a.currSlideId;
        a._n5 && a._n5.removeClass("rsNavSelected");
        c = a._l5.eq(c);
        c.addClass("rsNavSelected");
        a._n5 = c
      }))
    },
    _g6: function () {
      var a = this,
          c;
      a._j5 = !0;
      c = '<div class="rsNav rsTabs">';
      for (var d = 0; d < a.numSlides; d++) c += '<div class="rsNavItem rsTab">' + a.slides[d].thumbnail + "</div>";
      c = e(c + "</div>");
      a._k5 = c;
      a._l5 = c.children(".rsNavItem");
      a.slider.append(c);
      a._k5.click(function (b) {
        b = e(b.target).closest(".rsNavItem");
        b.length && a.goTo(b.index())
      })
    }
  });
  e.rsModules.tabs = e.rsProto._f6
})(jQuery);
// jquery.rs.fullscreen v1.0.6
(function (c) {
  c.extend(c.rsProto, {
    _q5: function () {
      var a = this;
      a._r5 = {
        enabled: !1,
        keyboardNav: !0,
        buttonFS: !0,
        nativeFS: !1,
        doubleTap: !0
      };
      a.st.fullscreen = c.extend({}, a._r5, a.st.fullscreen);
      if (a.st.fullscreen.enabled) a.ev.one("rsBeforeSizeSet", function () {
        a._s5()
      })
    },
    _s5: function () {
      var a = this;
      a._t5 = !a.st.keyboardNavEnabled && a.st.fullscreen.keyboardNav;
      if (a.st.fullscreen.nativeFS) {
        var b = {
          supportsFullScreen: !1,
          isFullScreen: function () {
            return !1
          },
          requestFullScreen: function () {},
          cancelFullScreen: function () {},
          fullScreenEventName: "",
          prefix: ""
        },
            d = ["webkit", "moz", "o", "ms", "khtml"];
        if ("undefined" != typeof document.cancelFullScreen) b.supportsFullScreen = !0;
        else for (var e = 0, f = d.length; e < f; e++) if (b.prefix = d[e], "undefined" != typeof document[b.prefix + "CancelFullScreen"]) {
          b.supportsFullScreen = !0;
          break
        }
        b.supportsFullScreen ? (a.nativeFS = !0, b.fullScreenEventName = b.prefix + "fullscreenchange" + a.ns, b.isFullScreen = function () {
          switch (this.prefix) {
          case "":
            return document.fullScreen;
          case "webkit":
            return document.webkitIsFullScreen;
          default:
            return document[this.prefix + "FullScreen"]
          }
        }, b.requestFullScreen = function (a) {
          return "" === this.prefix ? a.requestFullScreen() : a[this.prefix + "RequestFullScreen"]()
        }, b.cancelFullScreen = function (a) {
          return "" === this.prefix ? document.cancelFullScreen() : document[this.prefix + "CancelFullScreen"]()
        }, a._u5 = b) : a._u5 = !1
      }
      a.st.fullscreen.buttonFS && (a._v5 = c('<div class="rsFullscreenBtn"><div class="rsFullscreenIcn"></div></div>').appendTo(a._o1).on("click.rs", function () {
        a.isFullscreen ? a.exitFullscreen() : a.enterFullscreen()
      }))
    },
    enterFullscreen: function (a) {
      var b =
      this;
      if (b._u5) if (a) b._u5.requestFullScreen(c("html")[0]);
      else {
        b._b.on(b._u5.fullScreenEventName, function (a) {
          b._u5.isFullScreen() ? b.enterFullscreen(!0) : b.exitFullscreen(!0)
        });
        b._u5.requestFullScreen(c("html")[0]);
        return
      }
      if (!b._w5) {
        b._w5 = !0;
        b._b.on("keyup" + b.ns + "fullscreen", function (a) {
          27 === a.keyCode && b.exitFullscreen()
        });
        b._t5 && b._b2();
        a = c(window);
        b._x5 = a.scrollTop();
        b._y5 = a.scrollLeft();
        b._z5 = c("html").attr("style");
        b._a6 = c("body").attr("style");
        b._b6 = b.slider.attr("style");
        c("body, html").css({
          overflow: "hidden",
          height: "100%",
          width: "100%",
          margin: "0",
          padding: "0"
        });
        b.slider.addClass("rsFullscreen");
        var d;
        for (d = 0; d < b.numSlides; d++) a = b.slides[d], a.isRendered = !1, a.bigImage && (a.isBig = !0, a.isMedLoaded = a.isLoaded, a.isMedLoading = a.isLoading, a.medImage = a.image, a.medIW = a.iW, a.medIH = a.iH, a.slideId = -99, a.bigImage !== a.medImage && (a.sizeType = "big"), a.isLoaded = a.isBigLoaded, a.isLoading = !1, a.image = a.bigImage, a.images[0] = a.bigImage, a.iW = a.bigIW, a.iH = a.bigIH, a.isAppended = a.contentAdded = !1, b._c6(a));
        b.isFullscreen = !0;
        b._w5 = !1;
        b.updateSliderSize();
        b.ev.trigger("rsEnterFullscreen")
      }
    },
    exitFullscreen: function (a) {
      var b = this;
      if (b._u5) {
        if (!a) {
          b._u5.cancelFullScreen(c("html")[0]);
          return
        }
        b._b.off(b._u5.fullScreenEventName)
      }
      if (!b._w5) {
        b._w5 = !0;
        b._b.off("keyup" + b.ns + "fullscreen");
        b._t5 && b._b.off("keydown" + b.ns);
        c("html").attr("style", b._z5 || "");
        c("body").attr("style", b._a6 || "");
        var d;
        for (d = 0; d < b.numSlides; d++) a = b.slides[d], a.isRendered = !1, a.bigImage && (a.isBig = !1, a.slideId = -99, a.isBigLoaded = a.isLoaded, a.isBigLoading = a.isLoading, a.bigImage =
        a.image, a.bigIW = a.iW, a.bigIH = a.iH, a.isLoaded = a.isMedLoaded, a.isLoading = !1, a.image = a.medImage, a.images[0] = a.medImage, a.iW = a.medIW, a.iH = a.medIH, a.isAppended = a.contentAdded = !1, b._c6(a, !0), a.bigImage !== a.medImage && (a.sizeType = "med"));
        b.isFullscreen = !1;
        a = c(window);
        a.scrollTop(b._x5);
        a.scrollLeft(b._y5);
        b._w5 = !1;
        b.slider.removeClass("rsFullscreen");
        b.updateSliderSize();
        setTimeout(function () {
          b.updateSliderSize()
        }, 1);
        b.ev.trigger("rsExitFullscreen")
      }
    },
    _c6: function (a, b) {
      var d = a.isLoaded || a.isLoading ? '<img class="rsImg rsMainSlideImage" src="' + a.image + '"/>' : '<a class="rsImg rsMainSlideImage" href="' + a.image + '"></a>';
      a.content.hasClass("rsImg") ? a.content = c(d) : a.content.find(".rsImg").eq(0).replaceWith(d);
      a.isLoaded || a.isLoading || !a.holder || a.holder.html(a.content)
    }
  });
  c.rsModules.fullscreen = c.rsProto._q5
})(jQuery);
// jquery.rs.autoplay v1.0.5
(function (b) {
  b.extend(b.rsProto, {
    _x4: function () {
      var a = this,
          d;
      a._y4 = {
        enabled: !1,
        stopAtAction: !0,
        pauseOnHover: !0,
        delay: 2E3
      };
      !a.st.autoPlay && a.st.autoplay && (a.st.autoPlay = a.st.autoplay);
      a.st.autoPlay = b.extend({}, a._y4, a.st.autoPlay);
      a.st.autoPlay.enabled && (a.ev.on("rsBeforeParseNode", function (a, c, f) {
        c = b(c);
        if (d = c.attr("data-rsDelay")) f.customDelay = parseInt(d, 10)
      }), a.ev.one("rsAfterInit", function () {
        a._z4()
      }), a.ev.on("rsBeforeDestroy", function () {
        a.stopAutoPlay();
        a.slider.off("mouseenter mouseleave");
        b(window).off("blur" + a.ns + " focus" + a.ns)
      }))
    },
    _z4: function () {
      var a = this;
      a.startAutoPlay();
      a.ev.on("rsAfterContentSet", function (b, e) {
        a._l2 || a._r2 || !a._a5 || e !== a.currSlide || a._b5()
      });
      a.ev.on("rsDragRelease", function () {
        a._a5 && a._c5 && (a._c5 = !1, a._b5())
      });
      a.ev.on("rsAfterSlideChange", function () {
        a._a5 && a._c5 && (a._c5 = !1, a.currSlide.isLoaded && a._b5())
      });
      a.ev.on("rsDragStart", function () {
        a._a5 && (a.st.autoPlay.stopAtAction ? a.stopAutoPlay() : (a._c5 = !0, a._d5()))
      });
      a.ev.on("rsBeforeMove", function (b, e, c) {
        a._a5 && (c && a.st.autoPlay.stopAtAction ? a.stopAutoPlay() : (a._c5 = !0, a._d5()))
      });
      a._e5 = !1;
      a.ev.on("rsVideoStop", function () {
        a._a5 && (a._e5 = !1, a._b5())
      });
      a.ev.on("rsVideoPlay", function () {
        a._a5 && (a._c5 = !1, a._d5(), a._e5 = !0)
      });
      b(window).on("blur" + a.ns, function () {
        a._a5 && (a._c5 = !0, a._d5())
      }).on("focus" + a.ns, function () {
        a._a5 && a._c5 && (a._c5 = !1, a._b5())
      });
      a.st.autoPlay.pauseOnHover && (a._f5 = !1, a.slider.hover(function () {
        a._a5 && (a._c5 = !1, a._d5(), a._f5 = !0)
      }, function () {
        a._a5 && (a._f5 = !1, a._b5())
      }))
    },
    toggleAutoPlay: function () {
      this._a5 ? this.stopAutoPlay() : this.startAutoPlay()
    },
    startAutoPlay: function () {
      this._a5 = !0;
      this.currSlide.isLoaded && this._b5()
    },
    stopAutoPlay: function () {
      this._e5 = this._f5 = this._c5 = this._a5 = !1;
      this._d5()
    },
    _b5: function () {
      var a = this;
      a._f5 || a._e5 || (a._g5 = !0, a._h5 && clearTimeout(a._h5), a._h5 = setTimeout(function () {
        var b;
        a._z || a.st.loopRewind || (b = !0, a.st.loopRewind = !0);
        a.next(!0);
        b && (a.st.loopRewind = !1)
      }, a.currSlide.customDelay ? a.currSlide.customDelay : a.st.autoPlay.delay))
    },
    _d5: function () {
      this._f5 || this._e5 || (this._g5 = !1, this._h5 && (clearTimeout(this._h5), this._h5 = null))
    }
  });
  b.rsModules.autoplay = b.rsProto._x4
})(jQuery);
// jquery.rs.video v1.1.3
(function (f) {
  f.extend(f.rsProto, {
    _z6: function () {
      var a = this;
      a._a7 = {
        autoHideArrows: !0,
        autoHideControlNav: !1,
        autoHideBlocks: !1,
        autoHideCaption: !1,
        disableCSS3inFF: !0,
        youTubeCode: '<iframe src="http://www.youtube.com/embed/%id%?rel=1&showinfo=0&autoplay=1&wmode=transparent" frameborder="no"></iframe>',
        vimeoCode: '<iframe src="http://player.vimeo.com/video/%id%?byline=0&portrait=0&autoplay=1" frameborder="no" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>'
      };
      a.st.video = f.extend({}, a._a7, a.st.video);
      a.ev.on("rsBeforeSizeSet", function () {
        a._b7 && setTimeout(function () {
          var b = a._r1,
              b = b.hasClass("rsVideoContainer") ? b : b.find(".rsVideoContainer");
          a._c7 && a._c7.css({
            width: b.width(),
            height: b.height()
          })
        }, 32)
      });
      var d = a._a.mozilla;
      a.ev.on("rsAfterParseNode", function (b, c, e) {
        b = f(c);
        if (e.videoURL) {
          a.st.video.disableCSS3inFF && d && (a._e = a._f = !1);
          c = f('<div class="rsVideoContainer"></div>');
          var g = f('<div class="rsBtnCenterer"><div class="rsPlayBtn"><div class="rsPlayBtnIcon"></div></div></div>');
          b.hasClass("rsImg") ? e.content = c.append(b).append(g) : e.content.find(".rsImg").wrap(c).after(g)
        }
      });
      a.ev.on("rsAfterSlideChange", function () {
        a.stopVideo()
      })
    },
    toggleVideo: function () {
      return this._b7 ? this.stopVideo() : this.playVideo()
    },
    playVideo: function () {
      var a = this;
      if (!a._b7) {
        var d = a.currSlide;
        if (!d.videoURL) return !1;
        a._d7 = d;
        var b = a._e7 = d.content,
            d = d.videoURL,
            c, e;
        d.match(/youtu\.be/i) || d.match(/youtube\.com/i) ? (e = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/, (e = d.match(e)) && 11 == e[7].length && (c = e[7]), void 0 !== c && (a._c7 = a.st.video.youTubeCode.replace("%id%", c))) : d.match(/vimeo\.com/i) && (e = /(www\.)?vimeo.com\/(\d+)($|\/)/, (e = d.match(e)) && (c = e[2]), void 0 !== c && (a._c7 = a.st.video.vimeoCode.replace("%id%", c)));
        a.videoObj = f(a._c7);
        a.ev.trigger("rsOnCreateVideoElement", [d]);
        a.videoObj.length && (a._c7 = f('<div class="rsVideoFrameHolder"><div class="rsPreloader"></div><div class="rsCloseVideoBtn"><div class="rsCloseVideoIcn"></div></div></div>'), a._c7.find(".rsPreloader").after(a.videoObj), b = b.hasClass("rsVideoContainer") ? b : b.find(".rsVideoContainer"), a._c7.css({
          width: b.width(),
          height: b.height()
        }).find(".rsCloseVideoBtn").off("click.rsv").on("click.rsv", function (b) {
          a.stopVideo();
          b.preventDefault();
          b.stopPropagation();
          return !1
        }), b.append(a._c7), a.isIPAD && b.addClass("rsIOSVideo"), a._f7(!1), setTimeout(function () {
          a._c7.addClass("rsVideoActive")
        }, 10), a.ev.trigger("rsVideoPlay"), a._b7 = !0);
        return !0
      }
      return !1
    },
    stopVideo: function () {
      var a = this;
      return a._b7 ? (a.isIPAD && a.slider.find(".rsCloseVideoBtn").remove(), a._f7(!0), setTimeout(function () {
        a.ev.trigger("rsOnDestroyVideoElement", [a.videoObj]);
        var d = a._c7.find("iframe");
        if (d.length) try {
          d.attr("src", "")
        } catch (b) {}
        a._c7.remove();
        a._c7 = null
      }, 16), a.ev.trigger("rsVideoStop"), a._b7 = !1, !0) : !1
    },
    _f7: function (a, d) {
      var b = [],
          c = this.st.video;
      c.autoHideArrows && (this._c2 && (b.push(this._c2, this._d2), this._e2 = !a), this._v5 && b.push(this._v5));
      c.autoHideControlNav && this._k5 && b.push(this._k5);
      c.autoHideBlocks && this._d7.animBlocks && b.push(this._d7.animBlocks);
      c.autoHideCaption && this.globalCaption && b.push(this.globalCaption);
      this.slider[a ? "removeClass" : "addClass"]("rsVideoPlaying");
      if (b.length) for (c = 0; c < b.length; c++) a ? b[c].removeClass("rsHidden") : b[c].addClass("rsHidden")
    }
  });
  f.rsModules.video = f.rsProto._z6
})(jQuery);
// jquery.rs.animated-blocks v1.0.7
(function (l) {
  l.extend(l.rsProto, {
    _p4: function () {
      function m() {
        var g = a.currSlide;
        if (a.currSlide && a.currSlide.isLoaded && a._t4 !== g) {
          if (0 < a._s4.length) {
            for (b = 0; b < a._s4.length; b++) clearTimeout(a._s4[b]);
            a._s4 = []
          }
          if (0 < a._r4.length) {
            var f;
            for (b = 0; b < a._r4.length; b++) if (f = a._r4[b]) a._e ? (f.block.css(a._g + a._u1, "0s"), f.block.css(f.css)) : f.block.stop(!0).css(f.css), a._t4 = null, g.animBlocksDisplayed = !1;
            a._r4 = []
          }
          g.animBlocks && (g.animBlocksDisplayed = !0, a._t4 = g, a._u4(g.animBlocks))
        }
      }
      var a = this,
          b;
      a._q4 = {
        fadeEffect: !0,
        moveEffect: "top",
        moveOffset: 20,
        speed: 400,
        easing: "easeOutSine",
        delay: 200
      };
      a.st.block = l.extend({}, a._q4, a.st.block);
      a._r4 = [];
      a._s4 = [];
      a.ev.on("rsAfterInit", function () {
        m()
      });
      a.ev.on("rsBeforeParseNode", function (a, b, d) {
        b = l(b);
        d.animBlocks = b.find(".rsABlock").css("display", "none");
        d.animBlocks.length || (b.hasClass("rsABlock") ? d.animBlocks = b.css("display", "none") : d.animBlocks = !1)
      });
      a.ev.on("rsAfterContentSet", function (b, f) {
        f.id === a.slides[a.currSlideId].id && setTimeout(function () {
          m()
        }, a.st.fadeinLoadedSlide ? 300 : 0)
      });
      a.ev.on("rsAfterSlideChange", function () {
        m()
      })
    },
    _v4: function (l, a) {
      setTimeout(function () {
        l.css(a)
      }, 6)
    },
    _u4: function (m) {
      var a = this,
          b, g, f, d, h, e, n;
      a._s4 = [];
      m.each(function (m) {
        b = l(this);
        g = {};
        f = {};
        d = null;
        var c = b.attr("data-move-offset"),
            c = c ? parseInt(c, 10) : a.st.block.moveOffset;
        if (0 < c && ((e = b.data("move-effect")) ? (e = e.toLowerCase(), "none" === e ? e = !1 : "left" !== e && "top" !== e && "bottom" !== e && "right" !== e && (e = a.st.block.moveEffect, "none" === e && (e = !1))) : e = a.st.block.moveEffect, e && "none" !== e)) {
          var p;
          p = "right" === e || "left" === e ? !0 : !1;
          var k;
          n = !1;
          a._e ? (k = 0, h = a._x1) : (p ? isNaN(parseInt(b.css("right"), 10)) ? h = "left" : (h = "right", n = !0) : isNaN(parseInt(b.css("bottom"), 10)) ? h = "top" : (h = "bottom", n = !0), h = "margin-" + h, n && (c = -c), a._e ? k = parseInt(b.css(h), 10) : (k = b.data("rs-start-move-prop"), void 0 === k && (k = parseInt(b.css(h), 10), isNaN(k) && (k = 0), b.data("rs-start-move-prop", k))));
          f[h] = a._m4("top" === e || "left" === e ? k - c : k + c, p);
          g[h] = a._m4(k, p)
        }
        c = b.attr("data-fade-effect");
        if (!c) c = a.st.block.fadeEffect;
        else if ("none" === c.toLowerCase() || "false" === c.toLowerCase()) c = !1;
        c && (f.opacity = 0, g.opacity = 1);
        if (c || e) d = {}, d.hasFade = Boolean(c), Boolean(e) && (d.moveProp = h, d.hasMove = !0), d.speed = b.data("speed"), isNaN(d.speed) && (d.speed = a.st.block.speed), d.easing = b.data("easing"), d.easing || (d.easing = a.st.block.easing), d.css3Easing = l.rsCSS3Easing[d.easing], d.delay = b.data("delay"), isNaN(d.delay) && (d.delay = a.st.block.delay * m);
        c = {};
        a._e && (c[a._g + a._u1] = "0ms");
        c.moveProp = g.moveProp;
        c.opacity = g.opacity;
        c.display = "none";
        a._r4.push({
          block: b,
          css: c
        });
        a._v4(b, f);
        a._s4.push(setTimeout(function (b, d, c, e) {
          return function () {
            b.css("display", "block");
            if (c) {
              var g = {};
              if (a._e) {
                var f = "";
                c.hasMove && (f += c.moveProp);
                c.hasFade && (c.hasMove && (f += ", "), f += "opacity");
                g[a._g + a._t1] = f;
                g[a._g + a._u1] = c.speed + "ms";
                g[a._g + a._v1] = c.css3Easing;
                b.css(g);
                setTimeout(function () {
                  b.css(d)
                }, 24)
              } else setTimeout(function () {
                b.animate(d, c.speed, c.easing)
              }, 16)
            }
            delete a._s4[e]
          }
        }(b, g, d, m), 6 >= d.delay ? 12 : d.delay))
      })
    }
  });
  l.rsModules.animatedBlocks = l.rsProto._p4
})(jQuery);
// jquery.rs.auto-height v1.0.3
(function (b) {
  b.extend(b.rsProto, {
    _w4: function () {
      var a = this;
      if (a.st.autoHeight) {
        var b, c, e, f = !0,
            d = function (d) {
            e = a.slides[a.currSlideId];
            (b = e.holder) && (c = b.height()) && void 0 !== c && c > (a.st.minAutoHeight || 30) && (a._c4 = c, a._e || !d ? a._e1.css("height", c) : a._e1.stop(!0, !0).animate({
              height: c
            }, a.st.transitionSpeed), a.ev.trigger("rsAutoHeightChange", c), f && (a._e && setTimeout(function () {
              a._e1.css(a._g + "transition", "height " + a.st.transitionSpeed + "ms ease-in-out")
            }, 16), f = !1))
            };
        a.ev.on("rsMaybeSizeReady.rsAutoHeight", function (a, b) {
          e === b && d()
        });
        a.ev.on("rsAfterContentSet.rsAutoHeight", function (a, b) {
          e === b && d()
        });
        a.slider.addClass("rsAutoHeight");
        a.ev.one("rsAfterInit", function () {
          setTimeout(function () {
            d(!1);
            setTimeout(function () {
              a.slider.append('<div style="clear:both; float: none;"></div>')
            }, 16)
          }, 16)
        });
        a.ev.on("rsBeforeAnimStart", function () {
          d(!0)
        });
        a.ev.on("rsBeforeSizeSet", function () {
          setTimeout(function () {
            d(!1)
          }, 16)
        })
      }
    }
  });
  b.rsModules.autoHeight = b.rsProto._w4
})(jQuery);
// jquery.rs.global-caption v1.0
(function (b) {
  b.extend(b.rsProto, {
    _d6: function () {
      var a = this;
      a.st.globalCaption && (a.ev.on("rsAfterInit", function () {
        a.globalCaption = b('<div class="rsGCaption"></div>').appendTo(a.st.globalCaptionInside ? a._e1 : a.slider);
        a.globalCaption.html(a.currSlide.caption)
      }), a.ev.on("rsBeforeAnimStart", function () {
        a.globalCaption.html(a.currSlide.caption)
      }))
    }
  });
  b.rsModules.globalCaption = b.rsProto._d6
})(jQuery);
// jquery.rs.active-class v1.0.1
(function (c) {
  c.rsProto._o4 = function () {
    var b, a = this;
    if (a.st.addActiveClass) a.ev.on("rsOnUpdateNav", function () {
      b && clearTimeout(b);
      b = setTimeout(function () {
        a._g4 && a._g4.removeClass("rsActiveSlide");
        a._r1 && a._r1.addClass("rsActiveSlide");
        b = null
      }, 50)
    })
  };
  c.rsModules.activeClass = c.rsProto._o4
})(jQuery);
// jquery.rs.deeplinking v1.0.6 + jQuery hashchange plugin v1.3 Copyright (c) 2010 Ben Alman
(function (b) {
  b.extend(b.rsProto, {
    _o5: function () {
      var a = this,
          h, d, f;
      a._p5 = {
        enabled: !1,
        change: !1,
        prefix: ""
      };
      a.st.deeplinking = b.extend({}, a._p5, a.st.deeplinking);
      if (a.st.deeplinking.enabled) {
        var g = a.st.deeplinking.change,
            e = a.st.deeplinking.prefix,
            c = "#" + e,
            k = function () {
            var a = window.location.hash;
            return a && 0 < a.indexOf(e) && (a = parseInt(a.substring(c.length), 10), 0 <= a) ? a - 1 : -1
            },
            p = k(); - 1 !== p && (a.st.startSlideId = p);
        g && (b(window).on("hashchange" + a.ns, function (b) {
          h || (b = k(), 0 > b || (b > a.numSlides - 1 && (b = a.numSlides - 1), a.goTo(b)))
        }), a.ev.on("rsBeforeAnimStart", function () {
          d && clearTimeout(d);
          f && clearTimeout(f)
        }), a.ev.on("rsAfterSlideChange", function () {
          d && clearTimeout(d);
          f && clearTimeout(f);
          f = setTimeout(function () {
            h = !0;
            window.location.replace(("" + window.location).split("#")[0] + c + (a.currSlideId + 1));
            d = setTimeout(function () {
              h = !1;
              d = null
            }, 60)
          }, 400)
        }));
        a.ev.on("rsBeforeDestroy", function () {
          d = f = null;
          g && b(window).off("hashchange" + a.ns)
        })
      }
    }
  });
  b.rsModules.deeplinking = b.rsProto._o5
})(jQuery);
(function (b, a, h) {
  function d(a) {
    a = a || location.href;
    return "#" + a.replace(/^[^#]*#?(.*)$/, "$1")
  }
  "$:nomunge";
  var f = document,
      g, e = b.event.special,
      c = f.documentMode,
      k = "onhashchange" in a && (c === h || 7 < c);
  b.fn.hashchange = function (a) {
    return a ? this.bind("hashchange", a) : this.trigger("hashchange")
  };
  b.fn.hashchange.delay = 50;
  e.hashchange = b.extend(e.hashchange, {
    setup: function () {
      if (k) return !1;
      b(g.start)
    },
    teardown: function () {
      if (k) return !1;
      b(g.stop)
    }
  });
  g = function () {
    function g() {
      var f = d(),
          e = q(l);
      f !== l ? (m(l = f, e), b(a).trigger("hashchange")) : e !== l && (location.href = location.href.replace(/#.*/, "") + e);
      c = setTimeout(g, b.fn.hashchange.delay)
    }
    var e = {},
        c, l = d(),
        n = function (a) {
        return a
        },
        m = n,
        q = n;
    e.start = function () {
      c || g()
    };
    e.stop = function () {
      c && clearTimeout(c);
      c = h
    };
    a.attachEvent && !a.addEventListener && !k &&
    function () {
      var a, c;
      e.start = function () {
        a || (c = (c = b.fn.hashchange.src) && c + d(), a = b('<iframe tabindex="-1" title="empty"/>').hide().one("load", function () {
          c || m(d());
          g()
        }).attr("src", c || "javascript:0").insertAfter("body")[0].contentWindow, f.onpropertychange =

        function () {
          try {
            "title" === event.propertyName && (a.document.title = f.title)
          } catch (b) {}
        })
      };
      e.stop = n;
      q = function () {
        return d(a.location.href)
      };
      m = function (c, e) {
        var d = a.document,
            g = b.fn.hashchange.domain;
        c !== e && (d.title = f.title, d.open(), g && d.write('<script>document.domain="' + g + '"\x3c/script>'), d.close(), a.location.hash = c)
      }
    }();
    return e
  }()
})(jQuery, this);
// jquery.rs.visible-nearby v1.0.2
(function (d) {
  d.rsProto._g7 = function () {
    var a = this;
    a.st.visibleNearby && a.st.visibleNearby.enabled && (a._h7 = {
      enabled: !0,
      centerArea: .6,
      center: !0,
      breakpoint: 0,
      breakpointCenterArea: .8,
      hiddenOverflow: !0,
      navigateByCenterClick: !1
    }, a.st.visibleNearby = d.extend({}, a._h7, a.st.visibleNearby), a.ev.one("rsAfterPropsSetup", function () {
      a._i7 = a._e1.css("overflow", "visible").wrap('<div class="rsVisibleNearbyWrap"></div>').parent();
      a.st.visibleNearby.hiddenOverflow || a._i7.css("overflow", "visible");
      a._o1 = a.st.controlsInside ? a._i7 : a.slider
    }), a.ev.on("rsAfterSizePropSet", function () {
      var b, c = a.st.visibleNearby;
      b = c.breakpoint && a.width < c.breakpoint ? c.breakpointCenterArea : c.centerArea;
      a._h ? (a._b4 *= b, a._i7.css({
        height: a._c4,
        width: a._b4 / b
      }), a._d = a._b4 * (1 - b) / 2 / b) : (a._c4 *= b, a._i7.css({
        height: a._c4 / b,
        width: a._b4
      }), a._d = a._c4 * (1 - b) / 2 / b);
      c.navigateByCenterClick || (a._q = a._h ? a._b4 : a._c4);
      c.center && a._e1.css("margin-" + (a._h ? "left" : "top"), a._d)
    }))
  };
  d.rsModules.visibleNearby = d.rsProto._g7
})(jQuery);

/* --- ROYALSLIDER end --- */

// /* ====== HELPER FUNCTIONS ====== */
//similar to PHP's empty function


function empty(data) {
  if (typeof(data) == 'number' || typeof(data) == 'boolean') {
    return false;
  }
  if (typeof(data) == 'undefined' || data === null) {
    return true;
  }
  if (typeof(data.length) != 'undefined') {
    return data.length === 0;
  }
  var count = 0;
  for (var i in data) {
    // if(data.hasOwnProperty(i))
    //
    // This doesn't work in ie8/ie9 due the fact that hasOwnProperty works only on native objects.
    // http://stackoverflow.com/questions/8157700/object-has-no-hasownproperty-method-i-e-its-undefined-ie8
    //
    // for hosts objects we do this
    if (Object.prototype.hasOwnProperty.call(data, i)) {
      count++;
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

  for (var i = 0; i < 5; i++)
  text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function tryParseJSON(jsonString) {
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
    if (globalDebug) {
      console.log(e);
    }
  }

  return false;
};




// Background videos player
var vimeoPlayersList = Array(),
    ytPlayersList = Array();

// this function must be unwrapped / public
// because it is called by YT API


function onYouTubeIframeAPIReady() {

  ytPlayersList.forEach(function (element, index, array) {
    // for each YouTube player, create a player object
    var ytPlayer = new YT.Player(array[index][0].id, {
      events: {
        'onReady': onPlayerReady,
        'onStateChange': "onPlayerStateChange"
      },
      playerVars: {
        'controls': 0
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
  if (!Modernizr.touch) {
    event.target.playVideo();
  }
  event.target.mute();
}

function onPlayerStateChange(event) {
  event.target.mute();

  if (event.data === YT.PlayerState.ENDED) {
    event.target.playVideo();
  }
}



// Vimeo business


function onVimeoMessageReceived(e) {
  $ = jQuery;
  var data = tryParseJSON(e.data);

  if (data !== false) {
    switch (data.event) {
    case 'ready':
      var data = {
        method: 'setVolume',
        value: '0'
      };

      // for each vimeo player, set volume to 0
      vimeoPlayersList.forEach(function (element, index, array) {
        array[index].vimeoIframe[0].contentWindow.postMessage(JSON.stringify(data), array[index].vimeoURL);
      });

      if (!Modernizr.touch) {

        data = {
          method: 'play'
        };

        // for each vimeo player, let it play
        vimeoPlayersList.forEach(function (element, index, array) {
          array[index].vimeoIframe[0].contentWindow.postMessage(JSON.stringify(data), array[index].vimeoURL);
        });

      }

      break;
    }
  }
}

function youtube_parser(url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
  var match = url.match(regExp);
  if (match && match[7].length == 11) {
    return match[7];
  } else {
    console.log("Incorrect Youtube Video URL");
  }
}

function vimeo_parser(url) {
  var regExp = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
  var match = url.match(regExp);
  if (match) {
    return match[3];
  } else {
    console.log("Incorrect Vimeo Video URL");
  }
}

var VideoBackground = {
  init: function () {
    $ = jQuery;

    $('.video-iframe-holder').each(function () {

      // don't play the video if we're in a slider
      if ( !! $(this).closest('.projects--slider').length) {
        return;
      }

      $(this).parent().appendTo($(this).closest('.hero'));

      // Get the video URL
      var videoURL = $(this).data('url');

      var initialHeight = null,
          initialWidth = null;

      if (videoURL.indexOf('youtube') >= 0) {
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
        var youtubeVideoSrc = '//www.youtube.com/embed/' + youtubeVideoID + '?enablejsapi=1&amp;rel=0&amp;controls=0&amp;showinfo=0&amp;loop=1&amp;playlist=PL' + youtubeVideoID + '&amp;iv_load_policy=3';

        // Create YT iframe Object and push it to the players list
        ytPlayersList.push($('<iframe/>', {
          'class': 'video-bg  video--youtube',
          'id': 'video-bg-player-' + makeid(),
          'src': youtubeVideoSrc,
          'frameborder': 0,
          'width': 853,
          'height': 510
        }).appendTo($(this))); // and append it to .video-iframe-holder
      } else if (videoURL.indexOf('vimeo') >= 0) {
        // we have a Vimeo video
        // Get Vimeo video ID
        var vimeoVideoID = vimeo_parser(videoURL);

        // Compose iframe src
        var vimeoVideoSrc = 'https://player.vimeo.com/video/' + vimeoVideoID + '?title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;color=383737&amp;loop=1&amp;api=1';

        // Create the object that will be pushed into the videos list
        var vimeoObject = {
          vimeoIframe: null,
          vimeoURL: null
        }

        // Create Vimeo iframe Object
        vimeoObject.vimeoIframe =
        $('<iframe/>', {
          'class': 'video-bg  video--vimeo',
          'id': 'video-bg-player-' + makeid(),
          'src': vimeoVideoSrc,
          'frameborder': 0
        }).appendTo($(this));

        vimeoObject.vimeoURL = vimeoVideoSrc.split('?')[0];

        // pushing the object into the Vimeo players list
        vimeoPlayersList.push(vimeoObject);

        initialWidth = 16;
        initialHeight = 9;
      }

      if (initialHeight == null && initialWidth == null) {
        initialHeight = $(this).find('iframe').height();
        initialWidth = $(this).find('iframe').width();
      }

      // setting and aspect ration on each iframe holder
      // based on the iframes
      $(this).attr('data-ar', initialWidth / initialHeight);

    });

    // adding event listeners for Vimeo videos
    if (window.addEventListener) window.addEventListener('message', onVimeoMessageReceived, false);
    else window.attachEvent('onmessage', onVimeoMessageReceived, false);

    / / calling an initial fill() on videos
    this.fill();
  },

  fill: function () {
    $('.video-iframe-holder').each(function () {

      // don't play the video if we're in a slider
      if ( !! $(this).closest('.projects--slider').length) {
        return;
      }

      // getting the parent of the iframe holder - the .hero
      var $parent = $(this).parent();

      // getting .hero's width and height
      var parentHeight = $parent.height(),
          parentWidth = $parent.width();

      var aspectRatio = $(this).attr('data-ar');

      // calc. .hero aspect ratio
      var parentRatio = parentWidth / parentHeight;

      //console.log(aspectRatio + ' ' + parentRatio);
      if (parentRatio >= aspectRatio) {
        //console.log('fill landscape');
        fillLandscape($(this), parentWidth, parentHeight, aspectRatio);
      }
      else if (parentRatio < aspectRatio) {
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

(function () {
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
    window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function () {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };

  if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
    clearTimeout(id);
  };
}());
