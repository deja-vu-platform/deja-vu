// This file mostly has the initialization and functions that help with
// the display and interaction handling

var view = Display();
var miniNav = MiniNav();
var componentContainerMaker = ComponentContainerMaker();
var workSurface = WorkSurface();

var projectsSavePath = path.join(__dirname, 'projects');
var addedCliches;
var navZoom = .1;
var navDragging = false;

var selectedScreenSizeHeight = 1600;
var selectedScreenSizeWidth = 2000;

var draggingComponent = null;


/** ** ** ** ** ** Menu Related Functions ** ** ** ** ** **/

/**
 * Resets the menu options to their default values
 */
function resetMenuOptions() {
    $('#new-component-name').val('');
    $('#component-version').val('');
    $('#component-author').val('');

    $('#component-json').val('');
}

/** ** ** ** ** ** Mode Listeners ** ** ** ** ** ** ** ** **/
$('#build-mode').click(function(){
    if ($(this).hasClass('active')){
        return;
    }
    $(this).parent().find('.active').removeClass('active');
    $(this).addClass('active');
    $('.components').css({
        display: 'block',
    });
    $('.style').css({
        display: 'none',
    });
});

$('#style-mode').click(function(){
    if ($(this).hasClass('active')){
        return;
    }
    $(this).parent().find('.active').removeClass('active');
    $(this).addClass('active');
    $('.style').css({
        display: 'block',
    });
    $('.components').css({
        display: 'none',
    });
});

/** ** ** ** ** ** Components Event Handlers ** ** ** ** ** **/

$('#back-to-projects').click(function(event){
    event.preventDefault();
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject)); // save the updated project
    saveObjectToFile(projectsSavePath, projectNameToFilename(selectedProject.meta.name), selectedProject);
    window.location = 'projectView.html';
});

function resizeViewportToFitWindow(){
    var windowWidth = $('html').width();
    var newWidth = Math.max(860, windowWidth);
    $('#outer-container').css({
        width: (newWidth-250-17) + 'px',
    });

    $('.component-options').css({
        width: (newWidth-250-17) + 'px',
    });

    $('.inner-component-options').css({
        width: (newWidth-250-17) + 'px',
    });

    $('#zoom-nav-position').css({
        height: $('#outer-container').height()*navZoom + 'px',
        width: $('#outer-container').width()*navZoom + 'px',
    });
}

window.addEventListener("resize", function(){
    resizeViewportToFitWindow();
    window.setTimeout(resizeViewportToFitWindow, 100);
});



/** ** ** ** ** ** ** ** Show Cliche Components in List  ** ** ** ** ** ** ** **/
function showClicheInList(id, name){
    var addedCliche = '<li id="added_'+id+'">'+name+'</li>';
    $('.cliche-components ul').append(addedCliche);
}



// possible sources http://jscolor.com/, http://www.w3schools.com/colors/colors_picker.asp
// http://jscolor.com/examples/


// TODO this needs to be revamped entirely
var setUpStyleColors = function(){
    var pickerText = $('#pick-color-text-input')[0]._jscLinkedInstance;
    pickerText.fromString('000000');
    var pickerBG = $('#pick-color-bg-input')[0]._jscLinkedInstance;
    pickerBG.fromString('87CEFA');

    if (selectedUserComponent.properties.custom) {
        var overallStyles = selectedUserComponent.properties.custom;
        var textColor = overallStyles['color'] || '';
        pickerText.fromString(textColor);

        var bgColor = overallStyles['background-color'] || '';
        pickerBG.fromString(bgColor);
        $('#work-surface_'+selectedUserComponent.meta.id).css({
            'background-color': bgColor,
        });
    }
};


