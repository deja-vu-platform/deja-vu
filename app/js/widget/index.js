/**
 * Created by Shinjini on 9/26/2016.
 */

var widgetContainerMaker = WidgetContainer();
var workSurface = WidgetWorkSurface();
var zoomElement = WidgetZoomElement();
var miniNav = WidgetMiniNav();
var view = WidgetDisplay();
var dragAndDrop = WidgetDragAndDropController();
var grid = WidgetGrid();
var widgetEditsManager = WidgetEditsManager();
var undo = WidgetUndo();

var style = WidgetStyle($('.palette-container'));

var projectsSavePath = path.join(__dirname, 'projects');
//var addedCliches;

var selectedScreenSizeHeight = 1600;
var selectedScreenSizeWidth = 2000;

var files = [];

var selectedUserWidget = null;
var selectedProject = null;
var userApp = null;

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

    if (!selectedProject.userApp){
        // start a default component
        userApp = initUserApp();
        selectedProject.addCliche(userApp);
        selectedProject.makeUserApp(userApp);

        selectedUserWidget = userApp.widgets.pages[Object.keys(userApp.widgets.pages)[0]];
        displayMainPageInListAndSelect(selectedUserWidget.meta.name, selectedUserWidget.meta.id);
    } else {
        var userAppId = selectedProject.userApp;
        userApp = selectedProject.cliches[userAppId];
        var widgetToLoadId;
        if (!$.isEmptyObject(userApp.widgets.pages)){
            widgetToLoadId = Object.keys(userApp.widgets.pages)[0];
            selectedUserWidget = userApp.widgets.pages[widgetToLoadId];
            displayMainPageInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId);
        } else {
            widgetToLoadId = Object.keys(userApp.widgets.unused)[0];
            selectedUserWidget = userApp.widgets.unused[widgetToLoadId];
            displayUserWidgetInListAndSelect(selectedUserWidget.meta.name, widgetToLoadId);
        }

        // TODO this will need to be changed once we bring in a userComponent which will be a
        // superset of userWidgets

        userApp.getAllWidgetIds().forEach(function(widgetId){
            if (widgetId != widgetToLoadId){
                var widgetName;
                if (widgetId in userApp.widgets.pages){
                    widgetName = userApp.widgets.pages[widgetId].meta.name;
                    displayNewWidgetInMainPagesList(widgetName, widgetId)
                } else if (widgetId in userApp.widgets.unused){
                    widgetName = userApp.widgets.unused[widgetId].meta.name;
                    displayNewWidgetInUserWidgetList(widgetName, widgetId);
                } else {
                    widgetName = userApp.widgets.templates[widgetId].meta.name;
                    displayNewWidgetTemplateInList(widgetName, widgetId);
                }

            }
        });

    }
    workSurface.loadUserWidget(selectedUserWidget, currentZoom);

    //autoSave5Mins();

    basicWidgets = $('#basic-cliches').html();

    dragAndDrop.registerWidgetDragHandleDraggable();


    // registerUserWidgetAreaDroppable();

    style.setUpStyleColors(selectedUserWidget);

    resizeViewportToFitWindow();

    // finish load animation
    $('.loader-container').fadeOut("fast");


});