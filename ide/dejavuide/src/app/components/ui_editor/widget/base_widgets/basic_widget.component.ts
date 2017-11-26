import { Component } from '@angular/core';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';

// Widgets are drag-and-droppable
import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;

@Component({
  selector: 'dv-base-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css'],
})
export class BaseWidgetComponent {

}



/**
 * Updates the contents of a base component info at a particular cell based on inputs
 * @param containerId
 */
function updateBaseWidgetContentsAndDisplayAt(containerId) {

    const container = $('#' + containerId);
    const tooltip = container.find('.tooltip');
    const widgetId = container.data('componentId');

    const type = container.find('.draggable').data('type');
    let value;
    let isUpload = false;

    const done = function(value2){
        const newValue = {type: type, value: value2};
        // widgetEditsManager.updateCustomProperties(selectedUserWidget, widgetId, 'value', newValue);

        // selectedUserWidget.innerWidgets[widgetId].innerWidgets = {};
        // selectedUserWidget.innerWidgets[widgetId].innerWidgets[type] = value;

        // refreshContainerDisplay(true, container, currentZoom);
    };
    let inputs;
    if (tooltip.length > 0) {
        inputs = Array.prototype.slice.call(
            tooltip.get(0).getElementsByTagName('input'), 0);
    } // TODO // else it is label and is handled

    if (type === 'label') {
        value = container.find('p')[0].textContent;
    } else if (type === 'link') {
        value = {
            link_text: inputs[0].value,
            target: inputs[1].value
        };
    } else if (type === 'tab_viewer') {
        value = {
            'tab1': {text: inputs[0].value, target: inputs[1].value},
            'tab2': {text: inputs[2].value, target: inputs[3].value},
            'tab3': {text: inputs[4].value, target: inputs[5].value}
        };
    } else if (type === 'menu') {
        value = {
            'menu_item1': {text: inputs[0].value, target: inputs[1].value},
            'menu_item2': {text: inputs[2].value, target: inputs[3].value},
            'menu_item3': {text: inputs[4].value, target: inputs[5].value}
        };
    } else if (type === 'image') {
        value = {};

        if (files.length > 0) { // if there's a file to upload

            const file = files[0];
            const parseFile = new Parse.File(file.name, file);
            isUpload = true;
            files.length = 0; // clear the old file
            console.log('trying?');

            parseFile.save()
                .then(function (savedFile) { // save was successful
                    console.log('success');
                    value.img_src = savedFile.url();
                    done(value);
                });
        } else { // pasted link to image
            if (inputs[0].value.length > 0) {
                value.img_src = inputs[0].value;
            } else {
                value.img_src = 'images/image_icon.png';
            }
        }
    } else if (type === 'panel') {
        value = {
            heading: container.find('.panel-title')[0].textContent,
            content: container.find('.panel-html')[0].textContent
        };
    }

    if (!isUpload) {
        done(value);
    }
}



/** ** ** ** ** ** ** ** IMAGE UPLOAD HELPERS ** ** ** ** ** ** ** **/
// file drag hover
function FileDragHover(e) {
    e.stopPropagation();
    e.preventDefault();
    if (e.type === 'dragover') {
        $(e.target).addClass('hover');
    } else if (e.type === 'dragleave') {
        $(e.target).removeClass('hover');
    }
}
// file selection
function FileSelectHandler(e) {

    FileDragHover(e); // cancel event and hover styling

    files = e.target.files || e.dataTransfer.files;

    $(e.target).text('Got file: ' + truncate(files[0].name, 30));
}

function truncate(str, len) {
    return str.substring(0, len) + (str.length > len ? '... ' + str.substring(str.length - 4) : '');
}

function getCSSRule(search) {
    let x = [];
    for (let sheetnum = 0; sheetnum < document.styleSheets.length; sheetnum++) {
        x = x.concat([].slice.call(document.styleSheets[sheetnum].cssRules));
    }
    return x.filter(function (rule) {
        return rule.selectorText === search;
    })[0];
}

function resizeLabelDivs(cellWidth, cellHeight) {
    getCSSRule('.label-container').style.setProperty('width', (cellWidth - 10) + 'px', null);
    getCSSRule('.label-container').style.setProperty('height', (cellHeight - 30) + 'px', null);
    getCSSRule('.label-container').style.setProperty('padding-top', (cellHeight / 4) + 'px', null);
}



/** ** ** ** ** ** ** ** ** Table Cells Interaction and display Helpers ** ** ** ** ** ** ** ** **/


/**
 * Register listener for click on edit button
 * @param container
 * @param popup
 */