(function(){
    var inputText = $('#pick-color-text-input');
    var pickerText = new jscolor(inputText[0]);
    pickerText.closable = true;
    pickerText.closeText = 'X';
    inputText.change(function(){
        if (!selectedUserComponent.properties.custom){
            selectedUserComponent.properties.custom = {}
        }
        var color = pickerText.toHEXString();
        selectedUserComponent.properties.custom['color'] = color;

        for (var id in selectedUserComponent.components){
            var innerComponent = selectedUserComponent.components[id];
            if (!innerComponent.properties.overall){
                innerComponent.properties.overall = {};
            }
            innerComponent.properties.overall['color'] = color;
            refreshContainerDisplay('component-container_'+id, currentZoom);
        }

    });

    var inputBG = $('#pick-color-bg-input');
    var pickerBG = new jscolor(inputBG[0]);
    pickerBG.closable = true;
    pickerBG.closeText = 'X';
    inputBG.change(function(){
        if (!selectedUserComponent.properties.custom){
            selectedUserComponent.properties.custom = {}
        }
        var color = pickerBG.toHEXString();
        selectedUserComponent.properties.custom['background-color'] = color;
        $('#work-surface_'+selectedUserComponent.meta.id).css({
            'background-color': color,
        });

        for (var id in selectedUserComponent.components){
            var innerComponent = selectedUserComponent.components[id];
            if (!innerComponent.properties.overall){
                innerComponent.properties.overall = {};
            }
            innerComponent.properties.overall['background-color'] = color;
            refreshContainerDisplay('component-container_'+id, currentZoom);
        }

    });
})();


