
var num_rows = 3;
var num_cols = 3;
var cell_width = 250;
var cell_height = 250;
var files = [];

// currently save components in this array
var userComponents = [];
var numComponents = userComponents.length - 1; // -1 to enable 0-indexing
var selectedUserComponent = null;
var bitmap_old = null;
var bitmap_new = null;

$(function() {
    Parse.initialize("8jPwCfzXBGpPR2WVW935pey0C66bWtjMLRZPIQc8", "zgB9cjo7JifswwYBTtSvU1MSJCMVZMwEZI3Etw4d");

    selectedUserComponent = "in jq";
    var grid = $('#grid-container').get(0);
    grid_width = grid.offsetWidth;
    grid_height = grid.offsetHeight;
    createTable(grid_width, grid_height, true);

    // start a default component
    InitClicheComponent(true);
});

$('#select-rows').on('change', function(e) {
    num_rows = $(this).val();
});

$('#select-cols').on('change', function(e) {
    num_cols = $(this).val();
});

$('#create_component').on('click', function() {
    createTable(grid_width, grid_height, false);
    InitClicheComponent(false);

});

$('#load_component_btn').on('click', function() {
    selectedUserComponent=JSON.parse($('#component_json').val());
    loadTable(grid_width, grid_height, selectedUserComponent);
    addComponentToUserComponentsList(selectedUserComponent);
});

$('#save_component').on('click', function() {

    window.open( "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(selectedUserComponent, null, '\t')));

    //w = window.open();
    //w.document.body.innerHTML='<a href="data:' + data + '" download="data.json">' +
    //    'Download JSON</a>'+'<p><textarea style="width:95%; height:95%">'+
    //    JSON.stringify(selectedUserComponent, null, '\t')+'</textarea></p>';
});

$('#user_components_list').on('click', 'li', function() {
    var componentNumber = $(this).data('componentnumber');
    $('#selected').removeAttr('id');
    $($('#user_components_list li')[componentNumber]).attr('id', 'selected');
    selectedUserComponent = userComponents[componentNumber];
    loadTable(grid_width, grid_height, selectedUserComponent);
});

$('#user_components_list').on('dblclick', '.component_name', function() {
    var componentNumber = $(this).parent().data('componentnumber');
    var componentToRename = $($('#user_components_list li')[componentNumber]);
    var new_name_input_elt = $(componentToRename.find('.new_name_input'));
    var submit_rename_elt = $(componentToRename.find('.submit_rename'));
    new_name_input_elt.val($(this).text());
    submit_rename_elt.removeClass('not_displayed');
    $(this).addClass('not_displayed');
    new_name_input_elt.focus();
    new_name_input_elt.select();
});

$('#user_components_list').on('keypress', '.new_name_input', function(event) {
    if ( event.which == 13 ) {
        event.preventDefault();
        var componentNumber = $(this).parent().parent().data('componentnumber');
        var componentToRename = $($('#user_components_list li')[componentNumber]);
        var component_name_elt = $(componentToRename.find('.component_name'));
        var submit_rename_elt = $(componentToRename.find('.submit_rename'));


        component_name_elt.removeClass('not_displayed');
        submit_rename_elt.addClass('not_displayed');
        var newName = $(this).val();
        if (newName.length===0){ // empty string entered, don't change the name!
            return;
        }
        component_name_elt.text($(this).val());
        // update the display of the component box
        $('<style>.table_outter::after{content:"'+$(this).val()+'"}</style>').appendTo('head');

        selectedUserComponent.meta.name = $(this).val();
    }
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

                    var sp = document.createElement('span');
                    sp.innerHTML = '<button type="button" class="edit-btn btn btn-default btn-xs"><span class="glyphicon glyphicon-pencil"></span></button>';

                    var button = sp.firstChild;

                    td.appendChild(button);
                    tr.appendChild(td);

                    $(button).on("click", function(e) {
                        //$('#'+td.id).get(0).removeChild($('#'+td.id).get(0).firstChild);
                        //triggerEdit(td.id);
                        $('#'+td.id).find('.tooltip').addClass('open');
                    });

                })(col+1);
            }
            grid.appendChild(tr);
        })(row+1);
    }

    document.getElementById('grid-container').appendChild(grid);

    //initSVG(grid);

    resizeCell(grid_width, grid_height, num_rows, num_cols);

    registerDroppable();

    bitmap_old = make2dArray(num_rows, num_cols);
    bitmap_new = make2dArray(num_rows, num_cols);


}

