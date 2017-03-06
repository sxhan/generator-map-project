`use strict`

// Async load of:
// location data
var Locations = $.getJSON("./data/data.json");

function makeCenterControl(controlDiv, map) {
    // Dynamic HTML creation

    // Set CSS for the control border.
    var controlUI = $('<div>', {class: 'control-toggle',
                                title: 'Click to recenter the map!',
                                text: 'Center Map'});
    controlDiv.append(controlUI);

    // Setup the click event listeners: simply set the map to Chicago.
    controlUI.click(function() {
        map.setCenter(chicago);
    });

    return controlDiv;
};

function makeSideNav() {

};

// Google Maps Init function
function initMap(data, textStatus, jqXHR) {
    // Init the actual map
    var map = new google.maps.Map($('#map')[0], {
        zoom: 3,
        center: {
            lat: -28.024,
            lng: 140.887
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true
    });

    // Create the DIV to hold the control toggle and call the CenterControl()
    // constructor passing in this DIV.
    var centerControlDiv = $('<div>');
    var centerControl = makeCenterControl(centerControlDiv, map);
    centerControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv[0]);

    // Create an array of alphabetical characters used to label the markers.
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var locations = [];

    // Add some markers to the map.
    // Note: The code uses the JavaScript Array.prototype.map() method to
    // create an array of markers based on a given "locations" array.
    // The map() method here has nothing to do with the Google Maps API.
    var markers = locations.map(function(location, i) {
        return new google.maps.Marker({
            position: location,
            label: labels[i % labels.length],
        });
    });

    // // Add a marker clusterer to manage the markers.
    // var markerCluster = new MarkerClusterer(map, markers,
    //     {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
}


(function($) {
    $(function() {
        // Initialize collapse button
        $(".button-drawer-toggle").sideNav();
        // Initialize collapsible (uncomment the line below if you use the dropdown variation)
        //$('.collapsible').collapsible();
        console.log("Ready!");
        // $('.button-collapse').sideNav();

        // var locations = ko.observable(Location);

    }); // end of document ready
})(jQuery); // end of jQuery name space