/*

////http://www.webdesignerdepot.com/2013/03/how-to-create-a-color-picker-with-html5-canvas/
// The color picker
var colorPickerCanvas = document.getElementById('color-picker').getContext('2d');

// create an image object and get it’s source
var img = new Image();
img.src = 'images/colorpicker.png';
//$(img).css({
//    width: '100px',
//    height: 'auto'
//});

// copy the image to the colorPickerCanvas
$(img).load(function(){
    colorPickerCanvas.drawImage(img,0,0);
});

// http://www.javascripter.net/faq/rgbtohex.htm
function rgbToHex(R,G,B) {return toHex(R)+toHex(G)+toHex(B)}
function toHex(n) {
    n = parseInt(n,10);
    if (isNaN(n)) return "00";
    n = Math.max(0,Math.min(n,255));
    return "0123456789ABCDEF".charAt((n-n%16)/16)  + "0123456789ABCDEF".charAt(n%16);
}
$('#color-picker').click(function(event){
    // getting user coordinates
    var x = event.pageX - $(this).offset().left;
    var y = event.pageY - $(this).offset().top;

    // getting image data and RGB values
    var img_data = colorPickerCanvas.getImageData(x, y, 1, 1).data;
    var R = img_data[0];
    var G = img_data[1];
    var B = img_data[2];  var rgb = R + ',' + G + ',' + B;
    // convert RGB to HEX
    var hex = rgbToHex(R,G,B);
    // making the color the value of the input
    //$('#rgb input').val(rgb).css({
    //    'background-color': '#' + hex,
    //});
    //$('#hex input').val('#' + hex).css({
    //    'background-color': '#' + hex,
    //});

    if (whoseColorToChange == 'text'){
        $('#pick-color-text-input').val('#' + hex).css({
            'background-color': '#' + hex,
        });
    } else if (whoseColorToChange == 'bg'){
        $('#pick-color-bg-input').val('#' + hex).css({
            'background-color': '#' + hex,
        });
    }


    $('#color-picker-container').hide();
});

var whoseColorToChange = '';

$('.pick-color').click(function(){
    if (this.id == 'pick-color-text'){
        whoseColorToChange = 'text';
    } else if (this.id == 'pick-color-bg'){
        whoseColorToChange = 'bg';
    }
    $('#color-picker-container').show();
});

$('#color-picker-dismiss').click(function(){
    $('#color-picker-container').hide();
});

$('.set-color').click(function(){
    if (this.id == 'set-color-text'){
        whoseColorToChange = 'text';
    } else if (this.id == 'set-color-bg'){
        whoseColorToChange = 'bg';
    }

    if (innerComponentFocused){
        var rowcol = getRowColFromId($('#display-cell').data('cellid'));
        var row = rowcol.row;
        var col = rowcol.col;
        if (whoseColorToChange == 'text'){
            var color = $('#pick-color-text-input').val();
            if (color == ''){
                return;
            }
            $('#pick-color-text-input').css({
                'background-color': color,
            });


            $('#cell'+'_'+row+'_'+col+' .display-component').css({
                color: color,
            });

            var innerComponent = selectedUserComponent.components[row][col];
            if (!innerComponent.properties.custom){
                innerComponent.properties.custom = {};
            }
            innerComponent.properties.custom['color'] = color;
        } else if (whoseColorToChange == 'bg'){
            var color = $('#pick-color-bg-input').val();
            if (color == ''){
                return;
            }
            $('#pick-color-bg-input').css({
                'background-color': color,
            });
            $('#cell'+'_'+row+'_'+col+' .display-component').css({
                'background-color': color,
            });
            var innerComponent = selectedUserComponent.components[row][col];
            if (!innerComponent.properties.custom){
                innerComponent.properties.custom = {};
            }
            innerComponent.properties.custom['background-color'] = color;
        }
        refreshContainerDisplay('display-cell');
    } else {
        if (whoseColorToChange == 'text'){
            var color = $('#pick-color-text-input').val();
            if (color == ''){
                return;
            }
            $('#pick-color-text-input').css({
                'background-color': color,
            });
            $('.display-component').css({
                color: color,
            });

            if (!selectedUserComponent.layout.overallStyles){
                selectedUserComponent.layout.overallStyles = {}
            };

            selectedUserComponent.layout.overallStyles['color'] = color;

            for (var row = 1; row<=numRows; row++){
                for (var col = 1; col<=numCols; col++){
                    if (selectedUserComponent.components[row]){
                        if (selectedUserComponent.components[row][col]){
                            var innerComponent = selectedUserComponent.components[row][col];
                            if (!innerComponent.properties.custom){
                                innerComponent.properties.custom = {};
                            }
                            innerComponent.properties.custom['color'] = color;
                        }
                    }
                }
            }
        } else if (whoseColorToChange == 'bg'){
            var color = $('#pick-color-bg-input').val();
            if (color == ''){
                return;
            }
            $('#pick-color-bg-input').css({
                'background-color': color,
            });
            $('#main-cell-table').css({
                'background-color': color,
            });

            if (!selectedUserComponent.layout.overallStyles){
                selectedUserComponent.layout.overallStyles = {}
            };
            selectedUserComponent.layout.overallStyles['background-color'] = color;

            for (var row = 1; row<=numRows; row++){
                for (var col = 1; col<=numCols; col++){
                    if (selectedUserComponent.components[row]){
                        if (selectedUserComponent.components[row][col]){
                            var innerComponent = selectedUserComponent.components[row][col];
                            if (!innerComponent.properties.custom){
                                innerComponent.properties.custom = {};
                            }
                            innerComponent.properties.custom['background-color'] = color;
                        }
                    }
                }
            }
        }
    }

});

$('.remove-color').click(function(){
    if (this.id == 'remove-color-text'){
        whoseColorToChange = 'text';
    } else if (this.id == 'remove-color-bg'){
        whoseColorToChange = 'bg';
    }

    if (innerComponentFocused){
        var rowcol = getRowColFromId($('#display-cell').data('cellid'));
        var row = rowcol.row;
        var col = rowcol.col;
        if (whoseColorToChange == 'text'){
            $('#pick-color-text-input').val('').css({
                'background-color': ''
            });

            $('#cell'+'_'+row+'_'+col+' .display-component').css({
                color: '',
            });
            var innerComponent = selectedUserComponent.components[row][col];
            if (!innerComponent.properties.custom){
                innerComponent.properties.custom = {};
            }
            if (innerComponent.properties.custom['color']){
                delete innerComponent.properties.custom['color'];
            }
        } else if (whoseColorToChange == 'bg'){
            $('#pick-color-bg-input').val('').css({
                'background-color': ''
            });
            $('#cell'+'_'+row+'_'+col+' .display-component').css({
                'background-color': '',
            });
            var innerComponent = selectedUserComponent.components[row][col];
            if (!innerComponent.properties.custom){
                innerComponent.properties.custom = {};
            }
            if (innerComponent.properties.custom['background-color']){
                delete innerComponent.properties.custom['background-color'];
            }
        }
        refreshContainerDisplay('display-cell');
    } else {
        if (whoseColorToChange == 'text'){
            $('#pick-color-text-input').val('').css({
                'background-color': ''
            });
            $('.display-component').css({
                color: '',
            });

            if (selectedUserComponent.layout.overallStyles){
                if (selectedUserComponent.layout.overallStyles['color']){
                    delete selectedUserComponent.layout.overallStyles['color'];
                }
            }
            for (var row = 1; row<=numRows; row++){
                for (var col = 1; col<=numCols; col++){
                    if (selectedUserComponent.components[row]){
                        if (selectedUserComponent.components[row][col]){
                            var innerComponent = selectedUserComponent.components[row][col];
                            if (!innerComponent.properties.custom){
                                innerComponent.properties.custom = {};
                            }
                            if (innerComponent.properties.custom['color']){
                                delete innerComponent.properties.custom['color'];
                            }
                        }
                    }
                }
            }
        } else if (whoseColorToChange == 'bg'){
            $('#pick-color-bg-input').val('').css({
                'background-color': ''
            });
            $('#main-cell-table').css({
                'background-color': '',
            });

            if (selectedUserComponent.layout.overallStyles){
                if (selectedUserComponent.layout.overallStyles['background-color']){
                    delete selectedUserComponent.layout.overallStyles['background-color'];
                }
            }

            for (var row = 1; row<=numRows; row++){
                for (var col = 1; col<=numCols; col++){
                    if (selectedUserComponent.components[row]){
                        if (selectedUserComponent.components[row][col]){
                            var innerComponent = selectedUserComponent.components[row][col];
                            if (!innerComponent.properties.custom){
                                innerComponent.properties.custom = {};
                            }
                            if (innerComponent.properties.custom['background-color']){
                                delete innerComponent.properties.custom['background-color'];
                            }
                        }
                    }
                }
            }
        }
    }

});

// function setUpStyleColors(){
//     if (innerComponentFocused) {
//         var rowcol = getRowColFromId($('#display-cell').data('cellid'));
//         var row = rowcol.row;
//         var col = rowcol.col;
//         var customStyles = selectedUserComponent.components[row][col].properties.custom;
//         var textColor = customStyles['color'] || '';
//         $('#pick-color-text-input').val(textColor).css({
//             'background-color': textColor
//         });
//         var bgColor = customStyles['background-color'] || '';
//         $('#pick-color-bg-input').val(bgColor).css({
//             'background-color': bgColor
//         });
//
//     } else {
//         if (selectedUserComponent.layout.overallStyles){
//             var overallStyles = selectedUserComponent.layout.overallStyles;
//             var textColor = overallStyles['color'] || '';
//             $('#pick-color-text-input').val(textColor).css({
//                 'background-color': textColor
//             });
//             var bgColor = overallStyles['background-color'] || '';
//             $('#pick-color-bg-input').val(bgColor).css({
//                 'background-color': bgColor
//             });
//         } else {
//             $('#pick-color-text-input').val('').css({
//                 'background-color': ''
//             });
//             $('#pick-color-bg-input').val('').css({
//                 'background-color': ''
//             });
//         }
//     }
// }

*/

