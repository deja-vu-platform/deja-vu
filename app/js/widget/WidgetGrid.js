/**
 * Created by Shinjini on 1/8/2017.
 */

var WidgetGrid = function(){
    var that = Object.create(WidgetGrid.prototype);

    var xsWithoutBoundary = [];
    var ysWithoutBoundary = [];

    var xs = [];
    var ys = [];

    that.setUpGrid = function(){
        // TODO this should be able to be done based on the userWidget!

        $('.grid').remove();
        var workSurface = $('#work-surface_'+selectedUserWidget.meta.id);

        var grid = {x: {}, y:{}};
        for (var widgetId in selectedUserWidget.innerWidgets){
            // existing components should also be in the work surface!
            var container = $('#component-container_'+widgetId);
            var top = container.position().top;
            var left = container.position().left;
            var right = left + container.width();
            var bottom = top + container.height();
            grid.x[left] = '';
            grid.x[right] = '';
            grid.y[top] = '';
            grid.y[bottom] = '';
        }

        // var top = workSurface.offset().top;
        var workSurfaceTop = 0;
        var workSurfaceBottom = workSurfaceTop + workSurface.height();
        // var left = workSurface.offset().left;
        var workSurfaceLeft = 0;
        var workSurfaceRight = workSurfaceLeft + workSurface.width();

        xsWithoutBoundary.push(workSurfaceLeft, workSurfaceRight);
        ysWithoutBoundary.push(workSurfaceTop, workSurfaceBottom);

        // TODO make more elegant
        // get the sets of xs and ys
        xsWithoutBoundary = Object.keys(grid.x).map(function(key){
            return parseFloat(key);
        });
        xsWithoutBoundary.sort(function(a, b){
            return a-b;
        });

        ysWithoutBoundary = Object.keys(grid.y).map(function(key){
            return parseFloat(key);
        });
        ysWithoutBoundary.sort(function(a, b){
            return a-b;
        });



        grid.x[workSurfaceLeft] = '';
        grid.x[workSurfaceRight] = '';
        grid.y[workSurfaceTop] = '';
        grid.y[workSurfaceBottom] = '';

        // get the sets of xs and ys
        xs = Object.keys(grid.x).map(function(key){
            return parseFloat(key);
        });
        xs.sort(function(a, b){
            return a-b;
        });

        ys = Object.keys(grid.y).map(function(key){
            return parseFloat(key);
        });
        ys.sort(function(a, b){
            return a-b;
        });

        var gridElt = $('<div></div>');
        gridElt.addClass('grid');

        var numXs = xs.length;
        var numYs = ys.length;

        for (var xNum = 0; xNum<numXs; xNum++){
            var xElt = $('<div></div>');
            xElt.addClass('grid-x grid-line');
            xElt.attr('id', 'grid-x_'+xNum);
            gridElt.append(xElt);
            xElt.css({
                position: 'absolute',
                height: workSurface.height(),
                width: '1px',
                top: 0,
                left: xs[xNum],
                border: '1px dashed black'
            });
        }

        for (var yNum = 0; yNum<numYs; yNum++){
            var yElt = $('<div></div>');
            yElt.addClass('grid-y grid-line');
            yElt.attr('id', 'grid-y_'+yNum);
            gridElt.append(yElt);
            yElt.css({
                position: 'absolute',
                height: '1px',
                width: workSurface.width(),
                top: ys[yNum],
                left: 0,
                border: '1px dashed black'
            });
        }
        gridElt.css({
            position: 'absolute',
            top: 0,
            left: 0,
            visibility: 'hidden',
        });
        workSurface.append(gridElt);
    };


    that.detectGridLines = function(container){
        $('.grid-line').css({
            visibility: 'hidden'
        });

        var top = container.position().top;
        var bottom = top + container.height();
        var left = container.position().left;
        var right = left + container.width();

        var OFFSET = 10;
        var minLeft = left - OFFSET;
        var maxLeft = left + OFFSET;
        var minRight = right - OFFSET;
        var maxRight = right + OFFSET;
        var minTop = top - OFFSET;
        var maxTop = top + OFFSET;
        var minBottom = bottom - OFFSET;
        var maxBottom = bottom + OFFSET;

        for (var idx = 0; idx<xs.length; idx++){
            var x = xs[idx];
            if ((minLeft<=x)&&(maxLeft>=x) || (minRight<=x)&&(maxRight>=x) ){
                $('#grid-x_'+idx).css({
                    visibility: 'visible'
                });
            }
        }

        for (var idx = 0; idx<ys.length; idx++){
            var y = ys[idx];
            if ((minTop<=y)&&(maxTop>=y) || (minBottom<=y)&&(maxBottom>=y)){
                $('#grid-y_'+idx).css({
                    visibility: 'visible'
                });
            }
        }



    };

    that.getLeftMostGridPosition = function(){
        var len = xsWithoutBoundary.length;
        if (len>0){
            return xs[0];
        }
        return false;
    };

    that.getRightMostGridPosition = function(){
        var len = xsWithoutBoundary.length;
        if (len>0){
            return xsWithoutBoundary[len-1];
        }
        return false;
    };

    that.getTopMostGridPosition = function(){
        var len = ysWithoutBoundary.length;
        if (len>0){
            return ysWithoutBoundary[0];
        }
        return false;
    };

    that.getBottomMostGridPosition = function(){
        var len = ysWithoutBoundary.length;
        if (len>0){
            return ysWithoutBoundary[len-1];
        }
        return false;
    };

    Object.freeze(that);
    return that;
};



