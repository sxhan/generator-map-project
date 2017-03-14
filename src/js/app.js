/*jslint sub:true*/


function init(data, textStatus, jqXHR) {

    'use strict';

    // Init the actual map

    var viewModel = new ViewModel();

    // Init the viewmodel
    viewModel.init();

    // Apply bindings
    ko.applyBindings(viewModel);

    console.log("Ready");
}
