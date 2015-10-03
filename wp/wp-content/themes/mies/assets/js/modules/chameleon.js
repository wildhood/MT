var Chameleon = {
    prepared: false,
    color: null,
    offset: 0,

    prepare: function() {

        var that = this;

        this.offset     = parseInt($('.logo').css('top'));
        this.header     = $('.header');
        this.sections   = $('body').children('.hero, .content, .footer').not('.hero--missing');

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

    update: function() {

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