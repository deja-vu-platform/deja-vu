/**
 * Created by Shinjini on 6/20/2016.
 */

// TODO difference between project name and filename? .json vs sans .json?
var selectedProject;
//var fs = require('fs');
//var path = require('path');

// TODO get path emitted by main
var projectsSavePath = path.join(__dirname, 'projects');

var availableProjectsByFilename = {};
var availableProjectsByAccessTime = {};
var recentProjectsByAccessTime = {};

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
    } else {
        $('.current-project').css('display', 'none');
        $('#project-name-preview').text('Project Preview')
    }


    readFiles(projectsSavePath, function(filename, content) {
        // TODO add a loading projects sign
        // Check the types to only add projects
        var content = JSON.parse(content);
        if (content.objectType && (content.objectType === 'UserProject')){
            availableProjectsByFilename[filename] = content;
            // TODO for now, recent is one week
            var lastAccessed = (new Date(content.lastAccessed)).getTime();
            var now = (new Date()).getTime();
            availableProjectsByAccessTime[lastAccessed] = {content:content, filename: filename};
            if ((now-lastAccessed) < 604800000){ // two weeks is 1209600000
                recentProjectsByAccessTime[lastAccessed] = {content:content, filename: filename};
            }

        }
    }, function(err) {
        throw err;
        // handle errors
    }, function(){
        displayRecentProjects();
    });

    // finish load animation
    $('.loader-container').fadeOut("fast");

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
    window.location = 'index.html';
});

$('.current-project').on('click', '.content', function(){
    if (currentProject){
        displayProjectPreview(currentProject);
    } else {
        $('#table-container-preview').html('');
    }

});


$('.recent-projects').on('click', '.project-name', function(){
    var filename = $(this).parent().data('filename');
    selectedProject = availableProjectsByFilename[filename];
    $('.highlighted').removeClass('highlighted');
    $(this).parent().parent().addClass('highlighted');
    displayProjectPreview(selectedProject);
});

function addLoadProjectButton(filename){
    var spLoad = document.createElement('span');
    spLoad.innerHTML = '<button type="button" class="btn btn-default btn-load-project">' +
        '<span>Load Project</span>' +
        '</button>';

    var buttonLoadProject = spLoad.firstChild;

    $(buttonLoadProject).on("click", function () {
        selectedProject = availableProjectsByFilename[filename];
        selectedProject.lastAccessed = new Date();
        window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
        window.location = 'index.html';
    });

    $(".recent-projects").find("[data-filename='" + filename + "']").append(buttonLoadProject).parent().hover(
        function(){
            $(this).find('.project-name').css({
                width: '50%'
            });
            $(this).find('.btn-load-project').css({
                display: 'inline-block',
                'vertical-align': 'top',
            });
            $(this).find('.last-access-time').css({
                display: 'none',
            })

        }, function(){
            $(this).find('.project-name').css({
                width: '100%'
            });
            $(this).find('.btn-load-project').css({
                display: 'none',
            });

            $(this).find('.last-access-time').css({
                display: 'block',
            })
        }
    );

}


function displayProjectPreview(project){
    // TODO make it select the main component
    // TODO Also, have a way to click to change to another view?
    $('#project-name-preview').text('Project Preview: '+project.meta.name)
    $('#preview-prev-page').unbind();
    $('#preview-next-page').unbind();


    if (!$.isEmptyObject(project.mainComponents)){
        var componentToShowId = Object.keys(project.mainComponents)[0];
        var numMainPages = Object.keys(project.mainComponents).length;
        if (numMainPages>1){
            $('#table-container-preview').css('width', '790px');
            $('#preview-prev-page').css('display', 'inline-block');
            $('#preview-next-page').css('display', 'inline-block');
        } else {
            $('#table-container-preview').css('width', '850px');
            $('#preview-prev-page').css('display', 'none');
            $('#preview-next-page').css('display', 'none');
        }

        componentToShow = project.components[componentToShowId];
        loadTablePreview(componentToShow);

        $('#table-container-preview').data('pagenum', 0);

        $('#preview-prev-page').click(function(){
            var pageNum = $('#table-container-preview').data('pagenum');
            showPrevMainPage(project, pageNum);
        });

        $('#preview-next-page').click(function(){
            var pageNum = $('#table-container-preview').data('pagenum');
            showNextMainPage(project, pageNum);
        });


    } else {
        $('#preview-prev-page').css('display', 'none');
        $('#preview-next-page').css('display', 'none');
        $('#table-container-preview').css('width', '850px').text("This project does not have a main page yet...");
    }

}

