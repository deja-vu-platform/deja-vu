/**
 * Created by Shinjini on 3/14/2017.
 */


var Canvas = function(){
    var that = Object.create(Canvas.prototype);

    var canvas;

    that.createCanvas = function(container, height, width){
        canvas = document.createElement('canvas');
        canvas.id = "bonds-canvas";
        canvas.width = width;
        canvas.height = height;
        // canvas.style.position = "absolute";
        // canvas.style['pointer-events'] = "none";
       $(canvas).css({
            position: 'absolute',
            'pointer-events': 'none',
            top: 0,
            left: 0,
            'z-index': 100
        });
        container.append(canvas);
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
        var ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();
    };

    that.clear = function(){

    };

    return that;
};

