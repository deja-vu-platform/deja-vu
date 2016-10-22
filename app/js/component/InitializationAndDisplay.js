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

    if (selectedProject.numComponents == 0){
        // start a default component
        selectedUserComponent = initUserComponent(true, true);
        selectedProject.addMainPage(selectedUserComponent);

        loadComponent(selectedUserComponent, currentZoom);
        displayMainPageInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);
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
            loadComponent(selectedUserComponent, currentZoom);
        }, 1);

    }


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
        selectedUserComponent = initUserComponent(false, false);
        selectedProject.addComponent(selectedUserComponent);
        displayUserComponentInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);
        setUpEmptyWorkSurface(selectedUserComponent, 1);
        resetMenuOptions();
    });
});

$('#new-main-component-btn').click(function(){
    $('#create-component').unbind();
    $('#create-component').on('click', function () {
        numRows = $('#select-rows').val();
        numCols = $('#select-cols').val();
        selectedUserComponent = initUserComponent(false, true);
        selectedProject.addMainPage(selectedUserComponent);
        displayMainPageInListAndSelect(selectedUserComponent.meta.name, selectedUserComponent.meta.id);

        setUpEmptyWorkSurface(selectedUserComponent, 1)

        resetMenuOptions();
    });
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
                        };
        $('#work-surface'+'_'+selectedUserComponent.meta.id).data('state', oldState);

        var componentId = $(componentNameContainer).parent().data('componentid');
        $('.selected').removeClass('selected');
        $(componentNameContainer).parent().addClass('selected');
        selectedUserComponent = selectedProject.components[componentId];
        loadComponent(selectedUserComponent);
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
        componentNameElt.text(newName);
        $('.component-options .component-name').text(newName);

        selectedProject.components[componentId].meta.name = newName;
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
                selectedProject.addMainPage(copyComponent);
                displayMainPageInListAndSelect(copyComponent.meta.name, copyComponent.meta.id);
            } else {
                displayUserComponentInListAndSelect(copyComponent.meta.name, copyComponent.meta.id);
            }

            selectedProject.addComponent(copyComponent);
            selectedUserComponent = copyComponent;
            loadComponent(selectedUserComponent, currentZoom);

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

function deleteComponentFromView(containerId) {
    var cell = $('#'+containerId);
    cell.remove();
}


/**
 * Updates the contents of a base component info at a particular cell based on inputs
 * @param cellId
 */
