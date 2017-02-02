/**
 * Created by Shinjini on 6/30/2016.
 */
var currentZoom = 1;

var gridHeight;
var gridWidth;

var view = Display();
var workSurface = WorkSurface();

function loadTablePreview(widgetToShow) {

    $('#page-preview').html('');

    var page = $('<div></div>');
    page.attr('id', 'page');

    $('#page-preview').append(page);
    $('<style>#page::after{content:"' + widgetToShow.meta.name + '"}</style>').appendTo('head');

    page.css({
        position: 'relative',
        'background-color': (widgetToShow.properties.styles.custom['background-color'] || '87CEFA')
    });

    gridHeight = parseFloat($('#page-preview').height());
    gridWidth = parseFloat($('#page-preview').width());
    var widgetHeight = widgetToShow.properties.dimensions.height;
    var widgetWidth = widgetToShow.properties.dimensions.width;
    var widthScale = gridWidth/widgetWidth;
    var heightScale = gridHeight/widgetHeight;

    var scale = Math.min(widthScale,heightScale);
    page.height(widgetHeight*scale).width(widgetWidth*scale);

    widgetToShow.properties.layout.stackOrder.forEach(function(innerWidgetId){
        var innerWidget = widgetToShow.innerWidgets[innerWidgetId];
        var type = innerWidget.type;
        var dragHandle = $('.draggable[name=' + type + ']').clone(); // TODO do we have an a copy of this? needs a better way of getting this


        var widgetContainer = $('<div></div>');
        if (innerWidget.type == 'user'){
            widgetContainer = workSurface.makeRecursiveWidgetContainersAndDisplay(innerWidget, widgetToShow, false, dragHandle, null, currentZoom, widgetToShow.properties.styles.custom, true);
        }

        widgetContainer.addClass('component-container');
        widgetContainer.height(innerWidget.properties.dimensions.height*scale).width(innerWidget.properties.dimensions.width*scale);


        widgetContainer.css({
            position: 'absolute',
            left: widgetToShow.properties.layout[innerWidgetId].left*scale,
            top: widgetToShow.properties.layout[innerWidgetId].top*scale,

        });

        setUpContainer(widgetContainer, dragHandle, innerWidget, scale);
        page.append(widgetContainer);
    });
}

function setUpContainer(container, dragHandle, widget, zoom){
    container.append(dragHandle);
    view.displayWidget(true, widget, container, widget.properties.styles.custom, zoom);
}
