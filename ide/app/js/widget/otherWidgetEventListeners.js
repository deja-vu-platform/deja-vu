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

    miniNav.updateMiniNavPositionSize($('#outer-container').width(),  $('#outer-container').height());
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






style.setUpOverallInputs();

/** **/
//
//function addAddToMainPagesButton(userWidget){
//    var added = (userWidget.meta.id in selectedProject.userApp);
//    if (added){
//        var span = document.createElement('span');
//        span.innerHTML = '<button type="button" class="btn btn-default ">' +
//            '<span class="glyphicon glyphicon-remove"></span>' +
//            '<span> Remove from Main Pages</span>' +
//            '</button>';
//    }
//    else{
//        var span = document.createElement('span');
//        span.innerHTML = '<button type="button" class="btn btn-default ">' +
//            '<span class="glyphicon glyphicon-plus"></span>' +
//            '<span> Add to Main Pages</span>' +
//            '</button>';
//    }
//    var addToMainPageButton = span.firstChild;
//    addToMainPageButton.id = 'btn-add-main-page';;
//
//    $(addToMainPageButton).data('added', added).css({
//        position: 'absolute',
//        top:'-45px',
//        left:'230px',
//    });
//
//    $(addToMainPageButton).on("click", function (e) {
//        var added = $(this).data('added');
//        var userWidgetId = selectedUserWidget.meta.id;
//        var name = selectedUserWidget.meta.name;
//        if (added){
//            // then remove
//            $($(this).children().get(0)).removeClass('glyphicon-remove').addClass('glyphicon-plus');
//            $($(this).children().get(1)).text(' Add to Main Pages');
//            delete selectedProject.userApp[userWidgetId];
//            $("#main-pages-list").find("[data-componentid='" + userWidgetId + "']").remove();
//            displayUserWidgetInListAndSelect(name, userWidgetId);
//            selectedUserWidget.inMainPages = false;
//        } else {
//            // then add
//            $($(this).children().get(0)).removeClass('glyphicon-plus').addClass('glyphicon-remove');
//            $($(this).children().get(1)).text(' Remove from Main Pages');
//
//            if (!selectedProject.userApp){
//                selectedProject.userApp = {}; // for safety
//            }
//            selectedProject.userApp[userWidgetId] = name;
//            $("#user-cliches-list").find("[data-componentid='" + userWidgetId + "']").remove();
//            displayMainPageInListAndSelect(name, userWidgetId);
//            selectedUserWidget.inMainPages = true;
//        }
//        $(this).data('added', !added);
//    });
//
//    $('#main-cell-table').append(addToMainPageButton);
//
//}

