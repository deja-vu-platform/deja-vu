// This file mostly has the initialization and functions that help with
// the display and interaction handling


var projectsSavePath = path.join(__dirname, 'projects');
var addedCliches;
var navZoom = .1;
var navDragging = false;

var innerComponentFocused = false;

var selectedScreenSizeHeight = 1600;
var selectedScreenSizeWidth = 2000;

var draggingComponent = null;

/** ** ** ** ** ** Initialization ** ** ** ** ** **/
$(function () {
    // fix some views
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


    resizeViewportToFitWindow();
    zoomNavInitialize();



    Parse.initialize("8jPwCfzXBGpPR2WVW935pey0C66bWtjMLRZPIQc8", "zgB9cjo7JifswwYBTtSvU1MSJCMVZMwEZI3Etw4d");

    // get selected project
    selectedProject = window.sessionStorage.getItem('selectedProject');
    if (selectedProject){ // if it exists, load it
        selectedProject = UserProject.fromString(selectedProject);
    } else { // if not, make a new one
        selectedProject = new UserProject(DEFAULT_PROJECT_NAME, generateId(DEFAULT_PROJECT_NAME), DEFAULT_VERSION, DEFAULT_AUTHOR);
    }

    $('.project-name .header').text(selectedProject.meta.name);

    addedCliches = selectedProject.addedCliches;
    for (var id in addedCliches) {
        showClicheInList(id, addedCliches[id].name);
    }

    if (selectedProject.numComponents === 0){
        // start a default component
        selectedUserComponent = initUserComponent(true);
        selectedProject.addComponent(selectedUserComponent);

        //makeUserEmptyComponentDisplayTable(selectedUserComponent.meta.id, currentZoom);

        loadComponentIntoWorkSurface(selectedUserComponent);
        displayUserComponentInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);
    } else {
        if (!$.isEmptyObject(selectedProject.mainComponents)){
            var componentToLoadId = Object.keys(selectedProject.mainComponents)[0];
        } else {
            var componentToLoadId = Object.keys(selectedProject.components)[0];
        }
        selectedUserComponent = selectedProject.components[componentToLoadId];
        if (componentToLoadId in selectedProject.mainComponents){
            displayMainPageInListAndSelect(selectedUserComponent.meta.name, componentToLoadId);
        } else {
            displayUserComponentInListAndSelect(selectedUserComponent.meta.name, componentToLoadId);
        }
        for (var componentId in selectedProject.components){
            if (componentId != componentToLoadId){
                var componentName = selectedProject.components[componentId].meta.name;
                if (componentId in selectedProject.mainComponents){
                    displayNewComponentInMainPagesList(componentName, componentId)
                } else {
                    displayNewComponentInUserComponentList(componentName, componentId);
                }

            }
        }
        window.setTimeout(function(){
            loadComponentIntoWorkSurface(selectedUserComponent);
            //loadTable(selectedUserComponent, 1);
        }, 1);

    }

    initializeZoomNavComponentSize();

    //autoSave5Mins();

    basicComponents = $('#basic-components').html();

    registerDraggable();

    registerZoom();

    registerUserComponentAreaDroppable();

    setUpStyleColors();

    // finish load animation
    $('.loader-container').fadeOut("fast");

});



/** ** ** ** ** ** Menu Event Handlers ** ** ** ** ** **/


// TODO on user component name input check for special chars

$('#new-user-component-btn').click(function(){
    $('#create-component').unbind();
    $('#create-component').on('click', function () {
        numRows = $('#select-rows').val();
        numCols = $('#select-cols').val();
        selectedUserComponent = initUserComponent(false);
        selectedProject.addComponent(selectedUserComponent);
        displayUserComponentInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);
        makeUserEmptyComponentDisplayTable(selectedUserComponent.meta.id, 1);
        resetMenuOptions();
    });
});

$('#new-main-component-btn').click(function(){
    $('#create-component').unbind();
    $('#create-component').on('click', function () {
        numRows = $('#select-rows').val();
        numCols = $('#select-cols').val();
        selectedUserComponent = initUserComponent(false);
        selectedUserComponent.inMainPages = true;
        selectedProject.mainComponents[selectedUserComponent.meta.id] = selectedUserComponent.meta.name;
        selectedProject.addComponent(selectedUserComponent);
        displayMainPageInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);

        makeUserEmptyComponentDisplayTable(selectedUserComponent.meta.id, 1);
        resetMenuOptions();
    });
});


$('#load-component-btn').on('click', function () {
    selectedUserComponent = UserComponent.fromString($('#component-json').val());
    selectedProject.addComponent(selectedUserComponent);
    loadTable(selectedUserComponent, 1);
    displayNewComponentInUserComponentList(selectedUserComponent.meta.name,selectedUserComponent.meta.id);
    resetMenuOptions();
});

$('#save-component').on('click', function () {

    window.open("data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(selectedUserComponent, null, '\t')));
});

$('#save-project').on('click', function () {
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
    saveObjectToFile(projectsSavePath, projectNameToFilename(selectedProject.meta.name), selectedProject);
    //downloadObject(selectedProject.meta.name+'.json', selectedProject);
});


/** ** ** ** ** ** Menu Related Functions ** ** ** ** ** **/

/**
 * Resets the menu options to their default values
 */
function resetMenuOptions() {
    $('#select-rows').val(DEFAULT_ROWS);
    $('#select-cols').val(DEFAULT_COLS);
    $('#new-component-name').val('');
    $('#component-version').val('');
    $('#component-author').val('');

    $('#component-json').val('');
}

/** ** ** ** ** ** Mode Listeners ** ** ** ** ** ** ** ** **/
$('#build-mode').click(function(){
    if ($(this).hasClass('active')){
        return;
    }
    $(this).parent().find('.active').removeClass('active');
    $(this).addClass('active');
    $('.components').css({
        display: 'block',
    });
    $('.layout').css({
        display: 'none',
    });
    $('.style').css({
        display: 'none',
    });
});

$('#layout-mode').click(function(){
   if ($(this).hasClass('active')){
       return;
   }
   $(this).parent().find('.active').removeClass('active');
   $(this).addClass('active');
    $('.layout').css({
        display: 'block',
    });
    $('.components').css({
        display: 'none',
    });
    $('.style').css({
        display: 'none',
    });
});

$('#style-mode').click(function(){
    if ($(this).hasClass('active')){
        return;
    }
    $(this).parent().find('.active').removeClass('active');
    $(this).addClass('active');
    $('.style').css({
        display: 'block',
    });
    $('.layout').css({
        display: 'none',
    });
    $('.components').css({
        display: 'none',
    });
});

/** ** ** ** ** ** Components Event Handlers ** ** ** ** ** **/

$('#back-to-projects').click(function(event){
    event.preventDefault();
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject)); // save the updated project
    saveObjectToFile(projectsSavePath, projectNameToFilename(selectedProject.meta.name), selectedProject);
    window.location = 'projectView.html';
});

$('.components').on('click', '.component-name-container', function () {
    var load = function(componentNameContainer){
        // Save the current values
        var oldState = {zoom : currentZoom,
                        lock:{
                            width: tableLockedWidth,
                            height: tableLockedHeight,
                        }
                        };
        $('#table-grid-container'+'_'+selectedUserComponent.meta.id).data('state', oldState);

        var componentId = $(componentNameContainer).parent().data('componentid');
        $('.selected').removeClass('selected');
        $(componentNameContainer).parent().addClass('selected');
        selectedUserComponent = selectedProject.components[componentId];

        disableAllComponentDomElementsExcept(selectedUserComponent.meta.id);

        if ($('#table-grid-container'+'_'+componentId).length===0){
            loadTable(selectedUserComponent, 1);
        } else {
            toggleInnerComponentVisibility(true);
            enableSpecificComponentDomElements(selectedUserComponent.meta.id);
        }
    };

    // have this going in a separate thread
    window.setTimeout(load(this), 2000);
});

$('.components').on('dblclick', '.component-name', function (e) {
    var newNameInputElt = $($(this).parent().find('.new-name-input'));
    var submitRenameElt = $($(this).parent().find('.submit-rename'));
    newNameInputElt.val($(this).text());
    submitRenameElt.removeClass('not-displayed');
    $(this).addClass('not-displayed');
    newNameInputElt.focus();
    newNameInputElt.select();
});

$('.components').on('keypress', '.new-name-input', function (event) {
    if (event.which == 13) {
        event.preventDefault();
        var componentId = $(this).parent().parent().parent().data('componentid');
        var componentNameElt = $($(this).parent().parent().find('.component-name'));
        var submitRenameElt = $($(this).parent().parent().find('.submit-rename'));

        componentNameElt.removeClass('not-displayed');
        submitRenameElt.addClass('not-displayed');
        var newName = $(this).val();
        if (newName.length === 0) { // empty string entered, don't change the name!
            return;
        }
        componentNameElt.text($(this).val());

        selectedProject.components[componentId].meta.name = $(this).val();
        // changing the ids todo: is this a good idea?
        //var oldId = selectedUserComponent.meta.id;
        //var newId = generateId(selectedUserComponent.meta.name);
        //selectedUserComponent.meta.id = newId;
        //selectedProject.componentIdSet[newId] = "";
        //delete selectedProject.componentIdSet[oldId];
        //selectedProject.components[newId] = selectedUserComponent;
        //delete selectedProject.components[oldId];
        //$(this).parent().parent().data('componentid', newId);
    }
});

