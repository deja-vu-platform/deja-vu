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
    var currentProject = window.sessionStorage.getItem('selectedProject');

    if (currentProject){
        $('.current-project .content').html('<a href="projectView">'+JSON.parse(currentProject).meta.name + '</a>');
    } else {
        $('.current-project').css({
            //display: 'none'
        })
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
            addDeleteProjectButton(projectsSavePath, filename);
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

$('.current-project').on('click', 'a', function(){
    window.location = 'index.html';
});


$('.recent-projects').on('click', '.project-name', function(){
    var filename = $(this).parent().data('filename');
    selectedProject = availableProjects[filename];
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
    //console.log( window.sessionStorage.getItem('selectedProject'));
    window.location = 'index.html';
});


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
    saveObjectToFile(projectsSavePath, projectNameToFilename(copyName), newProject);
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


function deleteFileAndDisplay(dirname, filename){
    deleteFile(dirname, filename);
    $(".recent-projects").find("[data-filename='" + filename + "']").parent().remove();
}


function addDeleteProjectButton(dirname, filename){
    var spDelete = document.createElement('span');
    spDelete.innerHTML = '<button type="button" class="btn btn-default btn-delete-project">' +
            //'<span>Delete User Component </span>' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</button>';

    var buttonDeletProject = spDelete.firstChild;
    buttonDeletProject.id = 'btn-delete-project_'+filename;

    $(buttonDeletProject).on("click", function (e) {
        // todo add safety
        openDeleteProjectConfirmDialogue(dirname, filename);
    });



    $(".recent-projects").find("[data-filename='" + filename + "']").append(buttonDeletProject).hover(
        function(){
            $(this).find('.project-name').css({
                width: '70%'
            });
            $(this).find('.btn-delete-project').css({
                display: 'inline-block',
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

function openDeleteProjectConfirmDialogue(dirname, filename){
    var projectName = filenameToProjectName(filename);
    $('#confirm-delete-project').modal('show');
    $('#delete-project-name').text(projectName);
    $('#delete-project-btn').data('deleteProjectDirname', dirname).data('deleteFilename', filename);
};

$('#delete-project-btn').click(function(){
    var filename =  $('#delete-project-btn').data('deleteFilename');
    var projectDirname =  $('#delete-project-btn').data('deleteProjectDirname');
    deleteFileAndDisplay(projectDirname, filename);

    $('#delete-project-btn').data('deleteFilename', '');
    $('#delete-project-btn').data('deleteProjectDirname', '');

    $('#delete-project-name').text('');
});

$('#delete-project-cancel-btn').click(function(){
    $('#delete-project-btn').data('deleteFilename', '');
    $('#delete-project-btn').data('deleteProjectDirname', '');

    $('#delete-project-name').text('');
});

$('#confirm-delete-project .close').click(function(event){
    event.preventDefault();
    $('#delete-project-btn').data('deleteFilename', '');
    $('#delete-project-btn').data('deleteProjectDirname', '');
    $('#confirm-delete-project').modal('hide');

    $('#delete-project-name').text('');
});


function projectNameToFilename(projectName){
    return projectName+'.json';
}

function filenameToProjectName(filename){
    return filename.split('.').slice(0, -1).join('.')
}