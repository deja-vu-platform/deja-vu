// This file mostly has the initialization and functions that help with
// the display and interaction handling



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
    $('.cliches').css({
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
    $('.cliches').css({
        display: 'none',
    });
});

/** ** ** ** ** ** Components Event Handlers ** ** ** ** ** **/

$('#back-to-projects').click(function(event){
    event.preventDefault();
    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject)); // save the updated project
    utils.saveProject(selectedProject);
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

    dataMiniNav.updateMiniNavPositionSize($('#outer-container').width(),  $('#outer-container').height());
}

window.addEventListener("resize", function(){
    resizeViewportToFitWindow();
    window.setTimeout(resizeViewportToFitWindow, 100);
});



/** ** ** ** ** ** ** ** Show Cliche Components in List  ** ** ** ** ** ** ** **/
function showClicheInList(id, name){
    var addedCliche = '<li id="added_'+id+'">'+name+'</li>';
    $('.cliche-cliches ul').append(addedCliche);
}






//style.setUpOverallInputs();

// /** **/
//
// function addAddToMainPagesButton(userWidget){
//     var added = (userWidget.meta.id in selectedProject.userApp);
//     if (added){
//         var span = document.createElement('span');
//         span.innerHTML = '<button type="button" class="btn btn-default ">' +
//             '<span class="glyphicon glyphicon-remove"></span>' +
//             '<span> Remove from Main Pages</span>' +
//             '</button>';
//     } else {
//         var span = document.createElement('span');
//         span.innerHTML = '<button type="button" class="btn btn-default ">' +
//             '<span class="glyphicon glyphicon-plus"></span>' +
//             '<span> Add to Main Pages</span>' +
//             '</button>';
//     }
//     var addToMainPageButton = span.firstChild;
//     addToMainPageButton.id = 'btn-add-main-page';;
//
//     $(addToMainPageButton).data('added', added).css({
//         position: 'absolute',
//         top:'-45px',
//         left:'230px',
//     });
//
//     $(addToMainPageButton).on("click", function (e) {
//         var added = $(this).data('added');
//         var userWidgetId = selectedUserWidget.meta.id;
//         var name = selectedUserWidget.meta.name;
//         if (added){
//             // then remove
//             $($(this).children().get(0)).removeClass('glyphicon-remove').addClass('glyphicon-plus');
//             $($(this).children().get(1)).text(' Add to Main Pages');
//             delete selectedProject.userApp[userWidgetId];
//             $("#main-pages-list").find("[data-componentid='" + userWidgetId + "']").remove();
//             displayUserWidgetInListAndSelect(name, userWidgetId);
//             selectedUserWidget.isPage = false;
//         } else {
//             // then add
//             $($(this).children().get(0)).removeClass('glyphicon-plus').addClass('glyphicon-remove');
//             $($(this).children().get(1)).text(' Remove from Main Pages');
//
//             if (!selectedProject.userApp){
//                 selectedProject.userApp = {}; // for safety
//             }
//             selectedProject.userApp[userWidgetId] = name;
//             $("#user-cliches-list").find("[data-componentid='" + userWidgetId + "']").remove();
//             displayMainPageInListAndSelect(name, userWidgetId);
//             selectedUserWidget.inMainPages = true;
//         }
//         $(this).data('added', !added);
//     });
//
//     $('#main-cell-table').append(addToMainPageButton);
//
// }
//

/**
 * Update the saved ratios and then use this function
 */
function propagateRatioChangeToAllElts(newRatio, userWidget){
    var workSurfaceRef =dataWorkSurface.getWorkSurfaceRef();
    //view.displayWidget(false, userWidget, $('#'+workSurfaceRef+'_'+userWidget.meta.id), {}, newRatio);
    //miniNav.updateNavInnerWidgetSizes(newRatio);

}

function addDeleteUserDatatypeButton(userWidgetId){
    var spDelete = document.createElement('span');
    spDelete.innerHTML = '<button type="button" class="btn btn-default btn-delete-component">' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</button>';

    var buttonDeleteUserWidget = spDelete.firstChild;
    buttonDeleteUserWidget.id = 'btn-delete-component_'+userWidgetId;

    $(buttonDeleteUserWidget).on("click", function (e) {
        if (selectedProject.numComponents === 1){
            return; //don't delete the last one TODO is the the right way to go?
        }
        if (confirmOnUserWidgetDelete){
            openDeleteUserWidgetConfirmDialogue(userWidgetId);
        } else {
            deleteUserWidget(userWidgetId);
        }
    });

    var listElt;
    if (userWidgetId in selectedProject.userApp){
        listElt = $("#main-pages-list").find("[data-componentid='" + userWidgetId + "']");
    } else {
        listElt = $("#user-cliches-list").find("[data-componentid='" + userWidgetId + "']");
    }

    listElt.append(buttonDeleteUserWidget).hover(
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

function deleteUserWidget(userWidgetId){
    if (userApp.getNumWidgets() == 1){
        return; //don't delete the last one TODO is the the right way to go?
    }
    userApp.deleteWidget(userWidgetId);
    var workSurfaceRef = dataWorkSurface.getWorkSurfaceRef();

    $('#'+workSurfaceRef+'_'+userWidgetId).remove();
    $('#disabled_'+userWidgetId+'_'+workSurfaceRef+'_'+userWidgetId).remove(); // also remove disabled ones

    if (userWidgetId == selectedUserWidget.meta.id){ // strings will also do
        var otherIds = userApp.getAllWidgetIds();
        selectedUserWidget = userApp.getWidget(otherIds[0]);
        $("#user-cliches-list").find("[data-componentid='" + otherIds[0] + "']").addClass('selected');
        $("#main-pages-list").find("[data-componentid='" + otherIds[0] + "']").addClass('selected');
       dataWorkSurface.loadUserWidget(selectedUserWidget, currentZoom);
    }
    if (userWidgetId == userApp.widgets.pages.indexId){
        userApp.widgets.pages.indexId = null;
    }
    $("#user-cliches-list").find("[data-componentid='" + userWidgetId + "']").remove();
    $("#main-pages-list").find("[data-componentid='" + userWidgetId + "']").remove();

}

function openDeleteUserWidgetConfirmDialogue(userWidgetId){
    $('#confirm-delete-userComponent').modal('show');
    $('#delete-userComponent-name').text(selectedProject.cliches[userWidgetId].meta.name);

    $('#delete-userComponent-btn').unbind();
    $('#delete-userComponent-btn').click(function(){
        deleteUserWidget(userWidgetId);

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
function initDatatype() {
    var name, version, author;
    name = utils.sanitizeStringOfSpecialChars($('#new-component-name').val());
    version = selectedProject.meta.version;
    author = selectedProject.meta.author;

    var id = utils.generateId();


    var displayProperties = UserDatatypeDisplay();
    return [UserDatatype(name, id, version, author), displayProperties];
}



function duplicateUserWidget(userWidget){
    return UserDatatype.fromString(JSON.stringify(userWidget));
}

function clearAll(){
    for (var widgetId in selectedUserWidget.innerWidgets){
        deleteWidgetFromUserWidgetAndFromView(widgetId);
    }
}

