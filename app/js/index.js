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
            if ($(this).attr('id') != "trash") {
                $(this).addClass("dropped");
                $(this).removeClass("droppable");
                $(ui.draggable).appendTo(this);
                $(this).droppable('disable');
                triggerEdit($(this).attr('id'));
                addComponent($(ui.draggable), $(this).attr('id'));
            } else {
                var trashCopy = $(this).children().first();
                $(ui.draggable).appendTo(this);
                $(this).empty();
                trashCopy.appendTo($(this));
            }

            $('#basic_components').html(basic_components);

            registerDraggable();
            resetDroppability();

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
                $('#grid-container').append('<div id="clone" class="widget">' + $(this).html() + '</div>');
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
    $('#zoomIn').click(
        function () {
            $('#grid-container').animate({ 'zoom': currentZoom += .05 }, 'slow');
        });
    $('#zoomOut').click(
        function () {
            $('#grid-container').animate({ 'zoom': currentZoom -= .05 }, 'slow');
        });
    $('#zoomReset').click(
        function () {
            currentZoom = 1.0;
            $('#grid-container').animate({ 'zoom': 1 }, 'slow');
        });
}

function resetDroppability() {
    bitmap_old = JSON.parse(JSON.stringify(bitmap_new));

    $('td').each(function() {

        // ALSO UPDATE BITMAP
        var row = Number($(this).attr('id').substring(4,5))-1;
        var col = Number($(this).attr('id').substring(5,6))-1;

        if ($(this).get(0).getElementsByClassName('draggable').length == 0) {
            $(this).removeClass('dropped');
            $(this).addClass('droppable');
            $(this).droppable('enable');
            bitmap_new[row][col] = 0;
        } else {
            bitmap_new[row][col] = 1;
        }


    });

    var coord = findDeletedCoord();
    if (coord.length > 0 && typeof coord[0]!=="undefined") {
        var del_row = coord[0];
        var del_col = coord[1];
        var cell = $('#cell'+del_row+del_col).get(0);
        if (typeof coord[2]!=="undefined") { // if move, copy any save data
            var new_row = coord[2];
            var new_col = coord[3];

            var component_copy = clicheComponent.components[del_row][del_col];
            clicheComponent.components[new_row][new_col].components = component_copy.components;

            Display('cell'+new_row+new_col, getHTML[component_copy.type](component_copy.components[component_copy.type]));
        }
        delete clicheComponent.components[del_row][del_col];
        cell.removeChild(cell.firstChild);
    }
}

/**
 * Register listener for click on edit button
 * @param cell_id
 */
function triggerEdit(cell_id) {
    var dropped_component =$('#'+cell_id).children().last().attr('name').toLowerCase();

    var edit_dialog_template = $('#'+dropped_component+'_popup_holder').html();

    var sp = document.createElement('span');
    sp.innerHTML = edit_dialog_template;
    var edit_dialog = sp.firstElementChild;

    var cell = document.getElementById(cell_id);
    cell.insertBefore(edit_dialog, cell.firstChild);

    $(Array.prototype.slice.call(
        $('#'+cell_id).get(0).getElementsByClassName('form-control'), 0)[0]).trigger("focus");
    setTimeout(function(){
        $($('#'+cell_id).children().first()).addClass('open');
    }, 1);
    registerTooltipBtnHandlers();

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
        var parent = $(this).parent();
        var tag_name = parent.get(0).tagName;
        while (tag_name !== 'TD') {
            parent = $(parent).parent();
            tag_name = parent.get(0).tagName;
        }
        var cell_id = $(parent).attr('id');
        updateComponentAt(cell_id);
        $('.tooltip').removeClass('open');
    });

    var dropzones = document.getElementsByClassName("upload-drop-zone");
    for (var i=0; i<dropzones.length; i++) {
        dropzones[i].addEventListener("dragover", FileDragHover, false);
        dropzones[i].addEventListener("dragleave", FileDragHover, false);
        dropzones[i].addEventListener("drop", FileSelectHandler, false);
    }
}


/**
 * Click outside the tooltip to hide it
 */
$(document).click(function(event) {
    if(!$(event.target).closest('.tooltip').length &&
        !$(event.target).is('.tooltip')) {
        if($('.tooltip').hasClass('open')) {
            $('.tooltip').removeClass('open');
        }
    }
});

/**
 * Display name of uploaded image
 */
$(document).on('change', '#fileselect', function(evt) {
    files = $(this).get(0).files;
    $(this).parent().parent().parent().children().first().val(files[0].name);
});