function updateBaseComponentContentsAndDisplayAt(containerId) {
    // NOTE: actual cell is the cell in the main table
    // cellId could be either display-cell or the actual cell id, but it is the one
    // that contains text edits
    // tooltip is the tooltip currently being edited

    var container = $('#'+containerId);
    var tooltip = container.find('.tooltip');
    var componentId = container.data('componentId');

    var type = container.find('.draggable').attr('name');
    var value;
    var isUpload = false;

    if (tooltip.length>0){
        var inputs = Array.prototype.slice.call(
            tooltip.get(0).getElementsByTagName('input'), 0);
    } // TODO // else it is label and is handled

    if (type === 'label') {
        value = container.find('p')[0].textContent;
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
                    refreshContainerDisplay(container.attr('id'), currentZoom);
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
        selectedUserComponent.components[componentId].components = {};
        selectedUserComponent.components[componentId].components[type] = value;

        refreshContainerDisplay(container.attr('id'), currentZoom);
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

function setUpGrid(){
    $('.grid').remove();
    var workSurface = $('#work-surface_'+selectedUserComponent.meta.id);

    var grid = {x: {}, y:{}};
    for (var componentId in selectedUserComponent.components){
        // existing components should also be in the work surface!
        var container = $('#component-container_'+componentId);
        var top = container.position().top;
        var left = container.position().left;
        var right = left + container.width();
        var bottom = top + container.height();
        grid.x[left] = '';
        grid.x[right] = '';
        grid.y[top] = '';
        grid.y[bottom] = '';
    }
    var xs = Object.keys(grid.x).map(function(key){
        return parseFloat(key);
    });

    // var top = workSurface.offset().top;
    var top = 0;
    var bottom = top + workSurface.height();
    // var left = workSurface.offset().left;
    var left = 0;
    var right = left + workSurface.width();

    xs.push(left);
    xs.push(right);
    xs.sort(function(a, b){
        return a-b;
    });

    var ys = Object.keys(grid.y).map(function(key){
        return parseFloat(key);
    });
    ys.push(top);
    ys.push(bottom);
    ys.sort(function(a, b){
        return a-b;
    });

    var numRows = ys.length-1;
    var numCols = xs.length-1;

    var gridElt = $('<div></div>');
    gridElt.addClass('grid');
    for (var col=0; col<numCols; col++){
        var colElt = $('<div></div>');
        colElt.addClass('grid-col');
        gridElt.append(colElt);

        for (var row=0; row<numRows; row++){
            var cellElt = $('<div></div>');
            cellElt.addClass('grid-cell');
            cellElt.attr('id', 'grid-cell_'+row+'_'+col);
            colElt.append(cellElt);
            cellElt.css({
                width: xs[col+1] - xs[col],
                height: ys[row+1] - ys[row],
            });
        }
    }
    gridElt.css({
        position: 'absolute',
        // top: ys[0] - workSurface.offset().top,
        // left: xs[0] - workSurface.offset().left,
        top: 0,
        left: 0,
        width: 1.1*(xs[numCols] - xs[0]),
        visibility: 'hidden',
    });
    workSurface.append(gridElt);
    // $('body').append(gridElt);
    $('.grid-col').css({
        display: 'inline-block'
    });
    $('.grid-cell').css({
        display: 'block',
        border: '1px dashed grey'
    });
};



function registerDraggable(widgetToRegister) {

    var draggableOptions = {
        opacity: 1,
        revert: "invalid",
        cursorAt: { top: 0, left: 0 },
        helper: function(e, ui){
            var widget = $(this);
            var offsetFromMouse = { top: 0, left: 0 };
            if (widget.hasClass('associated')){
                var componentId = widget.data('componentId');
                draggingComponent = selectedUserComponent.components[componentId];
                // keep the old one for now, for guidance and all
                var componentContainerOld = $('#component-container_'+componentId);
                componentContainerOld.css({
                    opacity: .3,
                });
                var componentContainer = componentContainerOld.clone();
                offsetFromMouse = {
                    top: e.pageY - componentContainerOld.offset().top,
                    left: e.pageX - componentContainerOld.offset().left
                };


            } else {
                var type = $(this).attr('name');
                var component = BaseComponent(type, {}, getDimensions(type));
                draggingComponent = component;

                var componentContainer = createComponentContainer(component, currentZoom);
                setUpContainer(componentContainer, widget, component, currentZoom);
                $('#basic-components').html(basicComponents);
                registerDraggable();
            }

            $('#outer-container').append(componentContainer);
            $(this).draggable( "option", "cursorAt", offsetFromMouse );

            //Hack to append the widget to the html (visible above others divs), but still belonging to the scrollable container
            // componentContainer.hide();
            // setTimeout(function(){
            //     componentContainer.appendTo('html');
            //     componentContainer.show();
            // },1);
            componentContainer.attr('id', 'dragging-container');
            componentContainer.css('position', 'absolute');

            return componentContainer;

        },
        appendTo: 'html',
        cursor: '-webkit-grabbing',
        scroll: true,
        snap: '.grid-cell',
        snapTolerance: 10,
        start: function(){
            $('.grid').css({
                visibility: 'visible'
            });
        },
        drag: function(event, ui){

        },
        stop: function(event, ui){
            $('.grid').css({
                visibility: 'hidden'
            });

            var componentId = draggingComponent.meta.id;
            var isNewComponent = $(ui.helper).data('newcomponent');
            if (!isNewComponent){
                var componentContainerOld = $('#component-container_'+componentId);
                if (!$(ui.helper).data('dropped')){// not properly dropped!
                    componentContainerOld.css({
                        opacity: 1,
                    });
                } else { // properly dropped
                    componentContainerOld.remove();
                }
            }

        }
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

/** ** ** ** ** ** ** ** ** ** ** ** ** ZOOM ** ** ** ** ** ** ** ** ** ** ** ** **/

function getSliderValFromZoom(zoom){
    var max = parseFloat($('#zoom-slider').get(0).max);
    var min = parseFloat($('#zoom-slider').get(0).min);

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


function changeZoomViaZoomControl(type) {
    if (type == 'slider') {
        // TODO make this better
        var zoom = getZoomFromSliderVal();
        $('#zoom-control-value').text(Math.round(zoom * 100) + '%');
        currentZoom = zoom;
    } else if (type == 'fit') {
        var zoomHeight = $('#outer-container').height() / selectedUserComponent.dimensions.height;
        var zoomWidth = $('#outer-container').width() / selectedUserComponent.dimensions.width;
        currentZoom = Math.min(zoomWidth, zoomHeight);
    } else if (type == 'full'){
        var widthScale = ($('#outer-container').width())/selectedScreenSizeWidth;
        var heightScale = ($('#outer-container').height())/selectedScreenSizeHeight;
        currentZoom = Math.min(widthScale, heightScale);
    } else if (type == 'actual'){
        $('#zoom-slider').val(0);
        changeZoomViaZoomControl('slider');
    } else {
    //    Do nothing
    }
    changeZoomDisplays(currentZoom);

    // update the state
    var workSurface = $('#work-surface'+'_'+selectedUserComponent.meta.id);
    var state = workSurface.data('state');
    if (!state){
        state = {zoom: 1}
    }
    state.zoom = currentZoom;
    workSurface.data('state', state);

    propagateRatioChangeToAllElts(currentZoom);
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
    $('.work-surface').css({
        width: selectedUserComponent.dimensions.width*zoom + 'px',
        height: selectedUserComponent.dimensions.height*zoom + 'px',
    });

    updateNavComponentSizeZoom(zoom);
}

function updateNavComponentSize(zoom){
    setUpNavComponentSize();
    updateNavComponentSizeZoom(zoom);
}

function updateNavComponentSizeZoom(zoom){
    $('#zoom-nav-component-size').css({
        zoom: zoom,
    });
}

function setUpNavComponentSize(){
    $('#zoom-nav-component-size').html('').css({
        width: selectedUserComponent.dimensions.width*navZoom + 'px',
        height: selectedUserComponent.dimensions.height*navZoom + 'px',
    });

    Object.keys(selectedUserComponent.components).forEach(function(innerComponentId){
        var innerComponent = selectedUserComponent.components[innerComponentId];
        var componentSizeDiv = $('<div></div>');
        componentSizeDiv.addClass('zoom-nav-inner-component-size');
        componentSizeDiv.css({
            position: 'absolute',
            left: selectedUserComponent.layout[innerComponentId].left*navZoom,
            top: selectedUserComponent.layout[innerComponentId].top*navZoom,
            width: innerComponent.dimensions.width*navZoom,
            height: innerComponent.dimensions.height*navZoom,
            background: 'black'
        });

        $('#zoom-nav-component-size').append(componentSizeDiv);
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
        changeZoomViaZoomControl('actual');

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

    setUpNavComponentSize();
    $('#zoom-selected-screen-size').css({
        position: 'absolute',
        // height: $('#selected-screen-size').height()*scale*currentZoom + 'px',
        // width: $('#selected-screen-size').width()*scale*currentZoom + 'px',
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

function showConfigOptions(droppedComponentType, container) {
    // Hide edit button if label or panel
    if (droppedComponentType=='label' || droppedComponentType=='panel') {
        container.find('.edit-btn').css('display', 'none');
    } else {
        container.find('.edit-btn').css('display', 'block');
    }

    var configOptions = $('#'+droppedComponentType+'-properties').clone();
    if (configOptions.length==0) {
        return;
    }

    container.prepend(configOptions);
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
            var componentId = getComponentIdFromContainerId(cellId);
            selectedUserComponent.components[componentId].properties[propertyName] = bootstrapClass;

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


// TODO needs to be updated to use more relevant classes
function findContainingCell(context) {
    var parent = $(context).parent();

    while (!(parent.hasClass('component-container'))) {
        parent = $(parent).parent();
        if (parent.length == 0){ // TODO this is a check to see if anything went awry
            console.log('something went wrong');
            console.log(context);
            return null
        }
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
 */
function getContentEditableEdits() {
    $('[contenteditable=true]').unbind() // unbind to prevent this from firing multiple times
        .blur(function() {
        var cellId = findContainingCell(this);
        updateBaseComponentContentsAndDisplayAt(cellId);
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
                    selectedProject.addMainPage(selectedProject.components[userComponentId]);
                    $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();
                    displayMainPageInListAndSelect(name, userComponentId);
                }
            } else if ($(this).hasClass('user-components')){
                if (ui.draggable.hasClass('moving-main-component')){ // if type user
                    // removing from main page
                    selectedProject.removeMainPage(selectedProject.components[userComponentId]);
                    $("#main-pages-list").find("[data-componentid='" + userComponentId + "']").remove();
                    displayUserComponentInListAndSelect(name, userComponentId);

                }
            }
        },
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


// TODO probably can be reused
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


function refreshContainerDisplay(cellId, zoom){
    if (!zoom){
        zoom = 1;
    }
    var componentId = $('#'+cellId).data('componentId');

    if (selectedUserComponent.components[componentId]){
        var componentToChange = selectedUserComponent.components[componentId];

        removeDisplay(cellId);
        var properties = componentToChange.properties;

        // display itself gets rid of padding for the #display-cell
        display($('#'+cellId), componentToChange.type, getHTML[componentToChange.type](componentToChange.components[componentToChange.type]), zoom);
        //attach event handlers to new texts
        registerTooltipBtnHandlers();
    } else {
        deleteComponentFromView(cellId);
    }

}


// TODO this needs to be revamped entirely

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
        refreshContainerDisplay('display-cell');
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
        refreshContainerDisplay('display-cell');
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