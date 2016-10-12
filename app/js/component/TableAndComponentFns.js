// This file mostly has functions that work to make and display
// the table, and functions that work with editing the datatype
// (which is mostly connected to the table)

/** ** ** ** ** Global variables for this file ** ** ** ** ** **/
const DEFAULT_CONTAINER_WIDTH = '3000px';
const DEFAULT_CONTAINER_HEIGHT = '3000px';

const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;

var tableLockedHeight = false;
var tableLockedWidth = false;





/** ** ** Table, Grid, Merge-Handler Creation Functions ** ** ** **/

/**
 * Disabled by changing the id and class names
 * @param componentId
 */
function disableComponentDOMElements(componentId){
    var workSurface = $('#work-surface'+'_'+componentId);
    $(workSurface).addClass('hidden-component');

    $(workSurface).find('*').each(function() {
        var id = this.id;
        if (id.length>0){
            this.id = 'disabled_'+componentId+'_'+this.id;
        }
        var classes = this.className;
        if (classes.length>0){
            classes = classes.split(' ');
            var classNames = '';
            classes.forEach(function(className){
                classNames = classNames + ' ' + 'disabled_'+componentId+'_'+className;
            });
            this.className = classNames;
        }
    });
}


function enableComponentDOMElements(componentId){
    var workSurface = $('#work-surface'+'_'+componentId);
    $(workSurface).removeClass('hidden-component');

    $(workSurface).find('*').each(function() {
        var id = this.id;
        if (id.length>0){
            this.id = id.replace('disabled_'+componentId+'_', '');
        }
        var classes = this.className;
        if (classes.length>0){
            classes = classes.split(' ');
            var classNames = '';
            classes.forEach(function(className){
                classNames =  classNames  + ' ' +  className.replace('disabled_'+componentId+'_', '');
            });
            this.className = classNames.trim();
        }
    });
}

function disableAllComponentDomElementsExcept(componentToEnableId){
    for (var componentId in selectedProject.components){
        if (componentToEnableId == componentId){
            enableComponentDOMElements(componentId);
            continue;
        }
        if ($('#work-surface'+'_'+componentId).hasClass('hidden-component')){
            continue;
        }
        disableComponentDOMElements(componentId);
    }
}

function enableSpecificComponentDomElements(componentToEnableId){
    // first check that the table has been made (otherwise the reset will happen automatically,
    // but more importantly, the table-grid-container won't exist yet
    var workSurfaceToEnable = $('#work-surface'+'_'+componentToEnableId);
    if (!(workSurfaceToEnable.length>0)) {
        createOrResetTableGridContainer(componentToEnableId);
        var state = {
            zoom: 1,
            lock:{
                width: false,
                height: false
            }
        };
        $('#work-surface'+'_'+componentToEnableId).data('state', state);
    }

    var componentToEnable = selectedProject.components[componentToEnableId];

    // enable first (toggle needs the id's and classes to be enabled)
    if (workSurfaceToEnable.hasClass('hidden-component')){
        enableComponentDOMElements(componentToEnableId);
    }

    updateZoomFromState(componentToEnableId);

    setComponentOptions(componentToEnable);

}




// from http://stackoverflow.com/questions/8813051/determine-which-element-the-mouse-pointer-is-on-top-of-in-javascript
function allElementsFromPoint(x, y) {
    var element, elements = [];
    var oldVisibility = [];
    while (true) {
        element = document.elementFromPoint(x, y);
        if (!element || element === document.documentElement) {
            break;
        }
        elements.push(element);
        oldVisibility.push(element.style.visibility);
        element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
    }
    for (var k = 0; k < elements.length; k++) {
        elements[k].style.visibility = oldVisibility[k];
    }
    elements.reverse();
    return elements;
}


function updateZoomFromState(componentId){
    currentZoom = $('#work-surface'+'_'+componentId).data('state').zoom;
    changeZoomDisplays(currentZoom);
}

/** **/

