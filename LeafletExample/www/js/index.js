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
  var wayfindingController = new WayfindingController(map);
  var geofenceController = new GeofenceController(map);

  this.onFloorChange = function () {
    if (lastPosition) this.onLocationChanged(lastPosition);
    if (wayfindingController) {
      wayfindingController.setCurrentFloor(floorPlanSelector.getFloorNumber());
    }
    if (geofenceController) {
      geofenceController.setCurrentFloor(floorPlanSelector.getFloorNumber());
    }
  };

  var floorPlanSelector = new FloorPlanSelector(map, this.onFloorChange.bind(this));

  var self = this;
  map.on('mouseup', function (event) {
    // tap routes to pressed location
    var floor = floorPlanSelector.getFloorNumber();
    if (floor !== null) {
      IndoorAtlas.requestWayfindingUpdates({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
        floor: floor
      }, this.onWayfindingUpdate.bind(this));
    }
    IndoorAtlas.lockIndoors(true); // also lock indoors on click
  });

  wayfindingController.setCurrentFloor(floorPlanSelector.getFloorNumber());

  this.onTriggeredGeofences = function(transitionType, geofence) {
    geofenceController.updateTriggeredGeofences(transitionType, geofence);
  };

  this.onLocationChanged = function(position) {
    lastPosition = position;

    // updating graphics while zooming does not work in Leaflet
    if (zoomOngoing) return;

    var center = [position.coords.latitude, position.coords.longitude];
    var rotationAngle = position.coords.heading;

    function setBlueDotProperties() {
      accuracyCircle.setLatLng(center);
      accuracyCircle.setRadius(position.coords.accuracy);

      blueDotMarker.setLatLng(center);
      blueDotMarker.setRotationAngle(rotationAngle);

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

  this.onWayfindingUpdate = function(route) {
    wayfindingController.updateRoute(route);
    if (wayfindingController.routeFinished()) {
      console.log("wayfinding finished!");
      wayfindingController.hideRoute();
      IndoorAtlas.removeWayfindingUpdates();
      IndoorAtlas.lockIndoors(false); // also release indoor lock when stopping WF
    }
  };

  IndoorAtlas.initialize({ apiKey: IA_API_KEY })
    .watchPosition(this.onLocationChanged.bind(this))
    .watchFloorPlan(floorPlanSelector.onFloorPlanChange.bind(floorPlanSelector))
    .watchVenue(floorPlanSelector.onVenueChange.bind(floorPlanSelector))
    .watchGeofences(this.onTriggeredGeofences.bind(this))
    .lockIndoors(true)
    .onStatusChanged(console.log)
    .getTraceId(console.log);
}

document.addEventListener('deviceready', function () {
  new ExampleApp();
}, false);
