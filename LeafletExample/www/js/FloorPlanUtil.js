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

// can hide an show multiple floor plans on a map
function FloorPlanView(map) {
  var visibleFloorPlans = {};
  var that = this;

  function asLatLng(coords) {
    return [coords[1], coords[0]];
  }

  function buildImageOverlay(floorPlan) {
    return L.imageOverlay.rotated(floorPlan.url,
      asLatLng(floorPlan.topLeft),
      asLatLng(floorPlan.topRight),
      asLatLng(floorPlan.bottomLeft));
  }

  this.show = function(floorPlan) {
    var id = floorPlan.id;
    if (visibleFloorPlans[id]) return;
    visibleFloorPlans[id] = buildImageOverlay(floorPlan).addTo(map);
  };

  function hideById(id) {
    if (!visibleFloorPlans[id]) return;
    visibleFloorPlans[id].remove();
    delete visibleFloorPlans[id];
  }

  this.hide = function(floorPlan) {
    hideById(floorPlan.id);
  };

  this.showAndHideOthers = function (floorPlan) {
    var id = floorPlan.id;
    var toRemove = [];
    for (var fpId in visibleFloorPlans) {
      if (fpId != id) toRemove.push(fpId);
    }
    this.show(floorPlan);
    // remove after show to reduce blinking
    toRemove.forEach(function (fpId) {
      hideById(fpId);
    });
  };

  this.hideAll = function () {
    for (var fpId in visibleFloorPlans) {
      hideById(fpId);
    }
  };
}
