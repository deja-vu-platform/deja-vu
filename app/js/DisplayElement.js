/**
 * Display element in cell
 */
var getHTML = {
    'label': function(value) {
        return '<p class="label display_component">'+value+'</p>';
    },
    'link': function(value) {
        return '<a class="link display_component" href="'+value.target+'">'+value.link_text+'</a>';
    },
    'tab_viewer': function(value) {
        var html = '<ul class="nav nav-pills nav-stacked">' +
            '<li role="presentation" class="active"><a href="#1a" data-toggle="tab">'+value.tab1.text+'</a></li>' +
            '<li role="presentation"><a href="#2a" data-toggle="tab">'+value.tab2.text+'</a></li>' +
            '<li role="presentation"><a href="#3a" data-toggle="tab">'+value.tab3.text+'</a></li>' +
            '</ul>'; //TODO: tab target
        return html;
    },
    'menu': function(value) {
        var html = '<div class="dropdown"> ' +
            '<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" ' +
            'data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">Menu' +
            '<span class="caret"></span></button>' +
            '<ul class="dropdown-menu" aria-labelledby="dropdownMenu1">' +
            '<li><a href="'+value.menu_item1.value+'">'+value.menu_item1.text+'</a></li>' +
            '<li><a href="'+value.menu_item2.value+'">'+value.menu_item2.text+'</a></li>' +
            '<li><a href="'+value.menu_item3.value+'">'+value.menu_item3.text+'</a></li>' +
            '</ul>' +
            '</div>';
        return html;
    },
    'image': function(value) {
        return '<img src="'+value.img_src+'">';
    }
};

function Display(cell_id, html) {
    var cell = document.getElementById(cell_id);
    var sp = document.createElement('span');
    sp.innerHTML = html;
    var html_ = sp.firstElementChild;
    cell.insertBefore(html_, cell.firstChild);
}