/**
 * Resize cell such that all cells fill width and height of grid
 * @param cell
 * @param grid_width
 * @param grid_height
 * @param num_rows
 * @param num_cols
 */
function resizeCell(grid_width, grid_height, num_rows, num_cols) {
    cell_width = Math.floor((grid_width/num_cols)) - 15;
    cell_height = Math.floor((grid_height/num_rows)) - 15;
    var tooltip_width = Number($('.tooltip').css('width').substring(0,3));

    getCSSRule('td').style.setProperty('width',cell_width+'px',null);
    getCSSRule('td').style.setProperty('height',cell_height+'px',null);
    getCSSRule('.tooltip').style.setProperty('left',-1*Math.floor((tooltip_width-(cell_width-40))/2)+'px',null);

    resizeLabelDivs(cell_width, cell_height);

}

function addComponentToUserComponentsList(newComponent){
    userComponents.push(newComponent);
    numComponents += 1;
    selectedUserComponent = newComponent;

    // display the newly added component to the user components list
    $('#selected').removeAttr("id");

    var newComponentElt = '<li id="selected" data-componentnumber='+numComponents+'>'
        +   '<span class="component_name">'+newComponent.meta.name+'</span>'
        +   '<span class="submit_rename not_displayed">'
        +      '<input type="text" class="new_name_input form-control" autofocus>'
        +   '</span>'
        + '</li>';
    $('#user_components_list').append(newComponentElt);
    $('#selected #modal-title-1').text(name); // TODO: what is this?

};


function InitClicheComponent(isDefault){
    var name, version, author;
    if (isDefault) {
        name = "NEW COMPONENT";
        version = "0.0.1";
        author = "Unknown";
    } else {
        name = $('#new_component_name').val();
        version = $('#component_version').val();
        author = $('#component_author').val();
    }
    $('<style>.table_outter::after{content:"'+name+'"}</style>').appendTo('head');
    var newComponent = new ClicheComponent({rows: num_rows, cols: num_cols}, name, 1, version, author);

    addComponentToUserComponentsList(newComponent);
}


function addComponent(widget, cell_id) {
    var row = cell_id.substring(4,5);
    var col = cell_id.substring(5,6);
    var span = document.createElement('span');
    span.innerHTML=widget[0].outerHTML;
    var type = span.firstElementChild.getAttribute('name');
    var component = new BaseComponent(type, {});
    if (!selectedUserComponent.components.hasOwnProperty(row)) {
        selectedUserComponent.components[row] = {};
        }
    selectedUserComponent.components[row][col] = component;

    //selectedUserComponent.addComponent(component, row, col);

    if (type==='label') {
        Display(cell_id, getHTML[type]("Type text here..."));
    } else if (type==='panel') {
        Display(cell_id, getHTML[type]({heading: "Type heading...", content: "Type content..."}));
    } else {
        triggerEdit(cell_id);
    }
}



function updateComponentAt(cell_id) {
    var row = cell_id.substring(4,5);
    var col = cell_id.substring(5,6);
    var type = $('#'+cell_id).get(0).getElementsByClassName('draggable')[0].getAttribute('name');
    var value;
    var isUpload = false;
    var inputs = Array.prototype.slice.call(
        $('#'+cell_id).get(0).getElementsByTagName('input'), 0);

    if (type==='label') {
        value = $('#'+cell_id).find('p')[0].textContent;
    } else if (type==='link') {
        value = {
            link_text: inputs[0].value,
            target: inputs[1].value
        }
    } else if (type==='tab_viewer') {
        value = {
            "tab1": { text: inputs[0].value, target: inputs[1].value},
            "tab2": { text: inputs[2].value, target: inputs[3].value},
            "tab3": { text: inputs[4].value, target: inputs[5].value}
        }
    } else if (type==='menu') {
        value = {
            "menu_item1": { text: inputs[0].value, target: inputs[1].value},
            "menu_item2": { text: inputs[2].value, target: inputs[3].value},
            "menu_item3": { text: inputs[4].value, target: inputs[5].value}
        }
    } else if (type==='image') {
        value = {};

        if (files.length > 0) { // if there's a file to upload
            var file = files[0];
            var parseFile = new Parse.File(file.name, file);
            isUpload = true;
            parseFile.save()
                .then(function (savedFile) { // save was successful
                    value.img_src = savedFile.url();
                    Display(cell_id, getHTML[type](value));
                    selectedUserComponent.components[row][col].components[type] = value;
                });
        } else { // pasted link to image
            value.img_src = inputs[0].value;
        }
    } else if (type==='panel') {
        value = {
            heading: $('#'+cell_id).find('.panel-title')[0].textContent,
            content: $('#'+cell_id).find('.panel-body')[0].textContent
        }
    }

    if (!isUpload) {
        $('#'+cell_id).find('.label_container').remove();
        $('#'+cell_id).find('.display_component').remove();
        Display(cell_id, getHTML[type](value), function() {
            //for (var prop in selectedUserComponent.components[row][col].properties) {
            //    var bootstrap_class = selectedUserComponent.components[row][col].properties[prop];
            //    $('#'+cell_id).find('.display_component').addClass(bootstrap_class);
            //}
        });
        selectedUserComponent.components[row][col].components={};
        selectedUserComponent.components[row][col].components[type] = value;
    }
}




