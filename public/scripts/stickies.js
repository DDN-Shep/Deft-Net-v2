function stickyTitles(stickies) {

    var _this = this;

    _this.load = function() {

        stickies.each(function(){

            var thisSticky = $(this).wrap('<div class="followWrap" />');
            thisSticky.parent().height(thisSticky.outerHeight());

            $.data(thisSticky[0], 'pos', thisSticky.offset().top);

        });

        $(window).off("scroll.stickies").on("scroll.stickies", function() {

            _this.scroll();

        });
    }

    _this.scroll = function() {

        stickies.each(function(i){

            var thisSticky = $(this),
                nextSticky = stickies.eq(i+1),
                prevSticky = stickies.eq(i-1),
                pos = $.data(thisSticky[0], 'pos');

            if (pos <= $(window).scrollTop()) {

                thisSticky.addClass("fixed");

                if (nextSticky.length > 0 && thisSticky.offset().top >= $.data(nextSticky[0], 'pos') - thisSticky.outerHeight()) {

                    thisSticky.addClass("absolute").css("top", $.data(nextSticky[0], 'pos') - thisSticky.outerHeight());
                }

            } else {

                thisSticky.removeClass("fixed");

                if (prevSticky.length > 0 && $(window).scrollTop() <= $.data(thisSticky[0], 'pos')  - prevSticky.outerHeight()) {

                    prevSticky.removeClass("absolute").removeAttr("style");
                }
            }
        });
    }
}

$(document).ready(function(){

    for (var iter = 1; iter <= 10; iter++)
    {
        var $demo = $('section.demo');

        $demo.append($('<div class="separator">' + iter + '</div>'));
        $demo.append($('<div class="whitespace"></div>'));
    }

    new stickyTitles($('.separator')).load();

});