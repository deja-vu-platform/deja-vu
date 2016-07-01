/**
 * Created by Shinjini on 6/30/2016.
 */

var numFakeCliches = 100;
var clichesPerPage = 5;

$(function(){
    addPagination();
    generateFakeClichesBulk(1, clichesPerPage);

    selectedProject = JSON.parse(window.sessionStorage.getItem('selectedProject')); // TODO we assume that this
                                                                                    // TODO will exist but shout enforce it!
    for (var id in selectedProject.addedCliches) {
        showClicheInList(id, selectedProject.addedCliches[id]);
        checkBoxes(id);
    }

    $('.project-name .header').text(selectedProject.meta.name);

});

function clicheDisplaySkeleton(name, id, description, previewHTML){
    var skeleton =
        '<div class="cliche-component-container" id="cliche_'+id+'">' +
            '<div class="name-and-description-container">' +
                '<div class="cliche-component-name-and-check">'+
                    '<input type="checkbox" id="check_'+id+'" data-checked="'+false+'">' +
                    '<div class="cliche-component-name">'+name+'</div>' +
                '</div>' +
                '<div class="cliche-component-description">'+description+'</div>' +
            '</div>' +
            '<div class="preview-container">'+previewHTML+'</div>'+
        '</div>';

    return skeleton;
}

/**
 * start, end inclusive
 * @param start
 * @param end
 */
function generateFakeClichesBulk(start, end){
    $('#all-cliches').html('');
    for (var i = start; i<=end; i++) {
        generateFakeCliches(i);
    }
}

function generateFakeCliches(id){ // For now
        var name = 'Fake Cliche #'+id;
        var description =
            'This is a fake cliche to test the functionality of the cliche page. ' +
            'Nulla vehicula eros in sapien posuere, eu luctus odio molestie. Praesent ' +
            'vestibulum justo quis ipsum tempus finibus. Sed egestas consectetur lectus, ' +
            'ac luctus est faucibus vel. Interdum et malesuada fames ac ante ipsum primis ' +
            'in faucibus. Etiam ut augue consequat, consectetur purus sit amet, fringilla ' +
            'eros. Duis bibendum sem at nisi fermentum imperdiet. Fusce egestas elit quis ' +
            'iaculis pharetra.';
        var html = '<img src="images/image_icon.png">';
        var skeleton = clicheDisplaySkeleton(name, id, description, html);
        $('#all-cliches').append(skeleton);
}


$('#all-cliche-container').on('click', 'input[type=checkbox]', function(){
    var checked = $(this).data('checked');
    var id = this.id.split('_')[1];
    var name = $(this).parent().find('.cliche-component-name').text();
    if (checked){
        // uncheck
        removeClicheFromList(id);
        if ($('#selected-cliches-radio').prop('checked')){ //if in selected section, get rid of it!
            $(this).parent().parent().parent().remove(); // TODO find a more robust way to do this
        }
    } else {
        // check
        addClicheToListAndShow(id, name);
    }
    $(this).data('checked', !checked);

    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));

});

function addClicheToListAndShow(id, name){
    selectedProject.addedCliches[id] = name;
    showClicheInList(id, name);
}

function showClicheInList(id, name){
    var addedCliche = '<li id="added_'+id+'">'+name+'</li>';
    $('.content ul').append(addedCliche);
}

function removeClicheFromList(id){
    delete selectedProject.addedCliches[id];
    $('.content ul').find('#added_'+id).remove();
}

function checkBoxes(id){
    $('#all-cliche-container').find('#check_'+id).prop("checked", true).data('checked', true);
}


$('#all-cliches-radio').change(function(){
    var checked = $(this).prop('checked');
    if (checked){
        $('#pagination-holder').css('visibility','visible');
        var id = $('.pagination .active').get(0).id.split('_')[1];
        var start = (id-1)*clichesPerPage+1;
        var end = id*clichesPerPage;
        generateFakeClichesBulk(start, end);
        for (var id in selectedProject.addedCliches) {
            checkBoxes(id);
        }
    }

});

$('#selected-cliches-radio').change(function(){
    var checked = $(this).prop('checked');
    if (checked){
        $('#all-cliches').html('');
        for (var id in selectedProject.addedCliches) {
            generateFakeCliches(id);
            checkBoxes(id);
        }
        $('#pagination-holder').css('visibility','hidden');
    }
});

function addPagination(){
    var numPages = Math.ceil(numFakeCliches/clichesPerPage);
    var paginationUL = document.createElement('ul');
    paginationUL.className = 'pagination';
    for (var i = 1; i<= numPages; i++){
        if (i===1){
            var page = '<li id="page_'+i+'" class="active"><a href="#"  >'+i+'</a></li>';
        } else {
            var page = '<li id="page_'+i+'"><a href="#"  >'+i+'</a></li>';
        }
        $(paginationUL).append(page);
    }
    $('#pagination-holder').append(paginationUL);
}

$('#pagination-holder').on('click', 'li', function(){
    var id = this.id.split('_')[1];
    $('#pagination-holder .active').removeClass('active');
    $(this).addClass('active');
    var start = (id-1)*clichesPerPage+1;
    var end = id*clichesPerPage;
    generateFakeClichesBulk(start, end);
    for (var id in selectedProject.addedCliches) {
        checkBoxes(id);
    }
});