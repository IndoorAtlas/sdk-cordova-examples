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

function ExampleApp() {

  var map = L.map('map', {
    zoomControl: false
  }).fitWorld();

  if (MAPBOX_ACCESS_TOKEN) {
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}{r}.png?access_token=' + MAPBOX_ACCESS_TOKEN, {
      maxZoom: 23,
      attribution: 'Map data &copy; OpenStreetMap contributors, ' +
        'CC-BY-SA, ' +
        'Imagery © Mapbox',
      id: 'mapbox.light',
      detectRetina: true
    }).addTo(map);
  }

  // fix Leaflet zooming bugs
  var zoomOngoing = false;
  map.on('zoomstart', function () {
    zoomOngoing = true;
  });
  map.on('zoomend', function () {
    zoomOngoing = false;
  });

  var accuracyCircle = null;
  var lastPosition = null;
  var wayfindingController = null;
  var blueDotMarker = null;

  this.onFloorChange = function () {
    console.log("floorChange");
    if (lastPosition) this.onLocationChanged(lastPosition);
    if (wayfindingController) {
      wayfindingController.setCurrentFloor(floorPlanSelector.getFloorNumber());
    }
  };

  this.onPositioningStarted = function () {
    readJsonAsset('www/data/wayfinding-graph.json').then(function (graph) {
      console.log("initializing wayfinding");
      buildWayfindingController(graph, map).then(function(wfc) {
        wayfindingController = wfc;
        wayfindingController.setCurrentFloor(floorPlanSelector.getFloorNumber());

        map.on('mouseup', function (event) {
          // tap routes to pressed location
          var floor = floorPlanSelector.getFloorNumber();
          if (wayfindingController && floor !== null) {
            wayfindingController.setDestination(
              event.latlng.lat,
              event.latlng.lng,
              floor);
          }
        });
      });
    }).catch(function (error) {
      console.log("no wayfinding graph: "+JSON.stringify(error));
    });
  }

  var floorPlanSelector = new FloorPlanSelector(map, this.onFloorChange.bind(this));

  this.onLocationChanged = function(position) {
    lastPosition = position;

    // updating graphics while zooming does not work in Leaflet
    if (zoomOngoing) return;

    var center = [position.coords.latitude, position.coords.longitude];

    if (wayfindingController) {
      wayfindingController.updateLocation(position.coords);
    }

    function setBlueDotProperties() {
      accuracyCircle.setLatLng(center);
      accuracyCircle.setRadius(position.coords.accuracy);

      blueDotMarker.setLatLng(center);
      blueDotMarker.setRotationAngle(position.coords.heading);

      if (floorPlanSelector.getFloorNumber() !== position.coords.floor) {

        accuracyCircle.setStyle({ color: 'gray' });
        if (map.hasLayer(blueDotMarker)) {
          blueDotMarker.remove();
        }
      } else {
        accuracyCircle.setStyle({ color: 'blue' });
        if (!map.hasLayer(blueDotMarker)) {
          blueDotMarker.addTo(map);
        }
      }
    }

    if (!accuracyCircle) {
      // first location
      accuracyCircle = L.circle([0,0], { radius: 1, opacity: 0 });
      blueDotMarker = L.marker([0,0], {
        icon: L.icon({
          iconUrl: 'img/blue_dot.png',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      });

      setBlueDotProperties();

      accuracyCircle.addTo(map);
      blueDotMarker.addTo(map);

      var ZOOM_LEVEL = 19;
      map.setView(center, ZOOM_LEVEL);
    } else {
      setBlueDotProperties();
    }
  };

  this.onEnterRegion = function(region) {
    if (region.regionType == Region.TYPE_FLOORPLAN) {
      floorPlanSelector.onEnterFloorPlan(region.regionId);
    } else if (region.regionType == Region.TYPE_VENUE) {
      floorPlanSelector.onEnterVenue(region.regionId);
    }
  };

  this.onExitRegion = function(region) {
    if (region.regionType == Region.TYPE_FLOORPLAN) {
      floorPlanSelector.onExitFloorPlan(region.regionId);
    }  else if (region.regionType == Region.TYPE_VENUE) {
      floorPlanSelector.onExitVenue(region.regionId);
    }
  };
}

var cordovaAndIaController = {
  watchId: null,
  regionWatchId: null,

  // Application Constructor
  initialize: function() {
    this.bindEvents();
  },

  // Bind Cordova Event Listeners
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },

  // deviceready Event Handler
  onDeviceReady: function() {
    if (!window.Promise) {
      window.Promise = IAPromise;
    }
    this.configureIA();
  },

  // Configure IndoorAtlas SDK with API Key
  configureIA: function() {
    var _config = {key : IA_API_KEY, secret : IA_API_SECRET};
    IndoorAtlas.onStatusChanged(this.onStatusChanged.bind(this), alert);
    IndoorAtlas.initialize(
      this.IAServiceConfigured.bind(this),
      this.IAServiceFailed.bind(this), _config);
  },

  onStatusChanged: function (status) {
    console.log("status changed: "+status.message);
    if (status.code === CurrentStatus.STATUS_OUT_OF_SERVICE) {
      alert("Unrecoverable error: "+status.message);
    }
  },

  IAServiceFailed: function (result) {
    // Try again to initialize the service
    console.warn("IAServiceFailed, trying again: "+JSON.stringify(result));
    setTimeout(this.configureIA.bind(this), 2*1000);
  },

  IAServiceConfigured: function() {
    console.log("IA configured");
    this.startPositioning();
  },

  startPositioning: function() {
    console.log("starting positioning");

    var onError = this.IAServiceFailed.bind(this);

    // watch position
    if (this.watchId != null) {
      IndoorAtlas.clearWatch(this.watchId);
    }
    this.watchId = IndoorAtlas.watchPosition(
      app.onLocationChanged.bind(app), onError);

    // watch region
    if (this.regionWatchId != null) {
      IndoorAtlas.clearRegionWatch(this.regionWatchId);
    }
    this.regionWatchId = IndoorAtlas.watchRegion(
      app.onEnterRegion.bind(app),
      app.onExitRegion.bind(app), onError);

    app.onPositioningStarted();
  }
};

cordovaAndIaController.initialize();
var app = new ExampleApp();
