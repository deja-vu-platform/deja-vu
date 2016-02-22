/**
 * Created by ericmanzi on 2/21/16.
 */

var num_rows = 4;
var num_cols = 4;

$(function() {
    createTable();

    $('#select-rows').on('change', function(e) {
        num_rows = $(this).val();
    });

    $('#select-cols').on('change', function(e) {
        num_cols = $(this).val();
    });

    $('#create_component').on('click', function() {
        createTable();
    });

});

function createTable() {
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