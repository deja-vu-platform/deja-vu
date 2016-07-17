/**
 * Created by Shinjini on 7/16/2016.
 */
$(function(){
    resizeMenubarToFitWindow();
});


function resizeMenubarToFitWindow(){
    var windowWidth = $('html').width();
    var newWidth = Math.max(860, windowWidth);
    $('.menubar').css({
        width: newWidth + 'px',
    });
}

window.addEventListener("resize", function(){
    resizeMenubarToFitWindow();
});