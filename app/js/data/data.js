/**
 * Created by Shinjini on 9/26/2016.
 */

var zoomElement = WidgetZoomElement();
var miniNav = WidgetMiniNav();
var view = WidgetDisplay();
var workSurface = WidgetWorkSurface();
var dragAndDrop = WidgetDragAndDropController();
//var grid = Grid();
var widgetEditsManager = WidgetEditsManager();
//var style = Style($('.palette-container'));

var projectsSavePath = path.join(__dirname, 'projects');
var addedCliches;

var selectedScreenSizeHeight = 1600;
var selectedScreenSizeWidth = 2000;

var files = [];

var selectedUserWidget = null;
var selectedProject = null;

var currentZoom = 1.0;
var basicWidgets;


// settings
var confirmOnUserWidgetDelete = true;

$(function(){
    $('.project-options-container').css({
        height: ($('html').height() - 70) + 'px',
    });

    $('#outer-container').css({
        height: ($('html').height() - 70 - 44) + 'px',
    });

    // todo get screenSizes for the user

    $('#selected-screen-size').css({
        height: selectedScreenSizeHeight*currentZoom + 'px',
        width: selectedScreenSizeWidth*currentZoom + 'px',
    });

    miniNav.miniNavInitialize();


    // get selected project
    selectedProject = window.sessionStorage.getItem('selectedProject');
    if (selectedProject){ // if it exists, load it
        selectedProject = UserProject.fromString(selectedProject);
    } else { // if not, make a new one
        selectedProject = new UserProject(DEFAULT_PROJECT_NAME, generateId(), DEFAULT_VERSION, DEFAULT_AUTHOR);
    }

    $('.project-name .header').text(selectedProject.meta.name);

    addedCliches = selectedProject.addedCliches;
    for (var id in addedCliches) {
        showClicheInList(id, addedCliches[id].name);
    }

    if (selectedProject.getNumComponents() == 0){
        // start a default component
        selectedUserWidget = initUserWidget(true, true);
        selectedProject.addMainPage(selectedUserWidget);
        displayMainPageInListAndSelect(selectedUserWidget.meta.name, selectedUserWidget.meta.id);
    } else {
        var widgetToLoadId;
        if (!$.isEmptyObject(selectedProject.mainComponent)){
            widgetToLoadId = Object.keys(selectedProject.mainComponent)[0];
        } else {
            widgetToLoadId = Object.keys(selectedProject.components)[0];
        }
        selectedUserWidget = selectedProject.components[widgetToLoadId];
        if (widgetToLoadId in selectedProject.mainComponent){
            displayMainPageInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId);
        } else {
            displayUserWidgetInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId);
        }
        // TODO this will need to be changed once we bring in a userComponent which will be a
        // superset of userWidgets

        for (var componentId in selectedProject.components){
            if (componentId != widgetToLoadId){
                var componentName = selectedProject.components[componentId].meta.name;
                if (componentId in selectedProject.mainComponent){
                    displayNewWidgetInMainPagesList(componentName, componentId)
                } else {
                    displayNewWidgetInUserWidgetList(componentName, componentId);
                }

            }
        }

    }
    workSurface.loadUserWidget(selectedUserWidget, currentZoom);

    //autoSave5Mins();

    basicWidgets = $('#basic-components').html();

    dragAndDrop.registerWidgetDragHandleDraggable();


    // registerUserWidgetAreaDroppable();

    //style.setUpStyleColors(selectedUserWidget);

    resizeViewportToFitWindow();

    // finish load animation
    $('.loader-container').fadeOut("fast");


});