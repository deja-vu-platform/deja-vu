/**
 * Created by Shinjini on 6/20/2016.
 */

// TODO difference between project name and filename? .json vs sans .json?
var selectedProject;
//var fs = require('fs');
//var path = require('path');

// TODO get path emitted by main
var projectsSavePath = path.join(__dirname, 'projects');

var availableProjects = {};
var currentProject;

var componentToShow;
//TODO implement recent vs all

// Initialization
$(function () {
    /*
        1. In main.js, create a new directory for the files on load of the app (if there isn't one)
        2. Look at all the available files in that directory, and display it for opening
        3. On click, save which project is selected (local storage or query strin) and shift to the
            main view of that project

        window.localStorage - stores data with no expiration date
        window.sessionStorage - stores data for one session (data is lost when the browser tab is closed)

     */
    currentProject = window.sessionStorage.getItem('selectedProject');

    if (currentProject){
        currentProject = JSON.parse(currentProject);
        var currentProjectLink = document.createElement('a');
        $('.current-project .content').html('').append(currentProjectLink);
        $(currentProjectLink).text(currentProject.meta.name);
        displayProjectPreview(currentProject);
    }

    readFiles(projectsSavePath, function(filename, content) {
        // TODO add a loading projects sign
        // Check the types to only add projects
        var content = JSON.parse(content);
        if (content.objectType && (content.objectType === 'UserProject')){
            availableProjects[filename] = content;
            // TODO sanitise filename!
            var projectLink = '<li><div class="project-filename" data-filename="'+filename+'">' +
                    // sanitizing display because that's where the injections can play
                '<div class="project-name">'+sanitizeStringOfSpecialChars(filenameToProjectName(filename))+'</div>' +
                '</div></li>';
            $('#recent-projects-list').append(projectLink);
            addLoadProjectButton(filename);
            addDeleteProjectButton(projectsSavePath, filename, content.meta.id);
        }
    }, function(err) {
        throw err;
        // handle errors
    });

});


// TODO on project name input *check* for special chars
// TODO something about rewriting existing files?
// TODO on project name input *check* for name being reused

$('#create-project').on('click', function () {
    selectedProject = initNewProject();
    resetMenuOptions();
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));

    window.location = 'index.html';
});

$('.current-project').on('click', 'a', function(e){
    e.preventDefault();
    window.location = 'index.html';
});

$('.current-project').on('click', '.content', function(){
    console.log('hi');
    if (currentProject){
        displayProjectPreview(currentProject);
    } else {
        $('#table-container-preview').html('');
    }

});


$('.recent-projects').on('click', '.project-name', function(){
    var filename = $(this).parent().data('filename');
    selectedProject = availableProjects[filename];
    displayProjectPreview(selectedProject);


    // TODO add a load button

    //window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
    //window.location = 'index.html';
});

function addLoadProjectButton(filename){
    var spLoad = document.createElement('span');
    spLoad.innerHTML = '<button type="button" class="btn btn-default btn-load-project">' +
            //'<span>Delete User Component </span>' +
        '<span>Load Project</span>' +
        '</button>';

    var buttonLoadProject = spLoad.firstChild;

    $(buttonLoadProject).on("click", function () {
        selectedProject = availableProjects[filename];
        window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
        window.location = 'index.html';
    });

    $(".recent-projects").find("[data-filename='" + filename + "']").append(buttonLoadProject).hover(
        function(){
            $(this).find('.project-name').css({
                width: '50%'
            });
            $(this).find('.btn-load-project').css({
                display: 'inline-block',
                'vertical-align': 'top',
            });
        }, function(){
            $(this).find('.project-name').css({
                width: '100%'
            });
            $(this).find('.btn-load-project').css({
                display: 'none',

            });
        }
    );

}


function displayProjectPreview(project){
    // TODO make it select the main component
    // TODO Also, have a way to click to change to another view?
    var componentToShowId = Object.keys(project.components)[0];
    componentToShow = project.components[componentToShowId];

    $('#project-name-preview').text('Project Preview: '+project.meta.name);

    loadTablePreview(componentToShow);
}


