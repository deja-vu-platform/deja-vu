/**
 * Created by Shinjini on 11/3/2016.
 */

var MiniNav = function(){
    var that = Object.create(MiniNav);

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

    that.miniNavInitialize = function(userComponent){
        var widthScale = ($('#mini-nav').width())/$('#selected-screen-size').width();
        var heightScale = ($('#mini-nav').height())/$('#selected-screen-size').height();

        var scale = Math.min(widthScale, heightScale);
        navZoom = scale;

        that.setUpMiniNavElementAndInnerComponentSizes(userComponent);
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

    that.updateMiniNavInnerComponentSizes = function(component, zoom){
        that.setUpMiniNavElementAndInnerComponentSizes(component);
        that.updateNavInnerComponentSizes(zoom);
    };

    that.updateNavInnerComponentSizes = function(zoom){
        $('#mini-nav-component-sizes').css({
            zoom: zoom,
        });
    };

    that.setUpMiniNavElementAndInnerComponentSizes = function(outerComponent){
        $('#mini-nav-component-sizes').html('').css({
            width: outerComponent.dimensions.width*navZoom + 'px',
            height: outerComponent.dimensions.height*navZoom + 'px',
        });

        Object.keys(outerComponent.components).forEach(function(innerComponentId){
            var innerComponent = outerComponent.components[innerComponentId];
            var componentSizeDiv = $('<div></div>');
            componentSizeDiv.addClass('mini-nav-inner-component-size');
            componentSizeDiv.css({
                position: 'absolute',
                left: outerComponent.layout[innerComponentId].left*navZoom,
                top: outerComponent.layout[innerComponentId].top*navZoom,
                width: innerComponent.dimensions.width*navZoom,
                height: innerComponent.dimensions.height*navZoom,
                background: 'black'
            });

            $('#mini-nav-component-sizes').append(componentSizeDiv);
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

    return that;
};