function showNextMainPage(project, currentPageNumber){
    var numMainPages = Object.keys(project.mainComponents).length;
    var nextPageNum = (currentPageNumber+1)%(numMainPages);
    var componentToShowId = Object.keys(project.mainComponents)[nextPageNum];
    componentToShow = project.components[componentToShowId];
    loadTablePreview(componentToShow);
    $('#table-container-preview').data('pagenum', nextPageNum);

}
function showPrevMainPage(project, currentPageNumber){
    var numMainPages = Object.keys(project.mainComponents).length;
    var prevPageNum = (currentPageNumber-1+numMainPages)%(numMainPages);
    var componentToShowId = Object.keys(project.mainComponents)[prevPageNum];
    componentToShow = project.components[componentToShowId];
    loadTablePreview(componentToShow);
    $('#table-container-preview').data('pagenum', prevPageNum);
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
function readFiles(dirname, onFileContent, onError, onFinish) {
    fs.readdir(dirname, function(err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        var numFilesProcessed = 0;
        filenames.forEach(function(filename) {
            fs.readFile(path.join(dirname, filename), 'utf-8', function(err, content) {
                if (err) {
                    onError(err);
                    return;
                }
                onFileContent(filename, content);
                numFilesProcessed++;
                if(numFilesProcessed===filenames.length){
                    onFinish();
                }
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
            window.sessionStorage.removeItem('selectedProject');
            $('.current-project .content').html('')
            $('.current-project').css('display', 'none');
            $('#table-container-preview').html('');
            $('#project-name-preview').text('Project Preview')
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



    $(".recent-projects").find("[data-filename='" + filename + "']").append(buttonDeletProject).parent().hover(
        function(){
            $(this).find('.project-name').css({
                width: '50%'
            });
            $(this).find('.btn-delete-project').css({
                display: 'inline-block',
                'vertical-align': 'top',
            });

            $(this).find('.last-access-time').css({
                display: 'none',
            })
        }, function(){
            $(this).find('.project-name').css({
                width: '100%'
            });
            $(this).find('.btn-delete-project').css({
                display: 'none',

            });

            $(this).find('.last-access-time').css({
                display: 'block',
            })
        }
    );

}

function openDeleteProjectConfirmDialogue(dirname, filename, id){
    $('#confirm-delete-project').modal('show');

    var projectName = filenameToProjectName(filename);
    $('#delete-project-name').text(projectName);

    $('#delete-project-btn').unbind();
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

}

function displayRecentProjects(){
    $('#recent-projects-list').html('');
    var lastAccessedTimes = Object.keys(recentProjectsByAccessTime);
    lastAccessedTimes.sort().reverse();
    for (var i = 0; i<lastAccessedTimes.length; i++){
        var lastAccessed = parseInt(lastAccessedTimes[i]);
        var filename = recentProjectsByAccessTime[lastAccessed].filename;
        var content = recentProjectsByAccessTime[lastAccessed].content;
        showProjectInList(filename, content.meta.id, lastAccessed);
        addLoadProjectButton(filename);
        addDeleteProjectButton(projectsSavePath, filename, content.meta.id);
    }
}


function displayAllProjects(){
    $('#recent-projects-list').html('');
    var lastAccessedTimes = Object.keys(availableProjectsByAccessTime);
    lastAccessedTimes.sort().reverse();
    for (var i = 0; i<lastAccessedTimes.length; i++){
        var lastAccessed = parseInt(lastAccessedTimes[i]);
        var filename = availableProjectsByAccessTime[lastAccessed].filename;
        var content = availableProjectsByAccessTime[lastAccessed].content;
        showProjectInList(filename, content.meta.id, lastAccessed);
        addLoadProjectButton(filename);
        addDeleteProjectButton(projectsSavePath, filename, content.meta.id);
    }
}

function showProjectInList(filename, id, lastAccessed){
    // TODO sanitise filename!
    var projectLink = document.createElement('li');
    projectLink.innerHTML = '<div class="project-filename" data-filename="'+filename+'">' +
        // sanitizing display because that's where the injections can play
        '<div class="project-name">'+sanitizeStringOfSpecialChars(filenameToProjectName(filename))+'</div>' +
        '<div class="last-access-time">' +
            'Last Accessed: '+(new Date(lastAccessed)).toLocaleDateString() +
            ' at '+(new Date(lastAccessed)).toLocaleTimeString()+
        '</div>'+
        '</div>';
    $('#recent-projects-list').append(projectLink);

    if (currentProject){
        if (id == currentProject.meta.id){
            $(projectLink).addClass('highlighted');
        }
    }
}



$('#recent-selector').click(function(){
    $(this).parent().find('.active').removeClass('active');
    $(this).addClass('active');
    displayRecentProjects();
});

$('#all-selector').click(function(){
    $(this).parent().find('.active').removeClass('active');
    $(this).addClass('active');
    displayAllProjects();
});
