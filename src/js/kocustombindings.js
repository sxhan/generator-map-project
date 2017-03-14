/*
 *
 * Custom KO bindings for tooltips
 *
 */

(function() {

    'use strict';

    /**
    * @description This is a custom binding to enable initialization call
    * by materialize css' extension to jQuery for tooltips
    * @param {number} element - DOM element object
    * @param {number} valueAccessor - the data bound to this element by
    * ko. In this case, its an object containing keys: delay, html
    */
    ko.bindingHandlers.tooltip = {
        // Thanks http://stackoverflow.com/a/16876013 !!!
        init: function(element, valueAccessor) {
            var local = ko.utils.unwrapObservable(valueAccessor()),
                options = {};

            // load default options
            ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
            // load bound values
            ko.utils.extend(options, local);

            // jQuery extension function call
            $(element).tooltip(options);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).tooltip("destroy");
            });
        },
        options: {
            delay: 50,
            html: true,
            position: 'right',
            tooltip: ''
        }
    };
})();
