'use strict';

/**
* @constructor model data objects holding the map location
* information
* @param {object} data - json formatted raw data
* @param {bool} visible - bound by ko to determine whether location is
* visible on list and map
*/

var Item = function (data, visible) {
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
    this.info = '<div class="tooltiptext">' +
                '<b><div>' + this.plantName + '</div></b>' +
                '</br>' +
                '<div>' + this.streetAddress + '</div>' +
                '<div>' + this.city + ', ' + this.state + ' ' + this.zip + '</div>' +
                '<div>County: ' + this.county + '</div>' +
                '<div>Utility: ' + this.utilityName + '</div>' +
                '<div>System Owner: ' + this.systemOwner + '</div>' +
                '<div>Lat Lng: ' + this.latitude + ', ' + this.longitude + '</div>' +
                '<div>NERC Region: ' + this.nercRegion + '</div>' +
                // '<div>Balancing Authority Name: ' + this.balancingAuthorityName + '</div>' +
                '</div>';
    this.toJSON = function () {
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
