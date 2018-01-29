
import { Component, Input, OnChanges, OnDestroy, ElementRef} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { UserCliche } from '../../../models/cliche/cliche';
import { Widget } from '../../../models/widget/widget';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'dv-project-preview-widget',
  templateUrl: './project-preview-widget.component.html',
  styleUrls: ['./project-preview-widget.component.css']
})
export class ProjectPreviewWidgetComponent implements OnChanges, OnDestroy {
  @Input() widget: Widget;
  @Input() app: UserCliche;
  @Input() scale = 1;
  innerWidgets: Widget[];
  el: HTMLElement;

  private subscriptions = [];

  constructor(
    el: ElementRef,
    private projectService: ProjectService,
  ) {
    this.el = el.nativeElement;
  }

  ngOnChanges() {
    this.unsubscribe();

    this.innerWidgets = this.app.getWidgets(this.widget.getInnerWidgetIds());

    // TODO this is very similar to the widgets, is there a way to generalize?
    const dimensions = this.widget.getDimensions();
    this.el.style.height = this.scale * dimensions.height + 'px';
    this.el.style.width = this.scale * dimensions.width + 'px';

    const position = this.widget.getPosition();
    this.el.style.top = this.scale * position.top + 'px';
    this.el.style.left = this.scale * position.left + 'px';
  }

  ngOnDestroy() {
    this.unsubscribe();
  }

  private unsubscribe() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}





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



// function loadTablePreview(widgetToShow) {

//     $('#page-preview').html('');

//     var page = $('<div></div>');

//     page.css({
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
