/**
 * Created by Shinjini on 11/3/2016.
 */
var ZoomElement = function(){
    var that = Object.create(ZoomElement);

    var getSliderValFromZoom = function(zoom){
        var max = parseFloat($('#zoom-slider').get(0).max);
        var min = parseFloat($('#zoom-slider').get(0).min);

        var val = 0;
        if (zoom === 1){
            val = 0;
        } else if ( zoom > 1 ){
            val = (zoom-1)*100;
        } else {
            val = (zoom-1)*(max+100);
        }
        // rounding for extremes
        val = Math.max(Math.min(val, max), min);
        return Math.round(val);
    };

    var getZoomFromSliderVal = function(){
        var val = parseFloat($('#zoom-slider').val())/100;
        //var val = $( "#zoom-slider" ).slider( "option", "value" );
        var zoom = 1;
        if (val===0){
            zoom = 1;
        } else if (val>0){
            zoom = (val+1);
        } else {
            var max = parseFloat($('#zoom-slider').get(0).max)/100;
            zoom = 1+val/(max+1);
        }
        return zoom;
    };

    var changeZoomViaZoomControl = function(outerComponent, type) {
        if (type == 'slider') {
            // TODO make this better
            var zoom = getZoomFromSliderVal();
            $('#zoom-control-value').text(Math.round(zoom * 100) + '%');
            currentZoom = zoom;
        } else if (type == 'fit') {
            var zoomHeight = $('#outer-container').height() / outerComponent.dimensions.height;
            var zoomWidth = $('#outer-container').width() / outerComponent.dimensions.width;
            currentZoom = Math.min(zoomWidth, zoomHeight);
        } else if (type == 'full'){
            var widthScale = ($('#outer-container').width())/selectedScreenSizeWidth;
            var heightScale = ($('#outer-container').height())/selectedScreenSizeHeight;
            currentZoom = Math.min(widthScale, heightScale);
        } else if (type == 'actual'){
            $('#zoom-slider').val(0);
            changeZoomViaZoomControl(outerComponent, 'slider');
        } else {
            //    Do nothing
        }
        changeZoomDisplays(outerComponent, currentZoom);

        // update the state
        var workSurface = $('#work-surface'+'_'+outerComponent.meta.id);
        var state = workSurface.data('state');
        if (!state){
            state = {zoom: 1}
        }
        state.zoom = currentZoom;
        workSurface.data('state', state);

        propagateRatioChangeToAllElts(currentZoom, outerComponent);
    };



    /**
     * Changes the displays related to zoom
     *
     * @param zoom
     */
    var changeZoomDisplays = function(outerComponent, zoom){
        $('#zoom-control-value').text(Math.round(currentZoom*100)+'%');
        var sliderVal = getSliderValFromZoom(currentZoom);
        $('#zoom-slider').val(sliderVal);

        // update zoom nav displays
        $('#selected-screen-size').css({
            height: selectedScreenSizeHeight*currentZoom + 'px',
            width: selectedScreenSizeWidth*currentZoom + 'px',
        });
        $('#zoom-selected-screen-size').css({
            height: selectedScreenSizeHeight*currentZoom*miniNav.getNavZoom() + 'px',
            width: selectedScreenSizeWidth*currentZoom*miniNav.getNavZoom() + 'px',
        });
        $('.work-surface').css({
            width: outerComponent.dimensions.width*zoom + 'px',
            height: outerComponent.dimensions.height*zoom + 'px',
        });

        miniNav.updateNavInnerWidgetSizes(zoom);
    };

    that.updateZoomFromState = function(component){
        var componentId = component.meta.id;
        currentZoom = $('#work-surface'+'_'+componentId).data('state').zoom;
        // it's updating from state, so that means new initializations are in order
        // miniNav.setUpMiniNavElementAndInnerWidgetSizes(component);
        // that.registerZoom(component);
        changeZoomDisplays(component, currentZoom);
    };

    that.registerZoom = function(outerComponent) {
        $('#zoom-control-value').text('100%');

        $('#zoom-in').unbind().click( function (e) {
            e.preventDefault();
            var val = parseFloat($('#zoom-slider').val());
            $('#zoom-slider').val(Math.round(val/100)*100+100);
            changeZoomViaZoomControl(outerComponent, 'slider');
        });
        $('#zoom-out').unbind().click( function (e) {
            e.preventDefault();
            var val = parseFloat($('#zoom-slider').val());
            $('#zoom-slider').val(Math.round(val/100)*100-100);
            changeZoomViaZoomControl(outerComponent, 'slider');
        });


        $('#zoom-slider').unbind().on('input', function(){
            var potentialZoom = getZoomFromSliderVal();
            $('#zoom-control-value').text(Math.round(potentialZoom*100)+'%');
        });

        $('#zoom-slider').unbind().on('change', function(){
            changeZoomViaZoomControl(outerComponent, 'slider');
        });

        $('#zoom-actual').unbind().click(function(e, ui){
            e.preventDefault();
            changeZoomViaZoomControl(outerComponent, 'actual');

        });

        $('#zoom-fit').unbind().click(function(e, ui){
            e.preventDefault();
            changeZoomViaZoomControl(outerComponent, 'fit');
        });
        $('#zoom-full').unbind().click(function(e, ui){
            e.preventDefault();
            changeZoomViaZoomControl(outerComponent, 'full');
        });

        $('#zoom-control-minimize-btn').unbind().click(function(){
            if ($(this).hasClass('minimized')){
                $(this).removeClass('minimized').find('span').removeClass('glyphicon-chevron-left').addClass('glyphicon-chevron-right');
                $('#zoom-slider-and-value, #zoom-actual, #zoom-fit, #zoom-full').css({
                    display: 'inline-block',
                })


            }else{
                $(this).addClass('minimized').find('span').addClass(' glyphicon-chevron-left').removeClass('glyphicon-chevron-right');
                $('#zoom-slider-and-value, #zoom-actual, #zoom-fit, #zoom-full').css({
                    display: 'none',
                })
            }
        })
    };

    Object.freeze(that);
    return that;
};






