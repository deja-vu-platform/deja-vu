'use strict'

var num_rows = 3;
var num_cols = 3;
var files = [];
var component_data = {};
var clicheComponent;

$(function() {

    var grid = document.getElementById('grid-container');
    var grid_width = grid.offsetWidth;
    var grid_height = grid.offsetHeight;

    createTable(grid_width, grid_height, true);

    $('#select-rows').on('change', function(e) {
        num_rows = $(this).val();
    });

    $('#select-cols').on('change', function(e) {
        num_cols = $(this).val();
    });

    $('#create_component').on('click', function() {
        createTable(grid_width, grid_height, false);
    });



});

/**
 * Generate the grid
 * @param grid_width
 * @param grid_height
 * @param num_rows
 * @param num_cols
 */
function createTable(grid_width, grid_height, isDefault) {
    $('#grid-container').html('');

    var grid = document.createElement('table');
    grid.className = 'table_outter';
    for (var row=0; row<num_rows; row++) {
        (function(row){
            var tr = document.createElement('tr');
            for (var col=0; col<num_cols; col++) {
                (function(col){
                    var td = document.createElement('td');
                    td.className = 'droppable';
                    td.id = 'cell'+row+col;
                    resizeCell(td, grid_width, grid_height, num_rows, num_cols);

                    var sp = document.createElement('span');
                    sp.innerHTML = '<button type="button" class="edit-btn btn btn-default"><span class="glyphicon glyphicon-edit"></span></button>';
                    var button = sp.firstChild;

                    td.appendChild(button);
                    tr.appendChild(td);

                    $(button).on("click", function() { triggerEdit(td.id)});

                })(col+1);
            }
            grid.appendChild(tr);
        })(row+1);
    }

    document.getElementById('grid-container').appendChild(grid);

    registerDroppable();

}

/**
 * Resize cell such that all cells fill width and height of grid
 * @param cell
 * @param grid_width
 * @param grid_height
 * @param num_rows
 * @param num_cols
 */
function resizeCell(cell, grid_width, grid_height, num_rows, num_cols) {

    var cell_width = Math.floor((grid_width/num_cols)) - 10;
    var cell_height = Math.floor((grid_height/num_rows)) - 10;

    cell.setAttribute('style', 'width: '+cell_width+'px; height: '+cell_height+'px;');

    // Resize tooltip
    var tooltip_width = Number($('.tooltip').css('width').substring(0,3));
    $('.tooltip').css('left', -1*Math.floor((tooltip_width-(cell_width-40))/2)+'px');
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


/**
 * SAVE COMPONENT
 */
$('#save_component').on('click', function() {

    component_data.num_rows = num_rows;
    component_data.num_cols = num_cols;

    $('[id^="cell"]').each(function() {
        var cell = $(this);

        component_data[cell.attr('id')]=cell.children().first().attr('id');
    });

    alert(JSON.stringify(component_data));
});