'use strict'

var currentZoom = 1.0;
var components = $('#basic_components').html();


$(function() {

    registerDroppable();

    registerDraggable();

    registerZoom();

});


function registerDroppable() {
    var enableDrop = {
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
            } else {
                var trashCopy = $(this).children().first();
                $(ui.draggable).appendTo(this);
                $(this).empty();
                trashCopy.appendTo($(this));
            }


            $('#basic_components').html(components);
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
    resetDraggability();
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

function resetDraggability() {
    $('td').each(function() {
        if ($(this).children().length < 3) { // if .dropped
            $(this).removeClass('dropped');
            $(this).addClass('droppable');
            $(this).droppable('enable');
        }
    })
}