function triggerEdit(container, popup) {
    if (container.find('.tooltip').length === 0) {
        const type = container.find('.widget').data('type').toLowerCase();
        const editDialog = $('#' + type + '-popup-holder').clone();

        if (!(type === 'label')) {

            container.prepend(editDialog);

            $(Array.prototype.slice.call(
                container.find('form-control'), 0)[0]).trigger('focus');

        }
    }
    if (popup) {
        setTimeout(function(){
            $(container.find('form-control')[0]).trigger('focus');
            editDialog.find('.tooltip').addClass('open');
        }, 1);
    }

}



function registerTooltipBtnHandlers() {
    $('.close').unbind().on('click', function() {
        setTimeout(function(){
            $('.tooltip').removeClass('open');
        }, 1);
        Array.prototype.slice.call(
            $(this).parent().get(0).getElementsByClassName('form-control'), 0)
            .forEach(function(item) {
                item.value = '';
            });
    });

    $('.apply').unbind().on('click', function(event) {
        const cellId = findContainingContainer(this);
        updateBaseWidgetContentsAndDisplayAt(cellId);
        $('.tooltip').removeClass('open');
    });

    const align_options = ['alignment', 'center', 'right', 'left', 'justify'];
    const label_sizes = ['size', 'small', 'default', 'large', 'heading'];
    const label_styles = ['style', 'muted', 'default', 'primary', 'info', 'success', 'warning', 'danger'];
    const btn_styles = ['style', 'link', 'default', 'primary', 'info', 'success', 'warning', 'danger'];
    const btn_sizes = ['size', 'xs', 'df', 'lg'];
    const tab_styles = ['style', 'pills', 'tabs'];
    const tab_alignments = ['alignment', 'stacked', 'horizontal'];
    const menu_alignments = ['alignment', 'vertical', 'horizontal'];
    const panel_styles = ['style', 'default', 'primary', 'info', 'success', 'warning', 'danger'];

    function registerPropHandlers(optionsList_, classPrefix, bootstrapPrefix) {
        const propertyName = optionsList_[0];
        const optionsList = optionsList_.slice(1);

        for (let i = 0; i < optionsList.length; i++) {
            const options = document.getElementsByClassName(classPrefix + '-' + optionsList[i]);
            for (let j = 0; j < options.length; j++) {
                options[j].onclick = generateHandler(i, optionsList, bootstrapPrefix, propertyName);
            }
        }
    }

    function generateHandler(index, optionsList, bootstrapPrefix, propertyName) {
        return function(e) {
            e.preventDefault();
            const containerId = findContainingContainer(this);
            const element = $('#' + containerId).find('.display-component');
            const bootstrapClass = bootstrapPrefix + '-' + optionsList[index];
            element.addClass(bootstrapClass);

            for (let j = 0; j < optionsList.length; j++) {
                if (j !== index) {
                    element.removeClass(bootstrapPrefix + '-' + optionsList[j]);
                }
            }
            // const widgetId = widgetContainerMaker.getWidgetIdFromContainerId(containerId);
            // selectedUserWidget.innerWidgets[widgetId].properties.styles.bsClasses[propertyName] = bootstrapClass;
        };
    }

    const inputOptions = [
        [align_options, 'align', 'text'],
        [label_sizes, 'lbl', 'lbl'],
        [label_styles, 'lbl-text', 'text'],
        [btn_styles, 'btn-style', 'btn'],
        [btn_sizes, 'btn-size', 'btn'],
        [tab_styles, 'tab-style', 'nav'],
        [tab_alignments, 'tab-align', 'nav'],
        [menu_alignments, 'menu', 'btn-group'],
        [panel_styles, 'panel-text', 'panel']];

    inputOptions.forEach(function(inputOption) {
        registerPropHandlers.apply(null, inputOption);
    });

    getContentEditableEdits();

    const dropzones = document.getElementsByClassName('upload-drop-zone');
    for (let i = 0; i < dropzones.length; i++) {
        dropzones[i].addEventListener('dragover', FileDragHover, false);
        dropzones[i].addEventListener('dragleave', FileDragHover, false);
        dropzones[i].addEventListener('drop', FileSelectHandler, false);
    }
}


// TODO needs to be updated to use more relevant classes
function findContainingContainer(context) {
    let parent = $(context).parent();

    const containerRef = widgetContainerMaker.getContainerRef();

    while (!(parent.hasClass(containerRef))) {
        parent = $(parent).parent();
        if (parent.length === 0) { // TODO this is a check to see if anything went awry
            console.log('something went wrong');
            console.log(context);
            return null;
        }
    }
    return $(parent).attr('id');
}


/**
 */
function getContentEditableEdits() {
    $('[contenteditable=true]').unbind() // unbind to prevent this from firing multiple times
        .blur(function() {
            const containerId = findContainingContainer(this);
            updateBaseWidgetContentsAndDisplayAt(containerId);
        });
}


function selectText(container) {
    const range = document.createRange();
    range.selectNodeContents(container);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
}
