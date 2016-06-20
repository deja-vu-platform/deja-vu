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
    selectedProject = new UserProject(name, 1, version, author);
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
