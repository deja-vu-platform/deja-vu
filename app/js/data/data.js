/**
 * Created by Shinjini on 9/26/2016.
 */
var dataZoomElement = DataZoomElement();
var dataMiniNav = DataMiniNav();
var dataWorkSurface = DataWorkSurface();
var dataDragAndDrop = DataDragAndDropController();
var canvas = Canvas();
var utils = Utility();

var selectedScreenSizeHeight = 1600;
var selectedScreenSizeWidth = 2000;

var files = [];

var selectedUserWidget = null;
var selectedCliche = null;
var selectedDatatype = null;
var userApp = null;
var selectedProject = null;


var currentZoom = 1.0;
var basicWidgets;


// settings
var confirmOnUserWidgetDelete = true;

$(function(){
    canvas.createCanvas($('#outer-container'), selectedScreenSizeHeight, selectedScreenSizeWidth);
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
        selectedProject = new UserProject(DEFAULT_PROJECT_NAME, utils.generateId(), DEFAULT_VERSION, DEFAULT_AUTHOR);
    }

    $('.project-name .header').text(selectedProject.meta.name);

    //addFakeClichesToProject(selectedProject);

    if (!selectedProject.userApp){
        // start a default component
        userApp = initUserApp();
        selectedProject.addCliche(userApp);
        selectedProject.makeUserApp(userApp);
    } else {
        displayOverallDatatypesInListAndSelect();
        for (var clicheId in selectedProject.cliches){
            var cliche = selectedProject.cliches[clicheId];
            displayNewClicheInList(cliche);
            if (clicheId == selectedProject.userApp){
                userApp = cliche;
            }
        }
    }
    //autoSave5Mins();
    dataWorkSurface.loadBondingData(null, null, currentZoom);

    basicWidgets = $('#basic-components').html();

    dataZoomElement.registerZoom(userApp);

    resizeViewportToFitWindow();

    // finish load animation
    $('.loader-container').fadeOut("fast");


});