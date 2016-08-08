var mainDisplayClasses = {
    'label': "display-component",
    'link': "btn display-component",
    'tab-viewer': "nav display-component",
    'menu': "btn-group display-component",
    'image': "display-component",
    'panel': "panel display-component"
};

/**
 * display element in cell
 */
var getHTML = {
    'label': function(value) {
        if (!value){
            value = "Type text here...";
        }
        return '<div class="label-container"><p contenteditable="true" class="display-component">'+value+'</p></div>';
    },
    'link': function(value) {
        if (!value){
            return '<a class="btn btn-link display-component" href="#">Link</a>';
        }
        return '<a class="btn btn-link display-component" href="'+value.target+'">'+value.link_text+'</a>';
    },
    'tab-viewer': function(value) {
        if (!value){
            var html = '<ul class="nav nav-pills nav-stacked display-component">' +
                '<li role="presentation" class="active"><a href="#" data-toggle="tab">Tab 1</a></li>' +
                '<li role="presentation"><a href="#" data-toggle="tab">Tab 2</a></li>' +
                '<li role="presentation"><a href="#" data-toggle="tab">Tab 3</a></li>' +
                '</ul>';

            return html;
        }
        var html = '<ul class="nav nav-pills nav-stacked display-component">' +
            '<li role="presentation" class="active"><a href="#1a" data-toggle="tab">'+value.tab1.text+'</a></li>' +
            '<li role="presentation"><a href="#2a" data-toggle="tab">'+value.tab2.text+'</a></li>' +
            '<li role="presentation"><a href="#3a" data-toggle="tab">'+value.tab3.text+'</a></li>' +
            '</ul>'; //TODO: tab target
        return html;
    },
    'menu': function(value) {
        if (!value){
            var html = '<div class="btn-group display-component" role="group">' +
                '<a type="button" class="btn btn-default" role="button" href="#">Item 1</a>' +
                '<a type="button" class="btn btn-default" role="button" href="#">Item 2</a>' +
                '<a type="button" class="btn btn-default" role="button" href="#">Item 3</a>' +
                '</div>';
            return html;
        }
        var html = '<div class="btn-group display-component" role="group">' +
            '<a type="button" class="btn btn-default" role="button" href="'+value.menu_item1.value+'">'+value.menu_item1.text+'</a>' +
            '<a type="button" class="btn btn-default" role="button" href="'+value.menu_item2.value+'">'+value.menu_item2.text+'</a>' +
            '<a type="button" class="btn btn-default" role="button" href="'+value.menu_item3.value+'">'+value.menu_item3.text+'</a>' +
            '</div>';
        return html;
    },
    'image': function(value) {
        if (!value){
            return '<img class="display-component" src="images/image_icon.png" width="15px" height="15px">';
        }
        return '<img src="'+value.img_src+'" width="'+cellWidth+"px"+'" class="display-component">';
    },
    'panel': function(value) {
        if (!value){
            value = {heading: "Type heading...", content: "Type content..."};
        }
        return '<div class="panel panel-default display-component">'+
            '<div class="panel-heading">'+
            '<h3 contenteditable="true" class="panel-title">'+value.heading+'</h3>'+
            '</div><div contenteditable="true" class="panel-body">'+value.content+'</div></div>';
    }
};

function display(cellId, type, html, zoom, padding, properties, callback) {
    var cell = document.getElementById(cellId);
    var sp = document.createElement('span');
    sp.innerHTML = html;
    var html_ = sp.firstElementChild;
    cell.insertBefore(html_, cell.firstChild);
    hideBaseComponentDisplayAt(cellId, type);
    updateBaseComponentDisplayAt(cellId, type, zoom, padding, properties);
    showBaseComponentDisplayAt(cellId, type);
    if (callback) callback();
}


/**
 *
 * @param cellId
 * @param type
 * @param zoom
 * @param padding
 */