/** ** ** ** ** ** ** ** ** ** ** ** Component Options ** ** ** ** ** ** ** ** ** ** ** ** **/
function setComponentOptions(component){
    // renaming

    $('.component-options .component-name')
        .text(component.meta.name)
        .unbind()
        .on('dblclick', function () {
        var newNameInputElt = $($(this).parent().find('.new-name-input'));
        var submitRenameElt = $($(this).parent().find('.submit-rename'));
        newNameInputElt.val($(this).text());
        submitRenameElt.removeClass('not-displayed');
        $(this).addClass('not-displayed');
        newNameInputElt.focus();
        newNameInputElt.select();
    });

    $('.component-options .new-name-input')
        .unbind()
        .on('keypress' , function (event) {
        if (event.which == 13) {
            event.preventDefault();
            var componentNameElt = $($(this).parent().parent().find('.component-name'));
            var submitRenameElt = $($(this).parent().parent().find('.submit-rename'));

            componentNameElt.removeClass('not-displayed');
            submitRenameElt.addClass('not-displayed');

            var newName = $(this).val();
            if (newName.length === 0) { // empty string entered, don't change the name!
                return;
            }
            $('.components').find('[data-componentid='+component.meta.id+']').find('.component-name').text(newName);

            componentNameElt.text($(this).val());

            component.meta.name = $(this).val();



            // changing the ids todo: is this a good idea?
            //var oldId = selectedUserComponent.meta.id;
            //var newId = generateId(selectedUserComponent.meta.name);
            //selectedUserComponent.meta.id = newId;
            //selectedProject.componentIdSet[newId] = "";
            //delete selectedProject.componentIdSet[oldId];
            //selectedProject.components[newId] = selectedUserComponent;
            //delete selectedProject.components[oldId];
            //$(this).parent().parent().data('componentid', newId);
        }
    });

    // copy
    $('.component-options #btn-duplicate-component')
        .unbind()
        .click(function(){
            var copyComponent = duplicateUserComponent(selectedUserComponent);
            var originalId = copyComponent.meta.id;
            // change the id
            copyComponent.meta.id = generateId(copyComponent.meta.name);

            if (originalId in selectedProject.mainComponents){
                selectedProject.mainComponents[copyComponent.meta.id] = copyComponent.meta.name;
                copyComponent.inMainPages = true;
                displayMainPageInListAndSelect(copyComponent.meta.name, copyComponent.meta.id);
            } else {
                displayUserComponentInListAndSelect(copyComponent.meta.name, copyComponent.meta.id);
            }

            selectedProject.addComponent(copyComponent);
            selectedUserComponent = copyComponent;
            loadTable(selectedUserComponent, 1);

        });

    $('.component-options #btn-download-component').unbind().on('click', function(){
        downloadHTML();
    });

    // clear all
    $('.component-options #btn-clear-all')
        .unbind()
        .on("click", function (e) {
            clearAll();
        });

    // delete
    $('.component-options .btn-delete-component')
        .unbind()
        .on("click", function (e) {
            var id = selectedUserComponent.meta.id;
            if (confirmOnUserComponentDelete){
                if (selectedProject.numComponents === 1){
                    return; //don't delete the last one TODO is the the right way to go?
                }
                openDeleteUserComponentConfirmDialogue(id);
            } else {
                deleteUserComponent(id);
            }
        });

    if (selectedUserComponent.meta.id in selectedProject.mainComponents){
        $('.component-options #btn-index-page-toggle').css({
            display: 'inline-block',
        });
        setUpComponentOptionsIndexPageToggle();
    } else {
        $('.component-options #btn-index-page-toggle').css({
            display: 'none',
        })
    }


}

function setUpComponentOptionsIndexPageToggle(){
    if (selectedUserComponent.meta.id == selectedProject.mainComponents.indexId){
        $('.component-options #btn-index-page-toggle').find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-remove');
        $('.component-options #btn-index-page-toggle').find('.text').text('Unassign as Index Page');
        $('.components').find('[data-componentid='+selectedUserComponent.meta.id+']').addClass('selected-index-page');

        $('.component-options #btn-index-page-toggle').unbind().click(function(){
            $(this).find('.glyphicon').removeClass('glyphicon-remove').addClass('glyphicon-plus');
            $(this).find('.text').text('Assign as Index Page');
            $('.components').find('[data-componentid='+selectedUserComponent.meta.id+']').find('.index-page-toggle').trigger('click');
        });
    } else {
        $('.component-options #btn-index-page-toggle').find('.glyphicon').removeClass('glyphicon-remove').addClass('glyphicon-plus');
        $('.component-options #btn-index-page-toggle').find('.text').text('Assign as Index Page');
        $('.component-options #btn-index-page-toggle').unbind().click(function(){
            $(this).find('.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-remove');
            $(this).find('.text').text('Unassign as Index Page');
            $('.components').find('[data-componentid='+selectedUserComponent.meta.id+']').find('.index-page-toggle').trigger('click');
        });

    }
}

/** ** ** ** ** ** Component Adding to Project and display helpers ** ** ** ** ** ** ** ** ** **/

function resizeViewportToFitWindow(){
    var windowWidth = $('html').width();
    var newWidth = Math.max(860, windowWidth);
    $('#outer-container').css({
        width: (newWidth-250-17) + 'px',
    });

    $('.component-options').css({
        width: (newWidth-250-17) + 'px',
    });

    $('.inner-component-options').css({
        width: (newWidth-250-17) + 'px',
    });

    $('#zoom-nav-position').css({
        height: $('#outer-container').height()*navZoom + 'px',
        width: $('#outer-container').width()*navZoom + 'px',
    });
}

window.addEventListener("resize", function(){
    resizeViewportToFitWindow();
});

function displayUserComponentInListAndSelect(name, id){
    $('.selected').removeClass("selected");
    displayNewComponentInUserComponentList(name,id);
    $("#user-components-list").find("[data-componentid='" + id + "']").addClass('selected');
}

/**
 * Adds a component to the list of user components
 * @param newComponent
 */
function displayNewComponentInUserComponentList(name, id){
    // TODO changes in style
    var newComponentElt =
          '<li data-componentid=' + id + '>'
            + '<div class="component-name-container">'
                + '<span class="component-name">' + name + '</span>'
                + '<span class="submit-rename not-displayed">'
                    + '<input type="text" class="new-name-input form-control" autofocus>'
                + '</span>'
            + '</div>'
        + '</li>';
    $('#user-components-list').append(newComponentElt);
    addDeleteUserComponentButton(id);
    registerUserComponentAsDraggable(id);
}


/**
 * Adds a component to the list of main pages
 * @param newComponent
 */
function displayNewComponentInMainPagesList(name, id){
    // TODO changes in style
    var newComponentElt =
        '<li data-componentid=' + id + '>'
        + '<div class="component-name-container">'
            + '<div class="component-name">' + name + '</div>'
            + '<div class="submit-rename not-displayed">'
                + '<input type="text" class="new-name-input form-control" autofocus>'
            + '</div>'
        + '</div>'
        + '<div class="index-page-toggle">'
        + '</div>'
        + '</li>';
    $('#main-pages-list').append(newComponentElt);
    addDeleteUserComponentButton(id);
    registerUserComponentAsDraggable(id);
}

function displayMainPageInListAndSelect(name, id){
    $('.selected').removeClass("selected");
    displayNewComponentInMainPagesList(name,id);
    $("#main-pages-list").find("[data-componentid='" + id + "']").addClass('selected');
}

/**
 * Adds a component to the table and displays it. If no component is given, it creates a
 * base component based on the widget
 *
 * Either a widget or a component has to be present
 *
 * @param widget
 * @param cellId
 * @param component
 */
function displayComponentInTable(cellId, widget, component) {
    var type;
    var rowcol = getRowColFromId(cellId);
    var row = rowcol.row;
    var col = rowcol.col;

    if (!component) {
        var span = document.createElement('span');
        span.innerHTML = widget[0].outerHTML;
        type = span.firstElementChild.getAttribute('name');
        component = new BaseComponent(type, {});

        showConfigOptions(type, cellId);

        if (!selectedUserComponent.components[row]) {
            selectedUserComponent.components[row] = {};
        }
        selectedUserComponent.components[row][col] = component;

        // note: no padding here because this is a new component we are adding
        // also note: no properties because of the same reason
        var padding = {top: 0, left: 0, bottom: 0, right: 0};
        selectedUserComponent.components[row][col].padding = padding;
        if (selectedUserComponent.layout.overallStyles){
            selectedUserComponent.components[row][col].properties.custom = selectedUserComponent.layout.overallStyles;
        } else {
            selectedUserComponent.components[row][col].properties.custom = {};
        }
        var properties = selectedUserComponent.components[row][col].properties;

        if (type === 'label') {
            display(cellId, type, getHTML[type]("Type text here..."), currentZoom, padding, properties);
        } else if (type === 'panel') {
            display(cellId, type, getHTML[type]({heading: "Type heading...", content: "Type content..."}), currentZoom, padding, properties);
        } else {
            display(cellId, type, getHTML[type](), currentZoom, padding, properties);
            triggerEdit(cellId, true); // since this is a new component, show edit options
        }

    } else {// a component is there
        type = component.type;

        showConfigOptions(type, cellId);

        if (!widget) {
            $($('.draggable[name=' + type + ']').get(0)).clone().appendTo($('#' + cellId).get(0))
        }
        // display requires widget to be placed before display happens

        var padding = selectedUserComponent.components[row][col].padding;
        var properties = component.properties;

        display(cellId, type, getHTML[type](component.components[type]), currentZoom, padding, properties);

        triggerEdit(cellId, false); // no need to show edit options

    }

    $('#' + cellId).addClass("dropped");
    $('#' + cellId).removeClass("droppable");
    $('#' + cellId).droppable('disable');
    registerDraggable();

    updateBitmap(false);
    registerTooltipBtnHandlers();
}


/**
 * Deletes a component from the datatype and also from the view
 */
