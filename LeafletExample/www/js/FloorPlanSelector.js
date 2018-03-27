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

function FloorPlanSelector(map, onFloorChange) {

  var floorPlanCache = new FloorPlanCache();
  var floorPlanView = new FloorPlanView(map, floorPlanCache);
  var venueCache = new PromiseCache();
  var currentVenue = null;
  var currentFloorPlanId = null;
  var currentFloorPlan = null;
  var that = this;

  function getVenue(id) {
    var VENUE_API_ENDPOINT = 'https://positioning-api.indooratlas.com/v1';
    // note: the API key needs to have the Positioning API scope enabled
    // or the floor plan selector UI will not be displayed
    var venueUrl = VENUE_API_ENDPOINT + '/venues/' + id + '?key=' + IA_API_KEY;
    return new Promise((resolve, reject) => {
      $.getJSON(venueUrl, data => resolve(data)).fail(reject);
    });
  }

  function findCurrentFloorPlanIndex() {
    if (!currentVenue && !currentFloorPlan) return -1;
    var fps = currentVenue.floorPlans;
    for (var index = 0; index < fps.length; index++) {
      if (fps[index].id === currentFloorPlan.id) return index;
    }
    return -1;
  }

  function showCurrentFloorNumber() {
    $('#floor-number').text('' + that.getFloorNumber());
  }

  function setCurrentFloorPlanId(floorPlanId) {
    currentFloorPlanId = floorPlanId;
    floorPlanView.showAndHideOthers(currentFloorPlanId);
    floorPlanCache.get(floorPlanId).then(function (floorPlan) {
      if (currentFloorPlanId !== floorPlan.id) return;
      currentFloorPlan = floorPlan;
      showCurrentFloorNumber();
      if (onFloorChange) onFloorChange(floorPlan);
    });
  }

  function changeFloor(delta) {
    var index = findCurrentFloorPlanIndex();
    if (index < 0) return;
    // new floor
    index += delta;
    if (index < 0 || index >= currentVenue.floorPlans.length) return;

    currentFloorPlanId = currentVenue.floorPlans[index].id;
    setCurrentFloorPlanId(currentFloorPlanId);
  }

  $("#floor-up").click(function () { changeFloor(1); });
  $("#floor-down").click(function () { changeFloor(-1); });

  this.getFloorNumber = function () {
    if (!currentFloorPlan) return null;
    return currentFloorPlan.floorLevel;
  }

  this.onEnterFloorPlan = function (floorPlanId) {
    console.log("enter floor plan "+floorPlanId);
    setCurrentFloorPlanId(floorPlanId);
  };

  this.onExitFloorPlan = function (floorPlanId) {
    currentFloorPlanId = null;

    setTimeout(function () {
      // don't hide immediately if the callback is followed by
      // another enter floor plan event
      if (!currentFloorPlanId) {
        floorPlanView.hideAll();
      }
    }, 100);
  };

  this.onEnterVenue = function (venueId) {
    console.log("enter venue "+venueId);
    venueCache.get(venueId, getVenue).then(function (venue) {
      currentVenue = venue;
      if (currentVenue.floorPlans.length > 1) {
        currentVenue.floorPlans.sort(function(a, b) {
          return a.floorNumber - b.floorNumber;
        });
        $("#floor-selector").removeClass("hidden");
      } else {
        console.log("not showing floor selector for a single-floor venue");
      }
    });
  };

  this.onExitVenue = function (venueId) {
    $("#floor-selector").addClass("hidden");
  };
}
