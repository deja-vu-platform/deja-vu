/**
 * Created by Shinjini on 11/3/2016.
 */

/** ** ** ** ** ** Menu Event Handlers ** ** ** ** ** **/
// TODO on user component name input check for special chars




$('#save-project').on('click', function () {
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
    saveObjectToFile(projectsSavePath, projectNameToFilename(selectedProject.meta.name), selectedProject);
    //downloadObject(selectedProject.meta.name+'.json', selectedProject);
});

$('.components').on('click', '.component-name-container', function () {
    // Save the current values
    var oldState = {zoom : currentZoom};
    var workSurfaceRef = dataWorkSurface.getWorkSurfaceRef();
    $('#'+workSurfaceRef+'_'+userApp.meta.id).data('state', oldState);

    var widgetId = $(this).parent().data('componentid');
    $('.selected').removeClass('selected');
    $(this).parent().addClass('selected');
    dataWorkSurface.loadCliche(userApp, currentZoom, isOverall);
    $('#outer-container').scrollTop(0); // TODO DRY
    $('#outer-container').scrollLeft(0);
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
        var widgetId = $(this).parent().parent().parent().data('componentid');
        var widgetNameElt = $($(this).parent().parent().find('.component-name'));
        var submitRenameElt = $($(this).parent().parent().find('.submit-rename'));

        widgetNameElt.removeClass('not-displayed');
        submitRenameElt.addClass('not-displayed');
        var newName = $(this).val();
        if (newName.length === 0) { // empty string entered, don't change the name!
            return;
        }
        widgetNameElt.text(newName);
        $('.component-options .component-name').text(newName);

        selectedProject.cliches[widgetId].meta.name = newName;
    }
});

/** ** ** ** ** ** ** ** ** ** ** ** Component Options ** ** ** ** ** ** ** ** ** ** ** ** **/
function setDatatypeOptions(cliche){
    // renaming

    $('.component-options .component-name')
        .text(cliche.meta.name)
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
                var widgetNameElt = $($(this).parent().parent().find('.component-name'));
                var submitRenameElt = $($(this).parent().parent().find('.submit-rename'));

                widgetNameElt.removeClass('not-displayed');
                submitRenameElt.addClass('not-displayed');

                var newName = $(this).val();
                if (newName.length === 0) { // empty string entered, don't change the name!
                    return;
                }
                $('.components').find('[data-componentid='+cliche.meta.id+']').find('.component-name').text(newName);

                widgetNameElt.text($(this).val());

                cliche.meta.name = $(this).val();
            }
        });

    // delete
    $('.component-options .btn-delete-component')
        .unbind()
        .on("click", function (e) {
            var id = cliche.meta.id;
            if (confirmOnUserWidgetDelete){
                if (selectedProject.numComponents === 1){
                    return; //don't delete the last one TODO is the the right way to go?
                }
                openDeleteUserWidgetConfirmDialogue(id);
            } else {
                deleteUserWidget(id);
            }
        });


}

/** ** ** ** ** ** Component Adding to Project and display helpers ** ** ** ** ** ** ** ** ** **/


/**
 * Adds a component to the list of user components
 * @param newComponent
 */
function displayNewClicheInList(cliche){
    // TODO changes in style
    var clicheId = cliche.meta.id;
    var dropdownId = clicheId+'_datatypes';
    var isUserApp = (clicheId == userApp.meta.id);

    var newDTButton = isUserApp? '<button type="button" class="btn btn-default" data-toggle="modal" data-target="#new-component" id="new-user-datatype-btn">'
    +'<span class="glyphicon glyphicon-plus"></span>'
    +'</button>': "";

    var newClicheElt = $(
        '<div class="user-components page-component-toggle-drop">'+
        '<div>'+
        '<span class="dropdown-trigger dropdown-open" data-dropdownid="'+dropdownId+'">'+
        '<span class="glyphicon glyphicon-triangle-bottom"></span>'+
        cliche.meta.name+
        '</span>'+
        newDTButton+
        '</div>'+
        '<div class="content  dropdown-target"  data-dropdownid="'+dropdownId+'">'+
        '<ul id="'+dropdownId+'-list">'+
        '</ul>'+
        '</div>'+
        '</div>');
    $('#user-components-list').append(newClicheElt);
    // addDeleteUserDatatypeButton(id);
    // registerUserWidgetAsDraggableForMainPages(id);
    // dataDragAndDrop.registerDataDragHandleDraggable(newClicheElt);
    enableDropdownTrigger();

    if (isUserApp) {
        $('#new-user-datatype-btn').click(function () {
            $('#create-component').unbind()
                .on('click', function () {
                    var name = sanitizeStringOfSpecialChars($('#new-component-name').val());
                    var datatypeInfo = initDatatype();
                    var datatype = datatypeInfo[0];
                    var datatypeDisplayProps = datatypeInfo[1];
                    userApp.addDatatype(datatype, datatypeDisplayProps);
                    selectedProject.addDataBondDisplay(userApp.meta.id, datatype.meta.id);
                    displayNewDatatypeInUserDatatypeList(datatype.meta.name, datatype.meta.id, userApp.meta.id);
                    // dataWorkSurface.setUpEmptyWorkSurface(datatype, 1);
                    // TODO add to overall and to userApp display
                    resetMenuOptions();
                    canvas.drawClicheDataLines(cliche);
                });
        });
    }
}


