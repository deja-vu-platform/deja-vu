/**
 * Created by Shinjini on 11/3/2016.
 */

var MiniNav = function(){
    var that = Object.create(MiniNav);

    var showMiniNavPosition = function(){
        var scrollTop = $('#outer-container').scrollTop()*navZoom;
        var scrollLeft = $('#outer-container').scrollLeft()*navZoom;

        $('#zoom-nav-position').css({
            position: 'absolute',
            top: scrollTop + 'px',
            left: scrollLeft + 'px',

            height: $('#outer-container').height()*navZoom + 'px',
            width: $('#outer-container').width()*navZoom + 'px',
            border: '1px black solid',
            background: 'blue',
            opacity: '0.5',
        });

        if ((scrollTop>($('#zoom-nav').scrollTop()+$('#zoom-nav').height()-$('#zoom-nav-position').height()))){
            var navScrollTop = scrollTop-($('#zoom-nav').height()-$('#zoom-nav-position').height());
            navScrollTop = Math.max(navScrollTop,0);
            navScrollTop = Math.min(navScrollTop, 3000/navZoom-$('#zoom-nav').height());
            $('#zoom-nav').scrollTop(navScrollTop);
        }
        if ((scrollTop<($('#zoom-nav').scrollTop()))){
            var navScrollTop = scrollTop;
            navScrollTop = Math.max(navScrollTop,0);
            navScrollTop = Math.min(navScrollTop, 3000/navZoom-$('#zoom-nav').height());
            $('#zoom-nav').scrollTop(navScrollTop);
        }
        if ((scrollLeft>($('#zoom-nav').scrollLeft()+$('#zoom-nav').width()-$('#zoom-nav-position').width()))){
            var navScrollLeft = scrollLeft-($('#zoom-nav').width()-$('#zoom-nav-position').width());
            navScrollLeft = Math.max(navScrollLeft,0);
            navScrollLeft = Math.min(navScrollLeft, 3000/navZoom-$('#zoom-nav').width());
            $('#zoom-nav').scrollLeft(navScrollLeft);
        }

        if ((scrollLeft<($('#zoom-nav').scrollLeft()))){
            var navScrollLeft = scrollLeft;
            navScrollLeft = Math.max(navScrollLeft,0);
            navScrollLeft = Math.min(navScrollLeft, 3000/navZoom-$('#zoom-nav').width());
            $('#zoom-nav').scrollLeft(navScrollLeft);
        }

    };

    that.miniNavInitialize = function(){
        var widthScale = ($('#zoom-nav').width())/$('#selected-screen-size').width();
        var heightScale = ($('#zoom-nav').height())/$('#selected-screen-size').height();

        var scale = Math.min(widthScale, heightScale);
        navZoom = scale;

        that.setUpMiniNavElementAndInnerComponentSizes();
        $('#zoom-selected-screen-size').css({
            position: 'absolute',
            // height: $('#selected-screen-size').height()*scale*currentZoom + 'px',
            // width: $('#selected-screen-size').width()*scale*currentZoom + 'px',
            border: '1px black solid',
            background: 'white',
        });

        $('#zoom-nav-full-area').css({
            position: 'absolute',
            height: 3000*scale + 'px',
            width: 3000*scale + 'px',
        });
        showMiniNavPosition();

        $('#zoom-nav-minimize-btn').click(function(){
            if ($(this).hasClass('minimized')){
                $(this).removeClass('minimized').addClass('btn-xs');
                $('#zoom-nav').css({
                    display: 'block',
                });
                $(this).text('_');
            } else {
                $(this).addClass('minimized').removeClass('btn-xs').text('Navigation');
                $('#zoom-nav').css({
                    display: 'none',
                })
            }

        });
    };

    that.updateMiniNavInnerComponentSizes = function(zoom){
        that.setUpMiniNavElementAndInnerComponentSizes();
        that.updateNavInnerComponentSizes(zoom);
    };

    that.updateNavInnerComponentSizes = function(zoom){
        $('#zoom-nav-component-sizes').css({
            zoom: zoom,
        });
    };

    that.setUpMiniNavElementAndInnerComponentSizes = function(){
        $('#zoom-nav-component-sizes').html('').css({
            width: selectedUserComponent.dimensions.width*navZoom + 'px',
            height: selectedUserComponent.dimensions.height*navZoom + 'px',
        });

        Object.keys(selectedUserComponent.components).forEach(function(innerComponentId){
            var innerComponent = selectedUserComponent.components[innerComponentId];
            var componentSizeDiv = $('<div></div>');
            componentSizeDiv.addClass('zoom-nav-inner-component-size');
            componentSizeDiv.css({
                position: 'absolute',
                left: selectedUserComponent.layout[innerComponentId].left*navZoom,
                top: selectedUserComponent.layout[innerComponentId].top*navZoom,
                width: innerComponent.dimensions.width*navZoom,
                height: innerComponent.dimensions.height*navZoom,
                background: 'black'
            });

            $('#zoom-nav-component-sizes').append(componentSizeDiv);
        });
    };

    $('#outer-container').on('scroll', function(){
        if (!navDragging){
            showMiniNavPosition();
        }
    });

    $('#zoom-nav').click(function(e){
        var posX = e.pageX - $('#zoom-nav').offset().left + $('#zoom-nav').scrollLeft();
        var posY = e.pageY - $('#zoom-nav').offset().top + $('#zoom-nav').scrollTop();
        $('#outer-container').scrollTop(posY/navZoom);
        $('#outer-container').scrollLeft(posX/navZoom);

        $('#zoom-nav-position').css({
            top: Math.min(posY, $('#zoom-nav-full-area').height()- $('#zoom-nav-position').height()) + 'px',
            left: Math.min(posX, $('#zoom-nav-full-area').width()- $('#zoom-nav-position').width()) + 'px',
        });
    });

    $('#zoom-nav-position').draggable({
        containment: '#zoom-nav-full-area',
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






