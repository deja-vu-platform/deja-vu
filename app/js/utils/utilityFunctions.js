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
