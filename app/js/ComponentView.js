/**
 * Display element in cell
 */
var getHTML = {
    'label': function(value) {
        if (!value){
            value = "Type text here...";
        }
        return '<div class="label_container"><p contenteditable="true" class="display_component">'+value+'</p></div>';
    },
    'link': function(value) {
        if (!value){
            return '<a class="btn btn-link display_component" href="#">Link</a>';
        }
        return '<a class="btn btn-link display_component" href="'+value.target+'">'+value.link_text+'</a>';
    },
    'tab_viewer': function(value) {
        if (!value){
            var html = '<ul class="nav nav-pills nav-stacked display_component">' +
                '<li role="presentation" class="active"><a href="#" data-toggle="tab">Tab 1</a></li>' +
                '<li role="presentation"><a href="#" data-toggle="tab">Tab 2</a></li>' +
                '<li role="presentation"><a href="#" data-toggle="tab">Tab 3</a></li>' +
                '</ul>';

            return html;
        }
        var html = '<ul class="nav nav-pills nav-stacked display_component">' +
            '<li role="presentation" class="active"><a href="#1a" data-toggle="tab">'+value.tab1.text+'</a></li>' +
            '<li role="presentation"><a href="#2a" data-toggle="tab">'+value.tab2.text+'</a></li>' +
            '<li role="presentation"><a href="#3a" data-toggle="tab">'+value.tab3.text+'</a></li>' +
            '</ul>'; //TODO: tab target
        return html;
    },
    'menu': function(value) {
        if (!value){
            var html = '<div class="btn-group display_component" role="group">' +
                '<a type="button" class="btn btn-default" role="button" href="#">Item 1</a>' +
                '<a type="button" class="btn btn-default" role="button" href="#">Item 2</a>' +
                '<a type="button" class="btn btn-default" role="button" href="#">Item 3</a>' +
                '</div>';
            return html;
        }
        var html = '<div class="btn-group display_component" role="group">' +
            '<a type="button" class="btn btn-default" role="button" href="'+value.menu_item1.value+'">'+value.menu_item1.text+'</a>' +
            '<a type="button" class="btn btn-default" role="button" href="'+value.menu_item2.value+'">'+value.menu_item2.text+'</a>' +
            '<a type="button" class="btn btn-default" role="button" href="'+value.menu_item3.value+'">'+value.menu_item3.text+'</a>' +
            '</div>';
        return html;
    },
    'image': function(value) {
        if (!value){
            return '<img src="images/image_icon.png" width="15px" height="15px">';
        }
        return '<img src="'+value.img_src+'" width="'+cell_width+"px"+'" class="display_component">';
    },
    'panel': function(value) {
        if (!value){
            value = {heading: "Type heading...", content: "Type content..."};
        }
        return '<div class="panel panel-default display_component">'+
            '<div class="panel-heading">'+
            '<h3 contenteditable="true" class="panel-title">'+value.heading+'</h3>'+
            '</div><div contenteditable="true" class="panel-body">'+value.content+'</div></div>';
    }
};

function Display(cell_id, html, callback) {
    var cell = document.getElementById(cell_id);
    var sp = document.createElement('span');
    sp.innerHTML = html;
    var html_ = sp.firstElementChild;
    cell.insertBefore(html_, cell.firstChild);
    if (callback) callback();
}