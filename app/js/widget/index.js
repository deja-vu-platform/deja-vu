/**
 * Created by Shinjini on 9/26/2016.
 */

var zoomElement = WidgetZoomElement();
var miniNav = WidgetMiniNav();
var view = WidgetDisplay();
var widgetContainerMaker = WidgetContainer();
var workSurface = WidgetWorkSurface();
var dragAndDrop = WidgetDragAndDropController();
var grid = WidgetGrid();
var widgetEditsManager = WidgetEditsManager();
var style = WidgetStyle($('.palette-container'));

var projectsSavePath = path.join(__dirname, 'projects');
//var addedCliches;

var selectedScreenSizeHeight = 1600;
var selectedScreenSizeWidth = 2000;

var files = [];

var selectedUserWidget = null;
var selectedProject = null;
var selectedComponent = null;

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


    Parse.initialize("8jPwCfzXBGpPR2WVW935pey0C66bWtjMLRZPIQc8", "zgB9cjo7JifswwYBTtSvU1MSJCMVZMwEZI3Etw4d");

    // get selected project
    selectedProject = window.sessionStorage.getItem('selectedProject');
    if (selectedProject){ // if it exists, load it
        selectedProject = UserProject.fromString(selectedProject);
    } else { // if not, make a new one
        selectedProject = new UserProject(DEFAULT_PROJECT_NAME, generateId(), DEFAULT_VERSION, DEFAULT_AUTHOR);
    }

    $('.project-name .header').text(selectedProject.meta.name);

    //addedCliches = selectedProject.addedCliches;
    //for (var id in addedCliches) {
    //    showClicheInList(id, addedCliches[id].name);
    //}

    if (selectedProject.getNumComponents() == 0){
        // start a default component
        selectedComponent = initUserComponent();
        selectedProject.addComponent(selectedComponent);
        selectedProject.makeMainComponent(selectedComponent);

        selectedUserWidget = selectedComponent.widgets[Object.keys(selectedComponent.widgets)[0]];
        displayMainPageInListAndSelect(selectedUserWidget.meta.name, selectedUserWidget.meta.id);
    } else {
        var selectedComponentId = selectedProject.mainComponent;
        selectedComponent = selectedProject.components[selectedComponentId];
        var widgetToLoadId;
        if (!$.isEmptyObject(selectedComponent.mainPages)){
            widgetToLoadId = Object.keys(selectedComponent.mainPages)[0];
        } else {
            widgetToLoadId = Object.keys(selectedComponent.widgets)[0];
        }
        selectedUserWidget = selectedComponent.widgets[widgetToLoadId];
        if (widgetToLoadId in selectedComponent.mainPages){
            displayMainPageInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId);
        } else {
            displayUserWidgetInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId);
        }
        // TODO this will need to be changed once we bring in a userComponent which will be a
        // superset of userWidgets

        for (var widgetId in selectedComponent.widgets){
            if (widgetId != widgetToLoadId){
                var widgetName = selectedComponent.widgets[widgetId].meta.name;
                if (widgetId in selectedComponent.mainPages){
                    displayNewWidgetInMainPagesList(widgetName, widgetId)
                } else {
                    displayNewWidgetInUserWidgetList(widgetName, widgetId);
                }

            }
        }

    }
    workSurface.loadUserWidget(selectedUserWidget, currentZoom);

    //autoSave5Mins();

    basicWidgets = $('#basic-components').html();

    dragAndDrop.registerWidgetDragHandleDraggable();


    // registerUserWidgetAreaDroppable();

    style.setUpStyleColors(selectedUserWidget);

    resizeViewportToFitWindow();

    // finish load animation
    $('.loader-container').fadeOut("fast");


});