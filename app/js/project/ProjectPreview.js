/**
 * Created by Shinjini on 6/30/2016.
 */
var currentZoom = 1;

var gridHeight;
var gridWidth;

var view = Display();
var workSurface = WorkSurface();

function loadTablePreview(componentToShow) {

    $('#page-preview').html('');

    var page = $('<div></div>');
    page.attr('id', 'page');

    $('#page-preview').append(page);
    $('<style>#page::after{content:"' + componentToShow.meta.name + '"}</style>').appendTo('head');

    page.css({
        position: 'relative',
        'background-color': (componentToShow.properties.custom['background-color'] || '87CEFA')
    });

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
        var dragHandle = $('.draggable[name=' + type + ']').clone(); // TODO do we have an a copy of this? needs a better way of getting this


        var componentContainer = $('<div></div>');
        if (innerComponent.type == 'user'){
            componentContainer = workSurface.makeRecursiveComponentContainersAndDisplay(innerComponent, componentToShow, false, dragHandle, null, currentZoom, componentToShow.properties.custom);
        }

        componentContainer.addClass('component-container');
        componentContainer.height(innerComponent.dimensions.height*scale).width(innerComponent.dimensions.width*scale);


        componentContainer.css({
            position: 'absolute',
            left: componentToShow.layout[innerComponentId].left*scale,
            top: componentToShow.layout[innerComponentId].top*scale,

        });

        setUpContainer(componentContainer, dragHandle, innerComponent, scale);
        page.append(componentContainer);
    });
}

function setUpContainer(container, dragHandle, component, zoom){
    container.append(dragHandle);
    view.displayComponent(true, component, container, component.properties.main, zoom);
}
