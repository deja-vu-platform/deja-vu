/**
 * Created by Shinjini on 6/30/2016.
 */


// TODO
// We will have a cliche div
// with a name, a description and a preview
// for now precedurally generally a bunch
// we can then import them into our index page

var addedCliches;

$(function(){
    generateFakeCliches100();

    selectedProject = window.sessionStorage.getItem('selectedProject');
    addedCliches = window.sessionStorage.getItem('addedCliches');
    if (addedCliches) {
        addedCliches = JSON.parse(addedCliches);

        for (var id in addedCliches) {
            showClicheInList(id, addedCliches[id]);
            checkBoxes(id);
        }

    } else {
        addedCliches = {};
    }

    $('.project-name .header').text(JSON.parse(selectedProject).meta.name);

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

function generateFakeCliches100(){
    for (var i = 0; i<100; i++) {
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
    window.sessionStorage.setItem('addedCliches', JSON.stringify(addedCliches));

});

function addClicheToListAndShow(id, name){
    addedCliches[id] = name;
    showClicheInList(id, name);
}

function showClicheInList(id, name){
    var addedCliche = '<li id="added_'+id+'">'+name+'</li>';
    $('.content ul').append(addedCliche);
}

function removeClicheFromList(id){
    delete addedCliches[id];
    $('.content ul').find('#added_'+id).remove();
}

function checkBoxes(id){
    $('#all-cliche-container').find('#check_'+id).prop("checked", true).data('checked', true);
}


$('#all-cliches-radio').change(function(){
    var checked = $(this).prop('checked');
    if (checked){
        $('#all-cliches').html('');
        generateFakeCliches100();
        for (var id in addedCliches) {
            checkBoxes(id);
        }
    }


});

$('#selected-cliches-radio').change(function(){
    var checked = $(this).prop('checked');
    if (checked){
        $('#all-cliches').html('');
        for (var id in addedCliches) {
            generateFakeCliches(id);
            checkBoxes(id);
        }
    }
});

