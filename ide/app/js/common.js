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
    $('.menubar-inner').css({
        width: newWidth + 'px',
    });
}

window.addEventListener("resize", function(){
    resizeMenubarToFitWindow();
});


/** ** ** ** ** ** ** ** Dropdown Implementation ** ** ** ** ** ** ** ** ** **/
function enableDropdownTrigger(){
    $(".dropdown-trigger").find('.glyphicon').unbind().click(function(ev) {

        var triggerElt = $(this).closest('.dropdown-trigger');
        var encapsulatingElt = triggerElt.closest('.dropdown-encapsulator');
        var dropdownid = triggerElt.data('dropdownid');

        if (triggerElt.hasClass('dropdown-open')){
            // close it
            triggerElt.removeClass('dropdown-open').addClass('dropdown-closed');
            triggerElt.find('.glyphicon').remove();
            triggerElt.prepend('<span class="glyphicon glyphicon-triangle-right"></span>');

            encapsulatingElt.find("[data-dropdownid='" + dropdownid + "']").each(function(idx, elt){
                var targetElt = $(elt);
                if (targetElt.hasClass('dropdown-target')){
                    targetElt.css({
                        display: 'none',
                    });
                }
            });

        } else {
            // open it
            triggerElt.removeClass('dropdown-closed').addClass('dropdown-open');
            triggerElt.find('.glyphicon').remove();
            triggerElt.prepend('<span class="glyphicon glyphicon-triangle-bottom"></span>');

            encapsulatingElt.find("[data-dropdownid='" + dropdownid + "']").each(function(idx, elt){
                var targetElt = $(elt);

                if (targetElt.hasClass('dropdown-target')){
                    targetElt.css({
                        display: 'block',
                    });
                }
            });

        }
        enableDropdownTrigger();
    });

}
