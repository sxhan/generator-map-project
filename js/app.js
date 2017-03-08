(function($) {
    $(function() {
        // 'use strict'
        // Models
        var Item = function(data) {
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
            this.visible = true; // true by default
            this.toJSON = function() {
                return {
                    utilityName: this.utilityName(),
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
                    systemOwner: this.systemOwner()
                };
            };
        };

        //
        // ViewModels
        //

        var ItemViewModel = function() {
            var self = this;
            var allItems = [];
            var markers = [];
            this.map = undefined;
            this.koItemList = ko.observableArray([]);
            this.init = function() {
                // Load google maps SDK. The callback function will create the
                // map, and then load the data into map
                $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB13Be18YOvyKwyDjXhJ9SKU5MdBzaKTj0",
                            self.initMap).fail(self.errorCallback)
            };
            this.loadData = function() {
                $.getJSON("/data/data.json", function(data) {
                    data.forEach(function(item) {
                        allItems.push(new Item(item));
                    });

                    // sort the list by plant name
                    allItems.sort(function(a, b) {
                        if (a.plantName() < b.plantName()) return -1;
                        if (a.plantName() > b.plantName()) return 1;
                        return 0;
                    });
                    // update the observableArray
                    self.koItemList(allItems);

                    self.koItemList().forEach(function(item) {
                        var marker = new google.maps.Marker({
                            position: {
                                lat: parseFloat(item.latitude()),
                                lng: parseFloat(item.longitude())
                            },
                            label: item.plantName(),
                            map: self.map,
                        });
                        markers.push(marker);
                    })
                    // Add a marker clusterer to manage the markers.
                    var markerCluster = new MarkerClusterer(self.map, markers, {
                        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
                    });
                });
            }

            // Callback function used by the .init() function
            this.initMap = function(data, textStatus, jqXHR) {
                // Init the actual map
                self.map = new google.maps.Map($('#map')[0], {
                    zoom: 12,
                    center: {
                        lat: 37.7749,
                        lng: -122.4194
                    },
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControlOptions: {
                        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    },
                    disableDefaultUI: false
                });

                // Create the DIV to hold the control toggle and call the CenterControl()
                // constructor passing in this DIV.
                var centerControlDiv = $('<div>');

                function makeCenterControl(controlDiv, map) {
                    // Dynamic HTML creation

                    // Set CSS for the control border.
                    var controlUI = $('<div>', {
                        class: 'control-toggle',
                        title: 'Click to recenter the map!',
                        text: 'Center Map'
                    });
                    controlDiv.append(controlUI);

                    // Setup the click event listeners: simply set the map to Chicago.
                    controlUI.click(function() {
                        map.setCenter(chicago);
                    });

                    return controlDiv;
                };

                self.centerControl = makeCenterControl(centerControlDiv, self.map);
                centerControlDiv.index = 1;
                self.map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv[0]);

                // // Kick off async loading and rendering of data. Only do this
                // // after map is created to guarentee ability to render points.
                self.loadData();
            };
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

            this.errorCallback = function(jqxhr, settings, exception) {
                var map = $('#map')
                map.text("error occured: " + jqxhr.status + " " +
                         jqxhr.statusText);
            }
            // this.koItemList = ko.observableArray([1, 2, 3]);

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

        // Initialize collapse button
        // var mapViewModel = new MapViewModel();
        // mapViewModel.init();
        $(".button-drawer-toggle").sideNav();
        // Initialize collapsible (uncomment the line below if you use the dropdown variation)
        console.log("Ready!");
        var itemViewModel = new ItemViewModel();
        itemViewModel.init();

        $("#map").ajaxError(function( e, jqxhr, settings, exception ) {
            console.log("asdfa")
            if ( settings.dataType == "script" ) {
                $( this ).text( "Triggered ajaxError handler." );
            }
        });

        // var locations = ko.observable(Location);
        ko.applyBindings(itemViewModel);
    }); // end of document ready
})(jQuery); // end of jQuery name space