function addAddToMainPagesButton(){
    var added = (selectedUserComponent.meta.id in selectedProject.mainComponents);
    if (added){
        var span = document.createElement('span');
        span.innerHTML = '<button type="button" class="btn btn-default ">' +
            '<span class="glyphicon glyphicon-remove"></span>' +
            '<span> Remove from Main Pages</span>' +
            '</button>';
    }
    else{
        var span = document.createElement('span');
        span.innerHTML = '<button type="button" class="btn btn-default ">' +
            '<span class="glyphicon glyphicon-plus"></span>' +
            '<span> Add to Main Pages</span>' +
            '</button>';
    }
    var addToMainPageButton = span.firstChild;
    addToMainPageButton.id = 'btn-add-main-page';;

    $(addToMainPageButton).data('added', added).css({
        position: 'absolute',
        top:'-45px',
        left:'230px',
    });

    $(addToMainPageButton).on("click", function (e) {
        var added = $(this).data('added');
        var userComponentId = selectedUserComponent.meta.id;
        var name = selectedUserComponent.meta.name;
        if (added){
            // then remove
            $($(this).children().get(0)).removeClass('glyphicon-remove').addClass('glyphicon-plus');
            $($(this).children().get(1)).text(' Add to Main Pages');
            delete selectedProject.mainComponents[userComponentId];
            $("#main-pages-list").find("[data-componentid='" + userComponentId + "']").remove();
            displayUserComponentInListAndSelect(name, userComponentId);
            selectedUserComponent.inMainPages = false;
        } else {
            // then add
            $($(this).children().get(0)).removeClass('glyphicon-plus').addClass('glyphicon-remove');
            $($(this).children().get(1)).text(' Remove from Main Pages');

            if (!selectedProject.mainComponents){
                selectedProject.mainComponents = {}; // for safety
            }
            selectedProject.mainComponents[userComponentId] = name;
            $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();
            displayMainPageInListAndSelect(name, userComponentId);
            selectedUserComponent.inMainPages = true;
        }
        $(this).data('added', !added);
    });

    $('#main-cell-table').append(addToMainPageButton);

}


/**
 * Update the saved ratios and then use this function
 */
function propagateRatioChangeToAllElts(newRatio){
    for (var componentId in selectedUserComponent.components){
        var container = $('#component-container_'+componentId);
        var component = selectedUserComponent.components[componentId];
        var type = component.type;
        hideBaseComponentDisplayAt(container, type);

        var width = component.dimensions.width * newRatio;
        var top = selectedUserComponent.layout[componentId].top * newRatio;
        var height = component.dimensions.height * newRatio;
        var left = selectedUserComponent.layout[componentId].left *  newRatio;

        container.css({
            width: width + 'px',
            height: height + 'px',
            top: top + 'px',
            left: left + 'px'
        });

        updateBaseComponentDisplayAt(container, type, newRatio);
        showBaseComponentDisplayAt(container, type);
    }

    var outerWidth = selectedUserComponent.dimensions.width * newRatio;
    var outerHeight = selectedUserComponent.dimensions.height * newRatio;

    $('.work-surface').css({
        height: outerHeight + 'px',
        width: outerWidth + 'px'
    });

    updateZoomNavComponentSize(newRatio);

}

function updateTableResizeHandler() {
    $('#table-resize-div').css({
        width: $('#main-grid-table').css('width'),
        height: $('#main-grid-table').css('height'),
    });
}

