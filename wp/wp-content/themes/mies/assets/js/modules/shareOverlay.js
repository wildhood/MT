function bindShareClick() {
    var tl              = new TimelineLite({ paused: true }),
        elements        = $(".share-icons > li"),
        randomGap       = .4;

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
}