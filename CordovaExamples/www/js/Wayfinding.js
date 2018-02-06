/**
 * IndoorAtlas Wayfinding example
 */

// Read a static JSON file
function readJsonAsset(assetName, callback) {
  var fileName = cordova.file.applicationDirectory + assetName;
  function onError(e) {
    console.error("Error reading " + fileName);
    throw e;
  }
  window.resolveLocalFileSystemURL(fileName, function (fileEntry) {
    fileEntry.file(function (file) {
      var reader = new FileReader();
      reader.onloadend = function (e) {
        callback(this.result);
      };
      reader.readAsText(file);
    }, onError);
  }, onError);
}

function buildWayfindingController(graph, googleMap) {
  return IndoorAtlas.buildWayfinder(graph).then(function(wayfinder) {
    return new WayfindingController(wayfinder, googleMap);
  });
}

function WayfindingController(wayfinder, googleMap) {
  var wayfindingRoutePolylines = [];

  function updatePolylines() {
    var success = function(result) {
      var route = result.route;

      // Clear previous polylines from the map
      wayfindingRoutePolylines.map(function(pl) { pl.setMap(null); });
      wayfindingRoutePolylines = [];

      if (route === null || route.length === 0) {
        // Null just clears the route
        return;
      }

      var currentFloor = route[0].begin.floor;
      // For visualization, split returned multi-floor route to two parts:
      // the part on the current floor and rest of the route on other floors
      var currentFloorRoute = [route[0].begin];

      var legIndex = 0;
      // Weird bug on iOS: changing == to === here does not work
      while (legIndex < route.length && route[legIndex].end.floor == currentFloor) {
        currentFloorRoute.push(route[legIndex].end);
        legIndex++;
      }

      var restOfRoute = [route[legIndex-1].end];

      while (legIndex < route.length) {
        restOfRoute.push(route[legIndex].end);
        legIndex++;
      }

      // Draw polylines on the map
      function addPolyline(spec) {
        // Convert leg nodes to google maps latlng points
        spec.path = spec.path.map(function (legNode) {
          return {
            lat: legNode.latitude,
            lng: legNode.longitude
          };
        });
        var pl = new google.maps.Polyline(spec);
        wayfindingRoutePolylines.push(pl);
        pl.setMap(googleMap);
      }

      addPolyline({
        path: currentFloorRoute,
        strokeColor: '#0000FF',
        strokeOpacity: 0.6,
        strokeWeight: 4
      });

      // The "other floors" part may be empty
      if (restOfRoute.length > 1) {
        addPolyline({
          path: restOfRoute,
          strokeColor: '#808080',
          strokeOpacity: 0.2,
          strokeWeight: 4
        });
      }
    };

    wayfinder.getRoute()
    .then(success).catch(function(e) { alert(e) });
  };

  this.updateLocation = function (location) {
    wayfinder.setLocation(location.latitude, location.longitude, location.floor);
    updatePolylines();
  };

  this.setDestination = function (lat, lon, floor) {
    wayfinder.setDestination(lat, lon, floor);
    updatePolylines();
  };
}

function onLongPress(map, callback) {
  var LONG_PRESS_TIME_MS = 700;
  var clickCount = 0;

  map.addListener('mousedown', function (downEvent) {
    clickCount++;
    (function (currentClick) {
      setTimeout(function () {
        if (clickCount === currentClick) {
          callback(downEvent);
        }
      }, LONG_PRESS_TIME_MS);
    })(clickCount);
  });

  map.addListener('mouseup', function () {
    clickCount++;
  });

  map.addListener('dragstart', function() {
    clickCount++;
  });
}
