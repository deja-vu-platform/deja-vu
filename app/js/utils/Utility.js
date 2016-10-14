var fs = require('fs');
var path = require('path');

// special characters not allowed in inputs
//var regex = /[`~!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/gi;
var regex = /[^\w\s\-]/gi;

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

function getRowColFromId(id){
    var rowcol = id.split('_');
    var row = rowcol[rowcol.length - 2];
    var col = rowcol[rowcol.length - 1];
    return {row:row,col:col}
}

function getComponentIdFromContainerId(id){
    var split = id.split('_');
    return split[split.length - 1]
}

function sanitizeStringOfSpecialChars(string){
    // from http://stackoverflow.com/questions/4374822/javascript-regexp-remove-all-special-characters
    // edited to include _ and -
    var outString = string.replace(regex, '');
    // some javascript bs http://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc
    regex.lastIndex= 0;
    return outString;
}

function checkStringForSpecialChars(string){
    // from http://stackoverflow.com/questions/4374822/javascript-regexp-remove-all-special-characters
    var matches = regex.test(string);
    // some javascript bs http://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc
    regex.lastIndex= 0;
    return matches;
}


function downloadObject(filename, obj) {
    var element = document.createElement('a');
    var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));

    element.setAttribute('href', data);
    element.setAttribute('download', filename);

    element.click();
}

function saveObjectToFile(dirname, filename, object){
    // Asynch
    var pathName = path.join(dirname, filename);
    fs.writeFile(pathName, JSON.stringify(object),function(err){
        if(err) return console.log(err);
        return true;
    });
}

function isCopyOfFile(dirname, filename){
    var pathName = path.join(dirname, filename);
    try {
        var stats = fs.statSync(pathName);
        return true;
    }
    catch (err) {
        return false;
    }
}


function projectNameToFilename(projectName){
    return projectName+'.json';
}

function filenameToProjectName(filename){
    return filename.split('.').slice(0, -1).join('.')
}


/**
 * Saves the file and the sets a timer to save the file every 5 minutes
 */
function autoSave5Mins(){ // every 5 minutes
    console.log('saving!');
    // update the session stored project too
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
    saveObjectToFile(projectsSavePath, projectNameToFilename(selectedProject.meta.name), selectedProject);
    setTimeout(function(){
        autoSave5Mins();
    }, 300000);
}