/**
 * Adds a component to the list of user components
 * @param newComponent
 */
function displayNewDatatypeInUserDatatypeList(name, id, clicheId){
    // TODO changes in style
    var dropdownId = clicheId+'_datatypes-list';


    var newDatatypeElt = $(
        '<li data-type="'+'user'+'" class="datatype" data-componentid="' + id + '" data-clicheid=' + clicheId + '>'
        + '<div class="component-name-container">'
        + '<span class="component-name">' + name + '</span>'
        + '<span class="submit-rename not-displayed">'
        + '<input type="text" class="new-name-input form-control" autofocus>'
        + '</span>'
        + '</div>'
        + '</li>');
    $('#'+dropdownId).append(newDatatypeElt);




    // addDeleteUserDatatypeButton(id);
    // registerUserWidgetAsDraggableForMainPages(id);
    // dataDragAndDrop.registerDataDragHandleDraggable(newDatatypeElt);
}


/**
 * Adds a component to the list of main pages
 * @param newComponent
 */
function displayOverallDatatypesInList(name, id){
    // TODO changes in style
    var newWidgetElt =
        '<li data-componentid=' + id + '>'
        + '<div class="component-name-container">'
        + '<div class="component-name">' + name + '</div>'
        + '<div class="submit-rename not-displayed">'
        + '<input type="text" class="new-name-input form-control" autofocus>'
        + '</div>'
        + '</div>'
        + '</li>';
    $('#main-pages-list').append(newWidgetElt);
}

function displayOverallDatatypesInListAndSelect(name, id){
    $('.selected').removeClass("selected");
    displayOverallDatatypesInList(name,id);
    $("#main-pages-list").find("[data-componentid='" + id + "']").addClass('selected');
}


/** ** ** ** ** ** ** ** ** Table Cells Interaction and display Helpers ** ** ** ** ** ** ** ** **/


/**
 * Register listener for click on edit button
 * @param container
 * @param popup
 */
function triggerEdit(container, popup) {
    if (container.find('.tooltip').length==0){
        var type = container.find('.widget').data('type').toLowerCase();
        var editDialog = $('#'+type+'-popup-holder').clone();

        if (!(type == 'label')){

            container.prepend(editDialog);

            $(Array.prototype.slice.call(
                container.find('form-control'), 0)[0]).trigger("focus");

        }
    }
    if (popup){
        setTimeout(function(){
            $(container.find('form-control')[0]).trigger("focus");
            editDialog.find('.tooltip').addClass('open');
        }, 1);
    }

}



function registerTooltipBtnHandlers() {
    $('.close').unbind().on("click", function() {
        setTimeout(function(){
            $('.tooltip').removeClass('open');
        }, 1);
        Array.prototype.slice.call(
            $(this).parent().get(0).getElementsByClassName('form-control'), 0)
            .forEach(function(item) {
                item.value = "";
            })
    });

    $('.apply').unbind().on("click", function(event) {
        var cellId = findContainingContainer(this);
        updateBaseWidgetContentsAndDisplayAt(cellId);
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
            var containerId = findContainingContainer(this);
            var element = $('#'+containerId).find('.display-component');
            var bootstrapClass = bootstrapPrefix+"-"+optionsList[index];
            element.addClass(bootstrapClass);

            for (var j=0; j<optionsList.length; j++) {
                if (j!==index) {
                    element.removeClass(bootstrapPrefix+'-'+optionsList[j]);
                }
            }
            var widgetId = getWidgetIdFromContainerId(containerId);
            selectedUserWidget.innerWidgets[widgetId].properties,style.bsClasses[propertyName] = bootstrapClass;

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



/** ** ** ** ** ** ** ** Dropdown Implementation ** ** ** ** ** ** ** ** ** **/
function enableDropdownTrigger(){
    $(".dropdown-trigger").unbind().click(function(ev) {
        var dropdownid = $(this).data('dropdownid');

        if ($(this).hasClass('dropdown-open')){
            // close it
            $(this).removeClass('dropdown-open').addClass('dropdown-closed');
            $(this).find('.glyphicon').remove();
            $(this).prepend('<span class="glyphicon glyphicon-triangle-right"></span>');

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
            $(this).prepend('<span class="glyphicon glyphicon-triangle-bottom"></span>');

            $("html").find("[data-dropdownid='" + dropdownid + "']").each(function(){
                if ($(this).hasClass('dropdown-target')){
                    $(this).css({
                        display: 'block',
                    });
                }
            });

        }
    });

}

enableDropdownTrigger();

/**
 * Deletes a component from the datatype and also from the view
 */
function deleteDatatypeFromUserDatatypeAndFromView(datatypeId) {
    var containerRef = dataContainerMaker.getContainerRef();

    var containerId = containerRef+"_"+datatypeId;
    userApp.deleteDatatype(datatypeId);
    $('#'+containerId).remove();
    //dataMiniNav.setUpMiniNavElementAndInnerWidgetSizes(selectedUserWidget);
    //dataZoomElement.registerZoom(selectedUserWidget);
}

