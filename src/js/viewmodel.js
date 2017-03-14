/**
*
*
* ViewModel
*
*
*/

var ViewModel = function () {

    'use strict';

    var self = this;

    // UI elements
    this.koItemList = ko.observableArray([]);
    this.filterString = ko.observable();

    // Map elements
    this.map = undefined;
    this.markerClusterer = undefined;
    this.infoWindowText = ko.observable();
    this.infoWindow = undefined;
    self.userMarker = undefined;

    // Aesthestic Elements
    this.progress = ko.observable();


    //
    // Public methods
    //

    /**
    * @description entrypoint for initializing all dynamically loaded
    * content
    */
    this.init = function () {
        // Init map
        initMap();
        // Load json data asynchronously, and create markers
        loadData();
    };

    /**
    * @description filters locations on map. Hides non matching
    * locations on map and list
    */
    this.filter = function () {
        var queryString = self.filterString();
        self.koItemList().forEach(function (item) {
            if (JSON.stringify(item().toJSON()).toLowerCase().includes(queryString.toLowerCase())) {
                item().visible(true);
                item().marker.setVisible(true);
            } else {
                item().visible(false);
                item().marker.setVisible(false);
            }
        });
        redrawClusters();
        // console.log("filter succeeded.")
    };


    /**
    * @description center map on location and animate marker
    * @param {ko.observable} koIndex - ko observable of index of
    * location
    */
    this.viewLocation = function() {

        startProgressBar();

        var wantedItem = this;

        goToLocation(wantedItem.latitude, wantedItem.longitude);
        self.map.setZoom(14);

        var marker = wantedItem.marker;

        // Give map time to move before setting off animation
        setTimeout(function () {
            clickMarker(wantedItem);
        }, 1000);
    };

    //
    // Private methods
    //

    /**
    * @description creates google map object and adds custom controls
    */
    function initMap() {
        self.map = new google.maps.Map($('#map')[0], {
            zoom: 12,
            center: {
                lat: 37.7749,
                lng: -122.4194
            },
            zoomControl: true,
            streetViewControl: true,
            // mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: mapStyle,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
            },
            disableDefaultUI: true
        });
        self.infoWindow = new google.maps.InfoWindow();

        createFilterButton(self.map);
        createGeolocationButton(self.map);
    }

    /**
    * @description Load location data and creates observables
    */
    function loadData() {
        $.getJSON("src/data/data.json", function (data) {
            // Create a temp array to hold our items for initial
            // loading and sorting
            var tempList = [];
            data.forEach(function (item) {
                tempList.push(ko.observable(new Item(item, true)));
            });

            // sort the list by plant name
            tempList.sort(function (a, b) {
                if (a().plantName < b().plantName) { return -1; }
                if (a().plantName > b().plantName) { return 1; }
                return 0;
            });

            // Create the observableArray which then populates the DOM
            self.koItemList(tempList);

            createMarkers();
            redrawClusters();

            // stop progress bar
            clearProgressBar();
        }).fail(errorCallback);
    }

    /**
    * @description Starts the progress bar
    */
    function startProgressBar () {
        self.progress(true);
    }

    /**
    * @description Clears the progress bar
    */
    function clearProgressBar () {
        self.progress(false);
    }

    /**
    * @description Populates the view with google maps markers and adds
    * references to markers on their respective item object instances
    */
    function createMarkers() {
        self.koItemList().forEach(function (item, i) {
            var marker = new google.maps.Marker({
                position: {
                    lat: parseFloat(item().latitude),
                    lng: parseFloat(item().longitude)
                },
                // label: item().plantName,
                map: self.map,
                title: item().plantName
            });
            // add marker to the item object in observable array
            item().marker = marker;
            // Add marker callback
            marker.addListener('click', function() {
                clickMarker(item());
            });
        });
    }

    /**
    * @description The action to take when a marker is clicked.
    * @param {Item} item - item object instance
    */
    function clickMarker(item) {
        startProgressBar();
        animateMarker(item.marker);
        // delay the popup window to let animation occur
        setTimeout(function () {
            populateInfoWindow(item, self.infoWindow);
        }, 750);
    }

    /**
    * @description Makes a marker bounce
    * @param {google.maps.Marker} marker - marker to animate
    */
    function animateMarker(marker) {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        }
        // } else {
        //     marker.setAnimation(google.maps.Animation.BOUNCE);
        //     setTimeout(function(){ marker.setAnimation(null); }, 750);
        // }
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () { marker.setAnimation(null); }, 750);
    }

    /**
    * @description Searches wikipedia for relevant links
    * @param {Item} query - query string
    * @param {google.maps.InfoWindow} infoWindow - infowindow instance
    */
    function searchWikipedia(query, infoWindow) {
        var url = "https://en.wikipedia.org/w/api.php";
        url += '?' + $.param({
            action: "opensearch",
            format: "json",
            search: query,
            rvprop: "content",
            callback: "jsonCallback"
        });

        $.ajax({
            url: url,
            dataType: "jsonp"
        }).done(function (data, textStatus, jqXHR) {
            // If no wiki content found, exit
            if (data.error || data[1].length === 0) {
                return ;
            }
            // Update page with wiki links
            var content = infoWindow.getContent();
            content += '</br><b><div>Wiki Links</div></b>';
            for (var i = 0; i < Math.min(data[1].length, 3); i++) {
                content += '<div><a target="_blank" href="' +
                    data[3][i] + '">' +
                    data[1][i] + '</a></div>';
            }
            infoWindow.setContent(content);
        }).fail(errorCallback);
    }

    /**
    * @description Displays information about a location as an infowindow
    * @param {Item} item - item object containing marker reference and text
    * to be displayed
    * @param {google.maps.InfoWindow} infoWindow - infowindow instance
    */
    function populateInfoWindow(item, infoWindow) {
        // only open if its not currently open
        if (infoWindow.marker !== item.marker) {
            infoWindow.marker = item.marker;
            self.infoWindowText(item.info);
            infoWindow.setContent(self.infoWindowText());
            // Async function to get wikipedia results
            searchWikipedia(item.systemOwner, infoWindow);
            infoWindow.open(self.map, item.marker);
            infoWindow.addListener('closeclick', function () {
                infoWindow.close();
            });
        }
        clearProgressBar();
    }

    /**
    * @description clear all clusters in preparation for redraw
    */
    function clearClusters() {
        if (self.markerClusterer) {
            self.markerClusterer.clearMarkers();
        }
    }

    /**
    * @description Move map center to location
    * @param {float} lat - latitude
    * @param {float} lng - longitude
    */
    function goToLocation(lat, lng) {
        self.map.setCenter({lat: parseFloat(lat),
                            lng: parseFloat(lng)});
    }

    /**
    * @description Redraws clusters on map after a filtering operation
    */
    function redrawClusters() {
        // Redraws the marker clusters on update of marker visibility
        clearClusters();

        var visibleMarkers = [];
        self.koItemList().forEach(function (site, i) {
            if (site().visible()) {
                visibleMarkers.push(site().marker);
            }
        });
        self.markerClusterer = new MarkerClusterer(self.map, visibleMarkers, {
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
            maxZoom: 13
        });
    }

    /**
    * @description callback function invoked for ajax request errors
    */
    function errorCallback(jqxhr, settings, exception) {
        Materialize.toast("error occured: " + jqxhr.status + " " +
            jqxhr.statusText);
        clearProgressBar();
    }

    //
    // Control functions for the map
    //

    function createFilterButton(map) {
        /**
         * The CenterControl adds a control to the map that recenters the map on
         * Chicago.
         * This constructor takes the control DIV as an argument.
         * @constructor
         */
        function CenterControl(controlDiv, map) {
            // Set CSS for the control border.
            var controlUI = $('<i class="fa fa-filter fa-fw fa-2x map-control-glyph" aria-hidden="true"></i>',
                              {title: "filter"});
            controlDiv.appendChild(controlUI[0]);

            // // Setup the click event listeners: simply set the map to Chicago.
            // controlUI.addEventListener('click', function() {
            //     console.log("harro");
            // });
        }

        // Dynamically generate the Filter button onto the map
        var centerControlDiv = $('<div>', {
            'data-activates': "slide-out",
            'class': 'waves-effect waves-light map-control-icon grey-text text-darken-1 white z-depth-1'
        });

        // jQuery sidenav initialization
        centerControlDiv.sideNav();

        var centerControl = new CenterControl(centerControlDiv[0], map);

        centerControlDiv.index = 1;
        map.controls[google.maps.ControlPosition.RIGHT_TOP].push(centerControlDiv[0]);
    }

    function createGeolocationButton(map) {

        // Dynamically generate the Filter button onto the map
        var locationControlDiv = $('<div>', {
            'class': 'waves-effect waves-light map-control-icon blue-text text-accent-1 white z-depth-1'
        });

        var locationControl = new LocationControl(locationControlDiv[0], map);

        locationControl.index = 1;
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationControlDiv[0]);

    }

    function LocationControl(controlDiv, map) {
        // Set CSS for the control border.
        // var controlUI = $('<i class="small material-icons rotate">my_location</i>');
        var controlUI = $('<i class="fa fa-location-arrow fa-fw fa-2x map-control-glyph" aria-hidden="true"></i>');
        controlDiv.appendChild(controlUI[0]);

        // Setup the click event listeners.
        controlUI.click(geoLocate);

        function geoLocate() {
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
                        dropUserMarker(map, pos);
                    }, 750);

                    clearProgressBar();

                }, function(err) {
                    handleLocationError(true, err);
                }, {timeout: 4000});
            } else {
              // Browser doesn't support Geolocation
              handleLocationError(false);
            }
        }
    }

    function handleLocationError(browserHasGeolocation, err) {
        var msg = browserHasGeolocation ?
            'Error: The Geolocation service failed. ' + err.message:
            'Error: Your browser doesn\'t support geolocation.';
        Materialize.toast(msg, 4000);
        clearProgressBar();
    }

    function dropUserMarker(map, pos) {
        var marker = self.userMarker;
        // Move user marker if exists. Create new if not
        if (marker) { marker.setMap(null); }

        var icon = {
            url: 'src/img/my-location.png', // url
            scaledSize: new google.maps.Size(25, 25), // scaled size
            origin: new google.maps.Point(0,0), // origin
            anchor: new google.maps.Point(0, 0) // ancho
        };

        self.userMarker = new google.maps.Marker({
          map: map,
          draggable: false,
          animation: google.maps.Animation.DROP,
          position: pos,
          icon: icon
        });
    }

};