function deleteComponentFromUserComponentAndFromView(cellId) {
    var rowcol = getRowColFromId(cellId);
    var row = rowcol.row;
    var col = rowcol.col;

    if (selectedUserComponent.components[row]) {
        if (selectedUserComponent.components[row][col]) {
            delete selectedUserComponent.components[row][col];
        }
    }
    deleteComponentFromView(cellId);
    updateBitmap(false);

}
function deleteComponentFromView(containerId) {
    var cell = $('#'+containerId);

    cell.find('.config-btns').remove();
    cell.find('.tooltip').remove();
    cell.find('.label-container').remove();
    cell.find('.display-component').remove();
    cell.find('.widget').remove();

    //resetDroppabilityAt(containerId);
}


/**
 * Updates the contents of a base component info at a particular cell based on inputs
 * @param cellId
 */
function updateBaseComponentContentsAndDisplayAt(cellId) {
    // NOTE: actual cell is the cell in the main table
    // cellId could be either display-cell or the actual cell id, but it is the one
    // that contains text edits
    // tooltip is the tooltip currently being edited

    var actualCellId;
    var cell;
    var tooltip;
    var componentId;
    if (cellId == 'display-cell') {
        actualCellId = $('#display-cell').data('cellid');
        tooltip = $('#inner-component-focus').find('.tooltip');
        componentId = null; //TODO
    } else {
        actualCellId = cellId;
        cell = $('#'+cellId);
        tooltip = cell.find('.tooltip');
        componentId = cell.data('componentId');
    }
    //var rowcol = getRowColFromId(actualCellId);
    //var row = rowcol.row;
    //var col = rowcol.col;

    var type = $('#' + actualCellId).get(0).getElementsByClassName('draggable')[0].getAttribute('name');
    var value;
    var isUpload = false;
    //var inputs = Array.prototype.slice.call(
    //    $('#' + cellId).get(0).getElementsByTagName('input'), 0);


    if (tooltip.length>0){
        var inputs = Array.prototype.slice.call(
            tooltip.get(0).getElementsByTagName('input'), 0);
    } // else it is label and is handled

    if (type === 'label') {
        value = $('#' + cellId).find('p')[0].textContent;
    } else if (type === 'link') {
        value = {
            link_text: inputs[0].value,
            target: inputs[1].value
        }
    } else if (type === 'tab_viewer') {
        value = {
            "tab1": {text: inputs[0].value, target: inputs[1].value},
            "tab2": {text: inputs[2].value, target: inputs[3].value},
            "tab3": {text: inputs[4].value, target: inputs[5].value}
        }
    } else if (type === 'menu') {
        value = {
            "menu_item1": {text: inputs[0].value, target: inputs[1].value},
            "menu_item2": {text: inputs[2].value, target: inputs[3].value},
            "menu_item3": {text: inputs[4].value, target: inputs[5].value}
        }
    } else if (type === 'image') {
        value = {};

        if (files.length > 0) { // if there's a file to upload

            var file = files[0];
            var parseFile = new Parse.File(file.name, file);
            isUpload = true;
            files.length = 0; // clear the old file
            parseFile.save()
                .then(function (savedFile) { // save was successful
                    value.img_src = savedFile.url();
                    selectedUserComponent.components[componentId].components[type] = value;

                    //selectedUserComponent.components[row][col].components[type] = value;
                    refreshCellDisplay(actualCellId, currentZoom);
                    if (cellId=='display-cell'){
                        refreshCellDisplay('display-cell', parseFloat($('#display-cell').data('display-cell-scale')));
                    }
                });
        } else { // pasted link to image
            if (inputs[0].value.length>0){
                value.img_src = inputs[0].value;
            } else {
                value.img_src = 'images/image_icon.png';
            }
        }
    } else if (type === 'panel') {
        value = {
            heading: $('#' + cellId).find('.panel-title')[0].textContent,
            content: $('#' + cellId).find('.panel-html')[0].textContent
        }
    }

    if (!isUpload) {
        //selectedUserComponent.components[row][col].components = {};
        //selectedUserComponent.components[row][col].components[type] = value;
        selectedUserComponent.components[componentId].components = {};
        selectedUserComponent.components[componentId].components[type] = value;


        refreshCellDisplay(actualCellId, currentZoom);
        if (cellId=='display-cell'){
            refreshCellDisplay('display-cell', parseFloat($('#display-cell').data('display-cell-scale')));
        }
    }
}



/** ** ** ** ** ** ** ** IMAGE UPLOAD HELPERS ** ** ** ** ** ** ** **/
// file drag hover
function FileDragHover(e) {
    e.stopPropagation();
    e.preventDefault();
    if (e.type == "dragover") {
        $(e.target).addClass("hover");
    } else if (e.type == "dragleave") {
        $(e.target).removeClass("hover");
    }
}
// file selection
function FileSelectHandler(e) {

    FileDragHover(e); // cancel event and hover styling

    files = e.target.files || e.dataTransfer.files;

    $(e.target).text("Got file: " + truncate(files[0].name, 30));
}

function truncate(str, len) {
    return str.substring(0, len) + (str.length > len ? "... " + str.substring(str.length - 4) : "");
}

function getCSSRule(search) {
    var x = [];
    for (var sheetnum =0; sheetnum< document.styleSheets.length; sheetnum++){
        x = x.concat([].slice.call(document.styleSheets[sheetnum].cssRules));
    }
    return x.filter(function (rule) {
        return rule.selectorText === search;
    })[0];
}

function resizeLabelDivs(cellWidth, cellHeight) {
    getCSSRule('.label-container').style.setProperty('width', (cellWidth - 10) + 'px', null);
    getCSSRule('.label-container').style.setProperty('height', (cellHeight - 30) + 'px', null);
    getCSSRule('.label-container').style.setProperty('padding-top', (cellHeight / 4) + 'px', null);
}



/** ** ** ** ** ** ** ** ** Table Cells Interaction and display Helpers ** ** ** ** ** ** ** ** **/

function cellTrashDroppableSettings(){
    var enableDrop = {
        accept: ".widget",
        hoverClass: "highlight",
        tolerance: "intersect",
        drop: function(event, ui) {

            if ($(this).attr('id') != "trash") { // if dropped in cell
                $(this).addClass("dropped");
                $(this).removeClass("droppable");
                $(ui.draggable).appendTo(this);
                $(this).droppable('disable');
                var cellId = $(this).attr('id');
                if (!movedComponent()) {
                    displayComponentInTable(cellId, $(ui.draggable));
                }
            }
            //else { // if dropped in trash
            //    var trashCopy = $(this).children().first();
            //    $(ui.draggable).appendTo(this);
            //    $(this).empty();
            //    trashCopy.appendTo($(this));
            //    movedComponent();
            //}

            registerDraggable();
            resetDroppability();
            registerTooltipBtnHandlers();

            //moveCellContentsToDisplayAreaAndScale(currentZoom, cellId);
            //scaleCellComponents(currentZoom, cellId)

        }
    };
    return enableDrop;
}

function registerCellDroppable(cellId){
    $('#'+cellId).droppable(cellTrashDroppableSettings());
}

//
// function registerDroppable() {
//     $('.droppable').each(function(){
//         if (!$(this).hasClass('page-component-toggle-drop')){
//             $(this).droppable(cellTrashDroppableSettings());
//         }
//     });
// }

function registerDraggable(widgetToRegister) {
    var draggableOptions = {
        opacity: 1,
        revert: "invalid",
        cursorAt: { top: 0, left: 0 },
        helper: function(){
            var widget = $(this);
            if (widget.hasClass('associated')){
                var componentId = widget.data('componentId');
                draggingComponent = selectedUserComponent.components[componentId];
                var componentContainer = $('#component-container_'+componentId);
            } else {

                var type = $(this).attr('name');
                var component = BaseComponent(type, {}, getDimensions(type));
                draggingComponent = component;

                var componentContainer = createComponentContainer(component);
                setUpContainer(componentContainer, widget);
                $('#basic-components').html(basicComponents);
            }

            $('#outer-container').append(componentContainer);
            // $('#outer-container').append('<div id="clone" class="widget cell dropped containing-cell component-container">' + $(this).html() + '</div>');

            //Hack to append the widget to the html (visible above others divs), but still belonging to the scrollable container
            componentContainer.hide();
            setTimeout(function(){componentContainer.appendTo('html'); componentContainer.show();},1);
            componentContainer.css({
                left: 0,
                top: 0
            });
            componentContainer.attr('id', 'dragging_container');
            return componentContainer;

            // $("#clone").hide();
            // setTimeout(function(){$('#clone').appendTo('html'); $("#clone").show();},1);
            // return $("#clone");
        },
        appendTo: 'html',
        cursor: '-webkit-grabbing',
        scroll: true,
        drag: function(e, ui){
            ui.position.top = e.pageY;
            ui.position.left = e.pageX;
        },
    };

    if (widgetToRegister){
        widgetToRegister.draggable(draggableOptions)
    }

    else {
        $('.widget').each(function() {
            $(this).draggable(draggableOptions);
        });
    }

}

function getSliderValFromZoom(zoom){
    var max = parseFloat($('#zoom-slider').get(0).max);
    var min = parseFloat($('#zoom-slider').get(0).min);

    //var max = $( "#zoom-slider" ).slider( "option", "max");
    //var min = $( "#zoom-slider" ).slider( "option", "min");

    var val = 0;
    if (zoom === 1){
        val = 0;
    } else if ( zoom > 1 ){
        val = (zoom-1)*100;
    } else {
        val = (zoom-1)*(max+100);
    }
    // rounding for extremes
    val = Math.max(Math.min(val, max), min);
    return Math.round(val);
}

