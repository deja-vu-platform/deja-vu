/**
 * Created by Shinjini on 6/20/2016.
 */
var selectedProject;

// Initialization
$(function () {
});


$('#create-project').on('click', function () {
    initNewProject();
    resetMenuOptions();
});

/**
 * Creates a new Project based on user inputs
 * @param isDefault
 * @constructor
 */
function initNewProject() {
    var name = $('#new-project-name').val();
    var version = $('#project-version').val();
    var author = $('#project-author').val();
    return new UserProject(name, generateId(name), version, author);
}

/**
 * Resets the menu options to their default values
 */
function resetMenuOptions() {
    $('#new-project-name').val('');
    $('#project-version').val('');
    $('#project-author').val('');

    $('#project-json').val('');
}


function stringHash(string){
    var hash = 0;
    if (string.length == 0) return hash;
    for (var i = 0; i < string.length; i++) {
        var char = string.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function generateId(name){
    var nameHash = stringHash(name);
    return (nameHash%997) + Math.floor(Math.random()*1000)*1000;
}
