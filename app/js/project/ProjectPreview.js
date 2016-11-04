/**
 * Created by Shinjini on 6/30/2016.
 */
var numRows;
var numCols;

var currentZoom = 1;

var gridHeight;
var gridWidth;

var view = ComponentView();

function loadTablePreview(componentToShow) {

    $('#page-preview').html('');

    var page = $('<div></div>');
    page.attr('id', 'page');

    gridHeight = parseFloat($('#page-preview').height());
    gridWidth = parseFloat($('#page-preview').width());
    var componentHeight = componentToShow.dimensions.height;
    var componentWidth = componentToShow.dimensions.width;
    var widthScale = gridWidth/componentWidth;
    var heightScale = gridHeight/componentHeight;

    var scale = Math.min(widthScale,heightScale);
    page.height(componentHeight*scale).width(componentWidth*scale);

    componentToShow.layout.stackOrder.forEach(function(innerComponentId){
        var innerComponent = componentToShow.components[innerComponentId];
        var type = innerComponent.type;
        var componentContainer = $('<div></div>');
        componentContainer.addClass('component-container');
        componentContainer.height(innerComponent.dimensions.height*scale).width(innerComponent.dimensions.width*scale);

        var widget = $('.draggable[name=' + type + ']').clone(); // TODO do we have an a copy of this? needs a better way of getting this

        componentContainer.css({
            position: 'absolute',
            left: componentToShow.layout[innerComponentId].left*scale,
            top: componentToShow.layout[innerComponentId].top*scale,

        });

        setUpContainer(componentContainer, widget, innerComponent, scale);
        page.append(componentContainer);
    });
    page.css({
        position: 'relative',
    });

    $('#page-preview').append(page);
    $('<style>#page::after{content:"' + componentToShow.meta.name + '"}</style>').appendTo('head');
}

function setUpContainer(container, widget, component, zoom){
    container.append(widget);
    var type = widget.attr('name');
    if (component){
        var html = view.getHTML[type](component.components[type]);
    } else {
        var html = view.getHTML[type]();
    }
    view.display(container, type, html, zoom);

}