function getZoomFromSliderVal(){
    var val = parseFloat($('#zoom-slider').val())/100;
    //var val = $( "#zoom-slider" ).slider( "option", "value" );
    var zoom = 1;
    if (val===0){
        zoom = 1;
    } else if (val>0){
        zoom = (val+1);
    } else {
        var max = parseFloat($('#zoom-slider').get(0).max)/100;
        zoom = 1+val/(max+1);
    }
    return zoom;
}

/**
 * Scales the table, based on the saved sizes, scaled to the zoom factor. If the saved sizes are changed beforhand,
 * this function can be used to resize the table
 */
function scaleTableToZoom(){
    propagateRatioChangeToAllElts();
}

function changeZoomViaZoomControl(type) {
    if (type == 'slider') {
        // TODO make this better
        var zoom = getZoomFromSliderVal();
        $('#zoom-control-value').text(Math.round(zoom * 100) + '%');
        currentZoom = zoom;
    } else if (type == 'fit') {
        var zoomHeight = ($('#outer-container').height() - (20 + 100 + 70 + 17)) / selectedUserComponent.layout.tablePxDimensions.height; // take into account padding and stuff
        var zoomWidth = ($('#outer-container').width() - (20 + 100 + 40 + 17)) / selectedUserComponent.layout.tablePxDimensions.width;
        currentZoom = Math.min(zoomWidth, zoomHeight);
    } else {
        var widthScale = ($('#outer-container').width())/selectedScreenSizeWidth;
        var heightScale = ($('#outer-container').height())/selectedScreenSizeHeight;

        currentZoom = Math.min(widthScale, heightScale);
    }
    changeZoomDisplays(currentZoom);

    // update the state
    var state = $('#table-grid-container'+'_'+selectedUserComponent.meta.id).data('state');
    state.zoom = currentZoom;
    $('#table-grid-container'+'_'+selectedUserComponent.meta.id).data('state', state);

    scaleTableToZoom();
}

/**
 * Changes the displays related to zoom
 *
 * @param zoom
 */
function changeZoomDisplays(zoom){
    $('#zoom-control-value').text(Math.round(currentZoom*100)+'%');
    var sliderVal = getSliderValFromZoom(currentZoom);
    $('#zoom-slider').val(sliderVal);



    // update zoom nav displays
    $('#selected-screen-size').css({
        height: selectedScreenSizeHeight*currentZoom + 'px',
        width: selectedScreenSizeWidth*currentZoom + 'px',
    });
    $('#zoom-selected-screen-size').css({
        height: selectedScreenSizeHeight*currentZoom*navZoom + 'px',
        width: selectedScreenSizeWidth*currentZoom*navZoom + 'px',
    });
    updateZoomNavComponentSize();
}

function updateZoomNavComponentSize(){
    $('#zoom-nav-component-size').css({
        width: selectedUserComponent.layout.tablePxDimensions.width*navZoom*currentZoom + 'px',
        height: selectedUserComponent.layout.tablePxDimensions.height*navZoom*currentZoom + 'px',
    });
}

function registerZoom() {
    $('#zoom-control-value').text('100%');

    $('#zoom-in').click( function (e) {
        e.preventDefault();
        var val = parseFloat($('#zoom-slider').val());
        $('#zoom-slider').val(Math.round(val/100)*100+100);
        changeZoomViaZoomControl('slider');
    });
    $('#zoom-out').click( function (e) {
        e.preventDefault();
        var val = parseFloat($('#zoom-slider').val());
        $('#zoom-slider').val(Math.round(val/100)*100-100);
        changeZoomViaZoomControl('slider');
    });


    $('#zoom-slider').on('input', function(){
        var potentialZoom = getZoomFromSliderVal();
        $('#zoom-control-value').text(Math.round(potentialZoom*100)+'%');
    });

    $('#zoom-slider').on('change', function(){
        changeZoomViaZoomControl('slider');
    });

    $('#zoom-actual').click(function(e, ui){
        e.preventDefault();
        $('#zoom-slider').val(0);
        changeZoomViaZoomControl('slider');
    });

    $('#zoom-fit').click(function(e, ui){
        e.preventDefault();
        changeZoomViaZoomControl('fit');
    });
    $('#zoom-full').click(function(e, ui){
        e.preventDefault();
        changeZoomViaZoomControl('full');
    });

    $('#zoom-control-minimize-btn').click(function(){
        if ($(this).hasClass('minimized')){
            $(this).removeClass('minimized').find('span').removeClass('glyphicon-chevron-left').addClass('glyphicon-chevron-right');
            $('#zoom-slider-and-value, #zoom-actual, #zoom-fit, #zoom-full').css({
                display: 'inline-block',
            })


        }else{
            $(this).addClass('minimized').find('span').addClass(' glyphicon-chevron-left').removeClass('glyphicon-chevron-right');
            $('#zoom-slider-and-value, #zoom-actual, #zoom-fit, #zoom-full').css({
                display: 'none',
            })
        }
    })
}

function zoomNavInitialize(){
    var widthScale = ($('#zoom-nav').width())/$('#selected-screen-size').width();
    var heightScale = ($('#zoom-nav').height())/$('#selected-screen-size').height();

    var scale = Math.min(widthScale, heightScale);
    navZoom = scale;

    $('#zoom-selected-screen-size').css({
        position: 'absolute',
        height: $('#selected-screen-size').height()*scale*currentZoom + 'px',
        width: $('#selected-screen-size').width()*scale*currentZoom + 'px',
        border: '1px black solid',
        background: 'white',
    });

    $('#zoom-nav-full-area').css({
        position: 'absolute',
        height: 3000*scale + 'px',
        width: 3000*scale + 'px',
    });
    showZoomNavPosition();

    $('#zoom-nav-minimize-btn').click(function(){
       if ($(this).hasClass('minimized')){
           $(this).removeClass('minimized').addClass('btn-xs');
           $('#zoom-nav').css({
               display: 'block',
           });
           $(this).text('_');
       } else {
           $(this).addClass('minimized').removeClass('btn-xs').text('Navigation');
           $('#zoom-nav').css({
               display: 'none',
           })
       }

    });
}

$('#outer-container').on('scroll', function(){
    if (!navDragging){
        showZoomNavPosition();
    }
});

$('#zoom-nav').click(function(e){
    var posX = e.pageX - $('#zoom-nav').offset().left + $('#zoom-nav').scrollLeft();
    var posY = e.pageY - $('#zoom-nav').offset().top + $('#zoom-nav').scrollTop();
    $('#outer-container').scrollTop(posY/navZoom);
    $('#outer-container').scrollLeft(posX/navZoom);

    $('#zoom-nav-position').css({
        top: Math.min(posY, $('#zoom-nav-full-area').height()- $('#zoom-nav-position').height()) + 'px',
        left: Math.min(posX, $('#zoom-nav-full-area').width()- $('#zoom-nav-position').width()) + 'px',
    });
});

function initializeZoomNavComponentSize(){
    $('#zoom-nav-component-size').css({
        background: '#D5D5D5',
        width: $('#main-cell-table').width()*navZoom*currentZoom + 'px',
        height: $('#main-cell-table').height()*navZoom*currentZoom + 'px',
        margin: 50*navZoom + 'px',
        position: 'absolute',
    })
}

function showZoomNavPosition(){
    var scrollTop = $('#outer-container').scrollTop()*navZoom;
    var scrollLeft = $('#outer-container').scrollLeft()*navZoom;

    $('#zoom-nav-position').css({
        position: 'absolute',
        top: scrollTop + 'px',
        left: scrollLeft + 'px',

        height: $('#outer-container').height()*navZoom + 'px',
        width: $('#outer-container').width()*navZoom + 'px',
        border: '1px black solid',
        background: 'blue',
        opacity: '0.5',
    });

    if ((scrollTop>($('#zoom-nav').scrollTop()+$('#zoom-nav').height()-$('#zoom-nav-position').height()))){
        var navScrollTop = scrollTop-($('#zoom-nav').height()-$('#zoom-nav-position').height());
        navScrollTop = Math.max(navScrollTop,0);
        navScrollTop = Math.min(navScrollTop, 3000/navZoom-$('#zoom-nav').height());
        $('#zoom-nav').scrollTop(navScrollTop);
    }
    if ((scrollTop<($('#zoom-nav').scrollTop()))){
        var navScrollTop = scrollTop;
        navScrollTop = Math.max(navScrollTop,0);
        navScrollTop = Math.min(navScrollTop, 3000/navZoom-$('#zoom-nav').height());
        $('#zoom-nav').scrollTop(navScrollTop);
    }
    if ((scrollLeft>($('#zoom-nav').scrollLeft()+$('#zoom-nav').width()-$('#zoom-nav-position').width()))){
        var navScrollLeft = scrollLeft-($('#zoom-nav').width()-$('#zoom-nav-position').width());
        navScrollLeft = Math.max(navScrollLeft,0);
        navScrollLeft = Math.min(navScrollLeft, 3000/navZoom-$('#zoom-nav').width());
        $('#zoom-nav').scrollLeft(navScrollLeft);
    }

    if ((scrollLeft<($('#zoom-nav').scrollLeft()))){
        var navScrollLeft = scrollLeft;
        navScrollLeft = Math.max(navScrollLeft,0);
        navScrollLeft = Math.min(navScrollLeft, 3000/navZoom-$('#zoom-nav').width());
        $('#zoom-nav').scrollLeft(navScrollLeft);
    }

}

$('#zoom-nav-position').draggable({
    containment: '#zoom-nav-full-area',
    start: function(){
        navDragging = true;
    },
    drag: function(e, ui){
        var posX = ui.position.left;
        var posY = ui.position.top;
        $('#outer-container').scrollTop(posY/navZoom);
        $('#outer-container').scrollLeft(posX/navZoom);
        showZoomNavPosition();
    },
    stop: function(){
        navDragging = false;
    },
});



