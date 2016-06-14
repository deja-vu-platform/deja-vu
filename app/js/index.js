var currentZoom = 1.0;


$(function() {

    basic_components = $('#basic_components').html();

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
                var cell_id = $(this).attr('id');
                var dropped_component =$('#'+cell_id).children().last().attr('name').toLowerCase();
                showConfigOptions(dropped_component, document.getElementById(cell_id));
                if (!movedComponent()) {
                    addComponent(cell_id, $(ui.draggable));
                }
            } else { // if dropped in trash
                var trashCopy = $(this).children().first();
                $(ui.draggable).appendTo(this);
                $(this).empty();
                trashCopy.appendTo($(this));
                movedComponent();
            }

            $('#basic_components').html(basic_components);

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
        $('.table_outter').after().css('font-size', '14px');
    });
    $('#zoomOut').click( function (e) {
        e.preventDefault();
        $('#middle-container').animate({ 'zoom': currentZoom = 0.4 }, 'slow');
        $('.table_outter').after().css('font-size', '50px');
    });

}


function resetDroppability(cell_id) {
    if (cell_id){
        if ($('#'+cell_id).get(0).getElementsByClassName('draggable').length == 0) {
            $('#'+cell_id).removeClass('dropped');
            $('#'+cell_id).addClass('droppable');
            $('#'+cell_id).droppable('enable');
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

        var del_row = coord[0];
        var del_col = coord[1];
        if (typeof coord[2]!=="undefined") { // if move, copy any save data
            var new_row = coord[2];
            var new_col = coord[3];

            var component_copy = selectedUserComponent.components[del_row][del_col];
            selectedUserComponent.addComponent(component_copy, new_row, new_col);

            Display('cell'+new_row+new_col, getHTML[component_copy.type](component_copy.components[component_copy.type]));
            triggerEdit('cell'+new_row+new_col, false);

        }

        deleteComponent("cell"+del_row+del_col);
        return true;
    }
    return false;
}

/**
 * Register listener for click on edit button
 * @param cell_id
 */
function triggerEdit(cell_id, popup) {
    var dropped_component =$('#'+cell_id).children().last().attr('name').toLowerCase();

    var edit_dialog_template = $('#'+dropped_component+'_popup_holder').html();

    var sp = document.createElement('span');
    sp.innerHTML = edit_dialog_template;
    var edit_dialog = sp.firstElementChild;

    var cell = document.getElementById(cell_id);
    cell.insertBefore(edit_dialog, cell.firstChild);

    $(Array.prototype.slice.call(
        $('#'+cell_id).get(0).getElementsByClassName('form-control'), 0)[0]).trigger("focus");
    if (popup){
        setTimeout(function(){
            $($('#'+cell_id).children().first()).addClass('open');
        }, 1);
    }

}

function showConfigOptions(dropped_component_type, cell) {
    // Hide edit button if label or panel
    if (dropped_component_type==='label' || dropped_component_type==='panel') {
        $('#'+cell.id).find('.edit-btn').css('visibility', 'hidden');
    } else {
        $('#'+cell.id).find('.edit-btn').css('visibility', 'visible');
    }

    var configOptions = document.getElementById(dropped_component_type+'_properties');
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
        var cell_id = findContainingCell(this);
        updateComponentAt(cell_id);
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

    function registerPropHandlers(options_list_, class_prefix, bootstrap_prefix) {
        var propertyName = options_list_[0];
        var options_list = options_list_.slice(1);

        for (var i=0; i<options_list.length; i++) {
            var options = document.getElementsByClassName(class_prefix+'-'+options_list[i]);
            for (var j=0; j<options.length; j++) {
                options[j].onclick = generateHandler(i, options_list, bootstrap_prefix, propertyName);
            }
        }
    }

    function generateHandler(index, options_list, bootstrap_prefix, propertyName) {
        return function(e) {
            e.preventDefault();
            var cell_id = findContainingCell(this);
            var element = $('#'+cell_id).find('.display_component');
            var bootstrap_class = bootstrap_prefix+"-"+options_list[index];
            element.addClass(bootstrap_class);

            for (var j=0; j<options_list.length; j++) {
                if (j!==index) {
                    element.removeClass(bootstrap_prefix+'-'+options_list[j]);
                }
            }

            var row = cell_id.substring(4,5);
            var col = cell_id.substring(5,6);
            selectedUserComponent.components[row][col].properties[propertyName] = bootstrap_class;

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
    var tag_name = parent.get(0).tagName;
    while (tag_name !== 'TD') {
        parent = $(parent).parent();
        tag_name = parent.get(0).tagName;
    }
    var cell_id = $(parent).attr('id');
    return cell_id;
}

function getEdits() {
    $('[contenteditable=true]').blur(function() {
        var cell_id = findContainingCell(this);
        updateComponentAt(cell_id);
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

