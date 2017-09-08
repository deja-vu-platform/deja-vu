/**
 * Created by Shinjini on 9/26/2016.
 */

var widgetContainerMaker = WidgetContainer();
var workSurface = WidgetWorkSurface();
var zoomElement = WidgetZoomElement();
var miniNav = WidgetMiniNav();
var view = WidgetDisplay();
var listDisplay = WidgetListDisplay();
var dragAndDrop = WidgetDragAndDropController();
var grid = WidgetGrid();
var widgetEditsManager = WidgetEditsManager();
var undo = WidgetUndo();
var utils = Utility();

var style = WidgetStyle($('.palette-container'));


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
        selectedProject = new UserProject(DEFAULT_PROJECT_NAME, utils.generateId(), DEFAULT_VERSION, DEFAULT_AUTHOR);
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
        //listDisplay.displayMainPageInListAndSelect(selectedUserWidget.meta.name, selectedUserWidget.meta.id);

        // TODO dry
        window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject)); // save the updated project
        utils.saveProject(selectedProject);
    } else {
        var userAppId = selectedProject.userApp;
        userApp = selectedProject.cliches[userAppId];
        var widgetToLoadId;
        if (!$.isEmptyObject(userApp.widgets.pages)){
            widgetToLoadId = Object.keys(userApp.widgets.pages)[0];
            selectedUserWidget = userApp.widgets.pages[widgetToLoadId];
        } else if (!$.isEmptyObject(userApp.widgets.unused)){
            widgetToLoadId = Object.keys(userApp.widgets.unused)[0];
            selectedUserWidget = userApp.widgets.unused[widgetToLoadId];
        } else {
            // todo make a new huan
        }


    }
    listDisplay.loadClicheIntoWidgetList(userApp, widgetToLoadId);
    // Todo will also need to load other cliches

    workSurface.loadUserWidget(selectedUserWidget, currentZoom);

    //autoSave5Mins();

    basicWidgets = $('#basic-components').html();

    dragAndDrop.registerWidgetDragHandleDraggable();


    // registerUserWidgetAreaDroppable();

    style.setUpStyleColors(selectedUserWidget);
    style.loadPalette(userApp);


    resizeViewportToFitWindow();

    // finish load animation
    $('.loader-container').fadeOut("fast");


});