function resetDroppabilityAt(cellId){
    if ($('#'+cellId).get(0).getElementsByClassName('draggable').length == 0) {
        $('#'+cellId).removeClass('dropped');
        $('#'+cellId).addClass('droppable');
        $('#'+cellId).droppable('enable');
    }
}

function resetDroppability() {
    $('.cell').each(function() {
        resetDroppabilityAt(this.id);
    });
}

function movedComponent() {

    updateBitmap(false);

    var coord = findDeletedCoord();

    if (coord.length > 0 && typeof coord[0]!=="undefined") { // if not first drop

        var delRow = coord[0];
        var delCol = coord[1];
        if (typeof coord[2]!=="undefined") { // if move, copy any save data
            var newRow = coord[2];
            var newCol = coord[3];

            var innerComponentCopy = selectedUserComponent.components[delRow][delCol];
            selectedUserComponent.addComponent(innerComponentCopy, newRow, newCol);

            var padding = selectedUserComponent.components[delRow][delCol].padding;
            var properties = innerComponentCopy.properties;

            display('cell'+ '_' + newRow + '_' + newCol, innerComponentCopy.type, getHTML[innerComponentCopy.type](innerComponentCopy.components[innerComponentCopy.type]), currentZoom, padding, properties);
            triggerEdit('cell'+ '_' + newRow + '_' + newCol, false);

        }

        deleteComponentFromUserComponentAndFromView("cell"+ '_' + delRow + '_' + delCol);
        return true;
    }
    return false;
}

/**
 * Register listener for click on edit button
 * @param container
 * @param popup
 */
function triggerEdit(container, popup) {
    var droppedComponent = container.find('.widget').attr('name').toLowerCase();
    var editDialog = $('#'+droppedComponent+'-popup-holder').clone();
    container.prepend(editDialog);


    $(Array.prototype.slice.call(
        container.find('form-control'), 0)[0]).trigger("focus");

    if (popup){
        setTimeout(function(){
            $(container.find('form-control')[0]).trigger("focus");
            editDialog.find('.tooltip').addClass('open');
        }, 1);
    }
}

function showConfigOptions(droppedComponentType, cellId) {
    var cell = document.getElementById(cellId);
    // Hide edit button if label or panel
    if (droppedComponentType=='label' || droppedComponentType=='panel') {
        $('#'+cell.id).find('.edit-btn').css('display', 'none');
    } else {
        $('#'+cell.id).find('.edit-btn').css('display', 'block');
    }

    var configOptions = document.getElementById(droppedComponentType+'-properties');
    if (configOptions==null || configOptions==undefined) {
        return;
    }

    var sp = document.createElement('span');
    sp.innerHTML = configOptions.innerHTML;
    var configDiv = sp.firstElementChild;

    if (cellId == 'display-cell'){
        $('#inner-component-focus').get(0).insertBefore(configDiv, cell.firstChild);
    } else{
        cell.insertBefore(configDiv, cell.firstChild);
    }

}


function registerTooltipBtnHandlers() {
    $('.close').on("click", function() {
        setTimeout(function(){
            $('.tooltip').removeClass('open');
        }, 1);
        Array.prototype.slice.call(
            $(this).parent().get(0).getElementsByClassName('form-control'), 0)
            .forEach(function(item) {
                item.value = "";
            })
    });

    $('.apply').on("click", function(event) {
        var cellId = findContainingCell(this);
        updateBaseComponentContentsAndDisplayAt(cellId);
        $('.tooltip').removeClass('open');
    });

    var align_options = ['alignment', 'center', 'right', 'left', 'justify'];
    var label_sizes = ['size', 'small', 'default', 'large', 'heading'];
    var label_styles = ['style', 'muted', 'default', 'primary', 'info', 'success', 'warning', 'danger'];
    var btn_styles = ['style', 'link', 'default', 'primary', 'info', 'success', 'warning', 'danger'];
    var btn_sizes = ['size', 'xs', 'df', 'lg'];
    var tab_styles = ['style', 'pills', 'tabs'];
    var tab_alignments = ['alignment', 'stacked', 'horizontal'];
    var menu_alignments = ['alignment', 'vertical', 'horizontal'];
    var panel_styles = ['style', 'default', 'primary', 'info', 'success', 'warning', 'danger'];

    function registerPropHandlers(optionsList_, classPrefix, bootstrapPrefix) {
        var propertyName = optionsList_[0];
        var optionsList = optionsList_.slice(1);

        for (var i=0; i<optionsList.length; i++) {
            var options = document.getElementsByClassName(classPrefix+'-'+optionsList[i]);
            for (var j=0; j<options.length; j++) {
                options[j].onclick = generateHandler(i, optionsList, bootstrapPrefix, propertyName);
            }
        }
    }

    function generateHandler(index, optionsList, bootstrapPrefix, propertyName) {
        return function(e) {
            e.preventDefault();
            var cellId = findContainingCell(this);
            var element = $('#'+cellId).find('.display-component');
            if (cellId == 'display-cell') {
                var element2 = $('#'+$('#display-cell').data('cellid')).find('.display-component');
            }
            var bootstrapClass = bootstrapPrefix+"-"+optionsList[index];
            element.addClass(bootstrapClass);
            if (cellId == 'display-cell') {
                element2.addClass(bootstrapClass);
            }


            for (var j=0; j<optionsList.length; j++) {
                if (j!==index) {
                    element.removeClass(bootstrapPrefix+'-'+optionsList[j]);
                    if (cellId == 'display-cell') {
                        element2.removeClass(bootstrapPrefix+'-'+optionsList[j]);
                    }
                }
            }

            if (cellId == 'display-cell'){
                var rowcol  = getRowColFromId($('#display-cell').data('cellid'));
            } else {
                var rowcol  = getRowColFromId(cellId);
            }
            var row = rowcol.row;
            var col = rowcol.col;
            selectedUserComponent.components[row][col].properties[propertyName] = bootstrapClass;

        }
    }

    var inputOptions = [
        [align_options, 'align', 'text'],
        [label_sizes, 'lbl', 'lbl'],
        [label_styles, 'lbl-text', 'text'],
        [btn_styles, 'btn-style', 'btn'],
        [btn_sizes, 'btn-size', 'btn'],
        [tab_styles, 'tab-style', 'nav'],
        [tab_alignments, 'tab-align', 'nav'],
        [menu_alignments, 'menu', 'btn-group'],
        [panel_styles, 'panel-text', 'panel']];

    inputOptions.forEach(function(inputOption) {
        registerPropHandlers.apply(null, inputOption);
    });

    getContentEditableEdits();

    var dropzones = document.getElementsByClassName("upload-drop-zone");
    for (var i=0; i<dropzones.length; i++) {
        dropzones[i].addEventListener("dragover", FileDragHover, false);
        dropzones[i].addEventListener("dragleave", FileDragHover, false);
        dropzones[i].addEventListener("drop", FileSelectHandler, false);
    }
}

function findContainingCell(context) {
    var parent = $(context).parent();
    while (!(parent.hasClass('containing-cell')||parent.hasClass('display-cell-parent'))) {
        parent = $(parent).parent();
    }
    var cellId;
    if (parent.hasClass('display-cell-parent')){
        cellId = 'display-cell';
    } else {
        cellId = $(parent).attr('id');
    }
    return cellId;
}


/**
 * The recursion is there so that ???
 */
function getContentEditableEdits() {
    $('[contenteditable=true]').blur(function() {
        var cellId = findContainingCell(this);
        updateBaseComponentContentsAndDisplayAt(cellId);
        //getContentEditableEditsAtCell(cellId);
    });
}


function selectText(container) {
    var range = document.createRange();
    range.selectNodeContents(container);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
}

/**
 * Click outside the tooltip to hide it
 */
$(document).click(function(event) {
    if(!$(event.target).closest('.tooltip').length &&
        !$(event.target).is('.tooltip') &&
        !$(event.target).is('.edit-btn') &&
        !$(event.target).is('.glyphicon')) {
        if($('.tooltip').hasClass('open')) {
            $('.tooltip').removeClass('open');
        }
    }
    // also listen for clicks in contenteditables
    if ($(event.target).is('[contenteditable=true]')) {
        selectText($(event.target).get(0));
    }
});

/**
 * display name of uploaded image
 */
$(document).on('change', '#fileselect', function(evt) {
    files = $(this).get(0).files;
    $(this).parent().parent().parent().children().first().val(files[0].name);
});


/** ** ** ** ** ** ** ** Show Cliche Components in List  ** ** ** ** ** ** ** **/
function showClicheInList(id, name){
    var addedCliche = '<li id="added_'+id+'">'+name+'</li>';
    $('.cliche-components ul').append(addedCliche);
}

/** ** ** ** ** ** Dragging and Dropping User Components to Main pages ** ** ** **/
function registerUserComponentAreaDroppable(){
    var enableDrop = {
        accept: ".dragging-component",
        hoverClass: "highlight",
        tolerance: "intersect",
        drop: function(event, ui) {
            var userComponentId = ui.draggable.data('componentid');
            var name = selectedProject.components[userComponentId].meta.name;
            if ($(this).hasClass('main-pages')){
                if (ui.draggable.hasClass('moving-user-component')){ // if type user
                    // adding to main page
                    selectedProject.mainComponents[userComponentId] = name;
                    $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();
                    displayMainPageInListAndSelect(name, userComponentId);
                    selectedProject.components[userComponentId].inMainPages = true;
                }
            } else if ($(this).hasClass('user-components')){
                if (ui.draggable.hasClass('moving-main-component')){ // if type user
                    // removing from main page
                    delete selectedProject.mainComponents[userComponentId];
                    $("#main-pages-list").find("[data-componentid='" + userComponentId + "']").remove();
                    displayUserComponentInListAndSelect(name, userComponentId);
                    selectedProject.components[userComponentId].inMainPages = false;
                }
            }
        }
    };
    $('.page-component-toggle-drop').each(function() {
        $(this).droppable(enableDrop);
    });
}

