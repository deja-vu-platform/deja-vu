var currentZoom = 1.0;
var basicComponents;

$(function() {

    basicComponents = $('#basic-components').html();

    registerDroppable();

    registerDraggable();

    registerZoom();

});


function registerDroppable() {
    enableDrop = {
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
            } else { // if dropped in trash
                var trashCopy = $(this).children().first();
                $(ui.draggable).appendTo(this);
                $(this).empty();
                trashCopy.appendTo($(this));
                movedComponent();
            }

            $('#basic-components').html(basicComponents);

            registerDraggable();
            resetDroppability();
            registerTooltipBtnHandlers();


        }
    };
    $('.droppable').each(function() {
        $(this).droppable(enableDrop);
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
                //Hack to append the widget to the body (visible above others divs), but still belonging to the scrollable container
                $("#clone").hide();
                setTimeout(function(){$('#clone').appendTo('body'); $("#clone").show();},1);
                return $("#clone");
            },
            appendTo: 'body',
            containment: 'body',
            cursor: '-webkit-grabbing',
            scroll: true
        });
    });

}

function registerZoom() {
    $('#zoomIn').click( function (e) {
        e.preventDefault();
        $('#middle-container').animate({ 'zoom': currentZoom = 1 }, 'slow');
        $('.main-table').after().css('font-size', '14px');
    });
    $('#zoomOut').click( function (e) {
        e.preventDefault();
        $('#middle-container').animate({ 'zoom': currentZoom = 0.4 }, 'slow');
        $('.main-table').after().css('font-size', '50px');
    });

}


function resetDroppability(cellId) {
    if (cellId){
        if ($('#'+cellId).get(0).getElementsByClassName('draggable').length == 0) {
            $('#'+cellId).removeClass('dropped');
            $('#'+cellId).addClass('droppable');
            $('#'+cellId).droppable('enable');
        }
    } else {
        $('#table-container td').each(function() {
            if ($(this).get(0).getElementsByClassName('draggable').length == 0) {
                $(this).removeClass('dropped');
                $(this).addClass('droppable');
                $(this).droppable('enable');
            }
        });
    }
}

function movedComponent() {

    updateBitmap();

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
        $('#'+cell.id).find('.edit-btn').css('visibility', 'hidden');
    } else {
        $('#'+cell.id).find('.edit-btn').css('visibility', 'visible');
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
        updateComponentContentsAt(cellId);
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

            var rowcol = cellId.split('_');
            var row = rowcol[rowcol.length-2];
            var col = cellId[rowcol.length-1];
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
        updateComponentContentsAt(cellId);
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

