import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'dv-project-preview',
    templateUrl: './project_preview.component.html',
    styleUrls: ['./project_preview.component.css']
  })
export class ProjectPreviewComponent  {

}
// var currentZoom = 1;

// var gridHeight;
// var gridWidth;

// var view = WidgetDisplay();
// var workSurface = WidgetWorkSurface();

// function loadTablePreview(widgetToShow) {

//     $('#page-preview').html('');

//     var page = $('<div></div>');
//     page.attr('id', 'page');

//     $('#page-preview').append(page);
//     $('<style>#page::after{content:"' + widgetToShow.meta.name + '"}</style>').appendTo('head');

//     page.css({
//         position: 'relative',
//         'background-color': (widgetToShow.properties.styles.custom['background-color'] || '87CEFA')
//     });

//     gridHeight = parseFloat($('#page-preview').height());
//     gridWidth = parseFloat($('#page-preview').width());
//     var widgetHeight = widgetToShow.properties.dimensions.height;
//     var widgetWidth = widgetToShow.properties.dimensions.width;
//     var widthScale = gridWidth/widgetWidth;
//     var heightScale = gridHeight/widgetHeight;

//     var scale = Math.min(widthScale,heightScale);
//     page.height(widgetHeight*scale).width(widgetWidth*scale);

//     widgetToShow.properties.layout.stackOrder.forEach(function(innerWidgetId){
//         var innerWidget = widgetToShow.innerWidgets[innerWidgetId];
//         var type = innerWidget.type;
//         var dragHandle = $('.draggable[name=' + type + ']').clone();
// // TODO do we have an a copy of this? needs a better way of getting this


//         var widgetContainer = $('<div></div>');
//         if (innerWidget.type == 'user'){
//             widgetContainer = workSurface.makeRecursiveWidgetContainersAndDisplay(
//                 innerWidget, widgetToShow, false, false, dragHandle,
//                 null, widgetToShow.properties.styles.custom, scale, true, true);
//         }

//         widgetContainer.addClass('component-container');
//         widgetContainer.height(innerWidget.properties.dimensions.height*scale).width(innerWidget.properties.dimensions.width*scale);


//         widgetContainer.css({
//             position: 'absolute',
//             left: widgetToShow.properties.layout[innerWidgetId].left*scale,
//             top: widgetToShow.properties.layout[innerWidgetId].top*scale,

//         });

//         setUpContainer(widgetContainer, dragHandle, innerWidget, scale);
//         page.append(widgetContainer);
//     });
// }

// function setUpContainer(container, dragHandle, widget, zoom){
//     container.append(dragHandle);
//     view.displayWidget(true, widget, container, widget.properties.styles.custom, zoom);
// }


// $('#page-preview').on('dblclick', '#main-table-preview', function(){
//     // this div's existance means there is some project showing

//    selectedProject = availableProjectsByFilename[$('#page-preview').data('projectfilename')];
//    selectedProject.lastAccessed = new Date();
//    window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
//    window.location = 'index.html';
// });


// function showNextMainPage(project, currentPageNumber){
//     var pages = project.cliches[project.userApp].widgets.pages;
//     var numMainPages = Object.keys(pages).length;
//     var nextPageNum = (currentPageNumber+1)%(numMainPages);
//     var componentToShowId = Object.keys(pages)[nextPageNum];
//     componentToShow = pages[componentToShowId];
//     loadTablePreview(componentToShow);
//     $('#page-preview').data('pagenum', nextPageNum);

// }
// function showPrevMainPage(project, currentPageNumber){
//     var pages = project.cliches[project.userApp].widgets.pages;
//     var numMainPages = Object.keys(pages).length;
//     var prevPageNum = (currentPageNumber-1+numMainPages)%(numMainPages);
//     var componentToShowId = Object.keys(pages)[prevPageNum];
//     componentToShow = pages[componentToShowId];
//     loadTablePreview(componentToShow);
//     $('#page-preview').data('pagenum', prevPageNum);
// }



// function displayProjectPreview(project){
//     // TODO make it select the main component
//     // TODO Also, have a way to click to change to another view?
//     $('#page-preview').data('projectfilename', projectNameToFilename(project.meta.name));
//     $('#project-name-preview').text('Project Preview: '+project.meta.name);
//     $('#preview-prev-page').unbind();
//     $('#preview-next-page').unbind();

//     var userApp = project.cliches[project.userApp];
//     var hasPages = (!$.isEmptyObject(userApp)) && (!$.isEmptyObject(userApp.widgets.pages));
//     if (hasPages){
//         var componentToShowId = Object.keys(userApp.widgets.pages)[0];
//         var numMainPages = Object.keys(userApp.widgets.pages).length;
//         if (numMainPages > 1) {
//             $('#page-preview').css('width', '790px');
//             $('#preview-prev-page').css('display', 'inline-block');
//             $('#preview-next-page').css('display', 'inline-block');
//         } else {
//             $('#page-preview').css('width', '850px');
//             $('#preview-prev-page').css('display', 'none');
//             $('#preview-next-page').css('display', 'none');
//         }

//         componentToShow = userApp.widgets.pages[componentToShowId];
//         loadTablePreview(componentToShow);

//         $('#page-preview').data('pagenum', 0);

//         $('#preview-prev-page').click(function () {
//             var pageNum = $('#page-preview').data('pagenum');
//             showPrevMainPage(project, pageNum);
//         });

//         $('#preview-next-page').click(function () {
//             var pageNum = $('#page-preview').data('pagenum');
//             showNextMainPage(project, pageNum);
//         });

//     } else {
//         $('#preview-prev-page').css('display', 'none');
//         $('#preview-next-page').css('display', 'none');
//         $('#page-preview').css('width', '850px').text("This project does not have a main page yet...");
//     }

// }
