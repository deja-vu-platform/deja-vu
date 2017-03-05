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
var userApp = null;
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


    if (!selectedProject.userApp){
        // start a default component
        userApp = initUserApp();
        selectedProject.addCliche(userApp);
        selectedProject.makeUserApp(userApp);
    } else {
        var userAppId = selectedProject.userApp;
        userApp = selectedProject.cliches[userAppId];

        // TODO this will need to be changed once we bring in a userComponent which will be a
        // superset of userWidgets
        var appName = userApp.meta.name;
        displayOverallDatatypesInListAndSelect(appName, userAppId);

        for (var datatypeId in userApp.datatypes.unused){
            var datatypeName = userApp.datatypes.unused[datatypeId].meta.name;
            displayNewDatatypeInUserDatatypeList(datatypeName, datatypeId, userAppId);
        }
    }

    dataWorkSurface.loadDatatype(userApp, null, currentZoom);

    //autoSave5Mins();

    basicWidgets = $('#basic-components').html();

    dataDragAndDrop.registerDataDragHandleDraggable();


    // registerUserWidgetAreaDroppable();

    resizeViewportToFitWindow();

    // finish load animation
    $('.loader-container').fadeOut("fast");


});