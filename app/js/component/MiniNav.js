/**
 * Created by Shinjini on 11/3/2016.
 */

var MiniNav = function(){
    var that = Object.create(MiniNav);

    var navZoom = .1;
    var navDragging = false;


    that.getNavZoom = function(){
        return navZoom;
    };

    var showMiniNavPosition = function(){
        var scrollTop = $('#outer-container').scrollTop()*navZoom;
        var scrollLeft = $('#outer-container').scrollLeft()*navZoom;

        $('#mini-nav-position').css({
            position: 'absolute',
            top: scrollTop + 'px',
            left: scrollLeft + 'px',

            height: $('#outer-container').height()*navZoom + 'px',
            width: $('#outer-container').width()*navZoom + 'px',
            border: '1px black solid',
            background: 'blue',
            opacity: '0.5',
        });

        if ((scrollTop>($('#mini-nav').scrollTop()+$('#mini-nav').height()-$('#mini-nav-position').height()))){
            var navScrollTop = scrollTop-($('#mini-nav').height()-$('#mini-nav-position').height());
            navScrollTop = Math.max(navScrollTop,0);
            navScrollTop = Math.min(navScrollTop, 3000/navZoom-$('#mini-nav').height());
            $('#mini-nav').scrollTop(navScrollTop);
        }
        if ((scrollTop<($('#mini-nav').scrollTop()))){
            var navScrollTop = scrollTop;
            navScrollTop = Math.max(navScrollTop,0);
            navScrollTop = Math.min(navScrollTop, 3000/navZoom-$('#mini-nav').height());
            $('#mini-nav').scrollTop(navScrollTop);
        }
        if ((scrollLeft>($('#mini-nav').scrollLeft()+$('#mini-nav').width()-$('#mini-nav-position').width()))){
            var navScrollLeft = scrollLeft-($('#mini-nav').width()-$('#mini-nav-position').width());
            navScrollLeft = Math.max(navScrollLeft,0);
            navScrollLeft = Math.min(navScrollLeft, 3000/navZoom-$('#mini-nav').width());
            $('#mini-nav').scrollLeft(navScrollLeft);
        }

        if ((scrollLeft<($('#mini-nav').scrollLeft()))){
            var navScrollLeft = scrollLeft;
            navScrollLeft = Math.max(navScrollLeft,0);
            navScrollLeft = Math.min(navScrollLeft, 3000/navZoom-$('#mini-nav').width());
            $('#mini-nav').scrollLeft(navScrollLeft);
        }

    };

    that.miniNavInitialize = function(){
        var widthScale = ($('#mini-nav').width())/$('#selected-screen-size').width();
        var heightScale = ($('#mini-nav').height())/$('#selected-screen-size').height();

        var scale = Math.min(widthScale, heightScale);
        navZoom = scale;

        $('#zoom-selected-screen-size').css({
            position: 'absolute',
            // height: $('#selected-screen-size').height()*scale*currentZoom + 'px',
            // width: $('#selected-screen-size').width()*scale*currentZoom + 'px',
            border: '1px black solid',
            background: 'white',
        });

        $('#mini-nav-full-area').css({
            position: 'absolute',
            height: 3000*scale + 'px',
            width: 3000*scale + 'px',
        });
        showMiniNavPosition();

        $('#mini-nav-minimize-btn').click(function(){
            if ($(this).hasClass('minimized')){
                $(this).removeClass('minimized').addClass('btn-xs');
                $('#mini-nav').css({
                    display: 'block',
                });
                $(this).text('_');
            } else {
                $(this).addClass('minimized').removeClass('btn-xs').text('Navigation');
                $('#mini-nav').css({
                    display: 'none',
                })
            }

        });
    };

    that.updateMiniNavInnerWidgetSizes = function(outerWidget, zoom){
        that.setUpMiniNavElementAndInnerWidgetSizes(outerWidget);
        that.updateNavInnerWidgetSizes(zoom);
    };

    that.updateNavInnerWidgetSizes = function(zoom){
        $('#mini-nav-component-sizes').css({
            zoom: zoom,
        });
    };

    that.setUpMiniNavElementAndInnerWidgetSizes = function(outerWidget){
        $('#mini-nav-component-sizes').html('').css({
            width: outerWidget.dimensions.width*navZoom + 'px',
            height: outerWidget.dimensions.height*navZoom + 'px',
        });

        Object.keys(outerWidget.innerWidgets).forEach(function(innerWidgetId){
            var innerWidget = outerWidget.innerWidgets[innerWidgetId];
            var widgetSizeDiv = $('<div></div>');
            widgetSizeDiv.addClass('mini-nav-inner-component-size');
            widgetSizeDiv.css({
                position: 'absolute',
                left: outerWidget.layout[innerWidgetId].left*navZoom,
                top: outerWidget.layout[innerWidgetId].top*navZoom,
                width: innerWidget.dimensions.width*navZoom,
                height: innerWidget.dimensions.height*navZoom,
                background: 'black'
            });

            $('#mini-nav-component-sizes').append(widgetSizeDiv);
        });
    };

    $('#outer-container').on('scroll', function(){
        if (!navDragging){
            showMiniNavPosition();
        }
    });

    $('#mini-nav').click(function(e){
        var posX = e.pageX - $('#mini-nav').offset().left + $('#mini-nav').scrollLeft();
        var posY = e.pageY - $('#mini-nav').offset().top + $('#mini-nav').scrollTop();
        $('#outer-container').scrollTop(posY/navZoom);
        $('#outer-container').scrollLeft(posX/navZoom);

        $('#mini-nav-position').css({
            top: Math.min(posY, $('#mini-nav-full-area').height()- $('#mini-nav-position').height()) + 'px',
            left: Math.min(posX, $('#mini-nav-full-area').width()- $('#mini-nav-position').width()) + 'px',
        });
    });

    $('#mini-nav-position').draggable({
        containment: '#mini-nav-full-area',
        start: function(){
            navDragging = true;
        },
        drag: function(e, ui){
            var posX = ui.position.left;
            var posY = ui.position.top;
            $('#outer-container').scrollTop(posY/navZoom);
            $('#outer-container').scrollLeft(posX/navZoom);
            showMiniNavPosition();
        },
        stop: function(){
            navDragging = false;
        },
    });

    that.updateMiniNavPositionSize = function(outerContainerWidth, outerContainerHeight){
        $('#mini-nav-position').css({
            height: outerContainerHeight*navZoom + 'px',
            width: outerContainerWidth*navZoom + 'px',
        });
    }

    return that;
};






