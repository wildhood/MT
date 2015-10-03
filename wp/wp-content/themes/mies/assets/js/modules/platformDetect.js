// Platform Detection
function getIOSVersion(ua) {
    ua = ua || navigator.userAgent;
    return parseFloat(
        ('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(ua) || [0,''])[1])
            .replace('undefined', '3_2').replace('_', '.').replace('_', '')
    ) || false;
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

    var navUA           = navigator.userAgent.toLowerCase(),
        navPlat         = navigator.platform.toLowerCase();

    var nua = navigator.userAgent;

    isiPhone        = navPlat.indexOf("iphone");
    isiPod          = navPlat.indexOf("ipod");
    isAndroidPhone  = ((nua.indexOf('Mozilla/5.0') !== -1 && nua.indexOf('Android ') !== -1 && nua.indexOf('AppleWebKit') !== -1) && nua.indexOf('Chrome') === -1);
    isSafari        = navUA.indexOf('safari') != -1 && navUA.indexOf('chrome') == -1;
    ieMobile        = ua.match(/Windows Phone/i) ? true : false;
    iOS             = getIOSVersion();
    android         = getAndroidVersion();
    isMac           = navigator.platform.toUpperCase().indexOf('MAC')>=0;
    is_ie           = detectIE();

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

    if (isAndroidPhone)
        $html.addClass('is--ancient-android');
}