/**
 * Creates a new Project based on user inputs
 * @param isDefault
 * @constructor
 */
function initNewProject() {
    var projectName = sanitizeStringOfSpecialChars($('#new-project-name').val());
    var version = $('#project-version').val();
    var author = $('#project-author').val();

    // create a copy instead
    var copyName = projectName;
    var copyNum = 0;
    // TODO should give user warning or options
    while(isCopyOfFile(projectsSavePath, copyName+'.json')){
        if (copyNum == 0){
            copyName = projectName + ' - Copy';
        } else {
            copyName = projectName + ' - Copy ' + copyNum;
        }
        copyNum++;
    }
    var newProject = new UserProject(copyName, generateId(copyName), version, author);

    // This will actually be saved after it's fully loaded (with a first component, etc) in the
    // components page
    //saveObjectToFile(projectsSavePath, projectNameToFilename(copyName), newProject);
    return newProject;

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

// from http://stackoverflow.com/questions/10049557/reading-all-files-in-a-directory-store-them-in-objects-and-send-the-object
// TODO should these calls be synch?
function readFiles(dirname, onFileContent, onError) {
    fs.readdir(dirname, function(err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function(filename) {
            fs.readFile(path.join(dirname, filename), 'utf-8', function(err, content) {
                if (err) {
                    onError(err);
                    return;
                }
                onFileContent(filename, content);
            });
        });
    });
}


function deleteFile(dirname, filename){
    var pathName = path.join(dirname, filename);
    fs.stat(pathName, function (err, stats) {
        if (err) {
            return console.error(err);
        }
        fs.unlink(pathName,function(err){
            if(err) return console.log(err);
        });
    });
}


function deleteFileAndDisplay(dirname, filename, id){
    deleteFile(dirname, filename);
    $(".recent-projects").find("[data-filename='" + filename + "']").parent().remove();

    if (currentProject){
        if (currentProject.meta.id === id){
            currentProject = null;
            window.sessionStorage.setItem('selectedProject', '');
            $('.current-project .content').html('');
            $('#table-container-preview').html('');
            $('#project-name-preview').html('');
        }
    }
}


function addDeleteProjectButton(dirname, filename, id){
    var spDelete = document.createElement('span');
    spDelete.innerHTML = '<button type="button" class="btn btn-default btn-delete-project">' +
            //'<span>Delete User Component </span>' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</button>';

    var buttonDeletProject = spDelete.firstChild;
    buttonDeletProject.id = 'btn-delete-project_'+id;

    $(buttonDeletProject).on("click", function (e) {
        // todo add safety
        openDeleteProjectConfirmDialogue(dirname, filename, id);
    });



    $(".recent-projects").find("[data-filename='" + filename + "']").append(buttonDeletProject).hover(
        function(){
            $(this).find('.project-name').css({
                width: '50%'
            });
            $(this).find('.btn-delete-project').css({
                display: 'inline-block',
                'vertical-align': 'top',
            });
        }, function(){
            $(this).find('.project-name').css({
                width: '100%'
            });
            $(this).find('.btn-delete-project').css({
                display: 'none',

            });
        }
    );

}

function openDeleteProjectConfirmDialogue(dirname, filename, id){
    $('#confirm-delete-project').modal('show');

    var projectName = filenameToProjectName(filename);
    $('#delete-project-name').text(projectName);

    $('#delete-project-btn').click(function(){
        deleteFileAndDisplay(dirname, filename, id);

        $('#delete-project-name').text('');
        $('#confirm-delete-project').modal('hide');

    });

    $('#delete-project-cancel-btn').click(function(){
        $('#delete-project-name').text('');
        $('#confirm-delete-project').modal('hide');

    });

    $('#confirm-delete-project .close').click(function(event){
        event.preventDefault();

        $('#delete-project-name').text('');
        $('#confirm-delete-project').modal('hide');
    });

};

