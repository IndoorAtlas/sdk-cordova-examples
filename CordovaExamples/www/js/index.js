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
var wayfindingController;
var lastFloor = 0;
var groundOverlay = null;
var blueDotVisible = false;
var cordovaExample = {
  watchId: null,
  regionWatchId: null,
  marker: null,
  accuracyCircle: null,
  retina: window.devicePixelRatio > 1,

  // Configures IndoorAtlas SDK with API Key and Secret
  // Set the API Keys in www/js/APIKeys.js
  configureIA: function() {
    var _config = { key: IA_API_KEY, secret: IA_API_SECRET };
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
      var center = { lat: position.coords.latitude, lng: position.coords.longitude };
      lastFloor = position.coords.floor;
      if (wayfindingController) {
        wayfindingController.updateLocation(position.coords);
      }

      marker.setPosition(center);

      accuracyCircle.setRadius(position.coords.accuracy);
      accuracyCircle.setCenter(center);

      if (!blueDotVisible) {
        accuracyCircle.setVisible(true);
        marker.setVisible(true);
        blueDotVisible = true;
        venuemap.panTo(center);
        venuemap.setZoom(20);
      }
    }
    catch(error) {alert(error)};
  },

  // Starts positioning the user in the given floorplan area
  startPositioning: function() {

    SpinnerPlugin.activityStart('Waiting for location');

    if (this.watchId != null) {
      IndoorAtlas.clearWatch(this.watchId);
    }
    this.watchId = IndoorAtlas.watchPosition(this.showLocation, this.IAServiceFailed);
    cordovaExample.startRegionWatch();
  },

  getTraceID: function() {
    // onSuccess Callback
    function onSuccess(data) {
      console.log('TraceId is: '+ data.traceId);
    };

    // onError Callback receives an error object
    function onError(error) {
      alert('Code: '    + error.code    + '\n' +
            'Message: ' + error.message + '\n');
    };

    IndoorAtlas.getTraceId(onSuccess, onError);
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
    if (groundOverlay != null) {
      groundOverlay.setMap(null);
    }
    if (marker != null) {
      marker.setVisible(false);
    }
    if (accuracyCircle != null) {
      accuracyCircle.setVisible(false);
    }
    blueDotVisible = false;
  },

  // Starts watching changes in region id
  startRegionWatch: function() {
    if (this.regionWatchId != null) {
      IndoorAtlas.clearRegionWatch(this.regionWatchId);
    }
    var onEnterRegion = function(region) {
      if (region.regionType == Region.TYPE_FLOORPLAN) {
        cordovaExample.updateOverlay(region.regionId);
      }
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
    image = {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#1681FB',
      fillOpacity: 1.0,
      scale: 5.0,
      strokeColor: '#1681FB',
      strokeWeight: 1
    };
    var mapProp = {
      center: new google.maps.LatLng(65.060848804763, 25.4410770535469),
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,

      // Disable clickable Points of Interest in Google Maps
      styles: [
        {
          "elementType": "labels",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "administrative.land_parcel",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "administrative.neighborhood",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        }
      ]
    };
    venuemap = new google.maps.Map(document.getElementById('googleMap'), mapProp);

    accuracyCircle = new google.maps.Circle({
      strokeColor: '#1681FB',
      strokeOpacity: 0.4,
      strokeWeight: 1,
      fillColor: '#1681FB',
      fillOpacity: 0.4,
      map: venuemap,
      center: new google.maps.LatLng(65.060848804763, 25.4410770535469),
      radius: 1
    });

    marker = new google.maps.Marker({
      position: new google.maps.LatLng(65.060848804763, 25.4410770535469),
      map: venuemap,
      icon: image,
      zIndex: google.maps.Marker.MAX_ZINDEX + 1,
      optimized: false
    });

    marker.setVisible(false);
    marker.setMap(venuemap);
    accuracyCircle.setVisible(false);
    accuracyCircle.setMap(venuemap);

    readJsonAsset('www/data/wayfinding-graph.json', function (graph) {
      if (graph) {
        console.log("initializing wayfinding");
        buildWayfindingController(graph, venuemap).then(function(wfc) {
          wayfindingController = wfc;
        });
      } else {
        console.log("no wayfinding graph");
      }
    });

    onLongPress(venuemap, function (event) {
      // on long-press, route to pressed location (on the same floor as
      // the user is on now)
      if (wayfindingController) {
        wayfindingController.setDestination(
          event.latLng.lat(),
          event.latLng.lng(),
          lastFloor);
      };
    });
  },

  // Sets the map overlay
  setMapOverlay: function(floorplan) {
    // Needed to calculate the coordinates for floorplan that has not yet been rotated
    var center = floorplan.center;
    var pixelsToMeters = floorplan.pixelsToMeters;
    var heightForCoordinates = floorplan.bitmapHeight / 2;
    var widthForCoordinates = floorplan.bitmapWidth / 2;

    // Amount of meters of how much the coordinates have to be moved from the centre.
    var metersHorizontal = widthForCoordinates * pixelsToMeters;
    var metersVertical = heightForCoordinates * pixelsToMeters;

    // This function returns the length of one degree of latitude and same for longitude for the given latitude
    var metersPerLatLonDegree = cordovaExample.calculateMetersPerLatLonDegree(center[1]);

    // Amounts of how much the coordinates need to be moved from the centre
    var longitudes = metersHorizontal / metersPerLatLonDegree.metersPerLongitudeDegree;
    var latitudes = metersVertical / metersPerLatLonDegree.metersPerLatitudeDegree;

    // Calculate the new south-west and north-east coordinates
    var swCoords = new google.maps.LatLng({ lat: center[1] - latitudes, lng: center[0] - longitudes });
    var neCoords = new google.maps.LatLng({ lat: center[1] + latitudes, lng: center[0] + longitudes });

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
  },

  // Updates the ground overlay
  updateOverlay: function(id) {
    var win = function(floorplan) {
      SpinnerPlugin.activityStop();
      cordovaExample.setMapOverlay(floorplan);
    };
    var fail = function(error) {
      SpinnerPlugin.activityStop();
    };

    // Gets the floorplan with the given region ID (floorplan ID) and then continues as specified earlier
    IndoorAtlas.fetchFloorPlanWithId(id, win, fail);
  },

  // Calculates length of degree of latitude and longitude according to the given latitude. Returns both of these lengths.
  calculateMetersPerLatLonDegree: function(latitude) {
    var EARTH_RADIUS_METERS = 6.371e6;
    var METERS_PER_LAT_DEGREE = EARTH_RADIUS_METERS * Math.PI / 180.0;
    var METERS_PER_LONG_DEGREE = METERS_PER_LAT_DEGREE * Math.cos(latitude / 180.0 * Math.PI);

    var metersPerLatLonDegree = { metersPerLatitudeDegree: METERS_PER_LAT_DEGREE, metersPerLongitudeDegree: METERS_PER_LONG_DEGREE };
    return metersPerLatLonDegree;
  }
};
