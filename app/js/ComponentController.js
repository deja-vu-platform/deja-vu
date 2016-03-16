
var num_rows = 3;
var num_cols = 3;
var files = [];
clicheComponent = null;

$(function() {
    clicheComponent = "in jq";
    var grid = $('#grid-container').get(0);
    grid_width = grid.offsetWidth;
    grid_height = grid.offsetHeight;
    createTable(grid_width, grid_height, true);

});

$('#select-rows').on('change', function(e) {
    num_rows = $(this).val();
});

$('#select-cols').on('change', function(e) {
    num_cols = $(this).val();
});

$('#create_component').on('click', function() {
    createTable(grid_width, grid_height, false);
});

$('#save_component').on('click', function() {
    w = window.open();
    w.document.body.innerHTML='<p><textarea style="width:95%; height:95%">'+JSON.stringify(clicheComponent, null, '\t')+'</textarea></p>';
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

    InitClicheComponent(isDefault);

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

function InitClicheComponent(isDefault) {
    var name, version, author;
    if (isDefault) {
        name = "New Component";
        version = "0.0.1";
        author = "Unknown";
    } else {
        name = $('#component_name').val();
        version = $('#component_version').val();
        author = $('#component_author').val();
    }
    clicheComponent = new ClicheComponent({rows: num_rows, cols: num_cols}, name, 1, version, author);
}


function addComponent(widget, cell_id) {
    var row = cell_id.substring(4,5);
    var col = cell_id.substring(5,6);
    var span = document.createElement('span');
    span.innerHTML=widget[0].outerHTML;
    var type = span.firstElementChild.getAttribute('name');
    var component = new BaseComponent(type, {text: null, link: null, tab_items: null, menu_items: null });
    clicheComponent.addComponent(component, row, col);
}

function updateComponentAt(cell_id) {
    var row = cell_id.substring(4,5);
    var col = cell_id.substring(5,6);
    var type = $('#'+cell_id).get(0).getElementsByClassName('draggable')[0].getAttribute('name');
    var component, value;
    var inputs = Array.prototype.slice.call(
        $('#'+cell_id).get(0).getElementsByTagName('input'), 0);

    if (type==='label') {
        component = "text";
        value = $('#'+cell_id).get(0).getElementsByTagName('textarea')[0].value;
    } else if (type==='link') {
        component = "link";
        value = {
            link_text: inputs[0].value,
            target: inputs[1].value
        }
    } else if (type==='tab_viewer') {
        component = "tab_items";
        value = {
            "tab1": { text: inputs[0].value, target: inputs[1].value},
            "tab2": { text: inputs[2].value, target: inputs[3].value},
            "tab3": { text: inputs[4].value, target: inputs[5].value}
        }
    } else if (type==='menu') {
        component = "menu_items";
        value = {
            "menu_item1": { text: inputs[0].value, target: inputs[1].value},
            "menu_item2": { text: inputs[2].value, target: inputs[3].value},
            "menu_item3": { text: inputs[4].value, target: inputs[5].value}
        }
    }

    clicheComponent.components[row][col].components[component] = value;
}