function registerUserComponentAsDraggable(componentId) {
    var enableDraggable = function (element, type) {
        // type === 'user'||'main'
        return {
            opacity: 1,
            revert: "invalid",
            cursorAt: {top: 0, left: 0},
            helper: function () {
                $(this).addClass('dragging-component moving-' + type + '-component');
                var clone = document.createElement('div');
                // TODO display
                clone.innerHTML = $(this).find('.component-name').text();
                return clone;
            },
            appendTo: '#user-components-list',
            containment: '.user-made-components',
            cursor: '-webkit-grabbing',
            scroll: true,
            stop: function () {
                $(this).removeClass('dragging-component moving-' + type + '-component');
            }
        }

    };

    $("#user-components-list").find("[data-componentid='" + componentId + "']").each(function () {
        $(this).draggable(enableDraggable(this, 'user'));
    });
    $("#main-pages-list").find("[data-componentid='" + componentId + "']").each(function () {
        $(this).draggable(enableDraggable(this, 'main'));
    });
}

/** ** ** ** ** ** ** ** Dropdown Implementation ** ** ** ** ** ** ** ** ** **/
$(".dropdown-trigger").click(function(ev) {
    var dropdownid = $(this).data('dropdownid');

    if ($(this).hasClass('dropdown-open')){
        // close it
        $(this).removeClass('dropdown-open').addClass('dropdown-closed');
        $(this).find('.glyphicon').remove();
        $(this).append('<span class="glyphicon glyphicon-triangle-right"></span>');

        $("html").find("[data-dropdownid='" + dropdownid + "']").each(function(){
            if ($(this).hasClass('dropdown-target')){
                $(this).css({
                    display: 'none',
                });
            }
        });

    } else {
        // open it
        $(this).removeClass('dropdown-closed').addClass('dropdown-open');
        $(this).find('.glyphicon').remove();
        $(this).append('<span class="glyphicon glyphicon-triangle-bottom"></span>');

        $("html").find("[data-dropdownid='" + dropdownid + "']").each(function(){
            if ($(this).hasClass('dropdown-target')){
                $(this).css({
                    display: 'block',
                });
            }
        });

    }
});


/** ** ** ** ** ** ** Layout Listeners ** ** ** ** ** ** **/
$('#unmerge-all-cells').click(function(){
   //TODO some sort of warning? Components are placed in the top-left cell
    for (var row = 1; row <= numRows; row++){
        for (var col = 1; col<= numCols; col++){
            var cellId = 'cell'+'_'+row+'_'+col;
            if (selectedUserComponent.components[row]){
                unmergeCells(cellId, selectedUserComponent.components[row][col]);
            } else{
                unmergeCells(cellId);
            }
        }
    }
});


$('#reset-width-ratios').click(function(){
    var widthRatio = 1/numCols;
    for (var row = 1; row <= numRows; row++){
        for (var col = 1; col<= numCols; col++){
            selectedUserComponent.layout[row][col].ratio.grid.width = widthRatio;
        }
    }
    scaleTableToZoom();
});


$('#reset-height-ratios').click(function(){
    var heightRatio = 1/numRows;
    for (var row = 1; row <= numRows; row++){
        for (var col = 1; col<= numCols; col++){
            selectedUserComponent.layout[row][col].ratio.grid.height = heightRatio;
        }
    }
    scaleTableToZoom();
});


$('.add-n-rows input').on('keypress',function(event, ui){
    if (event.which == 13) {
        var value = parseInt($(this).val());
        if (!isNaN(value)){
            addNRowsToEnd(value);
        }
        $(this).val('');
    }
});


$('.remove-n-rows input').on('keypress',function(event, ui){
    if (event.which == 13) {
        var value = parseInt($(this).val());
        if (!isNaN(value)){
            removeNRowsFromEnd(value);
        }

        $(this).val('');
    }
});


$('.add-n-cols input').on('keypress',function(event, ui){
    if (event.which == 13) {
        var value = parseInt($(this).val());
        if (!isNaN(value)){
            addNColsToEnd(value);
        }
        $(this).val('');
    }
});


$('.remove-n-cols input').on('keypress',function(event, ui){
    if (event.which == 13) {
        var value = parseInt($(this).val());
        if (!isNaN(value)){
            removeNColsFromEnd(value);
        }
        $(this).val('');
    }
});

function addResizeToFixedRatiosHandlers(){
    for (var row = 1; row<= numRows; row++){
        var toAdd = '<li><span>Row '+row+'</span> <input type="text"></li>';
        $('#resize-fixed-rows').append(toAdd);
    }

    for (var col = 1; col<= numCols; col++){
        var toAdd = '<li><span>Col '+col+'</span> <input type="text"></li>';
        $('#resize-fixed-cols').append(toAdd);

    }
}

$('#btn-resize-to-inputs').click(function(){
    $('.input-single').each(function() {
        // this exists
        $(this).removeClass('input-single neutral').addClass('input-multiple');
        if ($(this).hasClass('input-single-editing')){
            var rowcol = getRowColFromId($(this).find('.select-unit').get(0).id);
            var type = $(this).data('dimension');
            if (type == 'width'){
                updateSizeValueDisplayAtCol(rowcol.col, false);
            } else {
                updateSizeValueDisplayAtRow(rowcol.row, false);
            }
            $(this).removeClass('input-single-editing');
        }
    });

    $('#resize-to-inputs-done-cancel').css({
        display: 'block',
    });
    $(this).css({
        display: 'none',
    })
});

function resetResizeToInputDisplays(){//ToDO better name
    $('.input-multiple').removeClass('input-multiple').addClass('input-single neutral');

    $('#resize-to-inputs-done-cancel').css({
        display: 'none',
    });
    $('#btn-resize-to-inputs').css({
        display: 'block',
    });
}

$('#btn-resize-to-inputs-cancel').click(function(){
    updateSizeValueDisplay(false);
    resetResizeToInputDisplays();
});

$('#btn-resize-to-inputs-done').click(function(){
    var type = $('.select-unit').val(); // TODO this is a bit sketchy, since we are only sampling one
    if (type == 'px'){
        for (var row = 1; row<= numRows; row++){
            var newRatioRow = parseFloat($('.size-display-height').find('#size-display-value_'+row+'_1').val())/selectedUserComponent.layout.tablePxDimensions.height;
            for (var col = 1; col<= numCols; col++){
                var newRatioCol = parseFloat($('.size-display-width').find('#size-display-value_1_'+col).val())/selectedUserComponent.layout.tablePxDimensions.width
                selectedUserComponent.layout[row][col].ratio.grid.width = newRatioCol;
                selectedUserComponent.layout[row][col].ratio.grid.height = newRatioRow;
            }
        }
        scaleTableToZoom(); // this resizes the table based on the above changes in size
        saveTableSizeAndRowColRatiosGrid(true, true); // this resets the saved ratios to the correct ones
        updateSizeValueDisplay(false);
    } else if (type == '%'){
        var ratiosRow = [];
        var ratiosCol = [];
        for (var row = 1; row<= numRows; row++){
            ratiosRow.push(parseFloat($('.size-display-height').find('#size-display-value_'+row+'_1').val())/100);
        }
        for (var col = 1; col<= numCols; col++){
            ratiosCol.push(parseFloat($('.size-display-width').find('#size-display-value_1_'+col).val())/100);
        }

        resizeColsBySetRatios(ratiosCol);
        resizeRowsBySetRatios(ratiosRow);
    }
    resetResizeToInputDisplays();
});


$('#resize-table').click(function(){
    var newWidth = parseInt($('#resize-table-width').find('input').val());
    var newHeight = parseInt($('#resize-table-height').find('input').val());
    if (isNaN(newWidth)|| isNaN(newHeight)){
       return;
    }
    selectedUserComponent.layout.tablePxDimensions.width = newWidth;
    selectedUserComponent.layout.tablePxDimensions.height = newHeight;

    scaleTableToZoom();

});


$('.components').on('click', '.index-page-toggle', function(){
    var turnOn = !($(this).parent().hasClass('selected-index-page'));
    $('.components .selected-index-page').removeClass('selected-index-page');
    var componentId = $(this).parent().data('componentid');
    if (turnOn){
        selectedProject.mainComponents.indexId = componentId;
        $(this).parent().addClass('selected-index-page');
    } else {
        selectedProject.mainComponents.indexId = null;
    }
    setUpComponentOptionsIndexPageToggle();
});



$('#outer-container').on('dblclick', '.cell', function(){
    var rowcol = getRowColFromId(this.id);
    if (selectedUserComponent.components[rowcol.row]){
        if (selectedUserComponent.components[rowcol.row][rowcol.col]){
            switchToInnerComponentFocusMode(rowcol.row, rowcol.col)
        }
    }
});

$('#display-cell').click(function(event){
    if (!$(allElementsFromPoint(event.clientX, event.clientY)).filter('[contenteditable=true]').get(0)){
        $( document.activeElement ).blur();
    }
});

