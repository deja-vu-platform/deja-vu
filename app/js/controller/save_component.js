$(function() {

    var component_data = {};

    $('#save_component').on('click', function() {

        component_data.num_rows = num_rows;
        component_data.num_cols = num_cols;

        $('[id^="cell"]').each(function() {
            var cell = $(this);

            component_data[cell.attr('id')]=cell.children().first().attr('id');
        });

        alert(JSON.stringify(component_data));
    });

});