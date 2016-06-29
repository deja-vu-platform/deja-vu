/**
 * Display element in cell
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

function Display(cellId, html, callback) {
    var cell = document.getElementById(cellId);
    var sp = document.createElement('span');
    sp.innerHTML = html;
    var html_ = sp.firstElementChild;
    cell.insertBefore(html_, cell.firstChild);
    hideBaseComponentDisplayAt(cellId);
    updateBaseComponentDisplayAt(cellId);
    showBaseComponentDisplayAt(cellId);
    if (callback) callback();
}

/**
 * Removes just the display part of the component. Useful for removing the old image
 * on upload
 * @param cellId
 * @param callback
 * @constructor
 */
function RemoveDisplay(cellId, callback) {
    $('#'+cellId).find('.display-component').remove();
    if (callback) callback();
}