function switchToInnerComponentFocusMode(row, col){
    $('#inner-component-focus #display-cell').html('');
    $('#inner-component-focus').find('.tooltip').remove();

    $('#inner-component-focus #display-cell').removeData();

    $('#style-overall-vs-specific').text('Specific, Row:'+row+' Col:'+col);

    var componentToShow = selectedUserComponent.components[row][col];
    var type = componentToShow.type;

    var cellId = 'cell'+'_'+row+'_'+col;
    $('#display-cell').data('cellid',cellId);

    setUpInnerComponentOptions(cellId);

    toggleInnerComponentVisibility(false);

    // dealing with merges
    var bottomRightCellId = $('#'+cellId).data('merged').bottomRightCellId;
    if (bottomRightCellId.length == 0){
        bottomRightCellId = cellId;
    }

    var actualHeight = 0;
    var actualWidth = 0;
    var endRowCol = getRowColFromId(bottomRightCellId);
    var endRow = parseInt(endRowCol.row);
    var endCol = parseInt(endRowCol.col);
    for (var mergeRow = row; mergeRow<=endRow; mergeRow++){
        actualHeight += selectedUserComponent.layout[mergeRow][col].ratio.grid.height * selectedUserComponent.layout.tablePxDimensions.height;
    }
    for (var mergeCol = col; mergeCol<=endCol; mergeCol++){
        actualWidth += selectedUserComponent.layout[row][mergeCol].ratio.grid.width * selectedUserComponent.layout.tablePxDimensions.width;
    }

    $('#inner-component-focus').css({
        width: '600px',
        height: '600px',
    });

    var widthScale = ($('#inner-component-focus').width())/actualWidth;
    var heightScale = ($('#inner-component-focus').height())/actualHeight;

    var scale = Math.min(widthScale, heightScale);

    $('#display-cell').data('display-cell-scale', scale);


    $('#inner-component-focus').css({ // update the width and height to something that actually looks like the cell
        height: actualHeight*scale + 'px',
        width: actualWidth*scale + 'px',
        //border: '5px solid white',
        'background-color': '#F9F9F9',
        position: 'relative',
    });

    var padding = selectedUserComponent.components[row][col].padding;
    if (!padding){
        padding = {top: 0, bottom: 0, left: 0, right: 0};
    }

    var displayTop = padding.top*actualHeight*scale;
    var displayLeft = padding.left*actualWidth*scale;
    var displayHeight = (1-padding.top-padding.bottom)*actualHeight*scale;
    var displayWidth = (1-padding.left-padding.right)*actualWidth*scale;

    $('#display-cell').css({
        height: displayHeight + 'px',
        width: displayWidth + 'px',
        display: 'table-cell',
        'text-align': 'center',
        'vertical-align': 'middle',
        border: '1px grey solid',
        position: 'absolute',
        top: displayTop,
        left: displayLeft,
    });

    $('#display-cell-resize-helper').css({
        height: displayHeight + 'px',
        width: displayWidth + 'px',
        'pointer-events': 'none',
        position: 'absolute',
        top: displayTop,
        left: displayLeft,
        'z-index':100,
    });

    // this isn't actually refreshing but this still works
    refreshCellDisplay('display-cell', scale);


    $('#display-cell').children().css('position', 'relative');
    $('#display-cell-resize-handle').css({
        position: 'absolute',
        bottom: 0,
        right: 0,
        'pointer-events': 'auto'
    });

    $('#display-cell-resize-helper').resizable({
        handles: {
            'se': $('#display-cell-resize-handle')
        },

        start: function(e, ui){
            $('#display-cell-resize-helper').css({
                border: 'black 1px dotted',
            });

            //e.stopPropagation();
        },
        stop: function (e, ui) {
            $('#display-cell-resize-helper').css({
                border: 'none',
            });
            $('#inner-component-focus #display-cell').children().each(function(){
                if (!$(this).hasClass('tooltip')){
                    $(this).remove();
                }
            });
            $('#inner-component-focus #display-cell').css({
                height: $('#display-cell-resize-helper').css('height'),
                width: $('#display-cell-resize-helper').css('width'),
            });
            // NOTE: shouldn't use any padding here
            var padding = null;
            var properties = selectedUserComponent.components[row][col].properties;


            display('display-cell', type, getHTML[type](componentToShow.components[type]), scale, padding, properties);


            //$('#inner-component-focus #display-cell').css({
            //    height: $('#display-cell .display-component').css('height'),
            //    width: $('#display-cell .display-component').css('width'),
            //});
            //
            //
            //$('#inner-component-focus #display-cell-resize-helper').css({
            //    height: $('#display-cell .display-component').css('height'),
            //    width: $('#display-cell .display-component').css('width'),
            //});


            var top = $(this).position().top/$('#inner-component-focus').height();
            var bottom = 1 - ($(this).position().top + $(this).height())/$('#inner-component-focus').height();
            var left = $(this).position().left/$('#inner-component-focus').width();;
            var right = 1 - ($(this).position().left + $(this).width())/$('#inner-component-focus').width();

            var cellId = $('#display-cell').data('cellid');
            var rowcol = getRowColFromId(cellId);

            selectedUserComponent.components[rowcol.row][rowcol.col].padding = {top: top, left: left, bottom: bottom, right: right}
            refreshCellDisplay(cellId, currentZoom);
        },
        containment: '#inner-component-focus',
    });



    $('#display-cell').draggable({
        containment: '#inner-component-focus',
        drag: function(){
            $('#display-cell-resize-helper').css({
                top: $(this).position().top,
                left: $(this).position().left,
            });
        },
        stop: function(){
            $('#display-cell-resize-helper').css({
                top: $(this).position().top,
                left: $(this).position().left,
            });

            var top = $(this).position().top/$('#inner-component-focus').height();
            var bottom = 1 - ($(this).position().top + $(this).height())/$('#inner-component-focus').height();
            var left = $(this).position().left/$('#inner-component-focus').width();;
            var right = 1 - ($(this).position().left + $(this).width())/$('#inner-component-focus').width();

            var cellId = $('#display-cell').data('cellid');
            var rowcol = getRowColFromId(cellId);

            selectedUserComponent.components[rowcol.row][rowcol.col].padding = {top: top, left: left, bottom: bottom, right: right}
            refreshCellDisplay(cellId, currentZoom);
        }
    });


}

function setUpInnerComponentOptions(cellId){
    var rowcol  = getRowColFromId(cellId);
    var row = rowcol.row;
    var col = rowcol.col;

    $('.back-to-all-components').unbind().click(function(){
        toggleInnerComponentVisibility(true);
        // refresh it after toggling, or else the display function will got get the right
        // dimensions of the cells (for merged cells)
        refreshCellDisplay(cellId, currentZoom);
    });
    $('.btn-delete-inner-component').unbind().click(function(){
        deleteComponentFromUserComponentAndFromView(cellId);
        toggleInnerComponentVisibility(true);
    });

    var type = selectedUserComponent.components[row][col].type;

    if (type == 'label'|| type=='panel'){
        $('.inner-component-options .edit-btn').css({
            display: 'none',
        });
    } else {
        $('.inner-component-options .edit-btn').css({
            display: 'inline-block',
        });
        var tooltipClone = $('#'+cellId).find('.tooltip').clone(true, true);
        $('#inner-component-focus').append(tooltipClone);

        $('.inner-component-options .edit-btn').unbind().on("click", function (e) {
            $('#inner-component-focus').find('.tooltip').addClass('open');
        });
    }

    showConfigOptions(type, 'display-cell');

}

function refreshCellDisplay(cellId, zoom){
    if (cellId == 'display-cell'){
        //var rowcol  = getRowColFromId($('#display-cell').data('cellid'));
        if (!zoom){
            zoom = $('#display-cell').data('display-cell-scale');
        };
    } else {
        //var rowcol  = getRowColFromId(cellId);
        if (!zoom){
            zoom = 1;
        };
        var componentId = $('#'+cellId).data('componentId');
    }

    if (selectedUserComponent.components[componentId]){
        var componentToChange = selectedUserComponent.components[componentId];

        removeDisplay(cellId);
        var padding = componentToChange.padding;
        var properties = componentToChange.properties;

        // display itself gets rid of padding for the #display-cell
        displayNew($('#'+cellId), componentToChange.type, getHTML[componentToChange.type](componentToChange.components[componentToChange.type]));
        // display(cellId, componentToChange.type, getHTML[componentToChange.type](componentToChange.components[componentToChange.type]), zoom, padding, properties);
        //attach event handlers to new texts
        //getContentEditableEditsAtCell(cellId);
        registerTooltipBtnHandlers();
    } else {
        deleteComponentFromView(cellId);
    }

}


function toggleInnerComponentVisibility(showAll){
    if (showAll){
        $('#inner-component-focus #display-cell').html('');
        $('#inner-component-focus').find('.tooltip').remove();
        $('#inner-component-focus').find('.config-btns').remove()

        $('#inner-component-focus #display-cell').removeData();

        $('#inner-component-focus').css('display', 'none');
        $('#outer-container').css('display', 'block');

        $('.inner-component-options').css('display', 'none');
        $('.component-options').css('display', 'block');

        $('#zoom-control').css('display', 'block');
        $('#zoom-nav-container').css('display', 'block');

        $('#style-overall-vs-specific').text('Overall');
        innerComponentFocused = false;


    } else {
        $('#inner-component-focus').css('display', 'block');
        $('#outer-container').css('display', 'none');

        $('.inner-component-options').css('display', 'block');
        $('.component-options').css('display', 'none');

        $('#zoom-control').css('display', 'none');
        $('#zoom-nav-container').css('display', 'none');

        innerComponentFocused = true;

    }
    setUpStyleColors();
}

////http://www.webdesignerdepot.com/2013/03/how-to-create-a-color-picker-with-html5-canvas/
// The color picker
var colorPickerCanvas = document.getElementById('color-picker').getContext('2d');

