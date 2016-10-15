/**
 * Created by Shinjini on 10/14/2016.
 */
function createEmptyRow(rowNumber) {
    var tr = document.createElement('tr');
    tr.className = 'row' + '_' + rowNumber;
    return tr;
}

function createTableCellPreview(row, col) {
    var td = document.createElement('td');
    td.className = 'cell col' + '_' + col;

    td.id = 'cell' + '_' + row + '_' + col;

    // change size of cell based on the layout
    var rowspan = componentToShow.layout[row][col].spans.row;
    var colspan = componentToShow.layout[row][col].spans.col;

    var isHidden = componentToShow.layout[row][col].hidden.isHidden;

    if (isHidden) {
        $(td).css("display", "none");
    } else {
        $(td).attr("rowSpan", rowspan);
        $(td).attr("colSpan", colspan);
    }

    return td;
}


function resetAlignersPreview(scale) {
    if (!scale){
        scale = 1;
    }

    $('#cell_0_0').css({
        width: '1px',
        height: '1px',
    });

    // 0th col
    for (var row = 1; row<=numRows; row++){
        var heightRatioGrid = componentToShow.layout[row][1].ratio.grid.height;
        var thisGridCellHeight = scale * heightRatioGrid * componentToShow.layout.tablePxDimensions.height;
        $('#cell' + '_' + row + '_' + 0).css({
            width: '1px',
            height: thisGridCellHeight + 'px',
        })
    }

    // 0th row
    for (var col = 1; col<=numCols; col++) {
        var widthRatioGrid = componentToShow.layout[1][col].ratio.grid.width;
        var thisGridCellWidth = scale * widthRatioGrid * componentToShow.layout.tablePxDimensions.width;

        $('#cell' + '_' + 0 + '_' + col).css({
            width: thisGridCellWidth + 'px',
            height: '1px',
        })

    }

}


function initialResizeCellsPreview() {
    //gridHeight = parseFloat($('#table-container-preview').css('height')) - 100;
    //gridWidth = parseFloat($('#table-container-preview').css('width')) - 60;

    gridHeight = parseFloat($('#table-container-preview').height());
    gridWidth = parseFloat($('#table-container-preview').width());


    //gridWidth = componentToShow.layout.tablePxDimensions.width;
    //gridHeight = componentToShow.layout.tablePxDimensions.height;

    // have to assume that the tablePxDimensions are set
    var widthScale = gridWidth/componentToShow.layout.tablePxDimensions.width;
    var heightScale = gridHeight/componentToShow.layout.tablePxDimensions.height;

    var scale = Math.min(widthScale,heightScale);

    currentZoom = scale;

    cellWidth = scale*((gridWidth-20) / numCols);
    cellHeight = scale*((gridHeight-20) / numRows);

    resetAlignersPreview(scale);

    for (var row = 1; row<=numRows; row++){
        for (var col = 1; col<=numCols; col++){
            var widthRatioGrid = componentToShow.layout[row][col].ratio.grid.width;
            var heightRatioGrid = componentToShow.layout[row][col].ratio.grid.height;
            var thisGridCellWidth = scale * widthRatioGrid * componentToShow.layout.tablePxDimensions.width;
            var thisGridCellHeight = scale * heightRatioGrid * componentToShow.layout.tablePxDimensions.height;

            $('#cell' + '_' + row + '_' + col).css({
                width: thisGridCellWidth + 'px',
                height: thisGridCellHeight + 'px',
            });
        }
    }

    resizeLabelDivs(cellWidth, cellHeight);

}

function resizeLabelDivs(cellWidth, cellHeight) {
    getCSSRule('.label-container').style.setProperty('width', (cellWidth - 10) + 'px', null);
    getCSSRule('.label-container').style.setProperty('height', (cellHeight - 30) + 'px', null);
    getCSSRule('.label-container').style.setProperty('padding-top', (cellHeight / 4) + 'px', null);
}

//function getCSSRule(search) {
//    var x = [].slice.call(document.styleSheets[3].cssRules);
//    return x.filter(function (rule) {
//        return rule.selectorText === search;
//    })[0];
//}
//
function getCSSRule(search) {
    var x = [];
    for (var sheetnum =0; sheetnum< document.styleSheets.length; sheetnum++){
        x = x.concat([].slice.call(document.styleSheets[sheetnum].cssRules));
    }
    return x.filter(function (rule) {
        return rule.selectorText === search;
    })[0];
}