/** **/

function addAddToMainPagesButton(){
    var added = (selectedUserComponent.meta.id in selectedProject.mainComponents);
    if (added){
        var span = document.createElement('span');
        span.innerHTML = '<button type="button" class="btn btn-default ">' +
            '<span class="glyphicon glyphicon-remove"></span>' +
            '<span> Remove from Main Pages</span>' +
            '</button>';
    }
    else{
        var span = document.createElement('span');
        span.innerHTML = '<button type="button" class="btn btn-default ">' +
            '<span class="glyphicon glyphicon-plus"></span>' +
            '<span> Add to Main Pages</span>' +
            '</button>';
    }
    var addToMainPageButton = span.firstChild;
    addToMainPageButton.id = 'btn-add-main-page';;

    $(addToMainPageButton).data('added', added).css({
        position: 'absolute',
        top:'-45px',
        left:'230px',
    });

    $(addToMainPageButton).on("click", function (e) {
        var added = $(this).data('added');
        var userComponentId = selectedUserComponent.meta.id;
        var name = selectedUserComponent.meta.name;
        if (added){
            // then remove
            $($(this).children().get(0)).removeClass('glyphicon-remove').addClass('glyphicon-plus');
            $($(this).children().get(1)).text(' Add to Main Pages');
            delete selectedProject.mainComponents[userComponentId];
            $("#main-pages-list").find("[data-componentid='" + userComponentId + "']").remove();
            displayUserComponentInListAndSelect(name, userComponentId);
            selectedUserComponent.inMainPages = false;
        } else {
            // then add
            $($(this).children().get(0)).removeClass('glyphicon-plus').addClass('glyphicon-remove');
            $($(this).children().get(1)).text(' Remove from Main Pages');

            if (!selectedProject.mainComponents){
                selectedProject.mainComponents = {}; // for safety
            }
            selectedProject.mainComponents[userComponentId] = name;
            $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();
            displayMainPageInListAndSelect(name, userComponentId);
            selectedUserComponent.inMainPages = true;
        }
        $(this).data('added', !added);
    });

    $('#main-cell-table').append(addToMainPageButton);

}


