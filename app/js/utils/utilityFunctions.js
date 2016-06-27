// special characters not allowed in inputs
//var regex = /[`~!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/gi;
var regex = /[^\w\s\-.]/gi;

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