// TODO: modify to make it work for the work surface
function addTableResizeHandler(componentId){
    var tableResizeDiv = document.createElement('div');
    tableResizeDiv.id = 'table-resize-div';

    var dragHandle = document.createElement('span');

    dragHandle.innerHTML = '<img src="images/drag_handle_se_icon.png" width="15px" height="15px">';
    dragHandle.className = 'ui-resizable-handle ui-resizable-se';
    dragHandle.id = 'table-drag-handle';

    $('#table-grid-container'+'_'+componentId+' '+'#guide-grid-container').append(tableResizeDiv);

    $(tableResizeDiv).append(dragHandle).resizable({
        handles: {
            'se': '#table-drag-handle'
        },
        start: function(){
            $(this).css({
                border: 'black 1px dotted',
            })
        },
        stop: function () {
            $(this).css({
                border: 'none',
            });

            // NOTE: the table-resize-div's height and width includes the table's margins!
            selectedUserComponent.layout.tablePxDimensions.width = ($('#table-resize-div').width()-20)/currentZoom;
            selectedUserComponent.layout.tablePxDimensions.height = ($('#table-resize-div').height()-20)/currentZoom;
            scaleTableToZoom();

            // updating this again to fix for rounding errors
            gridWidth = $('#table-resize-div').width();
            gridHeight = $('#table-resize-div').height();
        }
    }).css({
        'pointer-events':'none',
        position: 'absolute',
        visibility: 'visible',
        top: 0,
        left: 0,
        width: $('#main-grid-table').css('width'),
        height: $('#main-grid-table').css('height'),
    });

    $('#table-drag-handle').css({
        cursor: 'nwse-resize',
        width: 0,
        height: 0,
        position: 'absolute',
        top: 'auto',
        bottom: 0,
        left: 'auto',
        right: 0,
        'pointer-events': 'auto',
    });

}

/** ** ** ** ** ** ** Delete UserComponent Functions ** ** ** ** ** ** ** ** ** **/

function addDeleteUserComponentButton(userComponentId){
    var spDelete = document.createElement('span');
    spDelete.innerHTML = '<button type="button" class="btn btn-default btn-delete-component">' +
        //'<span>Delete User Component </span>' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</button>';

    var buttonDeleteUserComponent = spDelete.firstChild;
    buttonDeleteUserComponent.id = 'btn-delete-component_'+userComponentId;

    $(buttonDeleteUserComponent).on("click", function (e) {
        if (selectedProject.numComponents === 1){
            return; //don't delete the last one TODO is the the right way to go?
        }
        if (confirmOnUserComponentDelete){
            openDeleteUserComponentConfirmDialogue(userComponentId);
        } else {
            deleteUserComponent(userComponentId);
        }
    });

    var listElt;
    if (userComponentId in selectedProject.mainComponents){
        listElt = $("#main-pages-list").find("[data-componentid='" + userComponentId + "']");
    } else {
        listElt = $("#user-components-list").find("[data-componentid='" + userComponentId + "']");
    }

    listElt.append(buttonDeleteUserComponent).hover(
        function(){
            $(this).find('.component-name-container').css({
                width: '70%'
            });
            $(this).find('.btn-delete-component').css({
                display: 'inline-block',
            });
        }, function(){
            $(this).find('.component-name-container').css({
                width: '95%'
            });
            $(this).find('.btn-delete-component').css({
                display: 'none',

            });
        }
    );
}

function deleteUserComponent(userComponentId){
    if (selectedProject.numComponents === 1){
        return; //don't delete the last one TODO is the the right way to go?
    }
    selectedProject.removeComponent(userComponentId);
    $('#work-surface_'+userComponentId).remove();
    $('#disabled_'+userComponentId+'_work-surface_'+userComponentId).remove(); // also remove disabled ones

    if (userComponentId == selectedUserComponent.meta.id){ // strings will also do
        var otherIds = Object.keys(selectedProject.components);
        selectedUserComponent = selectedProject.components[otherIds[0]];
        $("#user-components-list").find("[data-componentid='" + otherIds[0] + "']").addClass('selected');
        $("#main-pages-list").find("[data-componentid='" + otherIds[0] + "']").addClass('selected');
        loadComponent(selectedUserComponent, currentZoom);
        // loadTable(selectedUserComponent, 1);
    }
    if (userComponentId == selectedProject.mainComponents.indexId){
        selectedProject.mainComponents.indexId = null;
    }
    $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();
    $("#main-pages-list").find("[data-componentid='" + userComponentId + "']").remove();

}

