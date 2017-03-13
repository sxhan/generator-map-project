/*jslint sub:true*/

(function ($) {

    'use strict';

    /**
     *
     * Main app
     *
     */

    $(function () {

        /*
         *
         * Entrypoint
         *
         */

        var viewModel = new ViewModel();
        viewModel.init();

        console.log("Ready!");

        ko.applyBindings(viewModel);
    }); // end of document ready
})(jQuery); // end of jQuery name space