/*
  BITMAP TO HELP IN UPDATE
 */
function quicklyMakeArray(size, func) {
    return Array.apply(null, Array(size)).map(func);
}
function make2dArray(rows, cols) {
    rows=Number(rows);
    cols=Number(cols);
    return quicklyMakeArray(rows, function () {
        return quicklyMakeArray(cols, function (i) {return 0;});
    });
}
function findDeletedCoord() {
    var result = [];
    for (var row=0; row < num_rows; row++) {
        for (var col = 0; col < num_cols; col++) {
            if ((bitmap_new[row][col] - bitmap_old[row][col]) < 0) {
                result[0] = row+1;
                result[1] = col+1;
            } else if ((bitmap_new[row][col] - bitmap_old[row][col]) > 0) {
                result[2] = row+1;
                result[3] = col+1;
            }
        }
    }
    return result;
}

function updateBitmap() {
    bitmap_old = JSON.parse(JSON.stringify(bitmap_new));
    $('td').each(function() {
        var row = Number($(this).attr('id').substring(4, 5)) - 1;
        var col = Number($(this).attr('id').substring(5, 6)) - 1;
        if ($(this).get(0).getElementsByClassName('draggable').length == 0) {
            bitmap_new[row][col] = 0;
        } else {
            bitmap_new[row][col] = 1;
        }
    });
}



/*
 IMAGE UPLOAD HELPERS
 */
// file drag hover
function FileDragHover(e) {
    e.stopPropagation();
    e.preventDefault();
    if (e.type=="dragover") {
        $(e.target).addClass("hover");
    } else if (e.type == "dragleave") {
        $(e.target).removeClass("hover");
    }
}
// file selection
function FileSelectHandler(e) {

    FileDragHover(e); // cancel event and hover styling

    files = e.target.files || e.dataTransfer.files;

    $(e.target).text("Got file: "+truncate(files[0].name,30));
}

function truncate(str,len) {
    return str.substring(0,len)+(str.length>len ? "... "+str.substring(str.length-4) : "");
}

function getCSSRule(search) {
    var x =[].slice.call(document.styleSheets[2].cssRules);
    return x.filter(function(rule) {
        return rule.selectorText === search;
    })[0];
}

function resizeLabelDivs(cell_width, cell_height) {
    getCSSRule('.label_container').style.setProperty('width',(cell_width-10)+'px',null);
    getCSSRule('.label_container').style.setProperty('height',(cell_height-30)+'px',null);
    getCSSRule('.label_container').style.setProperty('padding-top',(cell_height/4)+'px',null);
}

function loadTable(grid_width, grid_height, componentToShow) {
    $('<style>.table_outter::after{content:"'+componentToShow.meta.name+'"}</style>').appendTo('head');
    num_rows=componentToShow.dimensions.rows;
    num_cols=componentToShow.dimensions.cols;
    createTable(grid_width, grid_height, false);

    $('td').each(function() {
        var cell_id=$(this).get(0).id;
        var row = cell_id.substring(4,5);
        var col = cell_id.substring(5,6);
        if (componentToShow.components[row]) {
            if (componentToShow.components[row][col]) {
                var component = componentToShow.components[row][col];
                var type = component.type;
                showConfigOptions(type, document.getElementById(cell_id));
                Display(cell_id, getHTML[type](component.components[type]));
                $('#'+cell_id).addClass("dropped");
                $('#'+cell_id).removeClass("droppable");
            }
        }
    });

    registerDraggable();
    registerTooltipBtnHandlers();
}