/**
 * Update the saved ratios and then use this function
 */
function propagateRatioChangeToAllElts(newRatio){
    for (var componentId in selectedUserComponent.components){
        var container = $('#component-container_'+componentId);
        var component = selectedUserComponent.components[componentId];
        var type = component.type;
        view.hideBaseComponentDisplayAt(container, type);

        var width = component.dimensions.width * newRatio;
        var top = selectedUserComponent.layout[componentId].top * newRatio;
        var height = component.dimensions.height * newRatio;
        var left = selectedUserComponent.layout[componentId].left *  newRatio;

        var properties = component.properties;

        container.css({
            width: width + 'px',
            height: height + 'px',
            top: top + 'px',
            left: left + 'px'
        });

        view.updateBaseComponentDisplayAt(container, type, newRatio, properties);
        view.showBaseComponentDisplayAt(container, type);
    }

    var outerWidth = selectedUserComponent.dimensions.width * newRatio;
    var outerHeight = selectedUserComponent.dimensions.height * newRatio;

    $('.work-surface').css({
        height: outerHeight + 'px',
        width: outerWidth + 'px'
    });

    miniNav.updateNavInnerComponentSizes(newRatio);
    workSurface.setUpGrid();
}

function addDeleteUserComponentButton(userComponentId){
    var spDelete = document.createElement('span');
    spDelete.innerHTML = '<button type="button" class="btn btn-default btn-delete-component">' +
        //'<span>Delete User Component </span>' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</button>';

    var buttonDeleteUserComponent = spDelete.firstChild;
    buttonDeleteUserComponent.id = 'btn-delete-component_'+userComponentId;

    $(buttonDeleteUserComponent).on("click", function (e) {
        if (selectedProject.numComponents === 1){
            return; //don't delete the last one TODO is the the right way to go?
        }
        if (confirmOnUserComponentDelete){
            openDeleteUserComponentConfirmDialogue(userComponentId);
        } else {
            deleteUserComponent(userComponentId);
        }
    });

    var listElt;
    if (userComponentId in selectedProject.mainComponents){
        listElt = $("#main-pages-list").find("[data-componentid='" + userComponentId + "']");
    } else {
        listElt = $("#user-components-list").find("[data-componentid='" + userComponentId + "']");
    }

    listElt.append(buttonDeleteUserComponent).hover(
        function(){
            $(this).find('.component-name-container').css({
                width: '70%'
            });
            $(this).find('.btn-delete-component').css({
                display: 'inline-block',
            });
        }, function(){
            $(this).find('.component-name-container').css({
                width: '95%'
            });
            $(this).find('.btn-delete-component').css({
                display: 'none',

            });
        }
    );
}

