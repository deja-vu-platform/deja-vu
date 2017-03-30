/**
 * Created by Shinjini on 3/14/2017.
 */


var Canvas = function(){
    var that = Object.create(Canvas.prototype);

    var canvasElt;
    var containerRef = dataContainerMaker.getContainerRef();

    that.createCanvas = function(container, height, width){
        canvasElt = document.createElement('canvas');
        canvasElt.id = "bonds-canvas";
        canvasElt.width = width;
        canvasElt.height = height;
        // canvas.style.position = "absolute";
        // canvas.style['pointer-events'] = "none";
       $(canvasElt).css({
            position: 'absolute',
            'pointer-events': 'none',
            top: 0,
            left: 0,
            'z-index': 100
        });
        container.append(canvasElt);
    };

    that.drawClicheDataLines = function(cliche){
        var list = [{clicheId:cliche.meta.id, dataIds: Object.keys(cliche.datatypes)}];
        that.clear();
        list.forEach(function (thing) {
            drawSingleClicheDataLines(thing.clicheId, thing.dataIds);
        });
    };


    var drawSingleClicheDataLines = function(clicheId, dataIds){
        dataIds.forEach(function (dataId) {
            that.drawLineBetweenContainers(
                $('#'+containerRef+'_'+clicheId),
                $('#'+containerRef+'_'+dataId)
               );
        });

    };


    that.drawLineBetweenContainers = function(c1, c2){
        var c1top = c1.position().top;
        var c1left = c1.position().left;
        var c1height = c1.height();
        var c1width = c1.width();

        var c2top = c2.position().top;
        var c2left = c2.position().left;
        var c2height = c2.height();
        var c2width = c2.width();

        var c1y = (2*c1top + c1height)/2;
        var c1x = (2*c1left + c1width)/2;
        var c2y = (2*c2top + c2height)/2;
        var c2x = (2*c2left + c2width)/2;

        that.drawLine([c1x, c1y], [c2x, c2y]);
    };

    that.drawLine = function(start, end){
        var ctx = canvasElt.getContext('2d');

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();
    };

    that.clear = function(){
        //http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
        var ctx = canvasElt.getContext('2d');
        // Store the current transformation matrix
        // ctx.save();

        // Use the identity matrix while clearing the canvas
        // ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvasElt.width, canvasElt.height);

        // Restore the transform
        // ctx.restore();
    };

    return that;
};

