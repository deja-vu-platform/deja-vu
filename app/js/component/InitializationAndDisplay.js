// This file mostly has the initialization and functions that help with
// the display and interaction handling


var projectsSavePath = path.join(__dirname, 'projects');
var addedCliches;


/** ** ** ** ** ** Initialization ** ** ** ** ** **/
$(function () {
    // fix some views
    $('.project-options-container').css({
        height: ($('html').height() - 70) + 'px',
    });

    $('#outer-container').css({
        height: ($('html').height() - 70 - 44) + 'px',
    });

    $('#inner-component-focus').css({
        height: ($('html').height() - 70 - 44) + 'px',
    });


    resizeViewportToFitWindow();


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

        makeUserEmptyComponentDisplayTable(selectedUserComponent.meta.id);
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
            loadTable(selectedUserComponent);
        }, 1);
        //loadTable(selectedUserComponent);

    }

    //autoSave5Mins();

    basicComponents = $('#basic-components').html();

    registerDroppable();

    registerDraggable();

    registerZoom();

    registerUserComponentAreaDroppable();

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
        makeUserEmptyComponentDisplayTable(selectedUserComponent.meta.id);
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
        selectedProject.addComponent(selectedUserComponent);
        selectedProject.mainComponents[selectedUserComponent.meta.id] = selectedUserComponent.meta.name;
        displayMainPageInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);

        makeUserEmptyComponentDisplayTable(selectedUserComponent.meta.id);
        resetMenuOptions();
    });
});


//$('#create-component').on('click', function () {
//    numRows = $('#select-rows').val();
//    numCols = $('#select-cols').val();
//    selectedUserComponent = initUserComponent(false);
//    selectedProject.addComponent(selectedUserComponent);
//    displayUserComponentInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);
//    createTable(selectedUserComponent.meta.id);
//    resetMenuOptions();
//});

$('#load-component-btn').on('click', function () {
    selectedUserComponent = UserComponent.fromString($('#component-json').val());
    selectedProject.addComponent(selectedUserComponent);
    loadTable(selectedUserComponent);
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
    //$('.loader-container').fadeIn('fast');


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
            loadTable(selectedUserComponent);
        } else {
            toggleOneAllInnerComponentVisibility(true);
            enableSpecificComponentDomElements(selectedUserComponent.meta.id);
        }
        //$('.loader-container').fadeOut('fast');
    };

    // have this going in a separate thread
    window.setTimeout(load(this), 2000);
});

