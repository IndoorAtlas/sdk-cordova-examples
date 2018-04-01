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

  function applyShortcutsBasedOnAccuracy(route) {
    var remainingSlack = Math.max(currentLocation.accuracy, 20);

    remainingSlack -= route[0].length;
    route = route.slice(1); // always skip first artificial leg

    while (route.length > 0 &&
      route[0].length < remainingSlack &&
      route[0].end.floor === route[0].begin.floor) {

      remainingSlack -= route[0].length;
      route = route.slice(1);
    }
    return route;
  }

  function updatePolylines() {
    // Clear previous polylines from the map
    wayfindingRoutePolylines.map(function(pl) { pl.remove(); });
    wayfindingRoutePolylines = [];

    if (!currentRoute || currentRoute.length === 0 || !currentLocation) {
      return;
    }
    var route = applyShortcutsBasedOnAccuracy(currentRoute);
    if (route.length === 0) {
      var dest = currentRoute[currentRoute.length-1].end;
      // keep endpoint for visualization of direct & straight routes from
      // the current location to destination
      route = [{
        begin: dest,
        end: dest
      }];
    }

    // Draw polylines on the map
    function addPolyline(routePiece, style) {

      var latlngs = routePiece.map(function (legNode) {
        return [legNode.latitude, legNode.longitude];
      });

      var pl = L.polyline(latlngs, style).addTo(map);
      wayfindingRoutePolylines.push(pl);
    }

    function currentFloorStyle() {
      return { color: 'blue', opacity: 0.7, weight: 5 };
    }

    function differentFloorStyle() {
      return { color: 'gray', opacity: 0.5, weight: 5 };
    }

    function makeDashed(style) {
      style.dashArray = "3, 10";
      return style;
    }

    // dashed line: current location to route begin
    addPolyline([currentLocation, route[0].begin], makeDashed(
      currentLocation.floor === currentFloor
        ? currentFloorStyle()
        : differentFloorStyle()
    ));

    // For visualization, split returned multi-floor route to multiple
    // parts: the part of the current floor and others
    // the part on the current floor and rest of the route on other floors
    var routePieces = [];
    var isCurrentFloor = route[0].begin.floor == currentFloor;
    var currentPiece = [route[0].begin];

    for (var legIndex = 0; legIndex < route.length; legIndex++) {
      // Weird bug on iOS: changing != to !== here may break stuff
      var nowCurrentFloor = route[legIndex].end.floor == currentFloor;
      if (nowCurrentFloor != isCurrentFloor) {
        routePieces.push(currentPiece);
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
    routePieces.push(currentPiece);

    routePieces.forEach(function (piece) {
      if (piece.length < 2) return;
      var style;
      if (piece[0].floor == currentFloor && piece[1].floor == currentFloor) {
        style = currentFloorStyle();
      } else {
        style = differentFloorStyle();
      }
      addPolyline(piece, style);
    });
  }

  function updateRoute() {
    wayfinder.getRoute().then(function(result) {
      currentRoute = result.route;
      updatePolylines();
    });
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
