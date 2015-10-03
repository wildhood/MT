function smoothScrollTo(y, speed) {

    speed = typeof speed == "undefined" ? 1 : speed;

    var distance = Math.abs(latestKnownScrollY - y),
        time     = speed * distance / 2000;

    TweenMax.to($(window), time, {scrollTo: {y: y, autoKill: true, ease: Quint.easeInOut}});
}

(function () {
	if (window.location.hash) {
		var hash = window.location.hash,
			target = jQuery(hash),
			distance;

		if ( ! target.length ) {
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