$('.components').on('dblclick', '.component-name', function () {
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
        // //update the display of the component box
        //$('<style>.main-table::after{content:"' + $(this).val() + '"}</style>').appendTo('head');

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
            //// update the display of the component box
            //$('<style>.main-table::after{content:"' + $(this).val() + '"}</style>').appendTo('head');

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
            loadTable(selectedUserComponent);

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

/** ** ** ** ** ** Component Adding to Project and Display helpers ** ** ** ** ** ** ** ** ** **/

function resizeViewportToFitWindow(){
    var windowWidth = $('html').width();
    var newWidth = Math.max(860, windowWidth);
    $('#outer-container').css({
        width: (newWidth-250-17) + 'px',
    });

    $('.component-options').css({
        width: (newWidth-250-17) + 'px',
    });

    $('#inner-component-focus').css({
        width: (newWidth-250-17) + 'px',
    });

    $('.inner-component-options').css({
        width: (newWidth-250-17) + 'px',
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

        showConfigOptions(type, document.getElementById(cellId));

        if (type === 'label') {
            Display(cellId, getHTML[type]("Type text here..."));
        } else if (type === 'panel') {
            Display(cellId, getHTML[type]({heading: "Type heading...", content: "Type content..."}));
        } else {
            Display(cellId, getHTML[type]());
            triggerEdit(cellId, true); // since this is a new component, show edit options
        }

    } else {// a component is there
        type = component.type;

        showConfigOptions(type, document.getElementById(cellId));

        if (!widget) {
            $($('.draggable[name=' + type + ']').get(0)).clone().appendTo($('#' + cellId).get(0))
        }
        // display requires widget to be placed before display happens
        Display(cellId, getHTML[type](component.components[type]));

        triggerEdit(cellId, false); // no need to show edit options

    }

    $('#' + cellId).addClass("dropped");
    $('#' + cellId).removeClass("droppable");
    $('#' + cellId).droppable('disable');
    registerDraggable();

    if (!selectedUserComponent.components.hasOwnProperty(row)) {
        selectedUserComponent.components[row] = {};
    }
    selectedUserComponent.components[row][col] = component;

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
            var cell = $('#cell' + '_' + row + '_' + col).get(0);

            $(cell).find('.config-btns').remove();
            $(cell).find('.tooltip').remove();
            $(cell).find('.label-container').remove();
            $(cell).find('.display-component').remove();
            $(cell).find('.widget').remove();

            resetDroppabilityAt(cellId);
            updateBitmap(false);

        }
    }

}

/**
 * Updates the contents of a base component info at a particular cell based on inputs
 * @param cellId
 */
function updateBaseComponentContentsAndDisplayAt(cellId) {
    var rowcol = getRowColFromId(cellId);
    var row = rowcol.row;
    var col = rowcol.col;

    var type = $('#' + cellId).get(0).getElementsByClassName('draggable')[0].getAttribute('name');
    var value;
    var isUpload = false;
    var inputs = Array.prototype.slice.call(
        $('#' + cellId).get(0).getElementsByTagName('input'), 0);

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
                    RemoveDisplay(cellId);
                    value.img_src = savedFile.url();
                    Display(cellId, getHTML[type](value));
                    selectedUserComponent.components[row][col].components[type] = value;
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
        $('#' + cellId).find('.label-container').remove();
        $('#' + cellId).find('.display-component').remove();
        Display(cellId, getHTML[type](value), function () {
        });
        selectedUserComponent.components[row][col].components = {};
        selectedUserComponent.components[row][col].components[type] = value;
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
    var x = [].slice.call(document.styleSheets[2].cssRules)
    x = x.concat([].slice.call(document.styleSheets[3].cssRules));
    return x.filter(function (rule) {
        return rule.selectorText === search;
    })[0];
}

function resizeLabelDivs(cellWidth, cellHeight) {
    getCSSRule('.label-container').style.setProperty('width', (cellWidth - 10) + 'px', null);
    getCSSRule('.label-container').style.setProperty('height', (cellHeight - 30) + 'px', null);
    getCSSRule('.label-container').style.setProperty('padding-top', (cellHeight / 4) + 'px', null);
}



/** ** ** ** ** ** ** ** ** Table Cells Interaction and Display Helpers ** ** ** ** ** ** ** ** **/
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
                var droppedComponent =$('#'+cellId).children().last().attr('name').toLowerCase();
                showConfigOptions(droppedComponent, document.getElementById(cellId));
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

            $('#basic-components').html(basicComponents);

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


function registerDroppable() {
    $('.droppable').each(function(){
        if (!$(this).hasClass('page-component-toggle-drop')){
            $(this).droppable(cellTrashDroppableSettings());
        }
    });
}

function registerDraggable() {

    $('.widget').each(function() {
        $(this).draggable({
            opacity: 1,
            revert: "invalid",
            cursorAt: { top: 0, left: 0 },
            helper: function(){
                $('#table-container').append('<div id="clone" class="widget">' + $(this).html() + '</div>');
                //Hack to append the widget to the html (visible above others divs), but still belonging to the scrollable container
                $("#clone").hide();
                setTimeout(function(){$('#clone').appendTo('html'); $("#clone").show();},1);
                return $("#clone");
            },
            appendTo: 'html',
            cursor: '-webkit-grabbing',
            scroll: true,
            //start: function(e, ui){
            //    dragZoomFixes(this, '#outer-container').start(e, ui);
            //},
            //drag: function(e, ui){
            //    dragZoomFixes(this, '#outer-container').drag(e, ui);
            //},
            drag: function(e, ui){
                    ui.position.top = e.pageY;
                    ui.position.left = e.pageX;
                },
        });
    });

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
};

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
};

/**
 * Scales the table, based on the saved sizes, scaled to the zoom factor. If the saved sizes are changed beforhand,
 * this function can be used to resize the table
 */
