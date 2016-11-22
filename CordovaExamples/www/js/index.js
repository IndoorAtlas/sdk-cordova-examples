/*
* IndoorAtlas Cordova Plugin Examples
* https://github.com/IndoorAtlas/cordova-plugin
* https://github.com/IndoorAtlas/sdk-cordova-examples
*/

/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/

var app = {
  // Application Constructor
  initialize: function() {
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    app.receivedEvent('deviceready');
    cordovaExample.configureIA();
  },
  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  }
};

app.initialize();
var image;
var venuemap;
var groundOverlay = null;
var cordovaExample = {
  watchId : null,
  regionWatchId : null,
  marker : null,
  retina : window.devicePixelRatio > 1 ? true : false,

  // Configures IndoorAtlas SDK with API Key and Secret
  // Set the API Keys in www/js/APIKeys.js
  configureIA: function() {
    var _config = {key: IA_API_KEY, secret: IA_API_SECRET};
    IndoorAtlas.initialize(this.IAServiceConfigured, this.IAServiceFailed, _config);
    return false;
  },
  IAServiceFailed: function(result) {
    // Try again to initialize the service
    cordovaExample.configureIA();
  },
  IAServiceConfigured: function(result) {
    cordovaExample.initializeMap();
  },

  // Displays the current location of the user
  showLocation: function(position) {
    // Show a map centered at (position.coords.latitude, position.coords.longitude).
    SpinnerPlugin.activityStop();
    try {
      var center = {lat: position.coords.latitude, lng: position.coords.longitude};
      if (this.marker != null) {
        this.marker.setPosition(center);
      }
      else {
        this.marker = new google.maps.Marker({
          position: center,
          map: venuemap,
          icon: image,
          zIndex: google.maps.Marker.MAX_ZINDEX + 1,
          optimized: false
        });
      }
      venuemap.panTo(center);
    }
    catch(error) {alert(error)};
  },

  // Sets position of the location
  setPosition: function(options) {
    // Check if the floorplan is set
    if (IA_FLOORPLAN_ID != "") {

      alert("Setting location with floorplan ID: " + IA_FLOORPLAN_ID);

      try {
        SpinnerPlugin.activityStart('Setting location');
        var win = function() {
          SpinnerPlugin.activityStop();
          cordovaExample.startRegionWatch();
        };
        var fail = function(error) {
          SpinnerPlugin.activityStop();
          alert(error.message);
        };
        IndoorAtlas.setPosition(win, fail, options);
      }
      catch(error) {
        alert(error);
      }
    } else {
      alert("Floorplan ID is not set");
    }
  },
  // Starts positioning the user in the given floorplan area
  startPositioning: function() {
    SpinnerPlugin.activityStart('Move around to get a location');

    if (this.watchId != null) {
      IndoorAtlas.clearWatch(this.watchId);
    }
    this.watchId = IndoorAtlas.watchPosition(this.showLocation, this.IAServiceFailed);
    cordovaExample.startRegionWatch();
  },

  // Fetches the current location
  getLocationCall: function() {
    SpinnerPlugin.activityStart('Fetching location. Move around');
    IndoorAtlas.getCurrentPosition(this.showLocation, this.IAServiceFailed);
  },

  // Stops positioning the user
  stopPositioning: function() {
    IndoorAtlas.clearWatch(this.watchId);
    cordovaExample.stopRegionWatch();
    alert("IndoorAtlas positioning stopped");
  },
  // Starts watching changes in region id
  startRegionWatch: function() {
    if (this.regionWatchId != null) {
      IndoorAtlas.clearRegionWatch(this.regionWatchId);
    }
    var onEnterRegion = function(region) {
      cordovaExample.updateOverlay(region.regionId);
    };
    var onExitRegion = function(region) {
    };
    this.regionWatchId = IndoorAtlas.watchRegion(onEnterRegion, onExitRegion, this.IAServiceFailed);
  },

  // Stops watching for the changes in region id
  stopRegionWatch: function() {
    IndoorAtlas.clearRegionWatch(this.regionWatchId);
  },
  // Initializes Google Maps with the given properties
  initializeMap: function() {
    image ={
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#00A5F6',
      fillOpacity: 1.0,
      scale: 6.0,
      strokeColor: '#00A5F6',
      strokeWeight: 1
    };
    var mapProp = {
      center: new google.maps.LatLng(65.060848804763, 25.4410770535469),
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false
    };
    venuemap = new google.maps.Map(document.getElementById('googleMap'), mapProp);
    cordovaExample.mapOverlay({regionId: IA_FLOORPLAN_ID});
  },

  // Sets an overlay to Google Maps specified by the floorplan coordinates and bearing
  mapOverlay: function(position) {
    try {
      SpinnerPlugin.activityStart('Setting overlay');
      var win = function(floorplan) {
        SpinnerPlugin.activityStop();
        // Set position and map overlay
        cordovaExample.setMapOverlay(floorplan);

      };
      var fail = function(error) {
        SpinnerPlugin.activityStop();
        alert(error.message);
      };

      // Gets the floorplan with the given region ID (floorplan ID) and then continues as specified earlier
      IndoorAtlas.fetchFloorPlanWithId(position.regionId, win, fail);
    }
    catch(error) {
      alert(error);
    }
  },

  // Sets the map overlay
  setMapOverlay: function(floorplan) {
    // Needed to calculate the coordinates for floorplan that has not yet been rotated
    var center = floorplan.center;
    var pixelsToMeters = floorplan.pixelsToMeters;
    var heightForCoordinates = floorplan.bitmapHeight/2;
    var widthForCoordinates = floorplan.bitmapWidth/2;

    // Amount of meters of how much the coordinates have to be moved from the centre.
    var metersHorizontal = widthForCoordinates * pixelsToMeters;
    var metersVertical = heightForCoordinates * pixelsToMeters;

    // This function returns the length of one degree of latitude and same for longitude for the given latitude
    var lengths = cordovaExample.calculateLongLatDegreesInMeters(center[1]);

    // Amounts of how much the coordinates need to be moved from the centre
    var longitudes = metersHorizontal / lengths.degreeOfLongitudeInMeters;
    var latitudes = metersVertical / lengths.degreeOfLatitudeInMeters;

    // Calculate the new south-west and north-east coordinates
    var swCoords = new google.maps.LatLng({lat: center[1] - latitudes, lng: center[0] - longitudes});
    var neCoords = new google.maps.LatLng({lat: center[1] + latitudes, lng: center[0] + longitudes});

    // Get the bound of the unrotated image
    var bounds = new google.maps.LatLngBounds(swCoords , neCoords);

    // Options for custom class GroundOverlayEX
    var options = {
      // Rotates image counter-clockwise and floorplan.bearing has rotation clockwise therefore 360-[degrees] is needed
      rotate: 360 - floorplan.bearing
    };

    // Remove previous overlay if it exists
    if (groundOverlay != null) {
      groundOverlay.setMap(null);
    }

    // Creates new GroundOverlayEX for displaying floorplan in Google Maps
    // Custom class GroundOverlayEX is used to do this because Google Maps JavaScript API doesn't support rotation
    groundOverlay = new GroundOverlayEX(floorplan.url, bounds, options);
    // Displays the overlay in the map
    groundOverlay.setMap(venuemap);
    venuemap.setZoom(20);
  },

  // Updates the ground overlay
  updateOverlay: function(id) {
    var win = function(floorplan) {
      SpinnerPlugin.activityStop();
      cordovaExample.setMapOverlay(floorplan);
    };
    var fail = function(error) {
      SpinnerPlugin.activityStop();
      alert(error.message);
    };

    // Gets the floorplan with the given region ID (floorplan ID) and then continues as specified earlier
    IndoorAtlas.fetchFloorPlanWithId(id, win, fail);
  },

  // Calculates length of degree of latitude and longitude according to the given latitude. Returns both of these lengths.
  calculateLongLatDegreesInMeters: function(latitude) {
    var lat = Math.PI * latitude / 180;

    // Constants for calculating lengths
    var m1 = 111132.92;
    var m2 = -559.82;
    var m3 = 1.175;
    var m4 = -0.0023;
    var p1 = 111412.84;
    var p2 = -93.5;
    var p3 = 0.118;

    // Calculate the length of a degree of latitude and longitude in meters
    var lengthOfDegreeOfLatitudeInMeters = m1 + (m2 * Math.cos(2 * lat)) + (m3 * Math.cos(4 * lat)) + (m4 * Math.cos(6 * lat));
    var lengthOfDegreeOfLongitudeInMeters = (p1 * Math.cos(lat)) + (p2 * Math.cos(3 * lat)) +	(p3 * Math.cos(5 * lat));

    var lengths = {degreeOfLatitudeInMeters: lengthOfDegreeOfLatitudeInMeters, degreeOfLongitudeInMeters: lengthOfDegreeOfLongitudeInMeters};
    return lengths
  }
};
