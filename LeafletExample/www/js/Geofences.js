/**
 * IndoorAtlas geofences example
 */

function GeofenceController(map) {
  var triggeredGeofences = [];
  var geofenceLayers = [];
  var currentFloor = null;

  function updatePolygons() {
    // remove previously triggered geofences from the map
    geofenceLayers.forEach(function (layer) { layer.remove(); });
    geofenceLayers = [];

    triggeredGeofences.forEach(function (geofence) {
      var style;
      if (geofence.floor == currentFloor) {
        style = { color: 'blue', opacity: 0.7, weight: 5};
      } else {
        style = { color: 'gray', opacity: 0.7, weight: 5};
      }
      geofenceLayers.push(L.polygon(geofence.coordinates.map(function (coord) {
        return [coord.latitude, coord.longitude];
      })));
    });

    geofenceLayers.forEach(function (layer) { layer.addTo(map); });
  }

  this.updateTriggeredGeofences = function (transitionType, geofence) {
    if (transitionType == 'ENTER') {
      // Queue entered geofence for rendering
      var alreadyTriggered = triggeredGeofences.find(function (triggered) {
        return triggered.id == geofence.id;
      });
      if (!alreadyTriggered) {
        triggeredGeofences.push(geofence);
      }
    } else if (transitionType == 'EXIT') {
      // Remove exited geofences from list of rendered
      var isTriggered = triggeredGeofences.findIndex(function (triggered) {
        return triggered.id == geofence.id;
      });
      if (isTriggered >= 0) {
        triggeredGeofences.splice(isTriggered, 1);
      }
    } else {
      console.warn('Unknown geofence event transition type');
    }
    updatePolygons();
  };

  this.setCurrentFloor = function (floor) {
    if (floor !== null) currentFloor = floor;
    updatePolygons();
  };

  this.removeGeofences = function () {
    triggeredGeofences = [];
    updatePolygons();
  };
}
