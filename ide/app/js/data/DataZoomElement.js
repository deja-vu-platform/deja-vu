/**
 * Created by Shinjini on 11/3/2016.
 */
var DataZoomElement = function(){
    var that = Object.create(DataZoomElement.prototype);
    var workSurfaceRef = DataWorkSurface().getWorkSurfaceRef();

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

    var changeZoomViaZoomControl = function(cliche, type) {
        if (type == 'slider') {
            // TODO make this better
            var zoom = getZoomFromSliderVal();
            $('#zoom-control-value').text(Math.round(zoom * 100) + '%');
            currentZoom = zoom;
        } else if (type == 'actual'){
            $('#zoom-slider').val(0);
            changeZoomViaZoomControl(cliche, 'slider');
        } else {
            //    Do nothing
        }
        changeZoomDisplays(cliche, currentZoom);

        // update the state
        var workSurface = $('#'+workSurfaceRef+'_'+cliche.meta.id);
        var state = workSurface.data('state');
        if (!state){
            state = {zoom: 1}
        }
        state.zoom = currentZoom;
        workSurface.data('state', state);

        propagateRatioChangeToAllElts(currentZoom, cliche);
    };



    /**
     * Changes the displays related to zoom
     *
     * @param zoom
     */
    var changeZoomDisplays = function(cliche, zoom){
        $('#zoom-control-value').text(Math.round(currentZoom*100)+'%');
        var sliderVal = getSliderValFromZoom(currentZoom);
        $('#zoom-slider').val(sliderVal);

        // update zoom nav displays
        $('#selected-screen-size').css({
            height: selectedScreenSizeHeight*currentZoom + 'px',
            width: selectedScreenSizeWidth*currentZoom + 'px',
        });
        $('#zoom-selected-screen-size').css({
            height: selectedScreenSizeHeight*currentZoom*dataMiniNav.getNavZoom() + 'px',
            width: selectedScreenSizeWidth*currentZoom*dataMiniNav.getNavZoom() + 'px',
        });
        $('.work-surface').css({
            height: selectedScreenSizeHeight*currentZoom + 'px',
            width: selectedScreenSizeWidth*currentZoom + 'px',
        });

        //dataMiniNav.updateNavInnerWidgetSizes(zoom);
    };

    that.updateZoomFromState = function(widget){
        var widgetId = widget.meta.id;
        currentZoom = $('#'+workSurfaceRef+'_'+widgetId).data('state').zoom;
        // it's updating from state, so that means new initializations are in order
        changeZoomDisplays(widget, currentZoom);
    };

    that.registerZoom = function(cliche) {
        $('#zoom-control-value').text('100%');

        $('#zoom-in').unbind().click( function (e) {
            e.preventDefault();
            var val = parseFloat($('#zoom-slider').val());
            $('#zoom-slider').val(Math.round(val/100)*100+100);
            changeZoomViaZoomControl(cliche, 'slider');
        });
        $('#zoom-out').unbind().click( function (e) {
            e.preventDefault();
            var val = parseFloat($('#zoom-slider').val());
            $('#zoom-slider').val(Math.round(val/100)*100-100);
            changeZoomViaZoomControl(cliche, 'slider');
        });


        $('#zoom-slider').unbind().on('input', function(){
            var potentialZoom = getZoomFromSliderVal();
            $('#zoom-control-value').text(Math.round(potentialZoom*100)+'%');
        });

        $('#zoom-slider').unbind().on('change', function(){
            changeZoomViaZoomControl(cliche, 'slider');
        });

        $('#zoom-actual').unbind().click(function(e, ui){
            e.preventDefault();
            changeZoomViaZoomControl(cliche, 'actual');

        });
    };

    Object.freeze(that);
    return that;
};






