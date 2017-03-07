(function($) {
    $(function() {
        // 'use strict'
        // Models
        var Item = function (data) {
            this.utilityName = ko.observable(data['Utility Name']);
            this.plantName = ko.observable(data['Plant Name']);
            this.streetAddress = ko.observable(data['Street Address']);
            this.city = ko.observable(data['City']);
            this.state = ko.observable(data['State']);
            this.zip = ko.observable(data['Zip']);
            this.county = ko.observable(data['County']);
            this.latitude = ko.observable(data['Latitude']);
            this.longitude = ko.observable(data['Longitude']);
            this.nercRegion = ko.observable(data['NERC Region']);
            this.balancingAuthorityName = ko.observable(data['Balancing Authority Name']);
            this.systemOwner = ko.observable(data['Transmission or Distribution System Owner']);
        };

        //
        // ViewModels
        //

        var ItemViewModel = function() {
            var self = this;
            this.koItemList = ko.observableArray([]);
            $.getJSON("/data/data.json", function(data) {
                data.forEach(function(item) {
                    self.koItemList().push(new Item(item));
                });
                // ko bindings doesn't seem to work properly when updating the
                // observable array inside the AJAX callback function.
                // Explicitly command a refresh of all subscribers.
                self.koItemList.valueHasMutated();
            })
            // this.koItemList = ko.observableArray([1, 2, 3]);
        };

        var MapViewModel = function() {
            var self = this;
            this.init = function() {
                $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB13Be18YOvyKwyDjXhJ9SKU5MdBzaKTj0", this.initMap);
            }
            // Callback function used by the .init() function
            this.initMap = function(data, textStatus, jqXHR) {
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
                //
                self.map = map;

                // Create the DIV to hold the control toggle and call the CenterControl()
                // constructor passing in this DIV.
                var centerControlDiv = $('<div>');
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
                self.centerControl = makeCenterControl(centerControlDiv, map);
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
                return map
            };
        }


        //
        // Views
        //

        function makeSideNav() {};

        // Initialize collapse button
        var mapViewModel = new MapViewModel();
        mapViewModel.init();
        var itemViewModel = new ItemViewModel();
        $(".button-drawer-toggle").sideNav();
        // Initialize collapsible (uncomment the line below if you use the dropdown variation)
        console.log("Ready!");

        // var locations = ko.observable(Location);
        ko.applyBindings(itemViewModel);
    }); // end of document ready
})(jQuery); // end of jQuery name space
