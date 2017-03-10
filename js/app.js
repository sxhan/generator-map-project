'use strict';

(function($) {
    $(function() {

        //
        // Models
        //

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
            this.info = "<p>" + this.streetAddress + "\n" + this.city + ", " + this.state + " " + this.zip + "\n" + "owner: " + this.systemOwner + "\n" + "utility: " + this.utilityName + "</p>"
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
            this.markers = [];
            this.markerCluster = undefined;
            this.map = undefined;
            this.koItemList = ko.observableArray([]);
            this.filterString = ko.observable();

            this.init = function() {
                // Load google maps SDK. The callback function will create the
                // map, and then load the data into map
                $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB13Be18YOvyKwyDjXhJ9SKU5MdBzaKTj0",
                            initMap).fail(self.errorCallback)
            };

            this.filter = function() {
                var queryString = self.filterString();
                self.koItemList().forEach(function(item, i) {
                    if (JSON.stringify(item().toJSON()).toLowerCase().includes(queryString.toLowerCase())) {
                        item().visible(true);
                        self.markers[i].setMap(self.map);
                    } else {
                        item().visible(false);
                        self.markers[i].setMap(null);
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

            // this.hoverItem = function() {
            //     console.log("hello");
            // };

            this.goToLocation = function() {
                self.map.setCenter({lat: parseFloat(this.latitude),
                                    lng: parseFloat(this.longitude)});
            }


            //
            // Private methods
            //
            function loadData() {
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
                    createMarkers();
                    redrawClusters();
                });
            }

            // Initialization code has to be structured this way due to the
            // async loading of google maps SDK, which must preceed everything

            function initMap(data, textStatus, jqXHR) {
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
                createFilterButton();
                // Load generator data
                loadData();
            };

            function createMarkers() {
                self.koItemList().forEach(function(item) {
                    var marker = new google.maps.Marker({
                        position: {
                            lat: parseFloat(item().latitude),
                            lng: parseFloat(item().longitude)
                        },
                        label: item().plantName,
                        map: self.map,
                    });
                    // self.markers will be pushed in the same order as they are
                    // found on in the observable array
                    self.markers.push(marker);
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
                        visibleMarkers.push(self.markers[i]);
                    }
                });
                self.markerCluster = new MarkerClusterer(self.map, visibleMarkers, {
                    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
                });
            }

            function createFilterButton() {
                /**
                 * The CenterControl adds a control to the map that recenters the map on
                 * Chicago.
                 * This constructor takes the control DIV as an argument.
                 * @constructor
                 */
                function CenterControl(controlDiv, map) {
                    // Set CSS for the control border.
                    var controlUI = document.createElement('div');
                    controlUI.style.backgroundColor = '#fff';
                    controlUI.style.border = '2px solid #fff';
                    controlUI.style.borderRadius = '3px';
                    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
                    controlUI.style.cursor = 'pointer';
                    controlUI.style.marginBottom = '22px';
                    controlUI.style.textAlign = 'center';
                    controlUI.title = 'Click to recenter the map';
                    controlDiv.appendChild(controlUI);

                    // Set CSS for the control interior.
                    var controlText = document.createElement('div');
                    controlText.style.color = 'rgb(25,25,25)';
                    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
                    controlText.style.fontSize = '16px';
                    controlText.style.lineHeight = '38px';
                    controlText.style.paddingLeft = '5px';
                    controlText.style.paddingRight = '5px';
                    controlText.innerHTML = 'Filter';
                    controlUI.appendChild(controlText);

                    // // Setup the click event listeners: simply set the map to Chicago.
                    // controlUI.addEventListener('click', function() {
                    //     console.log("harro");
                    // });
                }

                // Dynamically generate the Filter button onto the map
                var centerControlDiv = $('<div>', {
                    'data-activates': "slide-out",
                    'class': "waves-effect waves-light btn button-drawer-toggle"
                });

                centerControlDiv.sideNav()
                var centerControl = new CenterControl(centerControlDiv[0], map);

                centerControlDiv.index = 1;
                self.map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv[0]);
            }
        };


        // Initialize collapse button
        $(".button-drawer-toggle").sideNav();

        var viewModel = new ViewModel();
        viewModel.init();

        console.log("Ready!");

        // var locations = ko.observable(Location);
        ko.applyBindings(viewModel);
    }); // end of document ready
})(jQuery); // end of jQuery name space
