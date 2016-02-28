/**
 * Created by ericmanzi on 2/21/16.
 */
num_rows = 3;
num_cols = 3;

$(function() {

    var grid = document.getElementById('grid-container');
    var grid_width = grid.offsetWidth;
    var grid_height = grid.offsetHeight;

    createTable(grid_width, grid_height, num_rows, num_cols);

    $('#select-rows').on('change', function(e) {
        num_rows = $(this).val();
    });

    $('#select-cols').on('change', function(e) {
        num_cols = $(this).val();
    });

    $('#create_component').on('click', function() {
        createTable(grid_width, grid_height, num_rows, num_cols);
    });

});

/**
 * Generate the grid
 * @param grid_width
 * @param grid_height
 * @param num_rows
 * @param num_cols
 */
function createTable(grid_width, grid_height, num_rows, num_cols) {
    $('#grid-container').html('');

    var grid = document.createElement('table');
    grid.className = 'table_outter';
    for (var row=0; row<num_rows; row++) {
        (function(row){
            var tr = document.createElement('tr');
            for (var col=0; col<num_cols; col++) {
                (function(col){
                    var td = document.createElement('td');

                    var sp = document.createElement('span');
                    sp.innerHTML = '<button type="button" class="edit-btn btn btn-default"><span class="glyphicon glyphicon-edit"></span></button>';
                    var button = sp.firstChild;

                    td.className = 'droppable';
                    td.id = 'cell'+row+col;

                    resizeCell(td, grid_width, grid_height, num_rows, num_cols);

                    td.appendChild(button);

                    tr.appendChild(td);
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

}