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

function CordovaExample() {

  var map = null;
  var self = this;

  var watchId = null;
  var regionWatchId = null;

  var accuracyCircle = null;
  var floorPlanManager = null;

  // ---- public

  // Configures IndoorAtlas SDK with API Key and Secret
  // Set the API Keys in www/js/APIKeys.js
  this.configureIA = function() {
    var _config = {key : IA_API_KEY, secret : IA_API_SECRET};
    IndoorAtlas.onStatusChanged(onStatusChanged, alert);
    IndoorAtlas.initialize(IAServiceConfigured, IAServiceFailed, _config);
    return false;
  };

  // ---- private

  function onStatusChanged(status) {
    console.log("status changed: "+status.message);
    if (status.code === CurrentStatus.STATUS_OUT_OF_SERVICE) {
      alert("Unrecoverable error: "+status.message);
    }
  }

  function IAServiceFailed (result) {
    // Try again to initialize the service
    console.warn("IAServiceFailed, trying again: "+JSON.stringify(result));
    setTimeout(self.configureIA, 2*1000);
  }

  function IAServiceConfigured(result) {
    startPositioning();
  }

  // Starts IA positioning
  function startPositioning() {
    if (watchId != null) {
      IndoorAtlas.clearWatch(watchId);
    }
    watchId = IndoorAtlas.watchPosition(showLocation, IAServiceFailed);
    startRegionWatch();
  }

  // Displays the current location of the user
  function showLocation(position) {
    // Show a map centered at (position.coords.latitude, position.coords.longitude).
    try {
      var center = [position.coords.latitude, position.coords.longitude];

      function setCircleProperties() {
        accuracyCircle.setLatLng(center);
        accuracyCircle.setRadius(position.coords.accuracy);
      }

      if (!accuracyCircle) {
        // first location
        accuracyCircle = L.circle([0,0], {radius: 1});
        setCircleProperties();
        accuracyCircle.addTo(map);

        var ZOOM_LEVEL = 19;
        map.setView(center, ZOOM_LEVEL);
      } else {
        setCircleProperties();
      }
    }
    catch(error) {alert(error)};
  }

  // Starts watching changes in region id
  function startRegionWatch() {
    if (regionWatchId != null) {
      IndoorAtlas.clearRegionWatch(regionWatchId);
    }
    var onEnterRegion = function(region) {
      if (region.regionType == Region.TYPE_FLOORPLAN) {
        floorPlanManager.onEnterFloorPlan(region.regionId);
      }
    };
    var onExitRegion = function(region) {
      if (region.regionType == Region.TYPE_FLOORPLAN) {
        floorPlanManager.onExitFloorPlan(region.regionId);
      }
    };
    regionWatchId = IndoorAtlas.watchRegion(onEnterRegion, onExitRegion, IAServiceFailed);
  }

  // Stops watching for the changes in region id
  function stopRegionWatch() {
    IndoorAtlas.clearRegionWatch(regionWatchId);
  }

  // Initializes Leaflet map
  function initializeMap() {

  	map = L.map('map').fitWorld();

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

    floorPlanManager = new FloorPlanManager(map);
  }

  // ---- init
  initializeMap();
};

// can hide an show multiple floor plans on a map
function FloorPlanView(map) {
  var layers = {};
  var visibleFloorPlans = {};

  function asLatLng(coords) {
    return [coords[1], coords[0]];
  }

  function buildImageOverlay(floorPlan) {
    return L.imageOverlay.rotated(floorPlan.url,
      asLatLng(floorPlan.topLeft),
      asLatLng(floorPlan.topRight),
      asLatLng(floorPlan.bottomLeft));
  }

  this.show = function(floorPlan) {
    var id = floorPlan.id;
    if (visibleFloorPlans[id]) return;

    if (!layers[id]) {
      layers[id] = buildImageOverlay(floorPlan);
    }
    layers[id].addTo(map);
    visibleFloorPlans[id] = true;
  }

  this.hide = function(floorPlan) {
    var id = floorPlan.id;
    if (!visibleFloorPlans[id]) return;
    layers[id].remove();
    visibleFloorPlans[id] = false;
  }
}

// handles caching of floor plan metadata and fetching it from the IA Cloud
function FloorPlanCache() {
  var metadata = {};

  this.fetchById = function (id, callback) {
    // download unless cached or pending
    if (!metadata[id]) {
      metadata[id] = "pending";
      IndoorAtlas.fetchFloorPlanWithId(id, function (floorPlan) {
        metadata[id] = floorPlan;
        callback(floorPlan);
      }, function (error) {
        alert("Failed to fetch floor plan with ID "+id+": "+JSON.stringify(error));
      });
    }
    else if (metadata[id] != "pending") {
      callback(floorPlan);
    }
  };
}

// handles fetching of floor plan metadata from IA cloud & showing
// a single floor plan
function FloorPlanManager(map) {
  var floorPlanView = new FloorPlanView(map);
  var floorPlanCache = new FloorPlanCache();

  // which floor plan should be visible
  var currentFloorPlanId = null;

  // which floor plan is visible
  var visibleFloorPlan = null;

  function showFloorPlan(floorPlan) {
    var id = floorPlan.id;
    floorPlanView.show(floorPlan);

    // remove after adding the new floor plan to reduce blinking
    if (visibleFloorPlan && visibleFloorPlan.id != id) {
      floorPlanView.hide(visibleFloorPlan);
    }
    visibleFloorPlan = floorPlan;
  };

  this.hide = function() {
    if (visibleFloorPlan) {
      floorPlanView.hide(visibleFloorPlan);
      visibleFloorPlan = null;
    }
  };

  this.onExitFloorPlan = function(id) {
    currentFloorPlanId = null;

    setTimeout(function () {
      // don't hide immediately if the callback is followed by
      // another enter floor plan event
      if (!currentFloorPlanId && visibleFloorPlan) {
        this.hide();
      }
    }, 100);
  };

  this.onEnterFloorPlan = function(id) {
    currentFloorPlanId = id;
    floorPlanCache.fetchById(id, function (floorPlan) {
      if (currentFloorPlanId != id) return;
      showFloorPlan(floorPlan);
    });
  };
}

app.initialize();
var cordovaExample = new CordovaExample();
