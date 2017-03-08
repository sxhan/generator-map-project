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
            this.visible = true;  // true by default
            this.toJSON = function() {
                return {utilityName: this.utilityName(),
                        plantName: this.plantName(),
                        streetAddress: this.streetAddress(),
                        city: this.city(),
                        state: this.state(),
                        zip: this.zip(),
                        county: this.county(),
                        latitude: this.latitude(),
                        longitude: this.longitude(),
                        nercRegion: this.nercRegion(),
                        balancingAuthorityName: this.balancingAuthorityName(),
                        systemOwner: this.systemOwner()};
            };
        };

        //
        // ViewModels
        //

        var ItemViewModel = function() {
            var self = this;
            var allItems = [];
            var markers = [];
            this.koItemList = ko.observableArray([]);

            $.getJSON("/data/data.json", function(data) {
                data.forEach(function(item) {
                    allItems.push(new Item(item));
                });

                // sort the list by plant name
                allItems.sort(function(a, b) {
                    if(a.plantName() < b.plantName()) return -1;
                    if(a.plantName() > b.plantName()) return 1;
                    return 0;
                });
                // update the observableArray
                self.koItemList(allItems);
                // self.koItemList.valueHasMutated();
                $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB13Be18YOvyKwyDjXhJ9SKU5MdBzaKTj0", self.initMap);
            })
            this.filterString = ko.observable();
            this.filter = function() {
                var newItemList = [];
                var queryString = self.filterString();
                allItems.forEach(function(item) {
                    if (JSON.stringify(item.toJSON()).toLowerCase().includes(queryString.toLowerCase())) {
                        newItemList.push(item);
                    }
                })
                self.koItemList(newItemList);
                // console.log("filter succeeded.")
            }
            // this.koItemList = ko.observableArray([1, 2, 3]);

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

                self.koItemList().forEach(function(item) {
                    var marker = new google.maps.Marker({
                        position: {lat: parseFloat(item.latitude()),
                                   lng: parseFloat(item.longitude())},
                        label: item.city(),
                        map: map,
                    });
                    markers.push(marker);
                })


                // // Add a marker clusterer to manage the markers.
                // var markerCluster = new MarkerClusterer(map, markers,
                //     {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
                return map
            };
        };

        // var MapViewModel = function() {
        //     var self = this;
        //     this.init = function() {
        //         $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB13Be18YOvyKwyDjXhJ9SKU5MdBzaKTj0", this.initMap);
        //     }
        //     // Callback function used by the .init() function
        //     this.initMap = function(data, textStatus, jqXHR) {
        //         // Init the actual map
        //         var map = new google.maps.Map($('#map')[0], {
        //             zoom: 3,
        //             center: {
        //                 lat: -28.024,
        //                 lng: 140.887
        //             },
        //             mapTypeId: google.maps.MapTypeId.ROADMAP,
        //             disableDefaultUI: true
        //         });
        //         //
        //         self.map = map;
        //
        //         // Create the DIV to hold the control toggle and call the CenterControl()
        //         // constructor passing in this DIV.
        //         var centerControlDiv = $('<div>');
        //         function makeCenterControl(controlDiv, map) {
        //             // Dynamic HTML creation
        //
        //             // Set CSS for the control border.
        //             var controlUI = $('<div>', {class: 'control-toggle',
        //                                         title: 'Click to recenter the map!',
        //                                         text: 'Center Map'});
        //             controlDiv.append(controlUI);
        //
        //             // Setup the click event listeners: simply set the map to Chicago.
        //             controlUI.click(function() {
        //                 map.setCenter(chicago);
        //             });
        //
        //             return controlDiv;
        //         };
        //         self.centerControl = makeCenterControl(centerControlDiv, map);
        //         centerControlDiv.index = 1;
        //         map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv[0]);
        //
        //         // Create an array of alphabetical characters used to label the markers.
        //         var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        //
        //         // // Add a marker clusterer to manage the markers.
        //         // var markerCluster = new MarkerClusterer(map, markers,
        //         //     {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
        //         return map
        //     };
        // }
        //

        //
        // Views
        //

        function makeSideNav() {};

        // Initialize collapse button
        // var mapViewModel = new MapViewModel();
        // mapViewModel.init();
        var itemViewModel = new ItemViewModel();
        $(".button-drawer-toggle").sideNav();
        // Initialize collapsible (uncomment the line below if you use the dropdown variation)
        console.log("Ready!");

        // var locations = ko.observable(Location);
        ko.applyBindings(itemViewModel);
    }); // end of document ready
})(jQuery); // end of jQuery name space
