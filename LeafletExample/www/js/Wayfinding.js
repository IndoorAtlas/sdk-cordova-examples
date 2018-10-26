/**
 * IndoorAtlas Wayfinding example
 */

function WayfindingController(map) {
  var wayfindingRoutePolylines = [];
  var currentFloor = null;
  var currentRoute = null;

  function updatePolylines() {
    // Clear previous polylines from the map
    wayfindingRoutePolylines.map(function(pl) { pl.remove(); });
    wayfindingRoutePolylines = [];

    if (!currentRoute || currentRoute.length === 0) {
      return;
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
    addPolyline([currentRoute[0].begin, currentRoute[0].end], makeDashed(
      currentRoute[0].begin.floor === currentFloor
        ? currentFloorStyle()
        : differentFloorStyle()
    ));

    // always skip first artificial leg (special rendering)
    var route = currentRoute.slice(1);

    // direct route from location to destination
    if (route.length === 0) {
      return;
    }

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

  this.updateRoute = function (route) {
    currentRoute = route.legs;
    updatePolylines();
  }

  this.hideRoute = function () {
    currentRoute = null;
    updatePolylines();
  }

  this.routeFinished = function () {
    if (!currentRoute || currentRoute.length === 0) return false;
    var totalLength = 0;
    currentRoute.forEach(function (leg) { totalLength += leg.length; });
    var FINISHED_THRESHOLD_METERS = 10.0;
    return totalLength < FINISHED_THRESHOLD_METERS;
  }

  this.setCurrentFloor = function (floor) {
    if (floor !== null) currentFloor = floor;
    updatePolylines();
  }
}