function scaleTableToZoom(){
    $('.grid').each(function(){
        var rowcol = getRowColFromId(this.id);
        var actualHeight = selectedUserComponent.layout[rowcol.row][rowcol.col].ratio.grid.height * selectedUserComponent.layout.tablePxDimensions.height ;
        var actualWidth = selectedUserComponent.layout[rowcol.row][rowcol.col].ratio.grid.width * selectedUserComponent.layout.tablePxDimensions.width;
        $(this).css({
            height: (actualHeight)*currentZoom + 'px',
            width: (actualWidth)*currentZoom + 'px',
        })
    });

    gridWidth = selectedUserComponent.layout.tablePxDimensions.width * currentZoom;
    gridHeight = selectedUserComponent.layout.tablePxDimensions.height * currentZoom;

    propagateCellResizeToOtherElts();

}

function changeZoom(isFit){
    if (!isFit){
        // TODO make this better
        var zoom = getZoomFromSliderVal();
        $('#zoom-control-value').text(Math.round(zoom*100)+'%');
        currentZoom = zoom;

    } else {
        var zoomHeight = ($('#outer-container').height()-(20+100+70+17))/selectedUserComponent.layout.tablePxDimensions.height; // take into account padding and stuff
        var zoomWidth = ($('#outer-container').width()-(20+100+40+17))/selectedUserComponent.layout.tablePxDimensions.width;
        currentZoom = Math.min(zoomWidth, zoomHeight);

        $('#zoom-control-value').text(Math.round(currentZoom*100)+'%');
        var sliderVal = getSliderValFromZoom(currentZoom);
        $('#zoom-slider').val(sliderVal);
    }
    var state = $('#table-grid-container'+'_'+selectedUserComponent.meta.id).data('state');
    state.zoom = currentZoom;
    $('#table-grid-container'+'_'+selectedUserComponent.meta.id).data('state', state);

    scaleTableToZoom();
};



function registerZoom() {
    $('#zoom-control-value').text('100%');

    //$('#zoom-slider').slider({
    //    max: 300,
    //    min: -300,
    //    value:0,
    //    slide: function(e, ui){
    //
    //    },
    //    stop: changeZoom,
    //
    //});



    $('#zoom-in').click( function (e) {
        e.preventDefault();
        var val = parseFloat($('#zoom-slider').val());
        //var val = $( "#zoom-slider" ).slider( "option", "value" );
        $('#zoom-slider').val(Math.round(val/100)*100+100);
        //$( "#zoom-slider" ).slider( "option", "value", val+100);
        changeZoom(false);
    });
    $('#zoom-out').click( function (e) {
        e.preventDefault();
        var val = parseFloat($('#zoom-slider').val());
        //var val = $( "#zoom-slider" ).slider( "option", "value" );
        $('#zoom-slider').val(Math.round(val/100)*100-100);
        //$( "#zoom-slider" ).slider( "option", "value", val-100);
        changeZoom(false);
    });


    $('#zoom-slider').on('input', function(){
        var potentialZoom = getZoomFromSliderVal();
        $('#zoom-control-value').text(Math.round(potentialZoom*100)+'%');
    });

    $('#zoom-slider').on('change', function(){
        changeZoom(false);
    });

    $('#zoom-actual').click(function(e, ui){
        e.preventDefault();
        $('#zoom-slider').val(0);
        //$( "#zoom-slider" ).slider( "option", "value", 0);
        changeZoom(false);
    });

    $('#zoom-fit').click(function(e, ui){
        e.preventDefault();
        changeZoom(true);
    });
}

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

            var componentCopy = selectedUserComponent.components[delRow][delCol];
            selectedUserComponent.addComponent(componentCopy, newRow, newCol);

            Display('cell'+ '_' + newRow + '_' + newCol, getHTML[componentCopy.type](componentCopy.components[componentCopy.type]));
            triggerEdit('cell'+ '_' + newRow + '_' + newCol, false);

        }

        deleteComponentFromUserComponentAndFromView("cell"+ '_' + delRow + '_' + delCol);
        return true;
    }
    return false;
}

/**
 * Register listener for click on edit button
 * @param cellId
 */