function updateBaseComponentDisplayAt(cellId, type, zoom, padding, properties) {
    var cell = $('#'+cellId);
    var cellHeight = cell.height();
    var cellWidth = cell.width();

    if ((!padding) || (cellId == 'display-cell')){
        padding = {top: 0, bottom: 0, left: 0, right: 0};
    }

    var paddingPx = {
        top: padding.top*cellHeight,
        bottom: padding.bottom*cellHeight,
        left: padding.left*cellWidth,
        right: padding.right*cellWidth
    };

    //var cellHeight = (parseFloat(cell.css('height'))/zoom-10) + 'px';
    //var cellWidth = (parseFloat(cell.css('width'))/zoom-10) + 'px';


    //var rowcol = getRowColFromId(cellId);
    //var cellHeight = (selectedUserComponent.layout[rowcol.row][rowcol.col].ratio.grid.height*selectedUserComponent.layout.tablePxDimensions.height-10) + 'px';
    //var cellWidth = (selectedUserComponent.layout[rowcol.row][rowcol.col].ratio.grid.width*selectedUserComponent.layout.tablePxDimensions.width-10) + 'px';

    var displayComponent = cell.find('.display-component');
    if (type === 'label'){
        displayComponent.parent().css({
            height: cellHeight + 'px',
            width: cellWidth + 'px',
            'padding-top': paddingPx.top + 'px',
            'padding-left': paddingPx.left + 'px',
            'padding-bottom': paddingPx.bottom + 'px',
            'padding-right': paddingPx.right + 'px',
        });
        displayComponent.css({
            //'-webkit-transform': 'scale('+zoom+','+zoom+')',
            zoom: zoom,
            background: 'white',
        });

    } else {
        if (type === 'image') {
            displayComponent.css({
                'max-height': cellHeight + 'px',
                'max-width': cellWidth + 'px',
                height: 'auto',
                width: 'auto',
                'vertical-align':'top',
                'padding-top': paddingPx.top + 'px',
                'padding-left': paddingPx.left + 'px',
                'padding-bottom': paddingPx.bottom + 'px',
                'padding-right': paddingPx.right + 'px',
            });
        } else {
            // TODO other types?

            displayComponent.css({
                //'-webkit-transform': 'scale('+zoom+','+zoom+')',
                zoom: zoom,
                // Todo: issue :(
                'padding-top': paddingPx.top/zoom + 'px',
                'padding-left': paddingPx.left/zoom + 'px',
                'padding-bottom': paddingPx.bottom/zoom + 'px',
                'padding-right': paddingPx.right/zoom + 'px',
            });
        }

    }

    //if (cellId == 'display-cell'){
    //    var rowcol  = getRowColFromId($('#display-cell').data('cellid'));
    //} else {
    //    var rowcol  = getRowColFromId(cellId);
    //}
    //// TODO SKETCHY!!!
    if (properties){
        if (Object.keys(properties).length>0){
            displayComponent.removeClass();
            for (var propertyName in properties){
                displayComponent.addClass(properties[propertyName]);
            }
            displayComponent.addClass(mainDisplayClasses[type]);
        }
    }

}


function hideBaseComponentDisplayAt(cellId, type){
    if (type === 'label'){
        $('#' + cellId).find('.display-component').parent().css({
            display: 'none'
        });
    } else {
        $('#' + cellId).find('.display-component').css({
            display: 'none'
        });
    }
}

function showBaseComponentDisplayAt(cellId, type){
    if (type === 'label'){
        $('#' + cellId).find('.display-component').parent().css({
            display: 'block'
        });
    } else {
        $('#' + cellId).find('.display-component').css({
            display: 'inline-block'
        });
    }
}


/**
 * Removes just the display part of the component. Useful for removing the old image
 * on upload
 * @param cellId
 * @param callback
 * @constructor
 */
function removeDisplay(cellId, callback) {
    $('#'+cellId).find('.label-container').remove();
    $('#'+cellId).find('.display-component').remove();
    if (callback) callback();
}

