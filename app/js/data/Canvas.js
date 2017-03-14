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
            left: 0
        });
        container.append(canvas);
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

