/**
 * Created by Shinjini on 9/26/2016.
 */

var dataZoomElement = DataZoomElement();
var dataMiniNav = DataMiniNav();
var dataView = DataDisplay();
var dataWorkSurface = DataWorkSurface();
var dataDragAndDrop = DataDragAndDropController();
var dataEditsManager = DataEditsManager();

var projectsSavePath = path.join(__dirname, 'projects');

var selectedScreenSizeHeight = 1600;
var selectedScreenSizeWidth = 2000;

var files = [];

var selectedUserWidget = null;
var selectedDatatype = null;
var selectedComponent = null;
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

    dataMiniNav.miniNavInitialize();

    // get selected project
    selectedProject = window.sessionStorage.getItem('selectedProject');
    if (selectedProject){ // if it exists, load it
        selectedProject = UserProject.fromString(selectedProject);
    } else { // if not, make a new one
        selectedProject = new UserProject(DEFAULT_PROJECT_NAME, generateId(), DEFAULT_VERSION, DEFAULT_AUTHOR);
    }

    $('.project-name .header').text(selectedProject.meta.name);

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
        selectedUserWidget = selectedComponent.widgets[Object.keys(selectedComponent.widgets)[0]];

        //var datatypeToLoadId;
        //if (!$.isEmptyObject(selectedComponent.mainPages)){
        //    datatypeToLoadId = Object.keys(selectedComponent.mainPages)[0];
        //} else {
        //    datatypeToLoadId = Object.keys(selectedComponent.widgets)[0];
        //}
        //selectedUserWidget = selectedComponent.widgets[datatypeToLoadId];
        //if (datatypeToLoadId in selectedComponent.mainPages){
        //    displayMainPageInListAndSelect(selectedUserWidget.meta.name, datatypeToLoadId);
        //} else {
        //    displayUserWidgetInListAndSelect(selectedUserWidget.meta.name, datatypeToLoadId);
        //}
        // TODO this will need to be changed once we bring in a userComponent which will be a
        // superset of userWidgets
        var componentName = selectedComponent.meta.name;
        displayOverallDatatypesInListAndSelect(componentName, selectedComponentId);

        for (var datatypeId in selectedComponent.datatypes){
            var datatypeName = selectedComponent.datatypes[datatypeId].meta.name;
            displayNewDatatypeInUserDatatypeList(datatypeName, datatypeId);
        }

    }
    dataWorkSurface.loadDatatype(selectedComponent, null, currentZoom);

    //autoSave5Mins();

    basicWidgets = $('#basic-components').html();

    dataDragAndDrop.registerWidgetDragHandleDraggable();


    // registerUserWidgetAreaDroppable();

    resizeViewportToFitWindow();

    // finish load animation
    $('.loader-container').fadeOut("fast");


});