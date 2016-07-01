/**
 * Created by Shinjini on 6/30/2016.
 */


// TODO
// We will have a cliche div
// with a name, a description and a preview
// for now precedurally generally a bunch
// we can then import them into our index page


$(function(){
    selectedProject = window.sessionStorage.getItem('selectedProject');

    $('.project-name .header').text(JSON.parse(selectedProject).meta.name);

    generateFakeCliches();
});

function clicheDisplaySkeleton(name, id, description, previewHTML){

    var skeleton = 
        '<div class="cliche-component-container" id="'+id+'">' +
            '<div class="name-and-description-container">' +
                '<div class="cliche-component-name-and-check">'+
                    '<input type="checkbox" id="check_'+id+'">' +
                    '<div class="cliche-component-name">'+name+'</div>' +
                '</div>' +
                '<div class="cliche-component-description">'+description+'</div>' +
            '</div>' +
            '<div class="preview-container">'+previewHTML+'</div>'+
        '</div>';

    return skeleton;
}

function generateFakeCliches(){ // For now
    var numCliches = 100;

    for (var i = 0; i<numCliches; i++){
        var name = 'fakeCliche_'+i;
        var id = i;
        var description =
            'This is a fake cliche to test the functionality of the cliche page. ' +
            'Nulla vehicula eros in sapien posuere, eu luctus odio molestie. Praesent ' +
            'vestibulum justo quis ipsum tempus finibus. Sed egestas consectetur lectus, ' +
            'ac luctus est faucibus vel. Interdum et malesuada fames ac ante ipsum primis ' +
            'in faucibus. Etiam ut augue consequat, consectetur purus sit amet, fringilla ' +
            'eros. Duis bibendum sem at nisi fermentum imperdiet. Fusce egestas elit quis ' +
            'iaculis pharetra.'
        var html = '<img src="images/lock_icon.png">'
        var skeleton = clicheDisplaySkeleton(name, id, description, html);
        $('#all-cliche-container').append(skeleton);
    }
}