// create an image object and get it’s source
var img = new Image();
img.src = 'images/colorpicker.png';
//$(img).css({
//    width: '100px',
//    height: 'auto'
//});

// copy the image to the colorPickerCanvas
$(img).load(function(){
    colorPickerCanvas.drawImage(img,0,0);
});

// http://www.javascripter.net/faq/rgbtohex.htm
function rgbToHex(R,G,B) {return toHex(R)+toHex(G)+toHex(B)}
function toHex(n) {
    n = parseInt(n,10);
    if (isNaN(n)) return "00";
    n = Math.max(0,Math.min(n,255));
    return "0123456789ABCDEF".charAt((n-n%16)/16)  + "0123456789ABCDEF".charAt(n%16);
}
$('#color-picker').click(function(event){
    // getting user coordinates
    var x = event.pageX - $(this).offset().left;
    var y = event.pageY - $(this).offset().top;

    // getting image data and RGB values
    var img_data = colorPickerCanvas.getImageData(x, y, 1, 1).data;
    var R = img_data[0];
    var G = img_data[1];
    var B = img_data[2];  var rgb = R + ',' + G + ',' + B;
    // convert RGB to HEX
    var hex = rgbToHex(R,G,B);
    // making the color the value of the input
    //$('#rgb input').val(rgb).css({
    //    'background-color': '#' + hex,
    //});
    //$('#hex input').val('#' + hex).css({
    //    'background-color': '#' + hex,
    //});

    if (whoseColorToChange == 'text'){
        $('#pick-color-text-input').val('#' + hex).css({
            'background-color': '#' + hex,
        });
    } else if (whoseColorToChange == 'bg'){
        $('#pick-color-bg-input').val('#' + hex).css({
            'background-color': '#' + hex,
        });
    }


    $('#color-picker-container').hide();
});

var whoseColorToChange = '';

$('.pick-color').click(function(){
    if (this.id == 'pick-color-text'){
        whoseColorToChange = 'text';
    } else if (this.id == 'pick-color-bg'){
        whoseColorToChange = 'bg';
    }
    $('#color-picker-container').show();
});

$('#color-picker-dismiss').click(function(){
    $('#color-picker-container').hide();
});

$('.set-color').click(function(){
    if (this.id == 'set-color-text'){
        whoseColorToChange = 'text';
    } else if (this.id == 'set-color-bg'){
        whoseColorToChange = 'bg';
    }

    if (innerComponentFocused){
        var rowcol = getRowColFromId($('#display-cell').data('cellid'));
        var row = rowcol.row;
        var col = rowcol.col;
        if (whoseColorToChange == 'text'){
            var color = $('#pick-color-text-input').val();
            if (color == ''){
                return;
            }
            $('#pick-color-text-input').css({
                'background-color': color,
            });


            $('#cell'+'_'+row+'_'+col+' .display-component').css({
                color: color,
            });

            var innerComponent = selectedUserComponent.components[row][col];
            if (!innerComponent.properties.custom){
                innerComponent.properties.custom = {};
            }
            innerComponent.properties.custom['color'] = color;
        } else if (whoseColorToChange == 'bg'){
            var color = $('#pick-color-bg-input').val();
            if (color == ''){
                return;
            }
            $('#pick-color-bg-input').css({
                'background-color': color,
            });
            $('#cell'+'_'+row+'_'+col+' .display-component').css({
                'background-color': color,
            });
            var innerComponent = selectedUserComponent.components[row][col];
            if (!innerComponent.properties.custom){
                innerComponent.properties.custom = {};
            }
            innerComponent.properties.custom['background-color'] = color;
        }
        refreshCellDisplay('display-cell');
    } else {
        if (whoseColorToChange == 'text'){
            var color = $('#pick-color-text-input').val();
            if (color == ''){
                return;
            }
            $('#pick-color-text-input').css({
                'background-color': color,
            });
            $('.display-component').css({
                color: color,
            });

            if (!selectedUserComponent.layout.overallStyles){
                selectedUserComponent.layout.overallStyles = {}
            };

            selectedUserComponent.layout.overallStyles['color'] = color;

            for (var row = 1; row<=numRows; row++){
                for (var col = 1; col<=numCols; col++){
                    if (selectedUserComponent.components[row]){
                        if (selectedUserComponent.components[row][col]){
                            var innerComponent = selectedUserComponent.components[row][col];
                            if (!innerComponent.properties.custom){
                                innerComponent.properties.custom = {};
                            }
                            innerComponent.properties.custom['color'] = color;
                        }
                    }
                }
            }
        } else if (whoseColorToChange == 'bg'){
            var color = $('#pick-color-bg-input').val();
            if (color == ''){
                return;
            }
            $('#pick-color-bg-input').css({
                'background-color': color,
            });
            $('#main-cell-table').css({
                'background-color': color,
            });

            if (!selectedUserComponent.layout.overallStyles){
                selectedUserComponent.layout.overallStyles = {}
            };
            selectedUserComponent.layout.overallStyles['background-color'] = color;

            for (var row = 1; row<=numRows; row++){
                for (var col = 1; col<=numCols; col++){
                    if (selectedUserComponent.components[row]){
                        if (selectedUserComponent.components[row][col]){
                            var innerComponent = selectedUserComponent.components[row][col];
                            if (!innerComponent.properties.custom){
                                innerComponent.properties.custom = {};
                            }
                            innerComponent.properties.custom['background-color'] = color;
                        }
                    }
                }
            }
        }
    }

});

$('.remove-color').click(function(){
    if (this.id == 'remove-color-text'){
        whoseColorToChange = 'text';
    } else if (this.id == 'remove-color-bg'){
        whoseColorToChange = 'bg';
    }

    if (innerComponentFocused){
        var rowcol = getRowColFromId($('#display-cell').data('cellid'));
        var row = rowcol.row;
        var col = rowcol.col;
        if (whoseColorToChange == 'text'){
            $('#pick-color-text-input').val('').css({
                'background-color': ''
            });

            $('#cell'+'_'+row+'_'+col+' .display-component').css({
                color: '',
            });
            var innerComponent = selectedUserComponent.components[row][col];
            if (!innerComponent.properties.custom){
                innerComponent.properties.custom = {};
            }
            if (innerComponent.properties.custom['color']){
                delete innerComponent.properties.custom['color'];
            }
        } else if (whoseColorToChange == 'bg'){
            $('#pick-color-bg-input').val('').css({
                'background-color': ''
            });
            $('#cell'+'_'+row+'_'+col+' .display-component').css({
                'background-color': '',
            });
            var innerComponent = selectedUserComponent.components[row][col];
            if (!innerComponent.properties.custom){
                innerComponent.properties.custom = {};
            }
            if (innerComponent.properties.custom['background-color']){
                delete innerComponent.properties.custom['background-color'];
            }
        }
        refreshCellDisplay('display-cell');
    } else {
        if (whoseColorToChange == 'text'){
            $('#pick-color-text-input').val('').css({
                'background-color': ''
            });
            $('.display-component').css({
                color: '',
            });

            if (selectedUserComponent.layout.overallStyles){
                if (selectedUserComponent.layout.overallStyles['color']){
                    delete selectedUserComponent.layout.overallStyles['color'];
                }
            }
            for (var row = 1; row<=numRows; row++){
                for (var col = 1; col<=numCols; col++){
                    if (selectedUserComponent.components[row]){
                        if (selectedUserComponent.components[row][col]){
                            var innerComponent = selectedUserComponent.components[row][col];
                            if (!innerComponent.properties.custom){
                                innerComponent.properties.custom = {};
                            }
                            if (innerComponent.properties.custom['color']){
                                delete innerComponent.properties.custom['color'];
                            }
                        }
                    }
                }
            }
        } else if (whoseColorToChange == 'bg'){
            $('#pick-color-bg-input').val('').css({
                'background-color': ''
            });
            $('#main-cell-table').css({
                'background-color': '',
            });

            if (selectedUserComponent.layout.overallStyles){
                if (selectedUserComponent.layout.overallStyles['background-color']){
                    delete selectedUserComponent.layout.overallStyles['background-color'];
                }
            }

            for (var row = 1; row<=numRows; row++){
                for (var col = 1; col<=numCols; col++){
                    if (selectedUserComponent.components[row]){
                        if (selectedUserComponent.components[row][col]){
                            var innerComponent = selectedUserComponent.components[row][col];
                            if (!innerComponent.properties.custom){
                                innerComponent.properties.custom = {};
                            }
                            if (innerComponent.properties.custom['background-color']){
                                delete innerComponent.properties.custom['background-color'];
                            }
                        }
                    }
                }
            }
        }
    }

});

function setUpStyleColors(){
    if (innerComponentFocused) {
        var rowcol = getRowColFromId($('#display-cell').data('cellid'));
        var row = rowcol.row;
        var col = rowcol.col;
        var customStyles = selectedUserComponent.components[row][col].properties.custom;
        var textColor = customStyles['color'] || '';
        $('#pick-color-text-input').val(textColor).css({
            'background-color': textColor
        });
        var bgColor = customStyles['background-color'] || '';
        $('#pick-color-bg-input').val(bgColor).css({
            'background-color': bgColor
        });

    } else {
        if (selectedUserComponent.layout.overallStyles){
            var overallStyles = selectedUserComponent.layout.overallStyles;
            var textColor = overallStyles['color'] || '';
            $('#pick-color-text-input').val(textColor).css({
                'background-color': textColor
            });
            var bgColor = overallStyles['background-color'] || '';
            $('#pick-color-bg-input').val(bgColor).css({
                'background-color': bgColor
            });
        } else {
            $('#pick-color-text-input').val('').css({
                'background-color': ''
            });
            $('#pick-color-bg-input').val('').css({
                'background-color': ''
            });
        }
    }
}