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

  var floorPlanView = new FloorPlanView(map);
  var currentVenue = null;
  var currentFloorPlan = null;
  var that = this;
  var lockedFloor = null;

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

  function setCurrentFloorPlan(floorPlan) {
    currentFloorPlan = floorPlan;
    floorPlanView.showAndHideOthers(floorPlan);
    showCurrentFloorNumber();
    if (onFloorChange) onFloorChange(floorPlan);
  }

  function changeFloor(delta) {
    var index = findCurrentFloorPlanIndex();
    if (index < 0) return;
    // new floor
    index += delta;
    if (index < 0 || index >= currentVenue.floorPlans.length) return;

    currentFloorPlan = currentVenue.floorPlans[index];
    setCurrentFloorPlan(currentFloorPlan);
  }

  $("#floor-up").click(function () { changeFloor(1); });
  $("#floor-down").click(function () { changeFloor(-1); });
  $("#floor-lock").click(function () {
    var floorNumber = that.getFloorNumber();
    if (floorNumber === null) return;

    if (floorNumber === lockedFloor) {
      floorNumber = null;
    }

    if (lockedFloor !== floorNumber) {
      lockedFloor = floorNumber;
      if (lockedFloor === null) {
        console.log("unlock floor");
        IndoorAtlas.unlockFloor();
      } else {
        console.log("locking floor "+lockedFloor);
        IndoorAtlas.lockFloor(lockedFloor);
      }
    }

    $("#floor-lock").toggleClass("active-lock", lockedFloor !== null);
  });

  this.getFloorNumber = function () {
    if (!currentFloorPlan) return null;
    return currentFloorPlan.floorLevel;
  }

  this.onEnterFloorPlan = function (floorPlan) {
    console.log("enter floor plan "+floorPlan.id);
    setCurrentFloorPlan(floorPlan);
  };

  this.onExitFloorPlan = function () {
    currentFloorPlan = null;

    setTimeout(function () {
      // don't hide immediately if the callback is followed by
      // another enter floor plan event
      if (!currentFloorPlan) {
        floorPlanView.hideAll();
      }
    }, 100);
  };

  this.onEnterVenue = function (venue) {
    currentVenue = venue;
    console.log("enter venue "+venue.id);
    if (currentVenue.floorPlans.length > 0) { // enables floor lock to single floor venue
      currentVenue.floorPlans.sort(function(a, b) {
        return a.floorLevel - b.floorLevel;
      });
      $("#floor-selector").removeClass("hidden");
    } else {
      console.log("not showing floor selector for a single-floor venue");
    }
  };

  this.onExitVenue = function () {
    $("#floor-selector").addClass("hidden");
  };
}
