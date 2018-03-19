/*
* IndoorAtlas Cordova Plugin Examples: Floor certainty filter
* https://github.com/IndoorAtlas/sdk-cordova-examples
*/

// requires setting variables IA_API_KEY and IA_API_SECRET to work

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

var exampleApp = {
  onPositioningStarted: function() {
    console.log("positioning (re)started");
    this.targetFloorAccuracyReached = false;
    this.floorPlanId = null;
    this.venueId = null;
  },

  onPositioningStopped: function() {
    console.log("positioning stopped");
  },

  onLocationChanged: function(loc) {
    var FLOOR_CERTAINTY_THRESHOLD = 0.7;
    if (this.floorPlanId && loc.floorCertainty > FLOOR_CERTAINTY_THRESHOLD) {
      if (!this.targetFloorAccuracyReached) {
        this.targetFloorAccuracyReached = true;
        console.log("now show floor plan: "+this.floorPlanId);
      }
    }
  },

  onEnterRegion: function(region) {
    if (region.regionType == Region.TYPE_FLOORPLAN) {
      this.floorPlanId = region.regionId;
    } else if (region.regionType == Region.TYPE_VENUE) {
      this.venueId = region.regionId;
      console.log("enter venue "+this.venueId);
    }
  },

  onExitRegion: function(region) {
    if (region.regionType == Region.TYPE_FLOORPLAN) {
      this.floorPlanId = null;
    } else if (region.regionType == Region.TYPE_VENUE) {
      this.venueId = null;
    }
  }
};

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
    exampleApp.onPositioningStarted();

    var onError = this.IAServiceFailed.bind(this);

    // watch position
    if (this.watchId != null) {
      IndoorAtlas.clearWatch(this.watchId);
    }
    this.watchId = IndoorAtlas.watchPosition(
      exampleApp.onLocationChanged.bind(exampleApp), onError);

    // watch region
    if (this.regionWatchId != null) {
      IndoorAtlas.clearRegionWatch(this.regionWatchId);
    }
    this.regionWatchId = IndoorAtlas.watchRegion(
      exampleApp.onEnterRegion.bind(exampleApp),
      exampleApp.onExitRegion.bind(exampleApp), onError);
  },

  stopPositioning: function() {
    if (this.watchId != null) {
      IndoorAtlas.clearWatch(this.watchId);
    }
    if (this.regionWatchId != null) {
      IndoorAtlas.clearRegionWatch(this.regionWatchId);
    }

    exampleApp.onPositioningStopped();
  }
};

cordovaAndIaController.initialize();

// timer: stop positioning after 60 seconds
setTimeout(
  cordovaAndIaController.stopPositioning.bind(cordovaAndIaController),
  60*1000);
