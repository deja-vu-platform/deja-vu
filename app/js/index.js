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

            //console.log(clicheComponent);
            registerDraggable();
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
    resetDroppability();

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
    $('td').each(function() {

        if ($(this).get(0).getElementsByClassName('draggable').length == 0) {
            $(this).removeClass('dropped');
            $(this).addClass('droppable');
            $(this).droppable('enable');
        }
    })
}

/**
 * Register listener for click on edit button
 * @param cell_id
 */
function triggerEdit(cell_id) {
    var dropped_component =$('#'+cell_id).children().last().attr('name').toLowerCase();
    //console.log("dropped_component:"+dropped_component);

    var edit_dialog_template = $('#'+dropped_component+'_popup_holder').html();
    //console.log(edit_dialog_template);

    var sp = document.createElement('span');
    sp.innerHTML = edit_dialog_template;
    //console.log(sp.firstElementChild);
    var edit_dialog = sp.firstElementChild;
    //console.log(edit_dialog.firstChild);

    var cell = document.getElementById(cell_id);
    cell.insertBefore(edit_dialog, cell.firstChild);

    $(Array.prototype.slice.call(
        $('#'+cell_id).get(0).getElementsByClassName('form-control'), 0)[0]).trigger("focus");
    setTimeout(function(){
        $($('#'+cell_id).children().first()).addClass('open');
    }, 1);
    registerCloseBtnHandler();

}


function registerCloseBtnHandler() {
    $('.close').on("click", function() {
        setTimeout(function(){
            $('.tooltip').removeClass('open');
        }, 1);
        Array.prototype.slice.call(
            $(this).parent().get(0).getElementsByClassName('form-control'), 0)
            .forEach(function(item) {
                item.value = "";
            })
    })
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
