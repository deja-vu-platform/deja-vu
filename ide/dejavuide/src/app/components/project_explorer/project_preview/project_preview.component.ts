/**
 * Created by Shinjini on 6/30/2016.
 */
var currentZoom = 1;

var gridHeight;
var gridWidth;

var view = WidgetDisplay();
var workSurface = WidgetWorkSurface();

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
            widgetContainer = workSurface.makeRecursiveWidgetContainersAndDisplay(
                innerWidget, widgetToShow, false, false, dragHandle,
                null, widgetToShow.properties.styles.custom, scale, true, true);
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


$('#page-preview').on('dblclick', '#main-table-preview', function(){
    // this div's existance means there is some project showing

   selectedProject = availableProjectsByFilename[$('#page-preview').data('projectfilename')];
   selectedProject.lastAccessed = new Date();
   window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
   window.location = 'index.html';
});


function showNextMainPage(project, currentPageNumber){
    var pages = project.cliches[project.userApp].widgets.pages;
    var numMainPages = Object.keys(pages).length;
    var nextPageNum = (currentPageNumber+1)%(numMainPages);
    var componentToShowId = Object.keys(pages)[nextPageNum];
    componentToShow = pages[componentToShowId];
    loadTablePreview(componentToShow);
    $('#page-preview').data('pagenum', nextPageNum);

}
function showPrevMainPage(project, currentPageNumber){
    var pages = project.cliches[project.userApp].widgets.pages;
    var numMainPages = Object.keys(pages).length;
    var prevPageNum = (currentPageNumber-1+numMainPages)%(numMainPages);
    var componentToShowId = Object.keys(pages)[prevPageNum];
    componentToShow = pages[componentToShowId];
    loadTablePreview(componentToShow);
    $('#page-preview').data('pagenum', prevPageNum);
}