function triggerEdit(cellId, popup) {
    var droppedComponent =$('#'+cellId).children().last().attr('name').toLowerCase();

    var editDialogTemplate = $('#'+droppedComponent+'-popup-holder').html();

    var sp = document.createElement('span');
    sp.innerHTML = editDialogTemplate;
    var editDialog = sp.firstElementChild;

    var cell = document.getElementById(cellId);
    cell.insertBefore(editDialog, cell.firstChild);

    $(Array.prototype.slice.call(
        $('#'+cellId).get(0).getElementsByClassName('form-control'), 0)[0]).trigger("focus");
    if (popup){
        setTimeout(function(){
            $($('#'+cellId).children().first()).addClass('open');
        }, 1);
    }

}

function showConfigOptions(droppedComponentType, cell) {
    // Hide edit button if label or panel
    if (droppedComponentType==='label' || droppedComponentType==='panel') {
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

    cell.insertBefore(configDiv, cell.firstChild);
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
            var bootstrapClass = bootstrapPrefix+"-"+optionsList[index];
            element.addClass(bootstrapClass);

            for (var j=0; j<optionsList.length; j++) {
                if (j!==index) {
                    element.removeClass(bootstrapPrefix+'-'+optionsList[j]);
                }
            }

            var rowcol = getRowColFromId(cellId);
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

    getEdits();

    var dropzones = document.getElementsByClassName("upload-drop-zone");
    for (var i=0; i<dropzones.length; i++) {
        dropzones[i].addEventListener("dragover", FileDragHover, false);
        dropzones[i].addEventListener("dragleave", FileDragHover, false);
        dropzones[i].addEventListener("drop", FileSelectHandler, false);
    }
}

function findContainingCell(context) {
    var parent = $(context).parent();
    var tagName = parent.get(0).tagName;
    while (tagName !== 'TD') {
        parent = $(parent).parent();
        tagName = parent.get(0).tagName;
    }
    var cellId = $(parent).attr('id');
    return cellId;
}

function getEdits() {
    $('[contenteditable=true]').blur(function() {
        var cellId = findContainingCell(this);
        updateBaseComponentContentsAndDisplayAt(cellId);
        getEdits();
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
 * Display name of uploaded image
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
        //$(this).parent().parent().find('.dropdown-target').css({ //TODO make less hacky
        //    display: 'none',
        //})

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
        //$(this).parent().parent().find('.dropdown-target').css({
        //    display: 'block',
        //})

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
    //loadTableWithLocksSaved(selectedUserComponent);
});


$('#reset-height-ratios').click(function(){
    var heightRatio = 1/numRows;
    for (var row = 1; row <= numRows; row++){
        for (var col = 1; col<= numCols; col++){
            selectedUserComponent.layout[row][col].ratio.grid.height = heightRatio;
        }
    }
    scaleTableToZoom();
    //loadTableWithLocksSaved(selectedUserComponent);
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

// TODO add a resize to fixed px sizes function


$('#resize-table').click(function(){
    var newWidth = parseInt($('#resize-table-width').find('input').val());
    var newHeight = parseInt($('#resize-table-height').find('input').val());
    if (isNaN(newWidth)|| isNaN(newHeight)){
       return;
    }
    selectedUserComponent.layout.tablePxDimensions.width = newWidth;
    selectedUserComponent.layout.tablePxDimensions.height = newHeight;

    //gridWidth = newWidth*currentZoom;
    //gridHeight = newHeight*currentZoom;
    scaleTableToZoom();
    //loadTableWithLocksSaved(selectedUserComponent);

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
    var cellToShow = $('#cell'+'_'+rowcol.row+'_'+rowcol.col).clone(true,true);

    $('#inner-component-focus').html('').append(cellToShow);
    toggleOneAllInnerComponentVisibility(false);
    setUpInnerComponentOptions();
});

function setUpInnerComponentOptions(){
    $('.back-to-all-components').unbind().click(function(){
        toggleOneAllInnerComponentVisibility(true);
    });
}

function toggleOneAllInnerComponentVisibility(showAll){
    if (showAll){
        $('#inner-component-focus').html('').css('display', 'none');
        $('#outer-container').css('display', 'block');

        $('.inner-component-options').css('display', 'none');
        $('.component-options').css('display', 'block');

    } else {
        $('#inner-component-focus').css('display', 'block');
        $('#outer-container').css('display', 'none');

        $('.inner-component-options').css('display', 'block');
        $('.component-options').css('display', 'none');

    }
}