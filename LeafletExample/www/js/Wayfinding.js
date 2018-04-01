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
  var currentLocation = null;
  var currentRoute = null;

  function updatePolylines() {
    // Clear previous polylines from the map
    wayfindingRoutePolylines.map(function(pl) { pl.remove(); });
    wayfindingRoutePolylines = [];

    if (!currentRoute || currentRoute.length === 0) {
      return;
    }
    var route = currentRoute.slice(0);

    // For visualization, split returned multi-floor route to multiple
    // parts: the part of the current floor and others
    // the part on the current floor and rest of the route on other floors
    var routes = [];
    var isCurrentFloor = route[0].begin.floor == currentFloor;
    var currentPiece = [route[0].begin];

    // split to continuous subroutes where the floor does not change
    var legIndex = 0;
    for (var legIndex = 0; legIndex < route.length; legIndex++) {
      // Weird bug on iOS: changing != to !== here may break stuff
      var nowCurrentFloor = route[legIndex].end.floor == currentFloor;
      if (nowCurrentFloor != isCurrentFloor) {
        routes.push(currentPiece);
        if (!isCurrentFloor) {
          currentPiece.push(route[legIndex].end);
          currentPiece = [];
        } else {
          currentPiece = [route[legIndex].begin];
        }
        nowCurrentFloor = isCurrentFloor;
      }
      currentPiece.push(route[legIndex].end);
    }

    if (currentPiece.length > 1) {
      routes.push(currentPiece);
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
  }

  function updateRoute() {
    wayfinder.getRoute().then(function(result) {
      currentRoute = result.route;
      updatePolylines();
    }).catch(alert);
  }

  this.updateLocation = function (location) {
    currentLocation = location;
    wayfinder.setLocation(location.latitude, location.longitude, location.floor);
    updateRoute();
  };

  this.setDestination = function (lat, lon, floor) {
    wayfinder.setDestination(lat, lon, floor);
    updateRoute();
  };

  this.setCurrentFloor = function (floor) {
    if (floor !== null) currentFloor = floor;
    updatePolylines();
  }
}
