/*
* IndoorAtlas Cordova Plugin Examples: Minimal
* https://github.com/IndoorAtlas/sdk-cordova-examples
*/

// requires setting the variable IA_API_KEY

document.addEventListener('deviceready', function () {

  // initialize and start positionins
  IndoorAtlas.initialize({ apiKey: IA_API_KEY })
    .watchPosition(function (position) {
      console.log(
        "latitude: " + position.coords.latitude + ", " +
        "longitude: " + position.coords.longitude + ", " +
        "floor: " + position.coords.floor);
    })
    .watchVenue(function (venue) {
      if (venue) {
        console.log(
          "entered venue " + venue.name + " with " +
          venue.floorPlans.length + " floor plan(s)");
      }
    })
    .watchFloorPlan(function (floorPlan) {
      if (floorPlan) {
        console.log("entered floor plan " + floorPlan.name + ", id: " + floorPlan.id);
      } else {
        console.log("moved outdoors");
      }
    });

  // timer: stop positioning after 20 seconds
  setTimeout(function () { IndoorAtlas.clearWatch(); }, 20*1000);

}, false);
