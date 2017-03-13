'use strict';

/**
*
*
* ViewModel
*
*
*/

var ViewModel = function () {

    var self = this;
    this.markers = [];
    this.markerClusterer = undefined;
    this.map = undefined;
    this.koItemList = ko.observableArray([]);
    this.filterString = ko.observable();
    this.userMarker = undefined;
    this.infoWindowText = ko.observable();
    this.infoWindow = undefined;


    /**
    * @description entrypoint for initializing all dynamically loaded
    * content
    */
    this.init = function () {
        // Load google maps SDK. The callback function will create the
        // map, and then load the data into map
        $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB13Be18YOvyKwyDjXhJ9SKU5MdBzaKTj0",
                    initMap).fail(self.errorCallback);
    };

    /**
    * @description filters locations on map. Hides non matching
    * locations on map and list
    */
    this.filter = function () {
        var queryString = self.filterString();
        self.koItemList().forEach(function (item, i) {
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

    /**
    * @description callback function invoked for ajax request errors
    */
    this.errorCallback = function (jqxhr, settings, exception) {
        Materialize.toast("error occured: " + jqxhr.status + " " +
            jqxhr.statusText);
        clearProgressBar();
    };

    /**
    * @description center map on location and animate marker
    * @param {ko.observable} koIndex - ko observable of index of
    * location
    */
    this.viewLocation = function(koIndex) {

        var wantedItem = self.koItemList()[koIndex()];

        goToLocation(wantedItem().latitude, wantedItem().longitude);
        self.map.setZoom(14);

        var marker = self.markers[koIndex()];

        // Give map time to move before setting off animation
        setTimeout(function () {
            animateMarker(marker);
        }, 1000);

        setTimeout(function () {
            populateInfoWindow(marker, self.infoWindow, koIndex());
        }, 750);

    };

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

    //
    // Private methods
    //

    function initMap(data, textStatus, jqXHR) {
        // Initialization code has to be structured this way due to the
        // async loading of google maps SDK, which must preceed everything

        // Init the actual map
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
        createFilterButton();
        createGeolocationButton();
        // Load generator data
        loadData();
    }

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
            // Now that the DOM is populated, initialize tooltips
            $('.tooltipped').tooltip({delay: 50,
                                      html: true});

            createMarkers();
            redrawClusters();

            // stop progress bar
            clearProgressBar();
        }).fail(self.errorCallback);
    }

    function createMarkers() {

        self.infoWindow = new google.maps.InfoWindow();

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
            // self.markers will be pushed in the same order as they are
            // found on in the observable array
            self.markers.push(marker);
            marker.addListener('click', function () {
                animateMarker(marker);
                // delay the popup window to let animation occur
                setTimeout(function () {
                    populateInfoWindow(marker, self.infoWindow, i);
                }, 750);
            });
        });
    }

    function searchWikipedia(query, infoWindow) {
        var url = "https://en.wikipedia.org/w/api.php";
        url += '?' + $.param({
            action: "opensearch",
            format: "json",
            search: query,
            rvprop: "content",
            callback: "jsonCallback"
        });
        var wikiRequestTimeout = setTimeout(function () {
            Materialize.toast("failed to get wikipedia resources");
        }, 8000);

        $.ajax({
            url: url,
            dataType: "jsonp"
        }).done(function (data, textStatus, jqXHR) {
            clearTimeout(wikiRequestTimeout);
            // If no wiki content found, exit
            if (data[1].length === 0) {
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
        });
    }

    function populateInfoWindow(marker, infoWindow, idx) {
        // only open if its not currently open
        if (infoWindow.marker !== marker) {
            infoWindow.marker = marker;
            self.infoWindowText(self.koItemList()[idx]().info);
            infoWindow.setContent(self.infoWindowText());
            // Async function to get wikipedia results
            searchWikipedia(self.koItemList()[idx]().systemOwner,
                            infoWindow);
            infoWindow.open(self.map, marker);
            infoWindow.addListener('closeclick', function () {
                infoWindow.setMap(null);
            });
        }
    }

    function clearClusters() {
        if (self.markerClusterer) {
            self.markerClusterer.clearMarkers();
        }
    }

    function goToLocation(lat, lng) {
        self.map.setCenter({lat: parseFloat(lat),
                            lng: parseFloat(lng)});
    }

    function redrawClusters() {
        // Redraws the marker clusters on update of marker visibility
        clearClusters();

        var visibleMarkers = [];
        self.koItemList().forEach(function (site, i) {
            if (site().visible()) {
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
            'class': 'waves-effect waves-light map-control-icon blue-text text-accent-1 white z-depth-1'
        });

        var locationControl = new LocationControl(locationControlDiv[0], self.map);

        locationControl.index = 1;
        self.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationControlDiv[0]);

    }

    function LocationControl(controlDiv, map) {
        // Set CSS for the control border.
        // var controlUI = $('<i class="small material-icons rotate">my_location</i>');
        var controlUI = $('<i class="fa fa-location-arrow fa-fw fa-2x map-control-glyph" aria-hidden="true"></i>');
        controlDiv.appendChild(controlUI[0]);

        // Setup the click event listeners: simply set the map to Chicago.
        controlUI[0].addEventListener('click', geoLocate);
    }

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

            }, function(err) {
                handleLocationError(true, err);
            }, {timeout: 4000});
        } else {
          // Browser doesn't support Geolocation
          handleLocationError(false);
        }
    }

    function dropUserMarker(pos) {
        var marker = self.userMarker;
        // Move user marker if exists. Create new if not
        if (marker) { marker.setMap(null); }

        var icon = {
            url: 'img/my-location.png', // url
            scaledSize: new google.maps.Size(25, 25), // scaled size
            origin: new google.maps.Point(0,0), // origin
            anchor: new google.maps.Point(0, 0) // ancho
        };

        self.userMarker = new google.maps.Marker({
          map: self.map,
          draggable: false,
          animation: google.maps.Animation.DROP,
          position: pos,
          icon: icon
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

        var centerControl = new CenterControl(centerControlDiv[0], self.map);

        centerControlDiv.index = 1;
        self.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(centerControlDiv[0]);
    }

    function startProgressBar() {
        if (! $('#progress').children().first().hasClass('indeterminate')){
            $('#progress').children().first().addClass('indeterminate');
        }
    }

    function clearProgressBar() {
        $('#progress').children().first().removeClass('indeterminate');
    }

    function handleLocationError(browserHasGeolocation, err) {
        var msg = browserHasGeolocation ?
            'Error: The Geolocation service failed. ' + err.message:
            'Error: Your browser doesn\'t support geolocation.';

        Materialize.toast(msg, 2000); // 4000 is the duration of the toast
        clearProgressBar();
    }
};
