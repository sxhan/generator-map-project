(function($) {
    $(function() {
        'use strict'
        // Models
        var Item = function(data, visible, id) {
            this.utilityName = data['Utility Name'];
            this.plantName = data['Plant Name'];
            this.streetAddress = data['Street Address'];
            this.city = data['City'];
            this.state = data['State'];
            this.zip = data['Zip'];
            this.county = data['County'];
            this.latitude = data['Latitude'];
            this.longitude = data['Longitude'];
            this.nercRegion = data['NERC Region'];
            this.balancingAuthorityName = data['Balancing Authority Name'];
            this.systemOwner = data['Transmission or Distribution System Owner'];
            this.visible = ko.observable(visible); // true by default
            this.toJSON = function() {
                return {
                    utilityName: this.utilityName,
                    plantName: this.plantName,
                    streetAddress: this.streetAddress,
                    city: this.city,
                    state: this.state,
                    zip: this.zip,
                    county: this.county,
                    latitude: this.latitude,
                    longitude: this.longitude,
                    nercRegion: this.nercRegion,
                    balancingAuthorityName: this.balancingAuthorityName,
                    systemOwner: this.systemOwner
                };
            };
        };

        //
        // ViewModels
        //

        var ViewModel = function() {
            var self = this;
            var markers = [];
            this.markerCluster = undefined;
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
                    // Create a temp array to hold our items for initial
                    // loading and sorting
                    var tempList = [];
                    data.forEach(function(item) {
                        tempList.push(ko.observable(new Item(item, true)));
                    });

                    // sort the list by plant name
                    tempList.sort(function(a, b) {
                        if (a().plantName < b().plantName) return -1;
                        if (a().plantName > b().plantName) return 1;
                        return 0;
                    });

                    // Create the observableArray
                    self.koItemList(tempList);

                    self.koItemList().forEach(function(item) {
                        var marker = new google.maps.Marker({
                            position: {
                                lat: parseFloat(item().latitude),
                                lng: parseFloat(item().longitude)
                            },
                            label: item().plantName,
                            map: self.map,
                        });
                        // markers will be pushed in the same order as they are
                        // found on in the observable array
                        markers.push(marker);
                    })
                    redrawClusters();
                });
            }

            function redrawClusters() {
                // Redraws the marker clusters on update of marker visibility
                if (self.markerCluster) {
                    self.markerCluster.clearMarkers();
                }
                var visibleMarkers = [];
                self.koItemList().forEach(function(site, i) {
                    if (site().visible()){
                        visibleMarkers.push(markers[i]);
                    }
                });
                console.log(visibleMarkers);
                self.markerCluster = new MarkerClusterer(self.map, visibleMarkers, {
                    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
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
                // Load generator data
                self.loadData();
            };
            this.filterString = ko.observable();
            this.filter = function() {
                var queryString = self.filterString();
                self.koItemList().forEach(function(item, i) {
                    if (JSON.stringify(item().toJSON()).toLowerCase().includes(queryString.toLowerCase())) {
                        item().visible(true);
                        markers[i].setMap(self.map);
                    } else {
                        item().visible(false);
                        markers[i].setMap(null);
                    }
                });
                redrawClusters();
                // console.log("filter succeeded.")
            };

            this.errorCallback = function(jqxhr, settings, exception) {
                var map = $('#map')
                map.text("error occured: " + jqxhr.status + " " +
                         jqxhr.statusText);
            };
            // this.koItemList = ko.observableArray([1, 2, 3]);

        };


        // Initialize collapse button
        // var mapViewModel = new MapViewModel();
        // mapViewModel.init();
        $(".button-drawer-toggle").sideNav();
        // Initialize collapsible (uncomment the line below if you use the dropdown variation)
        console.log("Ready!");
        var viewModel = new ViewModel();
        viewModel.init();

        $("#map").ajaxError(function( e, jqxhr, settings, exception ) {
            console.log("asdfa")
            if ( settings.dataType == "script" ) {
                $( this ).text( "Triggered ajaxError handler." );
            }
        });

        // var locations = ko.observable(Location);
        ko.applyBindings(viewModel);
    }); // end of document ready
})(jQuery); // end of jQuery name space
