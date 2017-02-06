/**
 * Created by Shinjini on 9/26/2016.
 */

var zoomElement = ZoomElement();
var miniNav = MiniNav();
var view = Display();
var workSurface = WorkSurface();
var dragAndDrop = DragAndDropController();
var grid = Grid();
var widgetEditsManager = WidgetEditsManager();

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


    Parse.initialize("8jPwCfzXBGpPR2WVW935pey0C66bWtjMLRZPIQc8", "zgB9cjo7JifswwYBTtSvU1MSJCMVZMwEZI3Etw4d");

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

    if (selectedProject.numComponents == 0){
        // start a default component
        selectedUserWidget = initUserWidget(true, true);
        selectedProject.addMainPage(selectedUserWidget);
        displayMainPageInListAndSelect(selectedUserWidget.meta.name, selectedUserWidget.meta.id);
    } else {
        var widgetToLoadId;
        if (!$.isEmptyObject(selectedProject.mainComponents)){
            widgetToLoadId = Object.keys(selectedProject.mainComponents)[0];
        } else {
            widgetToLoadId = Object.keys(selectedProject.components)[0];
        }
        selectedUserWidget = selectedProject.components[widgetToLoadId];
        if (widgetToLoadId in selectedProject.mainComponents){
            displayMainPageInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId);
        } else {
            displayUserWidgetInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId);
        }
        // TODO this will need to be changed once we bring in a userComponent which will be a
        // superset of userWidgets

        for (var componentId in selectedProject.components){
            if (componentId != widgetToLoadId){
                var componentName = selectedProject.components[componentId].meta.name;
                if (componentId in selectedProject.mainComponents){
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

    setUpStyleColors(selectedUserWidget);

    resizeViewportToFitWindow();

    // finish load animation
    $('.loader-container').fadeOut("fast");


});