//
function setUpGrid(){
//     $('.grid').remove();
//     var workSurface = $('#work-surface_'+selectedUserWidget.meta.id);
//
//     var grid = {x: {}, y:{}};
//     for (var componentId in selectedUserWidget.components){
//         // existing components should also be in the work surface!
//         var container = $('#component-container_'+componentId);
//         var top = container.position().top;
//         var left = container.position().left;
//         var right = left + container.width();
//         var bottom = top + container.height();
//         grid.x[left] = '';
//         grid.x[right] = '';
//         grid.y[top] = '';
//         grid.y[bottom] = '';
//     }
//     var xs = Object.keys(grid.x).map(function(key){
//         return parseFloat(key);
//     });
//
//     // var top = workSurface.offset().top;
//     var top = 0;
//     var bottom = top + workSurface.height();
//     // var left = workSurface.offset().left;
//     var left = 0;
//     var right = left + workSurface.width();
//
//     xs.push(left);
//     xs.push(right);
//     xs.sort(function(a, b){
//         return a-b;
//     });
//
//     var ys = Object.keys(grid.y).map(function(key){
//         return parseFloat(key);
//     });
//     ys.push(top);
//     ys.push(bottom);
//     ys.sort(function(a, b){
//         return a-b;
//     });
//
//     var numRows = ys.length-1;
//     var numCols = xs.length-1;
//
//     var gridElt = $('<div></div>');
//     gridElt.addClass('grid');
//     for (var col=0; col<numCols; col++){
//         var colElt = $('<div></div>');
//         colElt.addClass('grid-col');
//         gridElt.append(colElt);
//
//         for (var row=0; row<numRows; row++){
//             var cellElt = $('<div></div>');
//             cellElt.addClass('grid-cell');
//             cellElt.attr('id', 'grid-cell_'+row+'_'+col);
//             colElt.append(cellElt);
//             cellElt.css({
//                 width: xs[col+1] - xs[col],
//                 height: ys[row+1] - ys[row],
//             });
//         }
//     }
//     gridElt.css({
//         position: 'absolute',
//         // top: ys[0] - workSurface.offset().top,
//         // left: xs[0] - workSurface.offset().left,
//         top: 0,
//         left: 0,
//         width: 1.1*(xs[numCols] - xs[0]),
//         visibility: 'hidden',
//     });
//     workSurface.append(gridElt);
//     // $('body').append(gridElt);
//     $('.grid-col').css({
//         display: 'inline-block'
//     });
//     $('.grid-cell').css({
//         display: 'block',
//         border: '1px dashed grey'
//     });
};