function deleteUserComponent(userComponentId){
    if (selectedProject.numComponents === 1){
        return; //don't delete the last one TODO is the the right way to go?
    }
    selectedProject.removeComponent(userComponentId);
    $('#work-surface_'+userComponentId).remove();
    $('#disabled_'+userComponentId+'_work-surface_'+userComponentId).remove(); // also remove disabled ones

    if (userComponentId == selectedUserComponent.meta.id){ // strings will also do
        var otherIds = Object.keys(selectedProject.components);
        selectedUserComponent = selectedProject.components[otherIds[0]];
        $("#user-components-list").find("[data-componentid='" + otherIds[0] + "']").addClass('selected');
        $("#main-pages-list").find("[data-componentid='" + otherIds[0] + "']").addClass('selected');
        workSurface.loadUserComponent(selectedUserComponent, currentZoom);
        // loadTable(selectedUserComponent, 1);
    }
    if (userComponentId == selectedProject.mainComponents.indexId){
        selectedProject.mainComponents.indexId = null;
    }
    $("#user-components-list").find("[data-componentid='" + userComponentId + "']").remove();
    $("#main-pages-list").find("[data-componentid='" + userComponentId + "']").remove();

}

function openDeleteUserComponentConfirmDialogue(userComponentId){
    $('#confirm-delete-userComponent').modal('show');
    $('#delete-userComponent-name').text(selectedProject.components[userComponentId].meta.name);

    $('#delete-userComponent-btn').unbind();
    $('#delete-userComponent-btn').click(function(){
        deleteUserComponent(userComponentId);

        $('#delete-userComponent-name').text('');
        $('#confirm-delete-userComponent').modal('hide');
    });

    $('#delete-userComponent-cancel-btn').click(function(){
        $('#delete-userComponent-name').text('');
        $('#confirm-delete-userComponent').modal('hide');
    });

    $('#confirm-delete-userComponent .close').click(function(event){
        event.preventDefault();
        $('#delete-userComponent-name').text('');
        $('#confirm-delete-userComponent').modal('hide');
    });
};




/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **/

/**
 * Creates a new User component based on user inputs
 * @param isDefault
 * @constructor
 */
function initUserComponent(isDefault, isMainPage) {
    var name, version, author;
    if (isDefault) {
        name = DEFAULT_COMPONENT_NAME;
    } else {
        name = sanitizeStringOfSpecialChars($('#new-component-name').val());
    }

    version = selectedProject.meta.version;
    author = selectedProject.meta.author;

    var id = generateId();

    if (isMainPage){
        return UserComponent({height: selectedScreenSizeHeight, width: selectedScreenSizeWidth}, name, id, version, author);
    }
    return UserComponent({height: 400, width: 600}, name, id, version, author); // experimentation
}



function duplicateUserComponent(userComponent){
    return UserComponent.fromString(JSON.stringify(userComponent));
}

function clearAll(){
    for (var componentId in selectedUserComponent.components){
        deleteComponentFromUserComponentAndFromView(componentId);
    }
}

