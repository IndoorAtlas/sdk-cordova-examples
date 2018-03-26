/**
 * IndoorAtlas Wayfinding example
 */

// Read a static JSON file
function readJsonAsset(assetName, callback) {
  var fileName = cordova.file.applicationDirectory + assetName;
  return new Promise(function (resolve, reject) {
    window.resolveLocalFileSystemURL(fileName, function (fileEntry) {
      fileEntry.file(function (file) {
        var reader = new FileReader();
        reader.onloadend = function (e) {
          if (!this.result) {
            reject("no contents");
          } else {
            resolve(this.result);
          }
        };
        reader.readAsText(file);
      }, reject);
    }, reject);
  });
}

function buildWayfindingController(graph, map) {
  return IndoorAtlas.buildWayfinder(graph).then(function(wayfinder) {
    return new WayfindingController(wayfinder, map);
  });
}

function WayfindingController(wayfinder, map) {
  var wayfindingRoutePolylines = [];
  var currentFloor = null;

  function updatePolylines() {
    var success = function(result) {
      var route = result.route;

      // Clear previous polylines from the map
      wayfindingRoutePolylines.map(function(pl) { pl.remove(); });
      wayfindingRoutePolylines = [];

      if (route === null || route.length === 0) {
        // Null just clears the route
        return;
      }

      // For visualization, split returned multi-floor route to multiple
      // parts: the part of the current floor and others
      // the part on the current floor and rest of the route on other floors
      var routes = [];
      var isCurrentFloor = route[0].begin.floor == currentFloor;
      var currentRoute = [route[0].begin];

      // split to continuous subroutes where the floor does not change
      var legIndex = 0;
      for (var legIndex = 0; legIndex < route.length; legIndex++) {
        // Weird bug on iOS: changing != to !== here may break stuff
        var nowCurrentFloor = route[legIndex].end.floor == currentFloor;
        if (nowCurrentFloor != isCurrentFloor) {
          routes.push(currentRoute);
          if (!isCurrentFloor) {
            currentRoute.push(route[legIndex].end);
            currentRoute = [];
          } else {
            currentRoute = [route[legIndex].begin];
          }
          nowCurrentFloor = isCurrentFloor;
        }
        currentRoute.push(route[legIndex].end);
      }

      if (currentRoute.length > 1) {
        routes.push(currentRoute);
      }

      // Draw polylines on the map
      function addPolyline(route, style) {

        var latlngs = route.map(function (legNode) {
          return [legNode.latitude, legNode.longitude];
        });

        var pl = L.polyline(latlngs, style).addTo(map);
        wayfindingRoutePolylines.push(pl);
      }

      routes.forEach(function (route) {
        console.log(route);
        var style;
        if (route[0].floor == currentFloor && route[1].floor == currentFloor) {
          style = { color: 'blue', opacity: 0.7, weight: 5 };
        } else {
          style = { color: 'gray', opacity: 0.5, weight: 5 };
        }
        addPolyline(route, style);
      });
    };

    wayfinder.getRoute().then(success).catch(alert);
  };

  this.updateLocation = function (location) {
    wayfinder.setLocation(location.latitude, location.longitude, location.floor);
    updatePolylines();
  };

  this.setDestination = function (lat, lon, floor) {
    wayfinder.setDestination(lat, lon, floor);
    updatePolylines();
  };

  this.setCurrentFloor = function (floor) {
    console.log("set "+floor);
    if (floor !== null) currentFloor = floor;
    updatePolylines();
  }
}
