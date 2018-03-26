
// a generic async cache
function PromiseCache() {
  var pending = {};
  var values = {};

  this.get = function (key, promiseGetter) {
    if (values[key]) {
      return Promise.resolve(values[key]);
    }
    if (pending[key]) {
      return pending[key];
    }
    pending[key] = promiseGetter(key).then(function (value) {
      delete pending[key];
      values[key] = value;
      return value;
    });
    return pending[key];
  };
};

// handles caching of floor plan metadata and fetching it from the IA Cloud
function FloorPlanCache() {
  var cache = new PromiseCache();

  // returns a promise
  this.get = function (id) {
    return cache.get(id, function (id) {
      return new Promise(function (resolve, reject) {
        IndoorAtlas.fetchFloorPlanWithId(id, resolve, reject);
      });
    });
  };
}

// can hide an show multiple floor plans on a map
function FloorPlanView(map) {
  var layers = {};
  var visibleFloorPlans = {};
  var cache = new FloorPlanCache();
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

  this.show = function(id) {
    if (visibleFloorPlans[id]) return;
    visibleFloorPlans[id] = true;

    if (layers[id]) {
      layers[id].addTo(map);
    } else {
      cache.get(id).then(function (floorPlan) {
        if (!layers[id]) {
          layers[id] = buildImageOverlay(floorPlan);
        }
        if (visibleFloorPlans[id]) {
          layers[id].addTo(map);
        }
      }).catch(function (error) {
        that.onError(id, error);
      });
    }
  };

  this.hide = function(id) {
    if (!visibleFloorPlans[id]) return;
    layers[id].remove();
    visibleFloorPlans[id] = false;
  };

  this.showAndHideOthers = function (id) {
    var toRemove = [];
    for (var fpId in visibleFloorPlans) {
      if (fpId != id) toRemove.push(fpId);
    }
    this.show(id);
    // remove after show to reduce blinking
    toRemove.forEach(function (fpId) {
      that.hide(fpId);
    });
  };

  this.hideAll = function () {
    for (var fpId in visibleFloorPlans) {
      this.hide(fpId);
    }
  }

  this.onError = function (id, error) {
    alert("Failed to fetch floor plan with ID "+id+": "+JSON.stringify(error));
  };
}