function openDeleteUserComponentConfirmDialogue(userComponentId){
    $('#confirm-delete-userComponent').modal('show');
    $('#delete-userComponent-name').text(selectedProject.components[userComponentId].meta.name);

    $('#delete-userComponent-btn').unbind();
    $('#delete-userComponent-btn').click(function(){
        deleteUserComponent(userComponentId);

        $('#delete-userComponent-name').text('');
        $('#confirm-delete-userComponent').modal('hide');
    });

    $('#delete-userComponent-cancel-btn').click(function(){
        $('#delete-userComponent-name').text('');
        $('#confirm-delete-userComponent').modal('hide');
    });

    $('#confirm-delete-userComponent .close').click(function(event){
        event.preventDefault();
        $('#delete-userComponent-name').text('');
        $('#confirm-delete-userComponent').modal('hide');
    });
};



/**
 * Creates a new User component based on user inputs
 * @param isDefault
 * @constructor
 */
function initUserComponent(isDefault) {
    var name, version, author;
    if (isDefault) {
        name = DEFAULT_COMPONENT_NAME;
    } else {
        name = sanitizeStringOfSpecialChars($('#new-component-name').val());
    }

    version = selectedProject.meta.version;
    author = selectedProject.meta.author;

    var id = generateId(name);
    while (id in selectedProject.componentIdSet){ // very unlikely to have a collision unless the user has 1 Million components!
        id = generateId(name);
    }
    selectedProject.componentIdSet[id] = '';

    return UserComponent({height: selectedScreenSizeHeight, width: selectedScreenSizeWidth}, name, id, version, author);
}




/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/

function duplicateUserComponent(userComponent){
    return UserComponent.fromString(JSON.stringify(userComponent));
}



/************************************************************/
function testSaveHTML(){
    var html = '';
    for (var row = 1; row<= numRows; row++){
        for (var col = 1; col<=numCols; col++){
            var cellId = 'cell'+'_'+row+'_'+col;
            var displayComponent = $('#'+cellId).find('.display-component');
            if (displayComponent.get(0)){
                html = html + displayComponent.get(0).outerHTML+'/n';
            }
        }
    }
    return html;
}

function createDownloadPreview(){
    var oldZoom = currentZoom;
    currentZoom = 1;
    propagateRatioChangeToAllElts(currentZoom);

    $('#download-preview-area').html('').css({
        position: 'relative',
        'text-align': 'center',
        margin: 'auto',
        width: $('#main-grid-table').css('width'),
    });

    $('.component-container').each(function(){
        var add = false;
        var css = {
            position: 'absolute',
            top: $(this).position().top,
            left: $(this).position().left,
            width: $(this).width()+'px',
            height: $(this).height()+'px',
            'vertical-align': 'middle',
            background: '#F9F9F9',
        };
        var container = $(document.createElement('div'));
        container.css(css);

        var labelContainer = $(this).find('.label-container').clone(true, true);
        if (labelContainer.get(0)){
            labelContainer.css({// this is not carried over, since this was declared in the css file
                position: 'absolute',
                top: '0',
                //border: '#e0e0e0 solid 1px',
                display: 'block',
            });
            container.append(labelContainer);
            var displayComponent = labelContainer.find('.display-component');
            displayComponent.css({// this is not carried over, since this was declared in the css file
                'white-space': 'initial',
                'font-weight': 400,
                margin: 0,
            });
            displayComponent.attr('contenteditable', false);
            add = true;
        } else {
            var displayComponent = $(this).find('.display-component').clone(true, true);
            displayComponent.css({// this is not carried over, since this was declared in the css file
                'white-space': 'initial',
                'font-weight': 400,
            });


            if (displayComponent.get(0)){
                container.append(displayComponent);
                add = true;
            }
        }
        if (add){
            $('#download-preview-area').append(container);
        }
    });

    currentZoom = oldZoom;
    propagateRatioChangeToAllElts(currentZoom);

    return $('#download-preview-area-container').html();
}

function downloadHTML(){
    var innerHTML = createDownloadPreview();
    var stylesheets = '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">';
    var js = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>'+
        '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>';
    var HTML = '<!doctype html><html>'+stylesheets+'<head></head><body>'+innerHTML+js+'</body></html>';
    var element = document.createElement('a');
    var data = "data:text/html;charset=utf-8," + encodeURIComponent(HTML);

    element.setAttribute('href', data);
    element.setAttribute('download', selectedUserComponent.meta.name+'.html');

    element.click();

}