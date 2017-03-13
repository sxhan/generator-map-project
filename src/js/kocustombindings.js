'use strict';

/*
 *
 * Custom KO bindings for tooltips
 *
 */

ko.bindingHandlers.dataTooltip = {
    /**
    * @description This is a custom binding to enable data binding
    * between ko and materalize's tooltip element attributes
    * @param {number} element - DOM element object
    * @param {number} valueAccessor - the data bound to this element by
    * ko
    * @returns undefined
    */
    init: function (element, valueAccessor) {
        var value = valueAccessor();
        element.setAttribute("data-tooltip", value);
    }
};
