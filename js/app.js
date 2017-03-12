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
            this.markerClusterer = undefined;
            this.map = undefined;
            this.koItemList = ko.observableArray([]);
            this.filterString = ko.observable();
            this.userMarker = undefined;

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
                Materialize.toast("error occured: " + jqxhr.status + " " +
                    jqxhr.statusText);
                clearProgressBar();
            };

            // this.hoverItem = function() {
            //     console.log("hello");
            // };

            this.goToLocation = function() {
                self.map.setCenter({lat: parseFloat(this.latitude),
                                    lng: parseFloat(this.longitude)});
            }

            this.toggleBounce = function(koIndex) {

                var wantedItem = self.koItemList()[koIndex()];

                self.map.setCenter({lat: parseFloat(wantedItem().latitude),
                                    lng: parseFloat(wantedItem().longitude)});
                self.map.setZoom(14);

                var wantedMarker = self.markers[koIndex()];
                animateMarker(wantedMarker);
            };

            function animateMarker(marker) {
                if (marker.getAnimation() !== null) {
                    marker.setAnimation(null);
                } else {
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function(){ marker.setAnimation(null); }, 750);
                }
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function(){ marker.setAnimation(null); }, 750);

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

                    // stop progress bar
                    clearProgressBar();
                }).fail(self.errorCallback);
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
                createGeolocationButton();
                // Load generator data
                loadData();
            };

            function createMarkers() {

                var largeInfowindow = new google.maps.InfoWindow();

                self.koItemList().forEach(function(item, i) {
                    var marker = new google.maps.Marker({
                        position: {
                            lat: parseFloat(item().latitude),
                            lng: parseFloat(item().longitude)
                        },
                        // label: item().plantName,
                        map: self.map,
                        title: item().plantName,
                    });
                    // self.markers will be pushed in the same order as they are
                    // found on in the observable array
                    self.markers.push(marker);
                    marker.addListener('click', function() {
                        animateMarker(marker);
                        // delay the popup window to let animation occur
                        setTimeout(function() {
                            populateInfoWindow(marker, largeInfowindow, i);
                        }, 750);
                    });
                });
            }

            function populateInfoWindow(marker, infowindow, idx) {
                // only open if its not currently open
                if (infowindow.maker != marker) {
                    infowindow.marker = marker;
                    var contentString = '<div><b>' + marker.title + '</b></div>' +
                        '<div>' + self.koItemList()[idx]().streetAddress + '</div>' +
                        '<div>' + self.koItemList()[idx]().city + ', ' + self.koItemList()[idx]().state + ' ' + self.koItemList()[idx]().zip + '</div>' +
                        '<div>Utility: ' + self.koItemList()[idx]().utilityName + '</div>';
                        // '<div id="siteNotice">'+
                        // '</div>'+
                        // '<h1 id="firstHeading" class="firstHeading">Uluru</h1>'+
                        // '<div id="bodyContent">'+
                        // '<p><b>Uluru</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
                        // 'sandstone rock formation in the southern part of the '+
                        // 'Northern Territory, central Australia. It lies 335&#160;km (208&#160;mi) '+
                        // 'south west of the nearest large town, Alice Springs; 450&#160;km '+
                        // '(280&#160;mi) by road. Kata Tjuta and Uluru are the two major '+
                        // 'features of the Uluru - Kata Tjuta National Park. Uluru is '+
                        // 'sacred to the Pitjantjatjara and Yankunytjatjara, the '+
                        // 'Aboriginal people of the area. It has many springs, waterholes, '+
                        // 'rock caves and ancient paintings. Uluru is listed as a World '+
                        // 'Heritage Site.</p>'+
                        // '<p>Attribution: Uluru, <a href="https://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
                        // 'https://en.wikipedia.org/w/index.php?title=Uluru</a> '+
                        // '(last visited June 22, 2009).</p>'+
                        // '</div>'+
                        // '</div>';
                    infowindow.setContent(contentString);
                    infowindow.open(self.map, marker);
                    infowindow.addListener('closeclick', function() {
                        infowindow.setMarker(null);
                    })
                }
            }

            function clearClusters() {
                if (self.markerClusterer) {
                    self.markerClusterer.clearMarkers();
                }
            }

            function redrawClusters() {
                // Redraws the marker clusters on update of marker visibility
                clearClusters()

                var visibleMarkers = [];
                self.koItemList().forEach(function(site, i) {
                    if (site().visible()){
                        visibleMarkers.push(self.markers[i]);
                    }
                });
                self.markerClusterer = new MarkerClusterer(self.map, visibleMarkers, {
                    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                    maxZoom: 13
                });
            }

            function createGeolocationButton() {

                // Dynamically generate the Filter button onto the map
                var locationControlDiv = $('<div>', {
                    'class': "waves-effect waves-light btn button-drawer-toggle"
                });

                var locationControl = new LocationControl(locationControlDiv[0], self.map);

                locationControl.index = 1;
                self.map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(locationControlDiv[0]);


            }

            function LocationControl(controlDiv, map) {
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
                controlText.innerHTML = 'Locate';
                controlUI.appendChild(controlText);

                // Setup the click event listeners: simply set the map to Chicago.
                controlUI.addEventListener('click', geoLocate);
            };

            function geoLocate() {
                var map = self.map;
                // Try HTML5 geolocation.
                if (navigator.geolocation) {

                    startProgressBar();
                    navigator.geolocation.getCurrentPosition(function(position) {
                        var pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        map.setCenter(pos);
                        // delay marker drop to let map movement occur
                        setTimeout(function() {
                            dropUserMarker(pos);
                        }, 750);

                        clearProgressBar();

                    }, function() {
                        handleLocationError(true);
                    }, {timeout: 4000});
                } else {
                  // Browser doesn't support Geolocation
                  handleLocationError(false);
                }
            }

            function dropUserMarker(pos) {
                var marker = self.userMarker;
                // Move user marker if exists. Create new if not
                if (marker) {
                    console.log(marker);
                } else {
                    self.userMarker = new google.maps.Marker({
                      map: self.map,
                      draggable: false,
                      animation: google.maps.Animation.DROP,
                      position: pos,
                    });
                }
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

                centerControlDiv.sideNav();
                var centerControl = new CenterControl(centerControlDiv[0], self.map);

                centerControlDiv.index = 1;
                self.map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv[0]);
            }

            function startProgressBar() {
                if (! $('#progress').children().first().hasClass('indeterminate')){
                    $('#progress').children().first().addClass('indeterminate');
                }
            }

            function clearProgressBar() {
                $('#progress').children().first().removeClass('indeterminate');
            }

            function handleLocationError(browserHasGeolocation) {
                Materialize.toast(browserHasGeolocation ?
                    'Error: The Geolocation service failed.' :
                    'Error: Your browser doesn\'t support geolocation.',
                    2000) // 4000 is the duration of the toast
                clearProgressBar();
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
